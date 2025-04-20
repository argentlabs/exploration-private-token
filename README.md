## Development

### Install Noir 1.0.0-beta.3

```
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
noirup --version 1.0.0-beta.3
```

### Install the Bartenberg prover 0.85.0

```
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
bbup --version 0.85.0
```

### Install Garaga 0.17.0

```
pip install garaga==0.17.0
```

## Building the mint circuit and verifying contract

In `/mint`:

Compile the circuit:
```
> nargo compile
```

Generate the verifying key:
```
> bb write_vk --scheme ultra_honk --oracle_hash keccak -b target/mint.json -o target/
> mv target/vk target/vk.bin
```

Generate the verifying contract from the verifying key:
```
> garaga gen --system ultra_keccak_honk --vk target/vk.bin
```

## Generating a proof for the mint circuit

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

## Deploying the contracts

```
> cd scripts
> sncast --account sepolia_test script run deploy --network sepolia
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