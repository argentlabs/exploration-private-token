## Development

### Install Noir

```
make install-noir
```

### Install the Bartenberg prover

```
make install-barretenberg
```

### Install Garaga

```
make install-garaga
```

### Install wasm-pack

```
make install-wasm-pack
```

### Build the circuits

```
make build-circuits
```

### Build the contracts

```
make build-contracts
```

### Deploy the contracts

```
make deploy-contracts
```

Keep track of the KeyRegistry and PrivateToken contract addresses and update the `app/src/constants/contracts.jsx` file with the correct values.

### Build babygiant wasm

```
make build-babygiant
```

### Move the artifacts to the app

```
make artifacts
```

### Run the app

```
cd app
npm install
npm run dev
```

### Prooving locally using the CLI

E.g. in `/mint`: 
Set the values of the private and public inputs in `Prover_mint.toml`.

Generate the witness from the inputs in `Prover_mint.toml`:
```
> nargo execute -p Prover_mint.toml
```

Generate the proof:
```
> bb prove -s ultra_honk --oracle_hash keccak -b target/mint.json -w target/mint.gz -o target/
> mv target/proof target/proof.bin
```

Format the proof and the public inputs as calldata for the verifying contract:
```
> cd target
> garaga calldata --system ultra_keccak_honk --vk vk.bin --proof proof.bin --format array
```

## Test use case

User 1: 
- private key 0x03c96f78ed310623e3b00fd5260d90647996193c19984c24b4ca92ec73c5d8e0
- public key [0x1cda22076db52c0b803c239b6515e88e2e2ae819aec57a4601599b0e9ca1ec9a, 0x27e92be248c00a5d0e387a641474370d593f1724de2774ff663c6442d9ac75bf]

User 2: 
- private key 0x0510bae26a9b59ebad67a4324c944b1910a778e8481d7f08ddba6bcd2b94b2c4
- public key [0x1865e98a61eb14dd9366fbc6808c3cd93aec7cf0adcecd86711c17e8e96cf95a, 0x2a6b15f46f69a6a6f8991466900b57585a49e31643cc04b0070f6d74db9f9fdc]

- User 1 registers public key in PKI
- User 2 registers public key in PKI
- User 1 mint 10000 tokens
- User 1 transfers 1000 tokens to User 2
- User 2 transfers 100 tokens back to User 1
- User 2 burns 100 tokens