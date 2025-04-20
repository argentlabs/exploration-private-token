use ec::tecurve::affine::Curve as AffineCurve;
use ec::tecurve::affine::Point as Gaffine;

use utils::{
    bjj_exp_elgamal_decrypt, bjj_exp_elgamal_encrypt, bjj_priv_to_pub_key, get_bjj_basept,
    get_bjj_curve,
};

fn main(
    from_private_key: Field,
    from_random: Field,
    to_random: Field,
    value: u64,
    from_balance_old_clear: u64,
    from_public_key: pub Gaffine,
    to_public_key: pub Gaffine,
    from_balance_old_encrypted_1: pub Gaffine,
    from_balance_old_encrypted_2: pub Gaffine,
    to_balance_old_encrypted_1: pub Gaffine,
    to_balance_old_encrypted_2: pub Gaffine,
    from_balance_new_encrypted_1: pub Gaffine,
    from_balance_new_encrypted_2: pub Gaffine,
    to_balance_new_encrypted_1: pub Gaffine,
    to_balance_new_encrypted_2: pub Gaffine,
) {
    // check that the sender owns the private key
    let computed_from_public_key: Gaffine = bjj_priv_to_pub_key(from_private_key);
    assert(
        (from_public_key.x == computed_from_public_key.x)
            & (from_public_key.y == computed_from_public_key.y),
    );

    // check that the sender has enough balance
    assert(value <= from_balance_old_clear);

    // prevents DOS
    assert(value >= 1);

    // check that the old unencrypted balance of the sender is correct
    let bjj_affine: AffineCurve = get_bjj_curve();
    let base_pt: Gaffine = get_bjj_basept();
    let exp_from_balance_old_clear = bjj_affine.mul(from_balance_old_clear as Field, base_pt);
    let decoded_value = bjj_exp_elgamal_decrypt(
        from_private_key,
        (from_balance_old_encrypted_1, from_balance_old_encrypted_2),
    );
    assert(
        (decoded_value.x == exp_from_balance_old_clear.x)
            & (decoded_value.y == exp_from_balance_old_clear.y),
    );

    // check that the new encrypted balance of the sender is correct
    let computed_from_balance_new_clear: u64 = from_balance_old_clear - value;
    let computed_from_balance_new_encrypted: (Gaffine, Gaffine) = bjj_exp_elgamal_encrypt(
        from_public_key,
        computed_from_balance_new_clear as Field,
        from_random,
    );
    assert(
        (computed_from_balance_new_encrypted.0.x == from_balance_new_encrypted_1.x)
            & (computed_from_balance_new_encrypted.0.y == from_balance_new_encrypted_1.y)
            & (computed_from_balance_new_encrypted.1.x == from_balance_new_encrypted_2.x)
            & (computed_from_balance_new_encrypted.1.y == from_balance_new_encrypted_2.y),
    );

    // check that the new encrypted balance of the receiver is correct
    let value_encrypted: (Gaffine, Gaffine) =
        bjj_exp_elgamal_encrypt(to_public_key, value as Field, to_random);
    // if the receiver has no balance, the new balance is the value encrypted
    let mut computed_to_balance_new_encrypted: (Gaffine, Gaffine) = value_encrypted;
    // else the new balance is the old balance plus the value encrypted
    if (
        (to_balance_old_encrypted_1.x != 0)
            | (to_balance_old_encrypted_1.y != 0)
            | (to_balance_old_encrypted_2.x != 0)
            | (to_balance_old_encrypted_2.y != 0)
    ) {
        computed_to_balance_new_encrypted = (
            bjj_affine.add(to_balance_old_encrypted_1, value_encrypted.0),
            bjj_affine.add(to_balance_old_encrypted_2, value_encrypted.1),
        );
    }
    assert(
        (computed_to_balance_new_encrypted.0.x == to_balance_new_encrypted_1.x)
            & (computed_to_balance_new_encrypted.0.y == to_balance_new_encrypted_1.y)
            & (computed_to_balance_new_encrypted.1.x == to_balance_new_encrypted_2.x)
            & (computed_to_balance_new_encrypted.1.y == to_balance_new_encrypted_2.y),
    );
}
