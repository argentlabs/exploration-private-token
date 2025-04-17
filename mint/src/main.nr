use ec::tecurve::affine::Curve as AffineCurve;
use ec::tecurve::affine::Point as Gaffine;

use utils::{bjj_exp_elgamal_encrypt, bjj_priv_to_pub_key, get_bjj_curve};

fn main(
    private_key: Field,
    random: Field,
    value: pub Field,
    public_key: pub Gaffine,
    balance_before_encrypted_1: pub Gaffine,
    balance_before_encrypted_2: pub Gaffine,
    balance_after_encrypted_1: pub Gaffine,
    balance_after_encrypted_2: pub Gaffine,
) {
    // check that the minter owns the private key associated to the public key
    let computed_public_key: Gaffine = bjj_priv_to_pub_key(private_key);
    assert((public_key.x == computed_public_key.x) & (public_key.y == computed_public_key.y));

    // check that the new encrypted balance of the minter is correct
    let value_encrypted: (Gaffine, Gaffine) =
        bjj_exp_elgamal_encrypt(public_key, value as Field, random);
    // if the minter has no balance, the new balance is the value encrypted
    let mut computed_balance_after_encrypted: (Gaffine, Gaffine) = value_encrypted;
    // else the new balance is the old balance plus the value encrypted
    if (
        (balance_before_encrypted_1.x != 0)
            | (balance_before_encrypted_1.y != 0)
            | (balance_before_encrypted_2.x != 0)
            | (balance_before_encrypted_2.y != 0)
    ) {
        let bjj_affine: AffineCurve = get_bjj_curve();
        computed_balance_after_encrypted = (
            bjj_affine.add(balance_before_encrypted_1, value_encrypted.0),
            bjj_affine.add(balance_before_encrypted_2, value_encrypted.1),
        );
    }
    assert(
        (computed_balance_after_encrypted.0.x == balance_after_encrypted_1.x)
            & (computed_balance_after_encrypted.0.y == balance_after_encrypted_1.y)
            & (computed_balance_after_encrypted.1.x == balance_after_encrypted_2.x)
            & (computed_balance_after_encrypted.1.y == balance_after_encrypted_2.y),
    );
}

