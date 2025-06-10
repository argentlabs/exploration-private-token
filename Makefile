install-noir:
	curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
	noirup --version 1.0.0-beta.3

install-barretenberg:
	curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
	bbup --version 0.86.0-starknet.1

install-garaga:
	pip install garaga==0.18.0

install-wasm-pack:
	curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

build-circuits:
	cd circuits/mint && nargo compile && bb write_vk --scheme ultra_honk --oracle_hash starknet -b target/mint.json -o target/
	cd circuits/burn && nargo compile && bb write_vk --scheme ultra_honk --oracle_hash starknet -b target/burn.json -o target/
	cd circuits/transfer && nargo compile && bb write_vk --scheme ultra_honk --oracle_hash starknet -b target/transfer.json -o target/

build-contracts:
	mkdir -p contracts/src
	cd contracts/src && garaga gen --system ultra_starknet_zk_honk --vk ../../circuits/mint/target/vk --project-name mint && mv mint ../mint
	cd contracts/src && garaga gen --system ultra_starknet_zk_honk --vk ../../circuits/burn/target/vk --project-name burn && mv burn ../burn
	cd contracts/src && garaga gen --system ultra_starknet_zk_honk --vk ../../circuits/transfer/target/vk --project-name transfer && mv transfer ../transfer
	sed -i '' '1s/.*/pub mod honk_verifier;/' contracts/mint/src/lib.cairo && sed -i '' 's/UltraStarknetZKHonkVerifier/MintVerifier/g' contracts/mint/src/honk_verifier.cairo
	sed -i '' '1s/.*/pub mod honk_verifier;/' contracts/burn/src/lib.cairo && sed -i '' 's/UltraStarknetZKHonkVerifier/BurnVerifier/g' contracts/burn/src/honk_verifier.cairo
	sed -i '' '1s/.*/pub mod honk_verifier;/' contracts/transfer/src/lib.cairo && sed -i '' 's/UltraStarknetZKHonkVerifier/TransferVerifier/g' contracts/transfer/src/honk_verifier.cairo
	echo "\n[lib]" >> contracts/mint/Scarb.toml && echo "\n[lib]" >> contracts/burn/Scarb.toml && echo "\n[lib]" >> contracts/transfer/Scarb.toml
	rm -rf contracts/src

clean-contracts:
	rm -rf contracts/mint contracts/burn contracts/transfer

deploy-contracts:
	cd contracts/scripts && sncast --account sepolia_test script run deploy --network sepolia 2>&1 | tee deploy-contracts.log

build-babygiant:
	cd babygiant && cargo build && wasm-pack build --target web --out-dir ../app/src/wasm/babygiant

build-artifacts:
	@cp ./circuits/mint/target/mint.json ./app/src/assets/mint.json
	@cp ./circuits/mint/target/vk ./app/src/assets/mint_vk.bin
	@cp ./circuits/burn/target/burn.json ./app/src/assets/burn.json
	@cp ./circuits/burn/target/vk ./app/src/assets/burn_vk.bin
	@cp ./circuits/transfer/target/transfer.json ./app/src/assets/transfer.json
	@cp ./circuits/transfer/target/vk ./app/src/assets/transfer_vk.bin
	$(eval PRIVATE_TOKEN_ADDRESS := $(shell grep 'PrivateToken deployed at address' contracts/scripts/deploy-contracts.log | grep -o '0x[0-9a-f]*'))
	$(eval KEY_REGISTRY_ADDRESS := $(shell grep 'KeyRegistry deployed at address' contracts/scripts/deploy-contracts.log | grep -o '0x[0-9a-f]*'))
	@sed -i '' "s/const TOKEN_CONTRACT_ADDRESS = '[^']*'/const TOKEN_CONTRACT_ADDRESS = '$(PRIVATE_TOKEN_ADDRESS)'/" app/src/constants/contracts.jsx
	@sed -i '' "s/const KEY_REGISTRY_ADDRESS = '[^']*'/const KEY_REGISTRY_ADDRESS = '$(KEY_REGISTRY_ADDRESS)'/" app/src/constants/contracts.jsx

run-app:
	cd app && npm run dev
