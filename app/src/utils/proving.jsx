import { createFileManager, compile } from "@noir-lang/noir_wasm";
import mintCircuitJson from "../../../mint/target/mint.json";
import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

const getMintCircuit = async () => {
    const fm = createFileManager("/");
    if (mintCircuitJson) {
        return { program: mintCircuitJson };
    }
    return await compile(fm);
}

const uint8ArrayToHex = (uint8Array) => {
    return Array.from(uint8Array)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

export const getMintProof = async (privateKey, random, value, publicKey, balance_before, balance_after) => {
    try {
        const { program } = await getMintCircuit();
        const noir = new Noir(program);
        const backend = new UltraHonkBackend(program.bytecode);
        console.log("before execute");
        const { witness } = await noir.execute({
            private_key: privateKey,
            random: random,
            value: value,
            public_key: publicKey,
            balance_before_encrypted_1: { x: balance_before.c1_x, y: balance_before.c1_y },
            balance_before_encrypted_2: { x: balance_before.c2_x, y: balance_before.c2_y },
            balance_after_encrypted_1: { x: balance_after.c1_x, y: balance_after.c1_y },
            balance_after_encrypted_2: { x: balance_after.c2_x, y: balance_after.c2_y }
        });
        console.log("after execute");
        const proof = await backend.generateProof(witness);

        console.log(proof);
        console.log(uint8ArrayToHex(proof.proof));

        const isValid = await backend.verifyProof(proof);
        alert(isValid ? "Valid" : "Invalid");
    } catch (err) {
        console.error("prooving failed with error: ", err.message);
    }

}