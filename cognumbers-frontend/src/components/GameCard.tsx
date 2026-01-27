import { Link } from 'react-router-dom'
import { type Game, GameStatus, GAME_STATUS_LABELS, MAX_PLAYERS } from '../types/game'
import { formatEntryFee, getTimeRemaining, isGameExpired } from '../hooks/useContract'
import { cn, shortenAddress, formatPrize } from '../lib/utils'

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  const expired = isGameExpired(game.deadline)
  const statusLabel = GAME_STATUS_LABELS[game.status as GameStatus]
  const prizePool = formatPrize(game.entryFee, game.playerCount)

  return (
    <Link
      to={`/game/${game.gameId}`}
      className="cyber-card p-4 block hover:border-cyan-400/50 transition-all duration-300 group"
    >
      <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-slate-500 font-mono mb-1">GAME ID</div>
          <div className="text-2xl font-bold text-white font-['Orbitron']">
            #{game.gameId.toString().padStart(4, '0')}
          </div>
        </div>
        <div
          className={cn(
            'px-2 py-1 text-xs font-mono border',
            game.status === GameStatus.Open && 'border-green-500/50 text-green-400 bg-green-500/10',
            game.status === GameStatus.Calculating && 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10 animate-pulse',
            game.status === GameStatus.Finished && 'border-slate-600 text-slate-500 bg-slate-800/50'
          )}
        >
          {statusLabel}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-slate-500 font-mono mb-1">ENTRY FEE</div>
          <div className="text-cyan-400 font-mono">
            {formatEntryFee(game.entryFee)} ETH
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-mono mb-1">PRIZE POOL</div>
          <div className="text-green-400 font-mono">
            {prizePool} ETH
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-slate-500 font-mono mb-1">PLAYERS</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400/50 transition-all duration-300"
                style={{ width: `${(Number(game.playerCount) / MAX_PLAYERS) * 100}%` }}
              />
            </div>
            <span className="text-white font-mono text-sm">
              {game.playerCount.toString()}/{MAX_PLAYERS}
            </span>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-mono mb-1">TIME LEFT</div>
          <div className={cn(
            'font-mono',
            expired ? 'text-red-400' : 'text-white'
          )}>
            {game.status === GameStatus.Open
              ? getTimeRemaining(game.deadline)
              : '--:--'}
          </div>
        </div>
      </div>

      {game.status === GameStatus.Finished && game.winner !== '0x0000000000000000000000000000000000000000' && (
        <div className="border-t border-slate-700 pt-3 mt-3">
          <div className="text-xs text-slate-500 font-mono mb-1">WINNER</div>
          <div className="flex items-center justify-between">
            <span className="text-green-400 font-mono">{shortenAddress(game.winner)}</span>
            <span className="text-yellow-400 font-mono">#{game.winningNumber.toString()}</span>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-600 font-mono mt-3">
        CREATED BY {shortenAddress(game.creator)}
      </div>
    </Link>
  )
}
