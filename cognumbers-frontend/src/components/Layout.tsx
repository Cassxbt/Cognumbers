import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'

const navItems = [
  { path: '/', label: 'HOME' },
  { path: '/games', label: 'GAMES' },
  { path: '/leaderboard', label: 'LEADERBOARD' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <header className="relative z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 border border-cyan-400/50 flex items-center justify-center bg-slate-900/80">
                <span className="text-cyan-400 font-bold text-xl">#</span>
              </div>
              <span className="font-['Orbitron'] text-lg md:text-xl font-bold text-white tracking-wider hidden sm:block">
                COGNUMBERS
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-4 py-2 text-sm font-mono tracking-wider transition-all duration-200',
                    location.pathname === item.path
                      ? 'text-cyan-400 bg-cyan-400/10 border-b-2 border-cyan-400'
                      : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side: Connect + Mobile Menu */}
            <div className="flex items-center gap-3">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted
                  const connected = ready && account && chain

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              className="cyber-button text-sm px-3 py-2"
                            >
                              CONNECT
                            </button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              className="cyber-button cyber-button-red text-sm px-3 py-2"
                            >
                              WRONG NETWORK
                            </button>
                          )
                        }

                        return (
                          <button
                            onClick={openAccountModal}
                            className="cyber-button text-sm px-3 py-2"
                          >
                            {account.displayName}
                          </button>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={cn(
              'md:hidden overflow-hidden transition-all duration-300',
              mobileMenuOpen ? 'max-h-48 mt-4' : 'max-h-0'
            )}
          >
            <nav className="flex flex-col border border-slate-800 bg-slate-900/90">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 text-sm font-mono tracking-wider transition-all duration-200 border-b border-slate-800 last:border-b-0',
                    location.pathname === item.path
                      ? 'text-cyan-400 bg-cyan-400/10'
                      : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {children}
      </main>

      <footer className="relative z-10 border-t border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-600 text-sm font-mono">
          <p>COGNUMBERS // INCO // CASSXBT</p>
        </div>
      </footer>
    </div>
  )
}
