import type { Directive, DirectiveBinding } from 'vue'

/**
 * Tooltip leve via diretiva (`v-tooltip="'texto'"`).
 *
 * Diferente do componente do reka-ui, NÃO cria uma árvore de componentes
 * (root + trigger + portal + popper) por gatilho — apenas registra alguns
 * listeners no elemento e reaproveita um único balão compartilhado anexado ao
 * <body>. Isso evita o travamento de renderização quando há muitos botões com
 * tooltip numa mesma tela (ex.: a lista de lançamentos do acompanhamento).
 *
 * Posicionamento com `position: fixed` (relativo à viewport), então não sofre
 * clipping de ancestrais com `overflow: hidden`.
 */

type TipEl = HTMLElement & {
  __tipText?: string
  __tipHandlers?: {
    enter: () => void
    leave: () => void
  }
}

const SHOW_DELAY = 200
const HIDE_ANIM = 120

let bubble: HTMLDivElement | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function ensureBubble(): HTMLDivElement {
  if (bubble) return bubble
  const el = document.createElement('div')
  // Mesmas classes visuais do tooltip do reka (bg-primary / text-primary-foreground).
  el.className =
    'pointer-events-none fixed left-0 top-0 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md'
  el.setAttribute('role', 'tooltip')
  el.style.zIndex = '9999'
  el.style.maxWidth = '260px'
  el.style.whiteSpace = 'nowrap'
  el.style.opacity = '0'
  el.style.display = 'none'
  el.style.transform = 'translateY(2px)'
  el.style.transition = 'opacity 120ms ease, transform 120ms ease'
  document.body.appendChild(el)
  bubble = el
  return el
}

function clearTimers() {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function positionAndShow(el: HTMLElement, text: string) {
  const b = ensureBubble()
  b.textContent = text
  b.style.display = 'block'

  const rect = el.getBoundingClientRect()
  const bb = b.getBoundingClientRect()
  const margin = 4

  let left = rect.left + rect.width / 2 - bb.width / 2
  left = Math.max(margin, Math.min(left, window.innerWidth - bb.width - margin))

  let top = rect.top - bb.height - 6
  if (top < margin) {
    // Sem espaço acima: mostra abaixo do elemento.
    top = rect.bottom + 6
  }

  b.style.left = `${Math.round(left)}px`
  b.style.top = `${Math.round(top)}px`

  requestAnimationFrame(() => {
    b.style.opacity = '1'
    b.style.transform = 'translateY(0)'
  })
}

function hide() {
  clearTimers()
  if (!bubble) return
  bubble.style.opacity = '0'
  bubble.style.transform = 'translateY(2px)'
  hideTimer = setTimeout(() => {
    if (bubble) bubble.style.display = 'none'
  }, HIDE_ANIM)
}

function scheduleShow(el: HTMLElement, text: string) {
  if (!text) return
  clearTimers()
  showTimer = setTimeout(() => positionAndShow(el, text), SHOW_DELAY)
}

export const vTooltip: Directive<TipEl, string | null | undefined> = {
  mounted(el, binding: DirectiveBinding<string | null | undefined>) {
    el.__tipText = binding.value == null ? '' : String(binding.value)

    const enter = () => scheduleShow(el, el.__tipText || '')
    const leave = () => hide()
    el.__tipHandlers = { enter, leave }

    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('focus', enter, true)
    el.addEventListener('blur', leave, true)
    // Some ao clicar (ação do botão) para não ficar "preso".
    el.addEventListener('click', leave)
  },
  updated(el, binding: DirectiveBinding<string | null | undefined>) {
    el.__tipText = binding.value == null ? '' : String(binding.value)
  },
  beforeUnmount(el) {
    const handlers = el.__tipHandlers
    if (handlers) {
      el.removeEventListener('mouseenter', handlers.enter)
      el.removeEventListener('mouseleave', handlers.leave)
      el.removeEventListener('focus', handlers.enter, true)
      el.removeEventListener('blur', handlers.leave, true)
      el.removeEventListener('click', handlers.leave)
    }
    hide()
  },
}

export default vTooltip
