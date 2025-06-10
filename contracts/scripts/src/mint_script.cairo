use mint::proof_array::proof_mint;
use scripts::constants::{PRIVATE_TOKEN_ADDRESS, USER_1_ADDRESS};
use sncast_std::{FeeSettingsTrait, get_nonce, invoke};

const value: u256 = 10000;

fn main() {
    let mut calldata: Array<felt252> = array![];
    value.serialize(ref calldata);
    proof_mint.span().serialize(ref calldata);

    let fee_settings = FeeSettingsTrait::estimate();
    let invoke_nonce = get_nonce('pending');

    invoke(
        PRIVATE_TOKEN_ADDRESS.try_into().unwrap(),
        selector!("mint"),
        calldata,
        fee_settings,
        Option::Some(invoke_nonce),
    )
        .expect('call failed');

    println!("Minted tokens for {:?}", USER_1_ADDRESS);
}
