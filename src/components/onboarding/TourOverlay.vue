<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle, Sparkles, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui/uiStore'
import { useTour } from '@/composables/useTour'
import { supportEmailUrl, supportWhatsappUrl } from '@/config/support'

const uiStore = useUiStore()
const { active, transitioning, currentStep, stepIndex, totalSteps, isFirst, isLast, next, prev, skip } = useTour()

const PAD = 8
const GAP = 14
const CARD_HALF = 175

type Rect = { top: number; left: number; width: number; height: number }
const rect = ref<Rect | null>(null)

const isModalStep = computed(() => currentStep.value?.type === 'modal')
// Sem alvo medido (passo modal, ou alvo não encontrado) -> painel central.
const isCentered = computed(() => isModalStep.value || !rect.value)

function measure() {
  const step = currentStep.value
  if (!step || step.type !== 'spotlight' || !step.target) {
    rect.value = null
    return
  }
  const el = document.querySelector<HTMLElement>(step.target)
  if (!el) {
    rect.value = null
    return
  }
  const r = el.getBoundingClientRect()
  rect.value = { top: r.top, left: r.left, width: r.width, height: r.height }
}

const spotlightStyle = computed(() => {
  if (!rect.value) return {}
  return {
    top: `${rect.value.top - PAD}px`,
    left: `${rect.value.left - PAD}px`,
    width: `${rect.value.width + PAD * 2}px`,
    height: `${rect.value.height + PAD * 2}px`,
  }
})

// Escolhe onde ancorar o card em relação ao alvo, com base no espaço disponível.
const placement = computed<'top' | 'bottom' | 'left' | 'right'>(() => {
  if (!rect.value) return 'bottom'
  const desired = currentStep.value?.placement ?? 'auto'
  const vh = window.innerHeight
  const vw = window.innerWidth
  const r = rect.value
  if (desired !== 'auto') return desired
  if (r.top + r.height + 230 < vh) return 'bottom'
  if (r.top - 230 > 0) return 'top'
  if (r.left + r.width + 380 < vw) return 'right'
  return 'left'
})

const coachStyle = computed(() => {
  if (!rect.value) return {}
  const r = rect.value
  const vw = window.innerWidth
  const centerX = Math.min(Math.max(r.left + r.width / 2, CARD_HALF + 8), vw - CARD_HALF - 8)
  switch (placement.value) {
    case 'top':
      return { top: `${r.top - GAP}px`, left: `${centerX}px`, transform: 'translate(-50%, -100%)' }
    case 'left':
      return { top: `${r.top + r.height / 2}px`, left: `${r.left - GAP}px`, transform: 'translate(-100%, -50%)' }
    case 'right':
      return { top: `${r.top + r.height / 2}px`, left: `${r.left + r.width + GAP}px`, transform: 'translate(0, -50%)' }
    default: // bottom
      return { top: `${r.top + r.height + GAP}px`, left: `${centerX}px`, transform: 'translate(-50%, 0)' }
  }
})

async function refresh() {
  await nextTick()
  measure()
}

watch([currentStep, transitioning, active], () => {
  if (active.value && !transitioning.value) refresh()
})

function onViewportChange() {
  if (active.value && !transitioning.value) measure()
}

function onKeydown(e: KeyboardEvent) {
  if (!active.value) return
  if (e.key === 'Escape') skip()
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}

onMounted(() => {
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('keydown', onKeydown)
})

const nextLabel = computed(() => currentStep.value?.nextLabel ?? 'Próximo')
const isSuporte = computed(() => currentStep.value?.key === 'suporte')
const isWelcome = computed(() => currentStep.value?.key === 'welcome')
const nomeUsuario = computed(() => uiStore.usuarioLogged?.nome?.split(' ')?.[0] || '')
</script>

<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="active && currentStep" class="fixed inset-0" style="z-index: 10000">
        <!-- Camada que bloqueia interação com a página durante o tour -->
        <div class="absolute inset-0" :class="isCentered ? 'bg-black/70 backdrop-blur-[2px]' : ''"
          style="pointer-events: auto" />

        <!-- Holofote (apenas quando há alvo medido) -->
        <div v-if="!isCentered && !transitioning"
          class="pointer-events-none absolute rounded-xl ring-2 ring-primary transition-all duration-300 ease-out"
          :style="[spotlightStyle, { boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)' }]" />

        <!-- Card (coach-mark ao lado do alvo, ou painel central) -->
        <Transition name="tour-pop">
          <div v-if="!transitioning" :key="currentStep.key"
            class="absolute w-[350px] max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
            :class="isCentered ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : ''"
            :style="isCentered ? {} : coachStyle" style="pointer-events: auto">
            <div class="p-5">
              <!-- Cabeçalho -->
              <div class="mb-3 flex items-start gap-3">
                <span
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Sparkles class="h-5 w-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <h3 class="text-base font-bold leading-tight">{{ currentStep.title }}</h3>
                  <p class="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Passo {{ stepIndex + 1 }} de {{ totalSteps }}
                  </p>
                </div>
                <button type="button" v-tooltip="'Fechar tour'"
                  class="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  @click="skip">
                  <X class="h-4 w-4" />
                </button>
              </div>

              <!-- Corpo -->
              <p class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                <template v-if="isWelcome && nomeUsuario">Olá, {{ nomeUsuario }}! </template>{{ currentStep.body }}
              </p>

              <!-- Contatos de suporte (passo final) -->
              <div v-if="isSuporte" class="mt-4 grid gap-2">
                <a :href="supportWhatsappUrl('Olá! Preciso de ajuda com o Gestão Fácil.')" target="_blank"
                  rel="noopener"
                  class="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300">
                  <MessageCircle class="h-4 w-4 shrink-0" /> Falar no WhatsApp
                </a>
                <a :href="supportEmailUrl('Suporte Gestão Fácil')"
                  class="flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm font-medium text-sky-700 transition hover:bg-sky-500/20 dark:text-sky-300">
                  <Mail class="h-4 w-4 shrink-0" /> Enviar um e-mail
                </a>
              </div>

              <!-- Progresso -->
              <div class="mt-4 flex items-center justify-center gap-1.5">
                <span v-for="(_, i) in totalSteps" :key="i" class="h-1.5 rounded-full transition-all duration-300"
                  :class="i === stepIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'" />
              </div>

              <!-- Ações -->
              <div class="mt-4 flex items-center justify-between gap-2">
                <button v-if="!isLast" type="button"
                  class="text-xs font-medium text-muted-foreground transition hover:text-foreground" @click="skip">
                  Pular tour
                </button>
                <span v-else />

                <div class="flex items-center gap-2">
                  <Button v-if="!isFirst" type="button" variant="outline" size="sm" @click="prev">
                    <ArrowLeft class="h-4 w-4" /> Voltar
                  </Button>
                  <Button type="button" size="sm" class="text-white" @click="next">
                    {{ nextLabel }}
                    <Check v-if="isLast" class="h-4 w-4" />
                    <ArrowRight v-else class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.25s ease;
}

.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}

.tour-pop-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.tour-pop-enter-from {
  opacity: 0;
}
</style>
