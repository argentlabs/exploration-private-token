#!/bin/bash

ACCOUNT="sepolia_test"
NETWORK="sepolia"

MINT_VERIFIER_CLASS_HASH="0x03f4974bc37287996cd4d1d926cbd472111a830b624d04b90b34ed89ac2efc21"
TRANSFER_VERIFIER_CLASS_HASH="0x01f4ee6c06bd8942a4c245527ab75de0515528b51acd2d37906d17e54cc3e9d0"
KEY_REGISTRY_CLASS_HASH="0x0003f47abe2f522244fb3d0617a7e29d3325c512b9fc480571e664d6a7512fe0"
PRIVATE_TOKEN_CLASS_HASH="0x05246b3be9213e5c5167fce6a006d5ab96348a65e0046a08d30312849dcbd99e"
MINT_VERIFIER_ADDRESS="0x04b38bf26c42422e413b8e326ca813aa8d68291a4371b3d8c0f37171f6709281"
TRANSFER_VERIFIER_ADDRESS="0x04a2679da9841faa7b5c1a80393580cae863657d1fd2b36f411a0e6eced35a0f"
KEY_REGISTRY_ADDRESS="0x07aa08eda03f876a093a790bf216d2d940678348a9f6dbe09c8be569e28eedd2"

# Declare contracts
# echo "Declaring MintVerifier..."
# MINT_VERIFIER_CLASS_HASH=$(sncast --account $ACCOUNT declare --contract-name MintVerifier --network $NETWORK | grep "class_hash:" | sed 's/class_hash: //')
# echo "MintVerifier Class Hash: $MINT_VERIFIER_CLASS_HASH"

# echo "Declaring TransferVerifier..."
# TRANSFER_VERIFIER_CLASS_HASH=$(sncast --account $ACCOUNT declare --contract-name TransferVerifier --network $NETWORK | grep "class_hash:" | sed 's/class_hash: //')
# echo "TransferVerifier Class Hash: $TRANSFER_VERIFIER_CLASS_HASH"

# echo "Declaring KeyRegistry..."
# KEY_REGISTRY_CLASS_HASH=$(sncast --account $ACCOUNT declare --contract-name KeyRegistry --network $NETWORK | grep "class_hash:" | sed 's/class_hash: //')
# echo "KeyRegistry Class Hash: $KEY_REGISTRY_CLASS_HASH"

# echo "Declaring PrivateToken..."
# PRIVATE_TOKEN_CLASS_HASH=$(sncast --account $ACCOUNT declare --contract-name PrivateToken --network $NETWORK | grep "class_hash:" | sed 's/class_hash: //')
# echo "KeyRegistry Class Hash: $PRIVATE_TOKEN_CLASS_HASH"

# Deploy contracts
# echo "Deploying MintVerifier..."
# MINT_VERIFIER_ADDRESS=$(sncast --account $ACCOUNT deploy --class-hash $MINT_VERIFIER_CLASS_HASH --network $NETWORK | grep "contract_address:" | sed 's/contract_address: //')
# echo "MintVerifier deployed at: $MINT_VERIFIER_ADDRESS"

# echo "Deploying TransferVerifier..."
# TRANSFER_VERIFIER_ADDRESS=$(sncast --account $ACCOUNT deploy --class-hash $TRANSFER_VERIFIER_CLASS_HASH --network $NETWORK | grep "contract_address:" | sed 's/contract_address: //')
# echo "TransferVerifier deployed at: $TRANSFER_VERIFIER_ADDRESS"

# echo "Deploying KeyRegistry..."
# KEY_REGISTRY_ADDRESS=$(sncast --account $ACCOUNT deploy --class-hash $KEY_REGISTRY_CLASS_HASH --network $NETWORK | grep "contract_address:" | sed 's/contract_address: //')
# echo "KeyRegistry deployed at: $KEY_REGISTRY_ADDRESS"

echo "Deploying PrivateToken..."
PRIVATE_TOKEN_ADDRESS=$(sncast --account $ACCOUNT deploy --class-hash $PRIVATE_TOKEN_CLASS_HASH --constructor-calldata $KEY_REGISTRY_ADDRESS $MINT_VERIFIER_ADDRESS $TRANSFER_VERIFIER_ADDRESS --network $NETWORK | grep "contract_address:" | sed 's/contract_address: //')
echo "PrivateToken deployed at: $PRIVATE_TOKEN_ADDRESS"

# Save addresses to a file for future reference
echo "Saving contract addresses..."
echo "MINT_VERIFIER_ADDRESS=$MINT_VERIFIER_ADDRESS" > ./.deployment-test
echo "TRANSFER_VERIFIER_ADDRESS=$TRANSFER_VERIFIER_ADDRESS" >> ./.deployment-test
echo "KEY_REGISTRY_ADDRESS=$KEY_REGISTRY_ADDRESS" >> ./.deployment-test
echo "PRIVATE_TOKEN_ADDRESS=$PRIVATE_TOKEN_ADDRESS" >> ./.deployment-test



