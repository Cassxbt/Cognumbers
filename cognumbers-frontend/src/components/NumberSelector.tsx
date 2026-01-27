import { cn } from '../lib/utils'
import { MIN_NUMBER, MAX_NUMBER } from '../types/game'

interface NumberSelectorProps {
  selected: number | null
  onSelect: (num: number) => void
  disabled?: boolean
}

export function NumberSelector({ selected, onSelect, disabled }: NumberSelectorProps) {
  const numbers = Array.from(
    { length: MAX_NUMBER - MIN_NUMBER + 1 },
    (_, i) => i + MIN_NUMBER
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
        <div className="w-2 h-2 bg-cyan-400 animate-pulse" />
        <span>SELECT YOUR NUMBER [1-10]</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {numbers.map((num) => (
          <button
            key={num}
            onClick={() => !disabled && onSelect(num)}
            disabled={disabled}
            className={cn(
              'number-grid-item',
              selected === num && 'selected',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {num}
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm">
          <span className="text-slate-500">SELECTED:</span>
          <span className="text-xl font-bold">{selected}</span>
          <span className="text-slate-500 text-xs">[ENCRYPTED ON SUBMIT]</span>
        </div>
      )}
    </div>
  )
}
