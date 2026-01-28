import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Cognumbers',
  projectId: 'b252d79b6dac6f6f3cfe4928736af784',
  chains: [baseSepolia],
  ssr: false,
})

// Full production contract (v0.7.11) - deployed Jan 28, 2026
export const CONTRACT_ADDRESS = '0x2b4482CaCf946DcEbB7548E3F250F00d3124a013' as const
