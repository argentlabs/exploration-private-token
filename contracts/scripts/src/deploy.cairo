use sncast_std::{DeclareResultTrait, FeeSettingsTrait, declare, deploy, get_nonce};
use starknet::{ClassHash, ContractAddress};

fn main() {
    // Declare contracts
    let burn_class_hash = declare_if_needed("BurnVerifier");
    let mint_class_hash = declare_if_needed("MintVerifier");
    let transfer_class_hash = declare_if_needed("TransferVerifier");
    let key_registry_class_hash = declare_if_needed("KeyRegistry");
    let private_token_class_hash = declare_if_needed("PrivateToken");
    

    // Deploy contracts
    let burn_contract_address = deploy_contract("BurnVerifier", burn_class_hash, array![]);
    let mint_contract_address = deploy_contract("MintVerifier", mint_class_hash, array![]);
    let transfer_contract_address = deploy_contract("TransferVerifier", transfer_class_hash, array![]);
    let key_registry_contract_address = deploy_contract("KeyRegistry", key_registry_class_hash, array![]);
    deploy_contract(
        "PrivateToken",
        private_token_class_hash,
        array![
            key_registry_contract_address.into(),
            mint_contract_address.into(),
            burn_contract_address.into(),
            transfer_contract_address.into(),
        ],
    );
}

fn declare_if_needed(contract_name: ByteArray) -> ClassHash {
    println!("Declaring {}...", contract_name);

    let fee_settings = FeeSettingsTrait::estimate();
    let declare_nonce = get_nonce('pending');

    let declare_result = declare(contract_name, fee_settings, Option::Some(declare_nonce))
        .expect('Declaration failed');

    let class_hash = *(declare_result.class_hash());
    let class_hash_as_felt: felt252 = class_hash.into();
    println!("Contract declared at: 0x{:x}", class_hash_as_felt);

    class_hash
}

fn deploy_contract(
    contract_name: ByteArray, class_hash: ClassHash, constructor_calldata: Array<felt252>,
) -> ContractAddress {
    println!("Deploying {}...", contract_name);

    let fee_settings = FeeSettingsTrait::estimate();
    let deploy_nonce = get_nonce('pending');

    let deploy_result = deploy(
        class_hash,
        constructor_calldata,
        Option::None,
        true,
        fee_settings,
        Option::Some(deploy_nonce),
    )
        .expect('Deployment failed');

    let address_as_felt: felt252 = deploy_result.contract_address.into();
    println!("{} deployed at address: 0x{:x}", contract_name, address_as_felt);

    deploy_result.contract_address
}
