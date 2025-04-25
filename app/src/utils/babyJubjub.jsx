import { Base8, mulPointEscalar, addPoint } from "@zk-kit/baby-jubjub";
import init from '../wasm/babygiant/babygiant.js';

// max value should be l (https://eips.ethereum.org/EIPS/eip-2494), the order of the big subgroup to avoid modulo bias
const MAX_VALUE = BigInt('2736030358979909402780800718157159386076813972158567259200215660948447373041');

export const privateKeyToPublicKey = (privateKey) => {
    try {
        const publicKey = mulPointEscalar(Base8, privateKey);
        return publicKey;
    } catch (error) {
        console.log(error);
        throw new Error('Invalid private key format or computation error');
    }
};

export const getRandomValue = () => {

    // Create a new array to store the random bytes
    const array = new Uint8Array(32); // 256 bits = 32 bytes
    // Fill the array with cryptographically secure random values
    window.crypto.getRandomValues(array);
    // Convert the bytes to a BigInt
    let randomValue = BigInt('0');
    for (let i = 0; i < array.length; i++) {
        randomValue = (randomValue << BigInt(8)) + BigInt(array[i]);
    }
    // Ensure the value is within the valid range using modulo
    randomValue = randomValue % MAX_VALUE;
    return randomValue;
};

export const elgamalEncrypt = async (value, publicKey, random) => {
    try {
        const plainEmbedded = mulPointEscalar(Base8, value);
        const sharedSecret = mulPointEscalar([publicKey.x, publicKey.y], random);
        const C1 = mulPointEscalar(Base8, random);
        const C2 = addPoint(sharedSecret, plainEmbedded);
        return { c1_x: C1[0], c1_y: C1[1], c2_x: C2[0], c2_y: C2[1] };
    } catch (error) {
        console.log(error);
        throw new Error('Encryption error');
    }
}

export const elgamalDecryptEmbedded = async (privateKey, encrypted) => {
    const sharedSecret = mulPointEscalar([encrypted.c1_x, encrypted.c1_y], privateKey);
    const sharedSecretInverse = mulPointEscalar(sharedSecret, 2736030358979909402780800718157159386076813972158567259200215660948447373040n); // Note : this BigInt is equal to l-1, this equivalent here to -1, to take the inverse of shared_secret, because mulPointEscalar only supports positive values for the second argument
    const decryptedEmbedded = addPoint([encrypted.c2_x, encrypted.c2_y], sharedSecretInverse);
    return decryptedEmbedded;
}

export const addEncryptedValues = (encrypted1, encrypted2) => {
    if (encrypted1.c1_x == 0 && encrypted1.c1_y == 0 && encrypted1.c2_x == 0 && encrypted1.c2_y == 0) {
        return encrypted2;
    } else if (encrypted2.c1_x == 0 && encrypted2.c1_y == 0 && encrypted2.c2_x == 0 && encrypted2.c2_y == 0) {
        return encrypted1;
    }
    let newC1 = addPoint([encrypted1.c1_x, encrypted1.c1_y], [encrypted2.c1_x, encrypted2.c1_y]);
    let newC2 = addPoint([encrypted1.c2_x, encrypted1.c2_y], [encrypted2.c2_x, encrypted2.c2_y]);
    return { c1_x: newC1[0], c1_y: newC1[1], c2_x: newC2[0], c2_y: newC2[1] };
}

export const decryptBalance = async (encryptedBalance, privateKey) => {
    const decryptedEmbedded = await elgamalDecryptEmbedded(privateKey, encryptedBalance);
    const decrypted = await compute_dlog(decryptedEmbedded);
    return decrypted;
};

export function bigintToBytes32(bigInt) {
    const max = (BigInt(2) ** BigInt(256));
    if (bigInt >= max || bigInt < 0) {
        throw new Error("The value is not between 0 and 2**256 - 1.");
    }
    return '0x' + ((bigInt).toString(16)).padStart(64, '0');
}

async function compute_dlog(decryptedEmbedded) {
    await init();
    const wasmPath = '../wasm/babygiant/babygiant_bg.wasm';

    const n = 1048576; // sqrt(max(uint40))
    const numberOfWorkers = Math.max(1, navigator.hardwareConcurrency - 2) || 8;
    const chunkSize = Math.ceil(n / numberOfWorkers);

    return new Promise((resolve, reject) => {
        const workers = [];
        let num_killed = 0;

        for (let i = 0; i < numberOfWorkers; i++) {
            const myWorker = new Worker(new URL('worker_babygiant.js', import.meta.url), { type: 'module' });
            workers.push(myWorker);

            myWorker.onmessage = function (event) {
                myWorker.terminate();
                num_killed += 1;

                if (event.data.status === "success") {
                    // Terminate all other workers
                    workers.forEach(w => w.terminate());
                    resolve(event.data.result);  // Resolve with the result
                } else if (num_killed === numberOfWorkers) {
                    reject(new Error("Discrete Log Not Found! Ensure private key is correct and original value is between 0 and max(uint40)."));
                }
            };

            const start = i * chunkSize;
            const end = Math.min(n, start + chunkSize);
            myWorker.postMessage({
                wasmPath,
                input: {
                    Cx: bigintToBytes32(decryptedEmbedded[0]),
                    Cy: bigintToBytes32(decryptedEmbedded[1]),
                    min_range: start,
                    max_range: end
                }
            });
        }
    });
}