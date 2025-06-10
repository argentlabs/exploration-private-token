import { Contract } from 'starknet';

// Token Contract Address
const TOKEN_CONTRACT_ADDRESS = '0x564dd2fe61825b08ecd0715072f7a6d0c95c2b5930d6e2cd9238f6e8c02c8f2';
const KEY_REGISTRY_ADDRESS = '0x3d198de23002ca307a9016c5e4d35f15e2b10151663779ec7a44bfed934aa64';

// Create Contract instances
export const createContracts = (account) => {
    if (!account) {
        console.warn("No account provided to createContracts");
        return null;
    }

    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT.abi,
            TOKEN_CONTRACT.address,
            account
        );

        const keyRegistryContract = new Contract(
            KEY_REGISTRATION_CONTRACT.abi,
            KEY_REGISTRATION_CONTRACT.address,
            account
        );

        return {
            tokenContract,
            keyRegistryContract
        };
    } catch (error) {
        console.error("Error creating contracts:", error);
        return null;
    }
};

// Export contract addresses and ABIs
export const TOKEN_CONTRACT = {
    address: TOKEN_CONTRACT_ADDRESS,
    abi: [
        {
            "type": "impl",
            "name": "PrivateTokenImpl",
            "interface_name": "token::private_token::IPrivateToken"
        },
        {
            "type": "struct",
            "name": "core::integer::u256",
            "members": [
                {
                    "name": "low",
                    "type": "core::integer::u128"
                },
                {
                    "name": "high",
                    "type": "core::integer::u128"
                }
            ]
        },
        {
            "type": "struct",
            "name": "core::array::Span::<core::felt252>",
            "members": [
                {
                    "name": "snapshot",
                    "type": "@core::array::Array::<core::felt252>"
                }
            ]
        },
        {
            "type": "struct",
            "name": "token::private_token::EncryptedValue",
            "members": [
                {
                    "name": "c1_x",
                    "type": "core::integer::u256"
                },
                {
                    "name": "c1_y",
                    "type": "core::integer::u256"
                },
                {
                    "name": "c2_x",
                    "type": "core::integer::u256"
                },
                {
                    "name": "c2_y",
                    "type": "core::integer::u256"
                }
            ]
        },
        {
            "type": "interface",
            "name": "token::private_token::IPrivateToken",
            "items": [
                {
                    "type": "function",
                    "name": "mint",
                    "inputs": [
                        {
                            "name": "value",
                            "type": "core::integer::u256"
                        },
                        {
                            "name": "proof_with_inputs",
                            "type": "core::array::Span::<core::felt252>"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "burn",
                    "inputs": [
                        {
                            "name": "value",
                            "type": "core::integer::u256"
                        },
                        {
                            "name": "proof_with_inputs",
                            "type": "core::array::Span::<core::felt252>"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "transfer",
                    "inputs": [
                        {
                            "name": "to",
                            "type": "core::starknet::contract_address::ContractAddress"
                        },
                        {
                            "name": "proof_with_inputs",
                            "type": "core::array::Span::<core::felt252>"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "total_supply",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::integer::u256"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "balance_of",
                    "inputs": [
                        {
                            "name": "account",
                            "type": "core::starknet::contract_address::ContractAddress"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "token::private_token::EncryptedValue"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "constructor",
            "name": "constructor",
            "inputs": [
                {
                    "name": "key_registry",
                    "type": "core::starknet::contract_address::ContractAddress"
                },
                {
                    "name": "mint_verifier",
                    "type": "core::starknet::contract_address::ContractAddress"
                },
                {
                    "name": "burn_verifier",
                    "type": "core::starknet::contract_address::ContractAddress"
                },
                {
                    "name": "transfer_verifier",
                    "type": "core::starknet::contract_address::ContractAddress"
                }
            ]
        },
        {
            "type": "event",
            "name": "token::private_token::PrivateToken::Event",
            "kind": "enum",
            "variants": []
        }
    ]
}

export const KEY_REGISTRATION_CONTRACT = {
    address: KEY_REGISTRY_ADDRESS,
    abi: [
        {
            "type": "impl",
            "name": "KeyRegistryImpl",
            "interface_name": "token::key_registry::IKeyRegistry"
        },
        {
            "type": "struct",
            "name": "core::integer::u256",
            "members": [
                {
                    "name": "low",
                    "type": "core::integer::u128"
                },
                {
                    "name": "high",
                    "type": "core::integer::u128"
                }
            ]
        },
        {
            "type": "struct",
            "name": "token::key_registry::PublicKey",
            "members": [
                {
                    "name": "x",
                    "type": "core::integer::u256"
                },
                {
                    "name": "y",
                    "type": "core::integer::u256"
                }
            ]
        },
        {
            "type": "interface",
            "name": "token::key_registry::IKeyRegistry",
            "items": [
                {
                    "type": "function",
                    "name": "set_encryption_key",
                    "inputs": [
                        {
                            "name": "key",
                            "type": "token::key_registry::PublicKey"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "get_encryption_key",
                    "inputs": [
                        {
                            "name": "address",
                            "type": "core::starknet::contract_address::ContractAddress"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "token::key_registry::PublicKey"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "event",
            "name": "token::key_registry::KeyRegistry::Event",
            "kind": "enum",
            "variants": []
        }
    ]
}

