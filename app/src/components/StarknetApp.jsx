import React, { useState, useEffect } from 'react';
import '../starknet-styles.css';
import { createContracts } from '../constants/contracts.jsx';
import { DEFAULT_NETWORK } from '../constants/networks.jsx';
import { privateKeyToPublicKey, getRandomValue, elgamalEncrypt, addEncryptedValues, decryptBalance } from '../utils/babyJubjub.jsx';
import { RpcProvider, cairo } from 'starknet';
import { getMintProof, getBurnProof, getTransferProof } from '../utils/proving.jsx';

const StarknetApp = () => {
  // State management
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [starknet, setStarknet] = useState(null);
  const [publicKey, setPublicKey] = useState({ x: null, y: null });
  const [privateKey, setPrivateKey] = useState(null);
  const [isKeyRegistered, setIsKeyRegistered] = useState(false);
  const [contracts, setContracts] = useState(null);
  const [balanceEncrypted, setBalanceEncrypted] = useState(null);
  const [balance, setBalance] = useState(null);

  // Input fields state
  const [inputs, setInputs] = useState({
    privateKey: '',
    mintValue: '1000',
    burnValue: '500',
    transferTo: '0x789...',
    transferValue: '100'
  });

  // Add these state variables to track proof generation status
  const [proofStatus, setProofStatus] = useState({
    mint: false,
    burn: false,
    transfer: false
  });

  // Add transaction status tracking
  const [txStatus, setTxStatus] = useState({
    mint: false,
    burn: false,
    transfer: false
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check for wallet on component mount
  useEffect(() => {
    function checkWallet() {
      console.log("check wallet");
      if (typeof window !== 'undefined' && window.starknet) {
        setStarknet(window.starknet);

        // Check if already connected
        try {
          window.starknet.isPreauthorized().then(isPreauthorized => {
            if (isPreauthorized) {
              connectWallet();
            }
          }).catch(error => {
            console.error("Error checking preauthorization:", error);
          });
        } catch (error) {
          console.error("Error checking wallet:", error);
        }
      } else {
        setStatusMessage("No Starknet wallet extension detected. Please install Argent X or Braavos.");
      }
    }

    checkWallet();
  }, []);

  const updatePublicKey = async () => {
    if (connected && account && contracts) {
      const registeredKey = await contracts.keyRegistryContract.get_encryption_key(account.address);
      setPublicKey({ x: registeredKey.x, y: registeredKey.y });
    }
  }

  // Function to fetch and update balance
  const updateBalance = async () => {
    if (connected && account && contracts) {
      try {
        const balanceResult = await contracts.tokenContract.balance_of(account.address);
        setBalanceEncrypted(balanceResult);
        console.log("balanceResult", balanceResult);
        console.log("Updated encrypted balance");

        // If we have a private key, decrypt the balance
        if (privateKey && balanceResult.c1_x != 0 && balanceResult.c1_y != 0 && balanceResult.c2_x != 0 && balanceResult.c2_y != 0) {
          try {
            // Assuming you have a function to decrypt the balance
            console.log("Decrypting balance");
            const decryptedBalance = await decryptBalance(balanceResult, privateKey);
            setBalance(decryptedBalance);
            console.log("Updated decrypted balance:", decryptedBalance);
          } catch (decryptError) {
            console.error("Error decrypting balance:", decryptError);
          }
        }
      } catch (error) {
        console.error("Error fetching encrypted balance:", error);
      }
    }
  };

  const waitForTransaction = async (txHash) => {
    console.log("waiting for transaction", txHash);
    await window.starknet.provider.waitForTransaction(txHash);
  }

  // Update balance when connected or when account/contracts change
  useEffect(() => {
    if (connected && account && contracts) {
      updateBalance();
      updatePublicKey();
      if (privateKey) {
        updateBalance();
      }
    }
  }, [connected, account, contracts, privateKey]);

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.starknet) {
      setStatusMessage("No Starknet wallet extension detected. Please install Argent X or Braavos.");
      return;
    }

    setLoading(true);
    setStatusMessage('Connecting wallet...');

    // Create and configure the provider first
    const provider = new RpcProvider({
      nodeUrl: DEFAULT_NETWORK.baseUrl,
    });

    window.starknet.enable()
      .then(walletResponse => {
        if (walletResponse) {
          // Set provider on both starknet and account
          window.starknet.provider = provider;
          window.starknet.account.provider = provider;

          const connectedAccount = {
            address: window.starknet.account?.address || window.starknet.selectedAddress,
          };

          setAccount(connectedAccount);
          setConnected(true);
          setStatusMessage(`Connected to wallet: ${connectedAccount.address.substring(0, 10)}...`);

          // Initialize contracts
          const contractInstances = createContracts(window.starknet.account);
          setContracts(contractInstances);
        } else {
          setStatusMessage('Connection request rejected by user');
        }
      })
      .catch(error => {
        console.error('Connection error:', error);
        setStatusMessage(`Error: ${error.message || 'Could not connect to wallet'}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    try {
      // Most wallet extensions don't support programmatic disconnect
      setAccount(null);
      setConnected(false);
      setPrivateKey(null);
      setPublicKey({ x: null, y: null });
      setBalanceEncrypted(null);
      setBalance(null);
      setIsKeyRegistered(false);
      setStatusMessage('Wallet disconnected');
      setTxHash('');
    } catch (error) {
      console.error('Disconnect error:', error);
      setStatusMessage(`Error disconnecting: ${error.message}`);
    }
  };

  // Action handlers
  const registerKey = async () => {
    if (!inputs.privateKey) {
      setStatusMessage('Please enter a private key');
      return;
    }

    try {
      const privKey = BigInt(inputs.privateKey.toString());

      const pubKey = privateKeyToPublicKey(privKey);

      const registeredKey = await contracts.keyRegistryContract.get_encryption_key(account.address);
      if (registeredKey.x == 0 && registeredKey.y == 0) {
        setStatusMessage('Registering public key...');
        const tx = await contracts.keyRegistryContract.set_encryption_key({
          x: cairo.uint256(pubKey[0]),
          y: cairo.uint256(pubKey[1])
        });
        await waitForTransaction(tx.transaction_hash);
        setStatusMessage('Key registered successfully');
      } else {
        setStatusMessage('Key already registered');
      }

      setPrivateKey(privKey);
      setPublicKey({ x: pubKey[0], y: pubKey[1] });
      setIsKeyRegistered(true);
    } catch (error) {
      console.error("Error in registerKey:", error);
      setStatusMessage(`Error registering public key: ${error.message}`);
    }
  };
  const mint = async () => {
    if (!inputs.mintValue || !contracts) {
      setStatusMessage('Please enter a value');
      return;
    }

    try {
      // Set proof generation status
      setProofStatus(prev => ({ ...prev, mint: true }));

      const random = getRandomValue();
      const mintValue = BigInt(inputs.mintValue);
      const balanceBefore = balanceEncrypted;
      const encryptedValue = await elgamalEncrypt(mintValue, publicKey, random);
      const balanceAfter = addEncryptedValues(balanceBefore, encryptedValue);

      // Generate proof with status message
      setStatusMessage('Generating mint proof...');
      const proof_as_calldata = await getMintProof(privateKey, random, mintValue, publicKey, balanceBefore, balanceAfter);

      // Reset proof status and set transaction status
      setProofStatus(prev => ({ ...prev, mint: false }));
      setTxStatus(prev => ({ ...prev, mint: true }));

      setStatusMessage('Submitting transaction...');
      const tx = await contracts.tokenContract.mint(cairo.uint256(mintValue), proof_as_calldata.slice(1));
      await waitForTransaction(tx.transaction_hash);
      await updateBalance();
      setStatusMessage('Mint successful!');
    } catch (error) {
      setStatusMessage(`Error minting: ${error.message}`);
    } finally {
      // Reset both statuses
      setProofStatus(prev => ({ ...prev, mint: false }));
      setTxStatus(prev => ({ ...prev, mint: false }));
    }
  }
  const burn = async () => {
    if (!inputs.burnValue || !contracts) {
      setStatusMessage('Please enter a value');
      return;
    }

    try {
      // Set proof generation status
      setProofStatus(prev => ({ ...prev, burn: true }));

      const random = getRandomValue();
      const burnValue = BigInt(inputs.burnValue);
      if (burnValue > balance) {
        setStatusMessage('Burn value is greater than balance');
        return;
      }
      const balanceBeforeClear = balance;
      const balanceAfterClear = balanceBeforeClear - burnValue;
      const balanceBefore = balanceEncrypted;

      // Generate encrypted balance after
      setStatusMessage('Encrypting new balance...');
      const balanceAfter = await elgamalEncrypt(balanceAfterClear, publicKey, random);

      // Generate proof with status message
      setStatusMessage('Generating burn proof...');
      const proof_as_calldata = await getBurnProof(privateKey, random, balanceBeforeClear, burnValue, publicKey, balanceBefore, balanceAfter);

      // Reset proof status and set transaction status
      setProofStatus(prev => ({ ...prev, burn: false }));
      setTxStatus(prev => ({ ...prev, burn: true }));

      setStatusMessage('Submitting transaction...');
      const tx = await contracts.tokenContract.burn(cairo.uint256(burnValue), proof_as_calldata.slice(1));
      await waitForTransaction(tx.transaction_hash);
      await updateBalance();
      setStatusMessage('Burn successful!');
    } catch (error) {
      setStatusMessage(`Error burning: ${error.message}`);
    } finally {
      // Reset both statuses
      setProofStatus(prev => ({ ...prev, burn: false }));
      setTxStatus(prev => ({ ...prev, burn: false }));
    }
  }
  const transfer = async () => {
    if (!inputs.transferTo || !inputs.transferValue || !contracts) {
      setStatusMessage('Please enter a recipient address and transfer amount');
      return;
    }

    try {
      // Set proof generation status
      setProofStatus(prev => ({ ...prev, transfer: true }));

      const transferValue = BigInt(inputs.transferValue);
      const transferTo = BigInt(inputs.transferTo);

      const fromRandom = getRandomValue();
      const toRandom = getRandomValue();
      const fromBalanceBeforeClear = balance;
      const fromPublicKey = publicKey;
      const toPublicKey = await contracts.keyRegistryContract.get_encryption_key(transferTo);
      if (toPublicKey.x == 0 && toPublicKey.y == 0) {
        setStatusMessage('Recipient has not registered their key');
        return;
      }

      setStatusMessage('Fetching recipient public key...');

      const fromBalanceBeforeEncrypted = balanceEncrypted;
      const toBalanceBeforeEncrypted = await contracts.tokenContract.balance_of(transferTo);
      const fromBalanceAfterClear = fromBalanceBeforeClear - transferValue;

      setStatusMessage('Encrypting new balances...');
      const fromBalanceAfterEncrypted = await elgamalEncrypt(fromBalanceAfterClear, fromPublicKey, fromRandom);
      const valueEncrypted = await elgamalEncrypt(transferValue, toPublicKey, toRandom);
      const toBalanceAfterEncrypted = addEncryptedValues(toBalanceBeforeEncrypted, valueEncrypted);

      setStatusMessage('Generating transfer proof...');
      const proof_as_calldata = await getTransferProof(
        privateKey,
        fromRandom,
        toRandom,
        transferValue,
        fromBalanceBeforeClear,
        fromPublicKey,
        { x: toPublicKey.x, y: toPublicKey.y },
        fromBalanceBeforeEncrypted,
        toBalanceBeforeEncrypted,
        fromBalanceAfterEncrypted,
        toBalanceAfterEncrypted,
      );

      // Reset proof status and set transaction status
      setProofStatus(prev => ({ ...prev, transfer: false }));
      setTxStatus(prev => ({ ...prev, transfer: true }));

      setStatusMessage('Submitting transaction...');
      const tx = await contracts.tokenContract.transfer(transferTo, proof_as_calldata.slice(1));
      await waitForTransaction(tx.transaction_hash);
      await updateBalance();
      setStatusMessage('Transfer successful!');
    } catch (error) {
      setStatusMessage(`Error transferring: ${error.message}`);
    } finally {
      // Reset both statuses
      setProofStatus(prev => ({ ...prev, transfer: false }));
      setTxStatus(prev => ({ ...prev, transfer: false }));
    }
  }

  // View transaction in explorer
  const viewTransaction = () => {
    if (txHash) {
      const explorerUrl = window.starknet?.provider?.chainId || DEFAULT_NETWORK.explorerUrl;

      window.open(explorerUrl, '_blank');
    }
  };

  return (
    <div>
      {/* Header with wallet connection in top right */}
      <div className="header">
        <h1 className="app-title">Private USDC</h1>

        {!connected ? (
          <button
            onClick={connectWallet}
            disabled={loading || !starknet}
            className="wallet-connect-button"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <span className="wallet-address">
              {account.address.substring(0, 6)}...{account.address.substring(account.address.length - 4)}
            </span>
            <button
              onClick={disconnectWallet}
              className="disconnect-button"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* New balance and key info box - displayed when connected */}
      {connected && (
        <div className="info-container">
          <div className="info-box">
            <h3>Account Information</h3>

            {publicKey.x && publicKey.y && (publicKey.x !== 0 || publicKey.y !== 0) ? (
              <>
                <div className="info-section">
                  <h4>Public Key</h4>
                  <div className="key-info">
                    <div className="key-component">
                      <span className="key-label">X:</span>
                      <span className="key-value">0x{publicKey.x.toString(16)}</span>
                    </div>
                    <div className="key-component">
                      <span className="key-label">Y:</span>
                      <span className="key-value">0x{publicKey.y.toString(16)}</span>
                    </div>
                  </div>
                </div>

                {balanceEncrypted ? (
                  <div className="info-section">
                    <h4>Balance</h4>
                    <div className="key-info">
                      <div className="key-component">
                        <span className="key-label">Value:</span>
                        {balance !== null ? (
                          <span className="key-value">{balance.toString()}</span>
                        ) : (
                          <span className="key-value">0x{balanceEncrypted.c1_x.toString(16)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="info-section">
                    <h4>Balance</h4>
                    <p className="no-balance-message">No balance</p>
                  </div>
                )}

                {/* Add private key status indicator */}
                {privateKey ? (
                  <div className="private-key-status">
                    <p>Private Key provided</p>
                  </div>
                ) : (
                  <div className="private-key-status">
                    <p>Private Key not provided</p>
                  </div>
                )}
              </>
            ) : (
              <div className="info-section">
                <h4>Public Key</h4>
                <p className="no-key-message">No public key registered</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="starknet-container">
        <div className="card">
          <div className="actions-grid">
            {/* Register Key Section - Show if private key not provided OR no public key registered */}
            {(!privateKey || !publicKey.x || !publicKey.y || (publicKey.x === 0 && publicKey.y === 0)) && (
              <div className="action-section">
                <div className="action-title">Set Private Key</div>
                {!isKeyRegistered ? (
                  <>
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">Private Key</span>
                        <input
                          type="text"
                          name="privateKey"
                          value={inputs.privateKey}
                          onChange={handleInputChange}
                          placeholder="Enter your private key"
                          className="input-field"
                        />
                      </label>
                    </div>
                    <button
                      onClick={registerKey}
                      disabled={loading || !connected}
                      className="btn btn-success"
                    >
                      Register Key
                    </button>
                  </>
                ) : (
                  <div className="registered-message">
                    <p>Your key has been registered</p>
                    <button
                      onClick={registerKey}
                      disabled={loading || !connected}
                      className="btn btn-secondary"
                    >
                      Update Key
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mint Section */}
            <div className="action-section">
              <div className="action-title">Mint</div>
              <div className="input-group">
                <label className="input-label">
                  <span className="label-text">Value</span>
                  <input
                    type="text"
                    name="mintValue"
                    value={inputs.mintValue}
                    onChange={handleInputChange}
                    placeholder="Enter mint amount"
                    className="input-field"
                  />
                </label>
              </div>
              <button
                onClick={mint}
                disabled={loading || !connected || proofStatus.mint || txStatus.mint}
                className={`btn ${proofStatus.mint ? 'btn-generating' : txStatus.mint ? 'btn-submitting' : 'btn-purple'}`}
              >
                {proofStatus.mint
                  ? 'Generating Proof...'
                  : txStatus.mint
                    ? 'Submitting Transaction...'
                    : 'Mint'}
              </button>
            </div>

            {/* Burn Section */}
            <div className="action-section">
              <div className="action-title">Burn</div>
              <div className="input-group">
                <label className="input-label">
                  <span className="label-text">Value</span>
                  <input
                    type="text"
                    name="burnValue"
                    value={inputs.burnValue}
                    onChange={handleInputChange}
                    placeholder="Enter burn amount"
                    className="input-field"
                  />
                </label>
              </div>
              <button
                onClick={burn}
                disabled={loading || !connected || proofStatus.burn || txStatus.burn}
                className={`btn ${proofStatus.burn ? 'btn-generating' : txStatus.burn ? 'btn-submitting' : 'btn-danger'}`}
              >
                {proofStatus.burn
                  ? 'Generating Proof...'
                  : txStatus.burn
                    ? 'Submitting Transaction...'
                    : 'Burn'}
              </button>
            </div>

            {/* Transfer Section */}
            <div className="action-section">
              <div className="action-title">Transfer</div>
              <div className="input-group">
                <label className="input-label">
                  <span className="label-text">To Address</span>
                  <input
                    type="text"
                    name="transferTo"
                    value={inputs.transferTo}
                    onChange={handleInputChange}
                    placeholder="Enter recipient address"
                    className="input-field"
                  />
                </label>
                <label className="input-label">
                  <span className="label-text">Value</span>
                  <input
                    type="text"
                    name="transferValue"
                    value={inputs.transferValue}
                    onChange={handleInputChange}
                    placeholder="Enter transfer amount"
                    className="input-field"
                  />
                </label>
              </div>
              <button
                onClick={transfer}
                disabled={loading || !connected || proofStatus.transfer || txStatus.transfer}
                className={`btn ${proofStatus.transfer ? 'btn-generating' : txStatus.transfer ? 'btn-submitting' : 'btn-warning'}`}
              >
                {proofStatus.transfer
                  ? 'Generating Proof...'
                  : txStatus.transfer
                    ? 'Submitting Transaction...'
                    : 'Transfer'}
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="status-box">
              <p>{statusMessage}</p>
              {txHash && (
                <button
                  onClick={viewTransaction}
                  className="transaction-link"
                >
                  View transaction
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          )}
        </div>

        <div className="footer">
          <p>Built with love by Argent!</p>
        </div>
      </div>
    </div>
  );
};

export default StarknetApp;