use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, Debug, starknet::Store)]
pub struct PublicKey {
    pub x: u256,
    pub y: u256,
}

#[starknet::interface]
pub trait IKeyRegistry<TContractState> {
    fn set_key(ref self: TContractState, key: PublicKey);
    fn get_key(self: @TContractState, address: ContractAddress) -> PublicKey;
}

#[starknet::contract]
mod KeyRegistry {
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use super::PublicKey;

    #[storage]
    struct Storage {
        keys: Map<ContractAddress, PublicKey>,
    }

    #[abi(embed_v0)]
    impl KeyRegistryImpl of super::IKeyRegistry<ContractState> {
        fn set_key(ref self: ContractState, key: PublicKey) {
            let caller = get_caller_address();
            self.keys.write(caller, key);
        }

        fn get_key(self: @ContractState, address: ContractAddress) -> PublicKey {
            let key = self.keys.read(address);
            return key;
        }
    }
}
