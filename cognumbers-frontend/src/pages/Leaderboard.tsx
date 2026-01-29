import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useAllGames } from '../hooks/useGames'
import { GameStatus } from '../types/game'
import { maskAddress } from '../lib/utils'
import { LoadingSpinner } from '../components/LoadingSpinner'

interface PlayerStats {
  address: string
  wins: number
  gamesPlayed: number
  earnings: bigint
}

// Rank badge component with medal styling
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30">
        <span className="text-yellow-900 font-bold text-lg md:text-xl">1</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-lg shadow-slate-400/30">
        <span className="text-slate-700 font-bold text-lg md:text-xl">2</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 shadow-lg shadow-amber-600/30">
        <span className="text-amber-100 font-bold text-lg md:text-xl">3</span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 border border-slate-700">
      <span className="text-slate-400 font-mono text-sm md:text-base">{rank}</span>
    </div>
  )
}

// Player row component
function PlayerRow({
  player,
  rank,
  isCurrentUser,
}: {
  player: PlayerStats
  rank: number
  isCurrentUser: boolean
}) {
  const ethEarnings = Number(player.earnings) / 1e18
  const winRate = player.gamesPlayed > 0
    ? Math.round((player.wins / player.gamesPlayed) * 100)
    : 0

  // Top 3 get special styling
  const isTopThree = rank <= 3
  const borderColor = isCurrentUser
    ? 'border-cyan-500/50'
    : rank === 1
      ? 'border-yellow-500/30'
      : rank === 2
        ? 'border-slate-400/30'
        : rank === 3
          ? 'border-amber-600/30'
          : 'border-slate-800'

  const bgColor = isCurrentUser
    ? 'bg-cyan-500/5'
    : isTopThree
      ? 'bg-slate-800/30'
      : 'bg-transparent'

  return (
    <div
      className={`
        flex items-center gap-3 md:gap-4 p-3 md:p-4 border ${borderColor} ${bgColor}
        transition-all duration-200 hover:bg-slate-800/50
        ${isTopThree ? 'mb-2' : ''}
      `}
    >
      {/* Rank */}
      <div className="flex-shrink-0">
        <RankBadge rank={rank} />
      </div>

      {/* Player info - grows to fill space */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-sm md:text-base truncate ${
              isCurrentUser ? 'text-cyan-400' : 'text-white'
            }`}
          >
            {maskAddress(player.address)}
          </span>
          {isCurrentUser && (
            <span className="px-1.5 py-0.5 text-[10px] md:text-xs font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              YOU
            </span>
          )}
        </div>
        {/* Mobile: show stats inline */}
        <div className="flex items-center gap-3 mt-1 md:hidden text-xs font-mono text-slate-500">
          <span>{player.wins}W</span>
          <span>{winRate}%</span>
        </div>
      </div>

      {/* Stats - desktop layout */}
      <div className="hidden md:flex items-center gap-6">
        {/* Wins */}
        <div className="text-center w-16">
          <div className="text-lg font-bold text-green-400">{player.wins}</div>
          <div className="text-[10px] text-slate-500 font-mono">WINS</div>
        </div>

        {/* Win Rate */}
        <div className="text-center w-16">
          <div className="text-lg font-mono text-slate-300">{winRate}%</div>
          <div className="text-[10px] text-slate-500 font-mono">RATE</div>
        </div>

        {/* Games */}
        <div className="text-center w-16">
          <div className="text-lg font-mono text-slate-400">{player.gamesPlayed}</div>
          <div className="text-[10px] text-slate-500 font-mono">GAMES</div>
        </div>
      </div>

      {/* Earnings - always visible */}
      <div className="text-right flex-shrink-0">
        <div
          className={`text-base md:text-lg font-mono font-bold ${
            rank === 1
              ? 'text-yellow-400'
              : rank === 2
                ? 'text-slate-300'
                : rank === 3
                  ? 'text-amber-500'
                  : 'text-green-400'
          }`}
        >
          {ethEarnings.toFixed(4)}
        </div>
        <div className="text-[10px] md:text-xs text-slate-500 font-mono">ETH</div>
      </div>
    </div>
  )
}

export function Leaderboard() {
  const { address: currentUserAddress } = useAccount()
  const { games, isLoading } = useAllGames()

  // Aggregate stats from finished games
  const leaderboardData = useMemo(() => {
    if (!games || games.length === 0) return []

    const statsMap = new Map<string, PlayerStats>()

    // Process all finished games with a winner
    for (const game of games) {
      if (
        game.status === GameStatus.Finished &&
        game.winner &&
        game.winner !== '0x0000000000000000000000000000000000000000'
      ) {
        const winnerAddr = game.winner.toLowerCase()

        // Get or create stats for winner
        const existing = statsMap.get(winnerAddr) || {
          address: game.winner,
          wins: 0,
          gamesPlayed: 0,
          earnings: 0n,
        }

        existing.wins += 1
        existing.gamesPlayed += 1
        existing.earnings += game.prizePool

        statsMap.set(winnerAddr, existing)
      }
    }

    // Convert to array and sort by wins (primary), then earnings (secondary)
    const sorted = Array.from(statsMap.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      return Number(b.earnings - a.earnings)
    })

    return sorted
  }, [games])

  const hasData = leaderboardData.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-['Orbitron'] font-bold text-white mb-2">
          LEADERBOARD
        </h1>
        <p className="text-slate-400 font-mono text-xs md:text-sm">
          Top players ranked by wins
        </p>
      </div>

      {/* Stats summary for top 3 - mobile cards */}
      {hasData && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:hidden">
          {leaderboardData.slice(0, 3).map((player, i) => {
            const rank = i + 1
            const ethEarnings = Number(player.earnings) / 1e18
            const bgGradient =
              rank === 1
                ? 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30'
                : rank === 2
                  ? 'from-slate-400/20 to-slate-500/5 border-slate-400/30'
                  : 'from-amber-600/20 to-amber-700/5 border-amber-600/30'

            return (
              <div
                key={player.address}
                className={`p-3 border bg-gradient-to-b ${bgGradient} text-center`}
              >
                <RankBadge rank={rank} />
                <div className="mt-2 font-mono text-xs text-slate-400 truncate">
                  {maskAddress(player.address)}
                </div>
                <div
                  className={`mt-1 text-sm font-bold ${
                    rank === 1
                      ? 'text-yellow-400'
                      : rank === 2
                        ? 'text-slate-300'
                        : 'text-amber-500'
                  }`}
                >
                  {player.wins}W
                </div>
                <div className="text-[10px] text-green-400 font-mono">
                  {ethEarnings.toFixed(3)} ETH
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main leaderboard */}
      <div className="border border-slate-800 overflow-hidden">
        {/* Header row - desktop only */}
        <div className="hidden md:flex items-center gap-4 px-4 py-3 bg-slate-900/50 border-b border-slate-800">
          <div className="w-12 text-xs font-mono text-slate-500 text-center">RANK</div>
          <div className="flex-1 text-xs font-mono text-slate-500">PLAYER</div>
          <div className="flex items-center gap-6">
            <div className="w-16 text-xs font-mono text-slate-500 text-center">WINS</div>
            <div className="w-16 text-xs font-mono text-slate-500 text-center">RATE</div>
            <div className="w-16 text-xs font-mono text-slate-500 text-center">GAMES</div>
          </div>
          <div className="w-24 text-xs font-mono text-slate-500 text-right">EARNINGS</div>
        </div>

        {/* Content */}
        <div className="divide-y divide-slate-800/50">
          {isLoading ? (
            <div className="px-4 py-12 text-center">
              <LoadingSpinner text="LOADING LEADERBOARD..." />
            </div>
          ) : !hasData ? (
            <div className="px-4 py-12 text-center">
              <div className="text-slate-500 font-mono">
                <div className="text-4xl mb-4 opacity-30">-</div>
                <p className="text-lg mb-2">NO WINNERS YET</p>
                <p className="text-sm text-slate-600">
                  Complete games to appear on the leaderboard
                </p>
              </div>
            </div>
          ) : (
            leaderboardData.map((player, index) => (
              <PlayerRow
                key={player.address}
                player={player}
                rank={index + 1}
                isCurrentUser={
                  currentUserAddress?.toLowerCase() === player.address.toLowerCase()
                }
              />
            ))
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6 md:mt-8 border border-slate-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-500 font-mono">
          <span>Updated in real-time from on-chain data</span>
          <span className="text-slate-600">
            {leaderboardData.length} player{leaderboardData.length !== 1 ? 's' : ''} ranked
          </span>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-slate-600 font-mono">
          Addresses partially hidden for privacy
        </p>
      </div>
    </div>
  )
}
