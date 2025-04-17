import { expect, test } from 'vitest'
import { privateKeyToPublicKey } from './sum.js'

test('adds 1 + 2 to equal 3', () => {
    const publicKey = privateKeyToPublicKey(BigInt(1));
    console.log(publicKey);
})