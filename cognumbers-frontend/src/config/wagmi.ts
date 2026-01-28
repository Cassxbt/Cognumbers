import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Cognumbers',
  projectId: 'b252d79b6dac6f6f3cfe4928736af784',
  chains: [baseSepolia],
  ssr: false,
})

// Full production contract with reveal() - deployed Jan 28, 2026
export const CONTRACT_ADDRESS = '0x3C20F0548933663cD13cCF2884a7bb785EF9766D' as const
