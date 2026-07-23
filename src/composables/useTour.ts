import { computed, ref } from 'vue'
import router from '@/router'
import { ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { isSupportActive } from '@/utils/supportSession'
import { getTour, ONBOARDING_TOUR_ID, type TourDefinition, type TourStep } from '@/components/onboarding/tours'

// Estado global (nível de módulo), espelhando o padrão de useConfirm.ts: um único overlay
// singleton montado no layout consome esses refs. Controla os tours guiados do sistema.

const active = ref(false)
const manual = ref(false)
const stepIndex = ref(0)
const currentTour = ref<TourDefinition | null>(null)
// Enquanto navega/espera o alvo aparecer, escondemos o holofote para não piscar posição errada.
const transitioning = ref(false)
// Seletor de tours (modal aberto pelo botão de ajuda do header).
const menuOpen = ref(false)

// Só mostra o tour de boas-vindas automaticamente para contas criadas há no máximo N dias
// (reforço ao backfill que já marcou contas antigas como concluídas).
const JANELA_CONTA_NOVA_DIAS = 14

const steps = computed<TourStep[]>(() => currentTour.value?.steps ?? [])
const currentStep = computed<TourStep | null>(() => steps.value[stepIndex.value] ?? null)
const totalSteps = computed(() => steps.value.length)
const isFirst = computed(() => stepIndex.value === 0)
const isLast = computed(() => stepIndex.value === steps.value.length - 1)

function waitForElement(selector: string, timeout = 4000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const start = performance.now()
    const tick = () => {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return resolve(el)
      if (performance.now() - start > timeout) return resolve(null)
      requestAnimationFrame(tick)
    }
    tick()
  })
}

async function goToStep(index: number) {
  const step = steps.value[index]
  if (!step) return

  transitioning.value = true

  // Navega até a rota do passo, se necessário.
  if (step.route && router.currentRoute.value.path !== step.route) {
    try {
      await router.push(step.route)
    } catch {
      /* navegação abortada/redirect — segue mesmo assim */
    }
  }

  // Passos com alvo esperam o elemento existir antes de posicionar o holofote.
  if (step.type === 'spotlight' && step.target) {
    await waitForElement(step.target)
    // pequeno atraso para a transição de página/layout assentar
    await new Promise((r) => setTimeout(r, 120))
  }

  stepIndex.value = index
  transitioning.value = false
}

function start(tourId: string, options: { manual?: boolean } = {}) {
  const tour = getTour(tourId)
  if (!tour) return
  menuOpen.value = false
  currentTour.value = tour
  manual.value = Boolean(options.manual)
  active.value = true
  goToStep(0)
}

function openMenu() {
  menuOpen.value = true
}

function next() {
  if (isLast.value) return finish()
  goToStep(stepIndex.value + 1)
}

function prev() {
  if (isFirst.value) return
  goToStep(stepIndex.value - 1)
}

async function persistConcluido() {
  // Apenas o tour de boas-vindas controla o auto-início; os demais são sob demanda.
  if (!currentTour.value?.persistConclusao) return
  const store = useUiStore()
  // Já concluído (ex.: refazendo o tour manualmente) — evita request redundante.
  if (store.tourConcluido) return
  try {
    await ContaRepository.concluirTourOnboarding()
    store.tourConcluido = true
  } catch (error) {
    console.error('Falha ao registrar conclusão do tour', error)
  }
}

function close() {
  active.value = false
  transitioning.value = false
  stepIndex.value = 0
  currentTour.value = null
  // Salvaguarda: navegar durante o fechamento de dialogs pode deixar pointer-events:none
  // preso no body (ver bug conhecido do reka). Garante que a página volte a ser clicável.
  if (typeof document !== 'undefined') document.body.style.pointerEvents = ''
}

function skip() {
  persistConcluido()
  close()
}

function finish() {
  persistConcluido()
  close()
}

function isContaNova(createdAt?: string | Date | null) {
  if (!createdAt) return false
  const criada = new Date(createdAt).getTime()
  if (Number.isNaN(criada)) return false
  const dias = (Date.now() - criada) / (1000 * 60 * 60 * 24)
  return dias <= JANELA_CONTA_NOVA_DIAS
}

// Auto-início do tour de boas-vindas para novos assinantes. Só dispara quando TODAS as
// condições valem.
function maybeAutoStart() {
  const store = useUiStore()

  if (active.value) return
  if (store.tourConcluido) return
  if (!isContaNova(store.contaInfo?.createdAt)) return
  // Não mostrar para o superadmin/CEO nem durante sessão de suporte.
  if (store.usuarioLogged?.permissao === 'root' || store.usuarioLogged?.superAdmin) return
  if (isSupportActive()) return
  // Modo quiosque do PDV não deve ser interrompido.
  if (localStorage.getItem('pdvBloqueado') === 'true') return

  start(ONBOARDING_TOUR_ID, { manual: false })
}

export function useTour() {
  return {
    active,
    manual,
    stepIndex,
    transitioning,
    currentStep,
    currentTour,
    totalSteps,
    isFirst,
    isLast,
    menuOpen,
    openMenu,
    start,
    next,
    prev,
    skip,
    finish,
    goToStep,
    maybeAutoStart,
  }
}
