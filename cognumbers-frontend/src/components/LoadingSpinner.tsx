import { cn } from '../lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={cn('relative', sizes[size])}>
        <div className="absolute inset-0 border-2 border-cyan-400/20 animate-pulse" />
        <div className="absolute inset-0 border-t-2 border-cyan-400 animate-spin" />
      </div>
      {text && (
        <div className="text-cyan-400 font-mono text-sm animate-pulse">
          {text}
        </div>
      )}
    </div>
  )
}
