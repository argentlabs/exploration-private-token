import { mulPointEscalar, Base8 } from "@zk-kit/baby-jubjub";

export const privateKeyToPublicKey = (privateKey) => {
    try {
        const publicKey = mulPointEscalar(Base8, privateKey);
        return publicKey;
    } catch (error) {
        console.log(error);
        throw new Error('Invalid private key format or computation error');
    }
};