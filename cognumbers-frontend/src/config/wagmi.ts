import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Cognumbers',
  projectId: 'b252d79b6dac6f6f3cfe4928736af784',
  chains: [baseSepolia],
  ssr: false,
})

// Original full contract: 0xe3aab2f36601cec8d217da5497fc3fe00ed22538
// Minimal test contract for debugging (lowercase for SDK compatibility)
export const CONTRACT_ADDRESS = '0x4ad54bafb404e66988828ec3d1193da317dc2ebb' as const
