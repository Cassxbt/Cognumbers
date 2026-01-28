import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Cognumbers',
  projectId: 'b252d79b6dac6f6f3cfe4928736af784',
  chains: [baseSepolia],
  ssr: false,
})

// Original full contract: 0xe3aab2f36601cec8d217da5497fc3fe00ed22538
// Minimal test contract (v0.7.11) for debugging
export const CONTRACT_ADDRESS = '0x2AEe6ECD379295891d2AEab5E8622c8a798922DA' as const
