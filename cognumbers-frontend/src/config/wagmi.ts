import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Cognumbers',
  projectId: 'b252d79b6dac6f6f3cfe4928736af784',
  chains: [baseSepolia],
  ssr: false,
})

export const CONTRACT_ADDRESS = '0x110Daf63811F8F2b50aC01a8Ab85fb9B20ca9624' as const
