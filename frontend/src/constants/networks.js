import { constants } from 'starknet';

/**
 * Network configurations for Starknet
 */
export const NETWORKS = {
  // Mainnet configuration
  MAINNET: {
    name: 'Mainnet',
    chainId: constants.StarknetChainId.SN_MAIN,
    baseUrl: 'https://pathfinder.nethermind.io',
    explorer: 'https://starkscan.co',
    explorerTx: (txHash) => `https://starkscan.co/tx/${txHash}`,
    explorerAddress: (address) => `https://starkscan.co/contract/${address}`,
  },

  // Sepolia Testnet configuration
  SEPOLIA: {
    name: 'Sepolia Testnet',
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    baseUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
    explorer: 'https://sepolia.starkscan.co',
    explorerTx: (txHash) => `https://sepolia.starkscan.co/tx/${txHash}`,
    explorerAddress: (address) => `https://sepolia.starkscan.co/contract/${address}`,
  },

  // Devnet configuration (for local development)
  DEVNET: {
    name: 'Devnet (Local)',
    chainId: constants.StarknetChainId.SN_GOERLI,
    baseUrl: 'http://localhost:5050',
    explorer: '',
    explorerTx: () => '',
    explorerAddress: () => '',
  }
};

// Default network to use
export const DEFAULT_NETWORK = NETWORKS.SEPOLIA;

/**
 * Get network configuration by chain ID
 * @param {string} chainId - The chain ID to look up
 * @returns {Object} Network configuration
 */
export const getNetworkByChainId = (chainId) => {
  const network = Object.values(NETWORKS).find(
    (network) => network.chainId === chainId
  );

  return network || DEFAULT_NETWORK;
};

/**
 * Get provider configuration for a network
 * @param {Object} network - Network configuration
 * @returns {Object} Provider configuration
 */
export const getProviderConfig = (network = DEFAULT_NETWORK) => {
  return {
    sequencer: {
      baseUrl: network.baseUrl
    }
  };
};

export const defaultNetwork = NETWORKS.SEPOLIA;
