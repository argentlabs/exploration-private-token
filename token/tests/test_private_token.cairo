use starknet::{ContractAddress, contract_address_const};
use token::private_token::{IPrivateTokenDispatcherTrait, IPrivateTokenDispatcher};
use token::key_registry::{IKeyRegistryDispatcherTrait, IKeyRegistryDispatcher, PublicKey};
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address};
use mint::proof_array::proof_mint;
use transfer::proof_array::{proof_transfer_1, proof_transfer_2};

fn deploy_contracts() -> (
    IPrivateTokenDispatcher, ContractAddress, IKeyRegistryDispatcher, ContractAddress
) {
    let mint_verifier_contract = declare("MintVerifier").unwrap().contract_class();
    let transfer_verifier_contract = declare("TransferVerifier").unwrap().contract_class();
    let key_registry_contract = declare("KeyRegistry").unwrap().contract_class();
    let token_contract = declare("PrivateToken").unwrap().contract_class();

    let (mint_vrifier_address, _) = mint_verifier_contract.deploy(@array![]).unwrap();
    let (transfer_vrifier_address, _) = transfer_verifier_contract.deploy(@array![]).unwrap();
    let (key_registry_address, _) = key_registry_contract.deploy(@array![]).unwrap();
    let args = @array![
        key_registry_address.into(), mint_vrifier_address.into(), transfer_vrifier_address.into()
    ];
    let (token_address, _) = token_contract.deploy(args).unwrap();
    let private_token = IPrivateTokenDispatcher { contract_address: token_address };
    let key_registry = IKeyRegistryDispatcher { contract_address: key_registry_address };
    (private_token, token_address, key_registry, key_registry_address)
}

#[test]
fn test_key_registry() {
    let (_, _, key_registry, key_registry_address) = deploy_contracts();
    let user: ContractAddress = contract_address_const::<'user'>();
    start_cheat_caller_address(key_registry_address, user);
    let public_key = key_registry.get_key(user);
    assert_eq!(public_key.x, 0);
    assert_eq!(public_key.y, 0);
    let new_key = PublicKey { x: 1, y: 2 };
    key_registry.set_key(new_key);
    let public_key = key_registry.get_key(user);
    assert_eq!(public_key.x, 1);
    assert_eq!(public_key.y, 2);
}

#[test]
fn test_mint() {
    let (private_token, private_token_address, key_registry, key_registry_address) =
        deploy_contracts();
    let user: ContractAddress = contract_address_const::<'user'>();
    start_cheat_caller_address(key_registry_address, user);
    let user_public_key = PublicKey {
        x: 0x1cda22076db52c0b803c239b6515e88e2e2ae819aec57a4601599b0e9ca1ec9a,
        y: 0x27e92be248c00a5d0e387a641474370d593f1724de2774ff663c6442d9ac75bf
    };
    key_registry.set_key(user_public_key);
    start_cheat_caller_address(private_token_address, user);

    // mint some tokens
    private_token.mint(value: 10000, proof_with_inputs: proof_mint.span());

    let total_supply = private_token.total_supply();
    assert_eq!(total_supply, 10000);

    let balance = private_token.balance_of(user);
    assert_eq!(
        balance.c1_x == 0x0bb77a6ad63e739b4eacb2e09d6277c12ab8d8010534e0b62893f3f6bb957051
            && balance.c1_y == 0x25797203f7a0b24925572e1cd16bf9edfce0051fb9e133774b3c257a872d7d8b
            && balance.c2_x == 0xa5356b9190d621e862294797bca129cddcea3a6ed5bc215a84fc472146c9a4
            && balance.c2_y == 0x29c2f427e739cda8dcd518c79f5e6fdaf0d7702ca5661cbfb1130b7623e7524e,
        true
    );
}

#[test]
fn test_transfer() {
    let (private_token, private_token_address, key_registry, key_registry_address) =
        deploy_contracts();
    let user_1: ContractAddress = contract_address_const::<'user1'>();
    let user_1_public_key = PublicKey {
        x: 0x1cda22076db52c0b803c239b6515e88e2e2ae819aec57a4601599b0e9ca1ec9a,
        y: 0x27e92be248c00a5d0e387a641474370d593f1724de2774ff663c6442d9ac75bf
    };
    let user_2: ContractAddress = contract_address_const::<'user2'>();
    let user_2_public_key = PublicKey {
        x: 0x1865e98a61eb14dd9366fbc6808c3cd93aec7cf0adcecd86711c17e8e96cf95a,
        y: 0x2a6b15f46f69a6a6f8991466900b57585a49e31643cc04b0070f6d74db9f9fdc
    };

    // register the public keys
    start_cheat_caller_address(key_registry_address, user_1);
    key_registry.set_key(user_1_public_key);
    start_cheat_caller_address(key_registry_address, user_2);
    key_registry.set_key(user_2_public_key);

    // mint some tokens to user 1
    start_cheat_caller_address(private_token_address, user_1);
    private_token.mint(value: 10000, proof_with_inputs: proof_mint.span());

    // transfer some tokens from user 1 to user 2
    start_cheat_caller_address(private_token_address, user_1);
    private_token.transfer(to: user_2, proof_with_inputs: proof_transfer_1.span());

    // transfer some tokens from user 2 to user 1
    start_cheat_caller_address(private_token_address, user_2);
    private_token.transfer(to: user_1, proof_with_inputs: proof_transfer_2.span());
}

