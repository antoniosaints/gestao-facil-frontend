import { ref, watch, type Ref } from 'vue'

export interface CountUpOptions {
  duration?: number
  startValue?: number
  decimals?: number
  prefix?: string
  suffix?: string
  separator?: string
  useEasing?: boolean
}

/**
 * Composable para animação de contagem de números
 * Útil para estatísticas e métricas
 */
export function useCountUp(endValue: number | Ref<number>, options: CountUpOptions = {}) {
  const {
    duration = 2000,
    startValue = 0,
    decimals = 0,
    prefix = '',
    suffix = '',
    separator = '.',
    useEasing = true,
  } = options

  const currentValue = ref(startValue)
  const displayValue = ref(formatNumber(startValue))
  let animationFrameId: number | null = null
  let startTime: number | null = null

  // Função de easing (ease-out)
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
  }

  // Formata o número com separadores e prefixo/sufixo
  function formatNumber(value: number): string {
    const fixed = value.toFixed(decimals)
    const parts = fixed.split('.')

    // Adiciona separador de milhares
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)

    const formatted = parts.join(',')
    return `${prefix}${formatted}${suffix}`
  }

  // Função de animação
  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp

    const progress = Math.min((timestamp - startTime) / duration, 1)
    const easedProgress = useEasing ? easeOutExpo(progress) : progress

    const target = typeof endValue === 'number' ? endValue : endValue.value
    const current = startValue + (target - startValue) * easedProgress

    currentValue.value = current
    displayValue.value = formatNumber(current)

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate)
    } else {
      startTime = null
    }
  }

  // Inicia a animação
  const start = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    startTime = null
    currentValue.value = startValue
    animationFrameId = requestAnimationFrame(animate)
  }

  // Reseta a animação
  const reset = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    startTime = null
    currentValue.value = startValue
    displayValue.value = formatNumber(startValue)
  }

  // Observa mudanças no valor final (se for ref)
  if (typeof endValue !== 'number') {
    watch(endValue, () => {
      start()
    })
  }

  return {
    currentValue,
    displayValue,
    start,
    reset,
  }
}

/**
 * Composable para contador animado que inicia quando entra no viewport
 */
export function useCountUpOnView(
  endValue: number,
  options: CountUpOptions = {},
  observerOptions: IntersectionObserverInit = {},
) {
  const elementRef: Ref<HTMLElement | null> = ref(null)
  const hasAnimated = ref(false)
  const counter = useCountUp(endValue, options)
  let observer: IntersectionObserver | null = null

  const setupObserver = () => {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.value) {
            counter.start()
            hasAnimated.value = true

            if (observer) {
              observer.unobserve(entry.target)
            }
          }
        })
      },
      {
        threshold: 0.5,
        ...observerOptions,
      },
    )

    observer.observe(elementRef.value)
  }

  // Cleanup
  const cleanup = () => {
    if (observer) {
      observer.disconnect()
    }
  }

  return {
    elementRef,
    displayValue: counter.displayValue,
    currentValue: counter.currentValue,
    hasAnimated,
    setupObserver,
    cleanup,
    reset: () => {
      hasAnimated.value = false
      counter.reset()
    },
  }
}
