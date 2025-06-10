use scripts::constants::{PRIVATE_TOKEN_ADDRESS, USER_1_ADDRESS, USER_2_ADDRESS};
use sncast_std::{FeeSettingsTrait, get_nonce, invoke};
use transfer::proof_array::proof_transfer_1;

fn main() {
    let mut calldata: Array<felt252> = array![USER_2_ADDRESS];
    proof_transfer_1.span().serialize(ref calldata);

    let fee_settings = FeeSettingsTrait::estimate();
    let invoke_nonce = get_nonce('pending');

    let invoke_Result = invoke(
        PRIVATE_TOKEN_ADDRESS.try_into().unwrap(),
        selector!("transfer"),
        calldata,
        fee_settings,
        Option::Some(invoke_nonce),
    );

    if (invoke_Result.is_ok()) {
        println!("Transfered tokens from {:?} to {:?}", USER_1_ADDRESS, USER_2_ADDRESS);
    } else {
        println!("Received error: {:?}", invoke_Result.unwrap_err());
    }
}
