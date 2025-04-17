import { expect, test } from 'vitest'
import { privateKeyToPublicKey, elgamalEncrypt } from './babyJubjub.jsx';

test('Elgamal encryption: should correctly encrypt values', async () => {
    // Test values
    const privateKey = BigInt('1712844159787528649208347389118675504046037977008704584632052244742798694624');
    const value = BigInt('1000');
    const random = BigInt('1579974533500091418858266504437497529448349460077355483020454056886908720762');

    // Get public key
    const publicKeyPoint = privateKeyToPublicKey(privateKey);
    const publicKey = {
        x: publicKeyPoint[0],
        y: publicKeyPoint[1]
    };

    // Encrypt a value
    const result = await elgamalEncrypt(value, publicKey, random);


    console.log(result);

    // Basic structure check
    expect(result.c1_x).toBe(BigInt('15367807528450505302967513039648255157392220098696457168601845357864369892929'));
    expect(result.c1_y).toBe(BigInt('11165946630881659555111915726274743875256328341562199247811517387550774714424'));
    expect(result.c2_x).toBe(BigInt('7198688426181357889598958753037561608904034060422956007373876991164938861068'));
    expect(result.c2_y).toBe(BigInt('13984109590330063406126336848167745938573970017863306036449331951156684523256'));
});