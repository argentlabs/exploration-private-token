import { Base8, mulPointEscalar, addPoint } from "@zk-kit/baby-jubjub";

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
        const encryptedValue = addPoint(sharedSecret, plainEmbedded);
        const C1 = mulPointEscalar(Base8, random);
        const C2 = addPoint(encryptedValue, sharedSecret);
        return { c1_x: C1[0], c1_y: C1[1], c2_x: C2[0], c2_y: C2[1] };
    } catch (error) {
        console.log(error);
        throw new Error('Encryption error');
    }
}

export const addEncryptedValues = (point1, point2) => {
    return { c1_x: point1.c1_x + point2.c1_x, c1_y: point1.c1_y + point2.c1_y, c2_x: point1.c2_x + point2.c2_x, c2_y: point1.c2_y + point2.c2_y };
}