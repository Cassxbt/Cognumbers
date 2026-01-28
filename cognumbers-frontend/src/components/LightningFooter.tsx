import { useEffect, useState } from 'react'

const words = ['COGNUMBERS', '//', 'INCO', '//', 'CASSXBT']

export function LightningFooter() {
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1
        if (next >= words.length + 3) {
          return -1 // Reset with pause
        }
        return next
      })
    }, 150) // Speed of lightning movement

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative overflow-hidden py-2">
      {/* Lightning bolt SVG that follows */}
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-100 ease-linear z-10"
        style={{
          left: `${Math.min(Math.max(activeIndex, 0), words.length - 1) * (100 / words.length) + (100 / words.length / 2)}%`,
          transform: 'translate(-50%, -50%)',
          opacity: activeIndex >= 0 && activeIndex < words.length ? 1 : 0,
        }}
      >
        {/* Lightning bolt glow */}
        <div className="relative">
          <svg
            className="w-6 h-6 text-yellow-400 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{
              filter: 'drop-shadow(0 0 8px #fbbf24) drop-shadow(0 0 16px #f59e0b)',
            }}
          >
            <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
          </svg>
        </div>
      </div>

      {/* Words with lightning effect */}
      <div className="flex items-center justify-center gap-2 md:gap-3">
        {words.map((word, index) => {
          const isActive = index === activeIndex
          const isTrail1 = index === activeIndex - 1
          const isTrail2 = index === activeIndex - 2
          const hasEffect = isActive || isTrail1 || isTrail2

          return (
            <span
              key={index}
              className="relative transition-all duration-75"
              style={{
                color: isActive
                  ? '#fbbf24' // Yellow for active
                  : isTrail1
                    ? '#f59e0b' // Orange for trail 1
                    : isTrail2
                      ? '#d97706' // Darker orange for trail 2
                      : '#475569', // Default slate
                textShadow: isActive
                  ? '0 0 10px #fbbf24, 0 0 20px #f59e0b, 0 0 30px #d97706, 0 0 40px #b45309'
                  : isTrail1
                    ? '0 0 8px #f59e0b, 0 0 16px #d97706'
                    : isTrail2
                      ? '0 0 4px #d97706'
                      : 'none',
                transform: hasEffect ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {/* Lightning spark particles */}
              {isActive && (
                <>
                  <span
                    className="absolute -top-1 -left-1 w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                    style={{ animationDuration: '0.3s' }}
                  />
                  <span
                    className="absolute -bottom-1 -right-1 w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                    style={{ animationDuration: '0.4s' }}
                  />
                </>
              )}
              {word}
            </span>
          )
        })}
      </div>

      {/* Lightning trail line */}
      <div
        className="absolute top-1/2 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent transition-all duration-100 ease-linear"
        style={{
          left: 0,
          width: activeIndex >= 0 ? `${(activeIndex / words.length) * 100}%` : '0%',
          opacity: activeIndex >= 0 ? 0.6 : 0,
          boxShadow: '0 0 8px #fbbf24, 0 0 16px #f59e0b',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  )
}
