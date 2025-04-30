import { createFileManager, compile } from "@noir-lang/noir_wasm";
import mintCircuitJson from "../assets/mint.json";
import mintVk from "../assets/mint_vk.bin?url";
import burnCircuitJson from "../assets/burn.json";
import burnVk from "../assets/burn_vk.bin?url";
import transferCircuitJson from "../assets/transfer.json";
import transferVk from "../assets/transfer_vk.bin?url";
import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import * as garaga from "garaga";

await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

// helper functions
function flattenFieldsAsArray(fields) {
    const flattenedPublicInputs = fields.map(hexToUint8Array);
    return flattenUint8Arrays(flattenedPublicInputs);
}

function flattenUint8Arrays(arrays) {
    const totalLength = arrays.reduce((acc, val) => acc + val.length, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }

    return result;
}

function hexToUint8Array(hex) {
    const sanitisedHex = BigInt(hex).toString(16).padStart(64, '0');

    const len = sanitisedHex.length / 2;
    const u8 = new Uint8Array(len);

    let i = 0;
    let j = 0;
    while (i < len) {
        u8[i] = parseInt(sanitisedHex.slice(j, j + 2), 16);
        i += 1;
        j += 2;
    }

    return u8;
}

// Mint functions
const getMintCircuit = async () => {
    const fm = createFileManager("/");
    if (mintCircuitJson) {
        return { program: mintCircuitJson };
    }
    return await compile(fm);
}

export const getMintProof = async (privateKey, random, value, publicKey, balance_before, balance_after) => {
    try {
        // generate the proof
        const { program } = await getMintCircuit();
        const noir = new Noir(program);
        const backend = new UltraHonkBackend(program.bytecode, { threads: 2 });
        const { witness } = await noir.execute({
            private_key: privateKey.toString(),
            random: random.toString(),
            value: value.toString(),
            public_key: { x: publicKey.x.toString(), y: publicKey.y.toString() },
            balance_before_encrypted_1: { x: balance_before.c1_x.toString(), y: balance_before.c1_y.toString() },
            balance_before_encrypted_2: { x: balance_before.c2_x.toString(), y: balance_before.c2_y.toString() },
            balance_after_encrypted_1: { x: balance_after.c1_x.toString(), y: balance_after.c1_y.toString() },
            balance_after_encrypted_2: { x: balance_after.c2_x.toString(), y: balance_after.c2_y.toString() }
        });
        const proof = await backend.generateProof(witness, { keccak: true });
        //const isValid = await backend.verifyProof(proof, { keccak: true });
        //console.log(isValid ? "Proof is Valid" : "Proof is Invalid");

        // fetch the verification key
        const vkResponse = await fetch(mintVk);
        const vkBuffer = await vkResponse.arrayBuffer();
        const vkUint8Array = new Uint8Array(vkBuffer);

        // get the proof as callData
        await garaga.init();
        const proof_as_callData = garaga.getHonkCallData(proof.proof, flattenFieldsAsArray(proof.publicInputs), vkUint8Array, 0);
        return proof_as_callData;
    } catch (err) {
        console.log(err);
        console.error("Mint proof failed with error: ", err.message);
    }
}

// Burn functions
const getBurnCircuit = async () => {
    const fm = createFileManager("/");
    if (burnCircuitJson) {
        return { program: burnCircuitJson };
    }
    return await compile(fm);
}

