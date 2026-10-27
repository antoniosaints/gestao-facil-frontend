<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import type { RouteLocationRaw } from 'vue-router'
import { routeLocationKey } from 'vue-router'
import { computed, inject } from 'vue'
defineProps<{
  title?: string
  description?: string
  back?: RouteLocationRaw
  backLabel?: string
  eyebrow?: string
}>()
const route = inject(routeLocationKey, undefined)
const section = computed(() => {
  const path = route?.path || ''
  if (path.includes('/configuracoes') || path.includes('/recursos')) return 'Sistema'
  if (path.includes('/relatorios')) return 'Análise'
  if (
    path.includes('/financeiro') ||
    path.includes('/vendas') ||
    path.includes('/estoque') ||
    path.includes('/ordens')
  )
    return 'Operação'
  if (path.includes('/pessoas') || path.includes('/produtos') || path.includes('/servicos'))
    return 'Cadastros'
  return 'Visão geral'
})
</script>
<template>
  <header class="space-y-3">
    <slot name="back"
      ><RouterLink
        v-if="back"
        :to="back"
        class="inline-flex min-h-10 items-center gap-2 text-xs font-medium"
        ><ArrowLeft :size="15" aria-hidden="true" />{{ backLabel || 'Voltar' }}</RouterLink
      ></slot
    >
    <div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="mf-eyebrow">{{ eyebrow || section }}</p>
        <h1 class="break-words !text-xl sm:!text-2xl">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="description || $slots.description" class="!mb-0 text-muted-foreground">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
