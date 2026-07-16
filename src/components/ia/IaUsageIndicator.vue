<template>
  <div v-if="uso" class="flex shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5"
    :title="tooltip">
    <Sparkles class="h-4 w-4 shrink-0 text-primary" />
    <div class="min-w-[92px]">
      <div class="flex items-center justify-between gap-2 whitespace-nowrap text-[11px] leading-tight">
        <span class="text-muted-foreground">IA restante</span>
        <span class="font-semibold" :class="corTexto">{{ rotuloRestante }}</span>
      </div>
      <div v-if="uso.limite != null" class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div class="h-full rounded-full transition-all" :class="corBarra" :style="{ width: pctUsado + '%' }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { IaRepository, type IaMeuUso } from '@/repositories/ia-repository'

const uso = ref<IaMeuUso | null>(null)

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('pt-BR')

const pctUsado = computed(() => {
  if (!uso.value || uso.value.limite == null || uso.value.limite <= 0) return 0
  return Math.min(100, Math.max(0, (uso.value.totalTokens / uso.value.limite) * 100))
})

const pctRestante = computed(() => 100 - pctUsado.value)

const rotuloRestante = computed(() => {
  if (!uso.value) return ''
  if (uso.value.limite == null) return 'Ilimitado'
  return compact.format(uso.value.restante ?? 0) + ' tok'
})

const corTexto = computed(() => {
  if (!uso.value || uso.value.limite == null) return 'text-emerald-500'
  if (pctRestante.value <= 10) return 'text-red-500'
  if (pctRestante.value <= 30) return 'text-amber-500'
  return 'text-emerald-500'
})

const corBarra = computed(() => {
  if (pctRestante.value <= 10) return 'bg-red-500'
  if (pctRestante.value <= 30) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const tooltip = computed(() => {
  if (!uso.value) return ''
  const usado = `Usado: ${full.format(uso.value.totalTokens)} tokens`
  const limite = uso.value.limite == null ? 'Limite: ilimitado' : `Limite: ${full.format(uso.value.limite)} tokens`
  return `${usado} • ${limite} (mês atual)`
})

async function refresh() {
  try {
    uso.value = await IaRepository.meuUso()
  } catch {
    uso.value = null
  }
}

defineExpose({ refresh })

onMounted(refresh)
</script>