export const getBurnProof = async (privateKey, random, balance_before_clear, value, publicKey, balance_before, balance_after) => {
    try {
        // generate the proof
        const { program } = await getBurnCircuit();
        const noir = new Noir(program);
        const backend = new UltraHonkBackend(program.bytecode, { threads: 2 });
        const { witness } = await noir.execute({
            private_key: privateKey.toString(),
            random: random.toString(),
            balance_before_clear: balance_before_clear.toString(),
            value: value.toString(),
            public_key: { x: publicKey.x.toString(), y: publicKey.y.toString() },
            balance_before_encrypted_1: { x: balance_before.c1_x.toString(), y: balance_before.c1_y.toString() },
            balance_before_encrypted_2: { x: balance_before.c2_x.toString(), y: balance_before.c2_y.toString() },
            balance_after_encrypted_1: { x: balance_after.c1_x.toString(), y: balance_after.c1_y.toString() },
            balance_after_encrypted_2: { x: balance_after.c2_x.toString(), y: balance_after.c2_y.toString() }
        });
        const proof = await backend.generateProof(witness, { keccak: true });

        // fetch the verification key
        const vkResponse = await fetch(burnVk);
        const vkBuffer = await vkResponse.arrayBuffer();
        const vkUint8Array = new Uint8Array(vkBuffer);

        // get the proof as callData
        await garaga.init();
        const proof_as_callData = garaga.getHonkCallData(proof.proof, flattenFieldsAsArray(proof.publicInputs), vkUint8Array, 0);
        return proof_as_callData;
    } catch (err) {
        console.log(err);
        console.error("Burn proof failed with error: ", err.message);
    }
}

// Transfer functions
const getTransferCircuit = async () => {
    const fm = createFileManager("/");
    if (transferCircuitJson) {
        return { program: transferCircuitJson };
    }
    return await compile(fm);
}

export const getTransferProof = async (
    privateKey,
    from_random,
    to_random,
    value,
    from_balance_old_clear,
    from_public_key,
    to_public_key,
    from_balance_old_encrypted,
    to_balance_old_encrypted,
    from_balance_new_encrypted,
    to_balance_new_encrypted
) => {
    try {
        // generate the proof
        const { program } = await getTransferCircuit();
        const noir = new Noir(program);
        const backend = new UltraHonkBackend(program.bytecode, { threads: 5 });
        const { witness } = await noir.execute({
            from_private_key: privateKey.toString(),
            from_random: from_random.toString(),
            to_random: to_random.toString(),
            value: value.toString(),
            from_balance_old_clear: from_balance_old_clear.toString(),
            from_public_key: { x: from_public_key.x.toString(), y: from_public_key.y.toString() },
            to_public_key: { x: to_public_key.x.toString(), y: to_public_key.y.toString() },
            from_balance_old_encrypted_1: { x: from_balance_old_encrypted.c1_x.toString(), y: from_balance_old_encrypted.c1_y.toString() },
            from_balance_old_encrypted_2: { x: from_balance_old_encrypted.c2_x.toString(), y: from_balance_old_encrypted.c2_y.toString() },
            to_balance_old_encrypted_1: { x: to_balance_old_encrypted.c1_x.toString(), y: to_balance_old_encrypted.c1_y.toString() },
            to_balance_old_encrypted_2: { x: to_balance_old_encrypted.c2_x.toString(), y: to_balance_old_encrypted.c2_y.toString() },
            from_balance_new_encrypted_1: { x: from_balance_new_encrypted.c1_x.toString(), y: from_balance_new_encrypted.c1_y.toString() },
            from_balance_new_encrypted_2: { x: from_balance_new_encrypted.c2_x.toString(), y: from_balance_new_encrypted.c2_y.toString() },
            to_balance_new_encrypted_1: { x: to_balance_new_encrypted.c1_x.toString(), y: to_balance_new_encrypted.c1_y.toString() },
            to_balance_new_encrypted_2: { x: to_balance_new_encrypted.c2_x.toString(), y: to_balance_new_encrypted.c2_y.toString() },
        });
        const proof = await backend.generateProof(witness, { keccak: true });
        const isValid = await backend.verifyProof(proof, { keccak: true });
        console.log(isValid ? "Proof is Valid" : "Proof is Invalid");

        // fetch the verification key
        const vkResponse = await fetch(transferVk);
        const vkBuffer = await vkResponse.arrayBuffer();
        const vkUint8Array = new Uint8Array(vkBuffer);

        // get the proof as callData
        await garaga.init();
        const proof_as_callData = garaga.getHonkCallData(proof.proof, flattenFieldsAsArray(proof.publicInputs), vkUint8Array, 0);
        return proof_as_callData;
    } catch (err) {
        console.log(err);
        console.error("Transfer proof failed with error: ", err.message);
    }
}
