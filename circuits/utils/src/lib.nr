use ec::tecurve::affine::Curve as AffineCurve;
use ec::tecurve::affine::Point as Gaffine;

global bjj_a: Field = 168700;
global bjj_d: Field = 168696;
global bjj_generator_x: Field =
    995203441582195749578291179787384436505546430278305826713579947235728471134;
global bjj_generator_y: Field =
    5472060717959818805561601436314318772137091100104008585924551046643952123905;
global bjj_basept_x: Field =
    5299619240641551281634865583518297030282874472190772894086521144482721001553;
global bjj_basept_y: Field =
    16950150798460657717958625567821834550301663161624707787222815936182638968203;

pub fn get_bjj_curve() -> AffineCurve {
    AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x, bjj_generator_y))
}

pub fn get_bjj_basept() -> Gaffine {
    Gaffine::new(bjj_basept_x, bjj_basept_y)
}

pub fn bjj_priv_to_pub_key(private_key: Field) -> Gaffine {
    let bjj_affine: AffineCurve = get_bjj_curve();
    let base_pt: Gaffine = get_bjj_basept();
    bjj_affine.mul(private_key, base_pt)
}

pub fn bjj_exp_elgamal_encrypt(
    public_key: Gaffine,
    plaintext: Field,
    randomness: Field,
) -> (Gaffine, Gaffine) {
    let bjj_affine: AffineCurve = get_bjj_curve();
    let base_pt: Gaffine = get_bjj_basept();
    let C1: Gaffine = bjj_affine.mul(randomness, base_pt);
    let plain_embedded: Gaffine = bjj_affine.mul(plaintext as Field, base_pt);
    println("plain_embedded");
    println(plain_embedded);
    let shared_secret: Gaffine = bjj_affine.mul(randomness, public_key);
    println("shared_secret");
    println(shared_secret);
    let C2: Gaffine = bjj_affine.add(shared_secret, plain_embedded);
    (C1, C2)
}

pub fn bjj_exp_elgamal_decrypt(private_key: Field, ciphertext: (Gaffine, Gaffine)) -> Gaffine {
    let bjj_affine: AffineCurve = get_bjj_curve();
    let shared_secret = bjj_affine.mul(private_key, ciphertext.0);
    let plain_embedded = bjj_affine.subtract(ciphertext.1, shared_secret);
    plain_embedded
}

#[test]
fn test_bjj_priv_to_pub_key() {
    let private_key_1 = 0x03c96f78ed310623e3b00fd5260d90647996193c19984c24b4ca92ec73c5d8e0;
    let public_key_1 = bjj_priv_to_pub_key(private_key_1);
    println(public_key_1);
    assert(public_key_1.x == 0x1cda22076db52c0b803c239b6515e88e2e2ae819aec57a4601599b0e9ca1ec9a);
    assert(public_key_1.y == 0x27e92be248c00a5d0e387a641474370d593f1724de2774ff663c6442d9ac75bf);
    let private_key_2 = 0x0510bae26a9b59ebad67a4324c944b1910a778e8481d7f08ddba6bcd2b94b2c4;
    let public_key_2 = bjj_priv_to_pub_key(private_key_2);
    println(public_key_2);
    assert(public_key_2.x == 0x1865e98a61eb14dd9366fbc6808c3cd93aec7cf0adcecd86711c17e8e96cf95a);
    assert(public_key_2.y == 0x2a6b15f46f69a6a6f8991466900b57585a49e31643cc04b0070f6d74db9f9fdc);
}

#[test]
fn test_bjj_exp_elgamal_encrypt() {
    let private_key = 1712844159787528649208347389118675504046037977008704584632052244742798694624;
    let public_key = bjj_priv_to_pub_key(private_key);
    let plaintext = 1000;
    let randomness = 1579974533500091418858266504437497529448349460077355483020454056886908720762;
    let ciphertext = bjj_exp_elgamal_encrypt(public_key, plaintext, randomness);
    println(ciphertext);
    // assert(ciphertext.0.x == 0x0bb77a6ad63e739b4eacb2e09d6277c12ab8d8010534e0b62893f3f6bb957051);
    // assert(ciphertext.0.y == 0x25797203f7a0b24925572e1cd16bf9edfce0051fb9e133774b3c257a872d7d8b);
    // assert(ciphertext.1.x == 0xa5356b9190d621e862294797bca129cddcea3a6ed5bc215a84fc472146c9a4);
    // assert(ciphertext.1.y == 0x29c2f427e739cda8dcd518c79f5e6fdaf0d7702ca5661cbfb1130b7623e7524e);
}

#[test]
fn test_bjj_exp_elgamal_decrypt() {
    let private_key = 1712844159787528649208347389118675504046037977008704584632052244742798694624;
    let public_key = bjj_priv_to_pub_key(private_key);
    let plaintext = 1000;
    let randomness = 1579974533500091418858266504437497529448349460077355483020454056886908720762;
    let ciphertext = bjj_exp_elgamal_encrypt(public_key, plaintext, randomness);
    let decrypted = bjj_exp_elgamal_decrypt(private_key, ciphertext);
    let bjj_affine: AffineCurve = get_bjj_curve();
    let base_pt: Gaffine = get_bjj_basept();
    let plaintext_exp = bjj_affine.mul(plaintext, base_pt);
    println(decrypted);
    assert(decrypted == plaintext_exp);
}

#[test]
fn print_encrypt() {
    let private_key = 0x0510bae26a9b59ebad67a4324c944b1910a778e8481d7f08ddba6bcd2b94b2c4;
    let public_key = bjj_priv_to_pub_key(private_key);
    let plaintext = 800;
    let randomness = 6;
    let ciphertext = bjj_exp_elgamal_encrypt(public_key, plaintext, randomness);
    println(ciphertext);
}
