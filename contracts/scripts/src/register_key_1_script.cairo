use scripts::constants::{
    KEY_REGISTRY_ADDRESS, USER_1_ADDRESS, USER_1_PUBLIC_KEY_X, USER_1_PUBLIC_KEY_Y,
};
use sncast_std::{FeeSettingsTrait, get_nonce, invoke};
use token::key_registry::PublicKey;


fn main() {
    let public_key: PublicKey = PublicKey { x: USER_1_PUBLIC_KEY_X, y: USER_1_PUBLIC_KEY_Y };
    let mut calldata: Array<felt252> = array![];
    public_key.serialize(ref calldata);

    let fee_settings = FeeSettingsTrait::estimate();
    let invoke_nonce = get_nonce('pending');

    invoke(
        KEY_REGISTRY_ADDRESS.try_into().unwrap(),
        selector!("set_key"),
        calldata,
        fee_settings,
        Option::Some(invoke_nonce),
    )
        .expect('call failed');

    println!("Key registered for {:?}", USER_1_ADDRESS);
}
