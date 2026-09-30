<script setup lang="ts">
import { computed } from 'vue'
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  ClockAlert,
  FileClock,
  ListChecks,
  LoaderCircle,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { statusClass, statusLabels } from './fiscalPresentation'

const props = defineProps<{ status: string; error?: string | null }>()
const processing = computed(() => ['EMITINDO', 'EM_PROCESSAMENTO'].includes(props.status))
const label = computed(() =>
  processing.value
    ? 'Emitindo...'
    : props.status === 'REGISTRADA'
      ? 'Registrada'
      : statusLabels[props.status] || props.status,
)
const icon = computed(() => {
  if (processing.value) return LoaderCircle
  if (['PENDENTE', 'REGISTRADA', 'PRONTA_PARA_EMISSAO'].includes(props.status)) return ListChecks
  if (['AUTORIZADA', 'HOMOLOGADA'].includes(props.status)) return CircleCheck
  if (['EMISSAO_INCERTA', 'RESULTADO_INCERTO'].includes(props.status)) return ClockAlert
  if (['REJEITADA', 'FALHA_REPROCESSAVEL', 'CANCELADA'].includes(props.status)) return CircleX
  return FileClock
})
</script>

<template>
  <div class="inline-flex items-center whitespace-nowrap align-middle" data-fiscal-status>
    <Badge
      variant="outline"
      class="h-7 gap-1.5 px-2.5"
      :class="[statusClass(status), { 'rounded-r-none': error }]"
      role="status"
      aria-live="polite"
      :aria-busy="processing"
    >
      <component
        :is="icon"
        class="size-3.5 shrink-0"
        :class="{ 'animate-spin motion-reduce:animate-none': processing }"
        aria-hidden="true"
      />
      <span>{{ label }}</span>
    </Badge>
    <TooltipProvider v-if="error" :delay-duration="150">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="-ml-px inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-r-lg border border-destructive/40 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Ver erro da nota fiscal"
          >
            <CircleAlert class="size-3.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          class="max-w-sm whitespace-pre-wrap break-words text-left leading-relaxed"
          >{{ error }}</TooltipContent
        >
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
