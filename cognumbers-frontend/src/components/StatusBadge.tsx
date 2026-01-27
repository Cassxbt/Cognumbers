import { GameStatus, GAME_STATUS_LABELS } from '../types/game'
import { cn } from '../lib/utils'

interface StatusBadgeProps {
  status: GameStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const label = GAME_STATUS_LABELS[status]

  return (
    <div
      className={cn(
        'font-mono border inline-flex items-center',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        status === GameStatus.Open && 'border-green-500/50 text-green-400 bg-green-500/10',
        status === GameStatus.Calculating && 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10 animate-pulse',
        status === GameStatus.Finished && 'border-slate-600 text-slate-500 bg-slate-800/50'
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-2',
        status === GameStatus.Open && 'bg-green-400',
        status === GameStatus.Calculating && 'bg-yellow-400 animate-pulse',
        status === GameStatus.Finished && 'bg-slate-500'
      )} />
      {label}
    </div>
  )
}
