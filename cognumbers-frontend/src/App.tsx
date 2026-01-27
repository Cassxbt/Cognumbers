import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import { config } from './config/wagmi'
import { Layout } from './components/Layout'
import { Landing } from './pages/Landing'
import { Games } from './pages/Games'
import { CreateGame } from './pages/CreateGame'
import { GameDetail } from './pages/GameDetail'
import { History } from './pages/History'
import { Leaderboard } from './pages/Leaderboard'

const queryClient = new QueryClient()

const customTheme = darkTheme({
  accentColor: '#00ffff',
  accentColorForeground: '#0a0a0f',
  borderRadius: 'none',
  fontStack: 'system',
})

customTheme.colors.modalBackground = '#12121a'
customTheme.colors.modalBorder = '#2a2a3a'
customTheme.colors.profileForeground = '#12121a'
customTheme.colors.closeButtonBackground = '#2a2a3a'
customTheme.colors.connectButtonBackground = '#12121a'
customTheme.colors.connectButtonInnerBackground = '#1a1a24'
customTheme.fonts.body = 'JetBrains Mono, monospace'

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme} modalSize="compact">
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/games" element={<Games />} />
                <Route path="/create" element={<CreateGame />} />
                <Route path="/game/:id" element={<GameDetail />} />
                <Route path="/history" element={<History />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
