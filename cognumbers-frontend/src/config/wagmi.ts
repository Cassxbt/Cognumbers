import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Cognumbers',
  projectId: 'b252d79b6dac6f6f3cfe4928736af784',
  chains: [baseSepolia],
  ssr: false,
})

export const CONTRACT_ADDRESS = '0x2f3268bd8ff551b770fd4830c1d2b68ef1a9e5e4' as const
