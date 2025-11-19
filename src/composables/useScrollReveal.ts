import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  delay?: number
  once?: boolean
}

/**
 * Composable para animações de reveal ao fazer scroll
 * Usa Intersection Observer para detectar quando elementos entram no viewport
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px', delay = 0, once = true } = options

  const isVisible = ref(false)
  const elementRef: Ref<HTMLElement | null> = ref(null)
  let observer: IntersectionObserver | null = null
  let timeoutId: number | null = null

  const setupObserver = () => {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              timeoutId = window.setTimeout(() => {
                isVisible.value = true
              }, delay)
            } else {
              isVisible.value = true
            }

            if (once && observer) {
              observer.unobserve(entry.target)
            }
          } else if (!once) {
            isVisible.value = false
          }
        })
      },
      {
        threshold,
        rootMargin,
      },
    )

    observer.observe(elementRef.value)
  }

  onMounted(() => {
    setupObserver()
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return {
    elementRef,
    isVisible,
  }
}

/**
 * Composable para animações staggered (escalonadas)
 * Útil para animar múltiplos elementos em sequência
 */
export function useStaggeredReveal(itemCount: number, baseDelay: number = 100) {
  const items = ref<boolean[]>(new Array(itemCount).fill(false))
  const containerRef: Ref<HTMLElement | null> = ref(null)
  let observer: IntersectionObserver | null = null
  let timeoutIds: number[] = []

  const setupObserver = () => {
    if (!containerRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Anima cada item com delay crescente
            items.value.forEach((_, index) => {
              const timeoutId = window.setTimeout(() => {
                items.value[index] = true
              }, index * baseDelay)
              timeoutIds.push(timeoutId)
            })

            if (observer) {
              observer.unobserve(entry.target)
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      },
    )

    observer.observe(containerRef.value)
  }

  onMounted(() => {
    setupObserver()
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
    timeoutIds.forEach((id) => clearTimeout(id))
  })

  return {
    containerRef,
    items,
  }
}
