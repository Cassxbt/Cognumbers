import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAllGames } from '../hooks/useGames'
import { GameCard } from '../components/GameCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GameStatus } from '../types/game'
import { formatPrize } from '../lib/utils'

export function History() {
  const { address, isConnected } = useAccount()
  const { games, isLoading } = useAllGames()

  const finishedGames = games.filter((g) => g.status === GameStatus.Finished)
  const totalPrizes = finishedGames.reduce((acc, game) => {
    return acc + Number(formatPrize(game.entryFee, game.playerCount))
  }, 0)

  const winners = finishedGames
    .filter((g) => g.winner !== '0x0000000000000000000000000000000000000000')
    .reduce((acc, game) => {
      const winner = game.winner
      if (!acc[winner]) {
        acc[winner] = { wins: 0, earnings: 0 }
      }
      acc[winner].wins++
      acc[winner].earnings += Number(formatPrize(game.entryFee, game.playerCount))
      return acc
    }, {} as Record<string, { wins: number; earnings: number }>)

  const leaderboard = Object.entries(winners)
    .map(([address, stats]) => ({ address, ...stats }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10)

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="cyber-card p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4 font-['Orbitron']">
            CONNECT WALLET
          </h2>
          <p className="text-slate-400 font-mono text-sm mb-6">
            Connect your wallet to view history
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-['Orbitron'] text-3xl font-bold text-white mb-2">
          HISTORY & LEADERBOARD
        </h1>
        <p className="text-slate-400 font-mono text-sm">
          {finishedGames.length} COMPLETED GAMES // {totalPrizes.toFixed(4)} ETH TOTAL PRIZES
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="cyber-card p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4 font-['Orbitron']">
              GLOBAL STATS
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 font-['Orbitron']">
                  {games.length}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1">TOTAL GAMES</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 font-['Orbitron']">
                  {finishedGames.length}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1">COMPLETED</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 font-['Orbitron']">
                  {totalPrizes.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1">ETH DISTRIBUTED</div>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-white mb-4 font-['Orbitron']">
            COMPLETED GAMES
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner text="LOADING HISTORY..." />
            </div>
          ) : finishedGames.length === 0 ? (
            <div className="cyber-card p-8 text-center">
              <p className="text-slate-400 font-mono">NO COMPLETED GAMES YET</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {finishedGames.map((game) => (
                <GameCard key={game.gameId.toString()} game={game} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="cyber-card p-6 sticky top-4">
            <h2 className="text-lg font-bold text-white mb-4 font-['Orbitron']">
              LEADERBOARD
            </h2>

            {leaderboard.length === 0 ? (
              <p className="text-slate-400 font-mono text-sm">NO WINNERS YET</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.address}
                    className={`flex items-center gap-3 p-3 border ${
                      entry.address === address
                        ? 'border-cyan-400/50 bg-cyan-400/5'
                        : 'border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center font-bold font-['Orbitron'] ${
                        index === 0
                          ? 'bg-yellow-400/20 text-yellow-400'
                          : index === 1
                          ? 'bg-slate-400/20 text-slate-400'
                          : index === 2
                          ? 'bg-orange-400/20 text-orange-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-white truncate">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        {entry.address === address && (
                          <span className="text-cyan-400 ml-1">(YOU)</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {entry.wins} WIN{entry.wins > 1 ? 'S' : ''}
                      </div>
                    </div>
                    <div className="text-green-400 font-mono text-sm">
                      {entry.earnings.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-bold text-white mb-3 font-mono">WINNING TIPS</h3>
              <ul className="text-xs text-slate-400 font-mono space-y-2">
                <li>- Avoid obvious numbers like 1 or 7</li>
                <li>- Think about what others might pick</li>
                <li>- Unique beats low</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
