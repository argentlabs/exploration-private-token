use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, Debug, starknet::Store)]
pub struct EncryptedValue {
    pub c1_x: u256,
    pub c1_y: u256,
    pub c2_x: u256,
    pub c2_y: u256,
}

#[starknet::interface]
pub trait IPrivateToken<TContractState> {
    fn mint(ref self: TContractState, value: u256, proof_with_inputs: Span<felt252>);
    fn burn(ref self: TContractState, value: u256, proof_with_inputs: Span<felt252>);
    fn transfer(ref self: TContractState, to: ContractAddress, proof_with_inputs: Span<felt252>);
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> EncryptedValue;
}

#[starknet::contract]
pub mod PrivateToken {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        Map, StorageMapReadAccess, StoragePointerReadAccess, StoragePointerWriteAccess,
        StorageMapWriteAccess
    };
    use mint::mint_verifier::{IMintVerifierDispatcherTrait, IMintVerifierDispatcher};
    use transfer::transfer_verifier::{
        ITransferVerifierDispatcherTrait, ITransferVerifierDispatcher
    };
    use token::key_registry::PublicKey;
    use super::{EncryptedValue, IPrivateToken};
    use token::key_registry::{IKeyRegistryDispatcherTrait, IKeyRegistryDispatcher};

    #[storage]
    pub struct Storage {
        balance: Map<ContractAddress, EncryptedValue>,
        total_supply: u256,
        key_registry: ContractAddress,
        mint_verifier: ContractAddress,
        burn_verifier: ContractAddress,
        transfer_verifier: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        key_registry: ContractAddress,
        mint_verifier: ContractAddress,
        burn_verifier: ContractAddress,
        transfer_verifier: ContractAddress
    ) {
        self.key_registry.write(key_registry);
        self.mint_verifier.write(mint_verifier);
        self.burn_verifier.write(burn_verifier);
        self.transfer_verifier.write(transfer_verifier);
    }

    #[abi(embed_v0)]
    impl PrivateTokenImpl of IPrivateToken<ContractState> {
        fn mint(ref self: ContractState, value: u256, proof_with_inputs: Span<felt252>) {
            // Check that the total supply is less than Max(u40) = 1099511627775
            let total_supply = self.total_supply.read();
            assert(total_supply + value < 1099511627775, 'total supply overflow');

            // Get the caller address
            let caller = get_caller_address();

            // Get the caller public key
            let key_registry = IKeyRegistryDispatcher {
                contract_address: self.key_registry.read()
            };
            let public_key = key_registry.get_key(caller);

            // Get the caller encryted balance
            let balance_before = self.balance.read(caller);

            // Verify the proof
            let mint_verifier = IMintVerifierDispatcher {
                contract_address: self.mint_verifier.read()
            };
            let valid = mint_verifier.verify_mint_proof(proof_with_inputs);
            let public_inputs = match valid {
                Option::Some(public_inputs) => public_inputs,
                Option::None => {
                    assert(false, 'invalid proof');
                    return;
                },
            };

            // Get the public inputs
            let proof_value = *public_inputs[0];
            let proof_public_key = PublicKey { x: *public_inputs[1], y: *public_inputs[2] };
            let proof_balance_before = EncryptedValue {
                c1_x: *public_inputs[3],
                c1_y: *public_inputs[4],
                c2_x: *public_inputs[5],
                c2_y: *public_inputs[6]
            };
            let proof_balance_after = EncryptedValue {
                c1_x: *public_inputs[7],
                c1_y: *public_inputs[8],
                c2_x: *public_inputs[9],
                c2_y: *public_inputs[10]
            };

            // check that the value is correct
            assert(value == proof_value, 'invalid value');

            // check that the public key is correct
            assert(
                (public_key.x == proof_public_key.x) & (public_key.y == proof_public_key.y),
                'invalid public key'
            );

            // check that the balance before is correct
            assert(
                (balance_before.c1_x == proof_balance_before.c1_x)
                    & (balance_before.c1_y == proof_balance_before.c1_y)
                    & (balance_before.c2_x == proof_balance_before.c2_x)
                    & (balance_before.c2_y == proof_balance_before.c2_y),
                'invalid balance before'
            );

            // Update the balance
            self.balance.write(caller, proof_balance_after);

            // Update the total supply
            let total_supply = self.total_supply.read();
            self.total_supply.write(total_supply + value);
        }

        fn burn(ref self: TContractState, value: u256, proof_with_inputs: Span<felt252>) {
            // Get the caller address
            let caller = get_caller_address();

            // Get the caller public key
            let key_registry = IKeyRegistryDispatcher {
                contract_address: self.key_registry.read()
            };
            let public_key = key_registry.get_key(caller);

            // Get the caller encryted balance
            let balance_before = self.balance.read(caller);

            // Verify the proof
            let burn_verifier = IBurnVerifierDispatcher {
                contract_address: self.burn_verifier.read()
            };
            let valid = burn_verifier.verify_burn_proof(proof_with_inputs);
            let public_inputs = match valid {
                Option::Some(public_inputs) => public_inputs,
                Option::None => {
                    assert(false, 'invalid proof');
                    return;
                },
            };

            // Get the public inputs
            let proof_value = *public_inputs[0];
            let proof_public_key = PublicKey { x: *public_inputs[1], y: *public_inputs[2] };
            let proof_balance_before = EncryptedValue {
                c1_x: *public_inputs[3],
                c1_y: *public_inputs[4],
                c2_x: *public_inputs[5],
                c2_y: *public_inputs[6]
            };
            let proof_balance_after = EncryptedValue {
                c1_x: *public_inputs[7],
                c1_y: *public_inputs[8],
                c2_x: *public_inputs[9],
                c2_y: *public_inputs[10]
            };

            // check that the value is correct
            assert(value == proof_value, 'invalid value');

            // check that the public key is correct
            assert(
                (public_key.x == proof_public_key.x) & (public_key.y == proof_public_key.y),
                'invalid public key'
            );

            // check that the balance before is correct
            assert(
                (balance_before.c1_x == proof_balance_before.c1_x)
                    & (balance_before.c1_y == proof_balance_before.c1_y)
                    & (balance_before.c2_x == proof_balance_before.c2_x)
                    & (balance_before.c2_y == proof_balance_before.c2_y),
                'invalid balance before'
            );

            // Update the balance
            self.balance.write(caller, proof_balance_after);
            // Update the total supply
            let total_supply = self.total_supply.read();
            self.total_supply.write(total_supply - value);
        }

        fn transfer(
            ref self: ContractState, to: ContractAddress, proof_with_inputs: Span<felt252>
        ) {
            // Get the caller address
            let caller = get_caller_address();

            // Get the key registry
            let key_registry = IKeyRegistryDispatcher {
                contract_address: self.key_registry.read()
            };

            // Get the public keys
            let from_public_key = key_registry.get_key(caller);
            let to_public_key = key_registry.get_key(to);

            // Get the encrypted balances
            let from_balance_before = self.balance.read(caller);
            let to_balance_before = self.balance.read(to);

            // Verify the proof
            let transfer_verifier = ITransferVerifierDispatcher {
                contract_address: self.transfer_verifier.read()
            };
            let valid = transfer_verifier.verify_transfer_proof(proof_with_inputs);
            let public_inputs = match valid {
                Option::Some(public_inputs) => public_inputs,
                Option::None => {
                    assert(false, 'invalid proof');
                    return;
                },
            };

            // Get the public inputs
            let proof_from_public_key = PublicKey { x: *public_inputs[0], y: *public_inputs[1] };
            let proof_to_public_key = PublicKey { x: *public_inputs[2], y: *public_inputs[3] };
            let proof_from_balance_before = EncryptedValue {
                c1_x: *public_inputs[4],
                c1_y: *public_inputs[5],
                c2_x: *public_inputs[6],
                c2_y: *public_inputs[7]
            };
            let proof_to_balance_before = EncryptedValue {
                c1_x: *public_inputs[8],
                c1_y: *public_inputs[9],
                c2_x: *public_inputs[10],
                c2_y: *public_inputs[11]
            };
            let proof_from_balance_after = EncryptedValue {
                c1_x: *public_inputs[12],
                c1_y: *public_inputs[13],
                c2_x: *public_inputs[14],
                c2_y: *public_inputs[15]
            };
            let proof_to_balance_after = EncryptedValue {
                c1_x: *public_inputs[16],
                c1_y: *public_inputs[17],
                c2_x: *public_inputs[18],
                c2_y: *public_inputs[19]
            };

            // check that the input public keys are correct
            assert(
                (from_public_key.x == proof_from_public_key.x)
                    & (from_public_key.y == proof_from_public_key.y),
                'invalid from public key'
            );
            assert(
                (to_public_key.x == proof_to_public_key.x)
                    & (to_public_key.y == proof_to_public_key.y),
                'invalid to public key'
            );

            // check that the input balances before are correct
            assert(
                (from_balance_before.c1_x == proof_from_balance_before.c1_x)
                    & (from_balance_before.c1_y == proof_from_balance_before.c1_y)
                    & (from_balance_before.c2_x == proof_from_balance_before.c2_x)
                    & (from_balance_before.c2_y == proof_from_balance_before.c2_y),
                'invalid from balance before'
            );
            assert(
                (to_balance_before.c1_x == proof_to_balance_before.c1_x)
                    & (to_balance_before.c1_y == proof_to_balance_before.c1_y)
                    & (to_balance_before.c2_x == proof_to_balance_before.c2_x)
                    & (to_balance_before.c2_y == proof_to_balance_before.c2_y),
                'invalid to balance before'
            );

            // Update the balance of the sender
            self.balance.write(caller, proof_from_balance_after);
            // Update the balance of the receiver
            self.balance.write(to, proof_to_balance_after);
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> EncryptedValue {
            self.balance.read(account)
        }
    }
}
