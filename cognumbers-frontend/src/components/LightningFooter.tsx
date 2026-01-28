import { useEffect, useState, useCallback } from 'react'

// Only the actual words - skip separators for lightning effect
const words = ['COGNUMBERS', 'INCO', 'CASSXBT']

export function LightningFooter() {
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [activeLetterIndex, setActiveLetterIndex] = useState(-1) // -1 = not started
  const [isRunning, setIsRunning] = useState(true)

  const currentWord = words[activeWordIndex]

  // Move to next letter or next word
  const advance = useCallback(() => {
    setActiveLetterIndex((prev) => {
      const nextIndex = prev + 1

      // Finished current word
      if (nextIndex >= currentWord.length + 5) {
        // +5 to let trail fully exit
        // Check if we finished all words
        if (activeWordIndex >= words.length - 1) {
          // Pause before restarting
          setIsRunning(false)
          setTimeout(() => {
            setActiveWordIndex(0)
            setActiveLetterIndex(-1)
            setIsRunning(true)
          }, 3000) // 3 second gap
          return prev
        } else {
          // Move to next word
          setActiveWordIndex((w) => w + 1)
          return -1
        }
      }
      return nextIndex
    })
  }, [activeWordIndex, currentWord.length])

  // Main animation loop - slow trace
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(advance, 180) // Slow: 180ms per letter
    return () => clearInterval(interval)
  }, [isRunning, advance])

  // Calculate trail intensity for a letter (0 = no effect, 1 = brightest)
  const getTrailIntensity = (wordIndex: number, letterIndex: number): number => {
    if (wordIndex !== activeWordIndex) return 0

    const distance = activeLetterIndex - letterIndex

    // 6-letter trail: active letter + 5 trailing
    if (distance < 0 || distance > 5) return 0

    // Intensity falloff: 1.0 -> 0.8 -> 0.6 -> 0.4 -> 0.25 -> 0.1
    const intensities = [1.0, 0.8, 0.6, 0.4, 0.25, 0.1]
    return intensities[distance] || 0
  }

  // Savitar color palette - icy white/silver-blue
  const getLetterStyle = (intensity: number, wordIndex: number, letterIndex: number) => {
    if (intensity === 0) {
      // Check if letter has been passed
      const isPassed = wordIndex < activeWordIndex ||
        (wordIndex === activeWordIndex && letterIndex < activeLetterIndex - 5)

      return {
        color: isPassed ? '#94a3b8' : '#475569', // Lighter slate for passed, dark for upcoming
        textShadow: 'none',
        transform: 'none',
        filter: 'none',
      }
    }

    // Savitar colors: white core -> silver -> icy blue trail
    const colors = {
      core: '#ffffff',
      silver: '#e2e8f0',
      icyBlue: '#bae6fd',
      paleBlue: '#7dd3fc',
      deepIcy: '#38bdf8',
    }

    // Color based on intensity
    let color: string
    let textShadow: string
    let scale: number

    if (intensity === 1.0) {
      // Active letter - bright white core
      color = colors.core
      textShadow = `
        0 0 4px ${colors.core},
        0 0 8px ${colors.core},
        0 0 15px ${colors.silver},
        0 0 25px ${colors.icyBlue},
        0 0 40px ${colors.paleBlue},
        0 0 60px ${colors.deepIcy}
      `
      scale = 1.08
    } else if (intensity >= 0.8) {
      // First trail - silver white
      color = colors.silver
      textShadow = `
        0 0 3px ${colors.silver},
        0 0 8px ${colors.icyBlue},
        0 0 20px ${colors.paleBlue},
        0 0 35px ${colors.deepIcy}
      `
      scale = 1.05
    } else if (intensity >= 0.6) {
      // Second trail - icy blue
      color = colors.icyBlue
      textShadow = `
        0 0 3px ${colors.icyBlue},
        0 0 12px ${colors.paleBlue},
        0 0 25px ${colors.deepIcy}
      `
      scale = 1.03
    } else if (intensity >= 0.4) {
      // Third trail - pale blue
      color = colors.paleBlue
      textShadow = `
        0 0 2px ${colors.paleBlue},
        0 0 8px ${colors.deepIcy}
      `
      scale = 1.01
    } else if (intensity >= 0.25) {
      // Fourth trail - fading
      color = colors.deepIcy
      textShadow = `0 0 5px ${colors.deepIcy}`
      scale = 1.0
    } else {
      // Fifth trail - barely visible
      color = '#0ea5e9'
      textShadow = '0 0 3px #0ea5e9'
      scale = 1.0
    }

    return {
      color,
      textShadow,
      transform: `scale(${scale})`,
      filter: intensity >= 0.8 ? `brightness(${1 + intensity * 0.2})` : 'none',
    }
  }

  return (
    <div className="relative py-4 select-none">
      <div className="flex items-center justify-center gap-3 md:gap-5 font-mono text-sm md:text-base tracking-widest">
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="relative inline-flex">
            {/* Separator before word (except first) */}
            {wordIndex > 0 && (
              <span className="text-slate-600 mx-2 md:mx-3">//</span>
            )}

            {/* Word letters */}
            {word.split('').map((letter, letterIndex) => {
              const intensity = getTrailIntensity(wordIndex, letterIndex)
              const style = getLetterStyle(intensity, wordIndex, letterIndex)

              return (
                <span
                  key={letterIndex}
                  className="relative inline-block transition-all duration-100 ease-out"
                  style={{
                    color: style.color,
                    textShadow: style.textShadow,
                    transform: style.transform,
                    filter: style.filter,
                  }}
                >
                  {letter}
                </span>
              )
            })}
          </span>
        ))}
      </div>
    </div>
  )
}
