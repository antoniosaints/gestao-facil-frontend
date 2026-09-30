<script setup lang="ts">
import { computed } from 'vue'
import {
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  ClockAlert,
  FileClock,
  ListChecks,
  LoaderCircle,
} from 'lucide-vue-next'
import type { FiscalDocument } from '@/repositories/notas-fiscais-repository'
import { statusClass, statusLabels } from './fiscalPresentation'

const props = withDefaults(defineProps<{ document: FiscalDocument; framed?: boolean }>(), {
  framed: true,
})
const steps = computed(() => {
  const { status, eventos } = props.document
  const authorized = ['AUTORIZADA', 'HOMOLOGADA', 'CANCELADA'].includes(status)
  const emitting = ['EMITINDO', 'EM_PROCESSAMENTO'].includes(status)
  const ready = status === 'PRONTA_PARA_EMISSAO'
  const regular = [
    'PENDENTE',
    'REGISTRADA',
    'PRONTA_PARA_EMISSAO',
    'EMITINDO',
    'EM_PROCESSAMENTO',
    'AUTORIZADA',
    'HOMOLOGADA',
  ].includes(status)
  const cancelling =
    status === 'AUTORIZADA' &&
    eventos?.some((event) => event.tipo === 'CANCELAMENTO' && event.status === 'PROCESSANDO')
  const exceptional = !regular || cancelling
  const emissionAttempted =
    emitting ||
    authorized ||
    ['REJEITADA', 'FALHA_REPROCESSAVEL', 'EMISSAO_INCERTA', 'RESULTADO_INCERTO'].includes(status)
  const normal = [
    { key: 'registration', label: 'Registrada', icon: ListChecks, reached: true },
    ...(ready
      ? [{ key: 'ready', label: 'Pronta para emissão', icon: FileClock, reached: true }]
      : []),
    {
      key: 'emission',
      label: 'Emitindo',
      icon: LoaderCircle,
      reached: emissionAttempted,
    },
    {
      key: 'processing',
      label: 'Processando',
      icon: LoaderCircle,
      reached: authorized || status === 'EM_PROCESSAMENTO' || status === 'REJEITADA',
    },
    {
      key: 'authorization',
      label: status === 'HOMOLOGADA' ? 'Homologada' : 'Autorizada',
      icon: CircleCheck,
      reached: authorized,
    },
  ]
  const activeKey = exceptional
    ? 'exception'
    : authorized
      ? 'authorization'
      : status === 'EM_PROCESSAMENTO'
        ? 'processing'
        : emitting
          ? 'emission'
          : ready
            ? 'ready'
            : 'registration'
  const extra = exceptional
    ? [
        {
          key: 'exception',
          label: cancelling ? 'Cancelando...' : statusLabels[status] || status,
          icon: cancelling
            ? LoaderCircle
            : ['EMISSAO_INCERTA', 'RESULTADO_INCERTO'].includes(status)
              ? ClockAlert
              : ['REJEITADA', 'CANCELADA'].includes(status)
                ? CircleX
                : CircleAlert,
          reached: true,
        },
      ]
    : []
  return [...normal, ...extra].map((step) => ({
    ...step,
    state: step.key === activeKey ? 'current' : step.reached ? 'completed' : 'pending',
    spinning: step.key === activeKey && (emitting || Boolean(cancelling)),
    currentClass: statusClass(cancelling ? 'EMITINDO' : status),
  }))
})
</script>

<template>
  <nav
    aria-label="Etapas da nota fiscal"
    :class="framed ? 'rounded-xl border bg-muted/10 px-2 py-5 sm:px-4' : 'py-1'"
  >
    <ol class="flex items-start">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="relative flex min-w-0 flex-1 flex-col items-center gap-2 px-1 text-center"
        :aria-current="step.state === 'current' ? 'step' : undefined"
        :data-state="step.state"
      >
        <span
          v-if="index < steps.length - 1"
          class="absolute left-[calc(50%+1.25rem)] top-5 h-0.5 w-[calc(100%-2.5rem)]"
          :class="
            step.state === 'completed' && steps[index + 1].state !== 'pending'
              ? 'bg-emerald-500/50'
              : 'bg-border'
          "
          aria-hidden="true"
        />
        <span
          class="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background transition-colors"
          :class="
            step.state === 'current'
              ? [step.currentClass, 'ring-2 ring-current ring-offset-2 ring-offset-background']
              : step.state === 'completed'
                ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-border bg-background text-muted-foreground'
          "
        >
          <Check v-if="step.state === 'completed'" class="size-4" aria-hidden="true" />
          <component
            :is="step.icon"
            v-else-if="step.state === 'current'"
            class="size-4"
            :class="{ 'animate-spin motion-reduce:animate-none': step.spinning }"
            aria-hidden="true"
          />
          <span v-else class="text-xs font-medium" aria-hidden="true">{{ index + 1 }}</span>
        </span>
        <span
          class="w-full break-words text-[11px] leading-snug sm:text-sm"
          :class="
            step.state === 'current' ? 'font-semibold text-foreground' : 'text-muted-foreground'
          "
        >
          {{ step.label }}
          <span v-if="step.state === 'current'" class="mt-1 block text-xs font-medium">Atual</span>
          <span v-else class="mt-1 block text-xs font-normal text-muted-foreground">{{
            step.state === 'completed'
              ? 'Concluída'
              : step.key === 'authorization'
                ? 'Aguardando'
                : 'Pendente'
          }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>
