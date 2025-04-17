use ec::tecurve::affine::Curve as AffineCurve;
use ec::tecurve::affine::Point as Gaffine;

use utils::{
    bjj_exp_elgamal_decrypt, bjj_exp_elgamal_encrypt, bjj_priv_to_pub_key, get_bjj_basept,
    get_bjj_curve,
};

fn main(
    private_key: Field,
    random: Field,
    balance_before_clear: u64,
    value: pub u64,
    public_key: pub Gaffine,
    balance_before_encrypted_1: pub Gaffine,
    balance_before_encrypted_2: pub Gaffine,
    balance_after_encrypted_1: pub Gaffine,
    balance_after_encrypted_2: pub Gaffine,
) {
    // check that the burner owns the private key associated to the public key
    let computed_public_key: Gaffine = bjj_priv_to_pub_key(private_key);
    assert((public_key.x == computed_public_key.x) & (public_key.y == computed_public_key.y));

    // check that the minter has enough balance
    assert(value <= balance_before_clear);

    // check that the old unencrypted balance of the burner is correct
    let bjj_affine: AffineCurve = get_bjj_curve();
    let base_pt: Gaffine = get_bjj_basept();
    let exp_balance_before_clear = bjj_affine.mul(balance_before_clear as Field, base_pt);
    let decoded_value = bjj_exp_elgamal_decrypt(
        private_key,
        (balance_before_encrypted_1, balance_before_encrypted_2),
    );
    assert(
        (decoded_value.x == exp_balance_before_clear.x)
            & (decoded_value.y == exp_balance_before_clear.y),
    );

    // check that the new encrypted balance of the burner is correct
    let computed_balance_after_clear: u64 = balance_before_clear - value;
    let computed_balance_after_encrypted: (Gaffine, Gaffine) =
        bjj_exp_elgamal_encrypt(public_key, computed_balance_after_clear as Field, random);
    assert(
        (computed_balance_after_encrypted.0.x == balance_after_encrypted_1.x)
            & (computed_balance_after_encrypted.0.y == balance_after_encrypted_1.y)
            & (computed_balance_after_encrypted.1.x == balance_after_encrypted_2.x)
            & (computed_balance_after_encrypted.1.y == balance_after_encrypted_2.y),
    );
}

