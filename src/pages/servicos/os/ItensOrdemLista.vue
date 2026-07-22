<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Inbox } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import type { ItensOrdensServico } from '@/types/schemas'

type BadgeColor = 'cyan' | 'yellow' | 'gray' | 'violet' | 'purple' | 'green' | 'emerald' | 'orange' | 'red' | 'blue'

const props = defineProps<{
  itens: ItensOrdensServico[]
  titulo: string
  descricao: string
  icone: Component
  corIcone: string
  badgeLabel: string
  badgeColor: BadgeColor
  vazioTexto: string
}>()

const totalItens = computed(() =>
  props.itens.reduce((total, item) => total + Number(item.valor || 0) * Number(item.quantidade || 0), 0),
)

const quantidadeTotal = computed(() =>
  props.itens.reduce((total, item) => total + Number(item.quantidade || 0), 0),
)

function getItemTotal(item: ItensOrdensServico) {
  return Number(item.valor || 0) * Number(item.quantidade || 0)
}

function buildItemKey(item: ItensOrdensServico, index: number) {
  return item.id ?? `${item.tipo}-${item.itemName}-${index}`
}
</script>

<template>
  <section class="rounded-xl border bg-card p-4">
    <div class="mb-3 flex items-center gap-2">
      <component :is="icone" class="h-4 w-4 shrink-0" :class="corIcone" />
      <div class="min-w-0">
        <h3 class="text-sm font-semibold">{{ titulo }}</h3>
        <p class="truncate text-xs text-muted-foreground">{{ descricao }}</p>
      </div>
      <Badge variant="outline" class="ml-auto shrink-0">{{ itens.length }}</Badge>
    </div>

    <div v-if="!itens.length" class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
      <Inbox class="h-8 w-8 opacity-50" />
      {{ vazioTexto }}
    </div>

    <template v-else>
      <div class="grid gap-2 lg:grid-cols-2">
        <div v-for="(item, index) in itens" :key="buildItemKey(item, index)"
          class="rounded-lg border bg-background px-3 py-2.5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 space-y-1">
              <BadgeCell :label="badgeLabel" :color="badgeColor" :icon="icone" :capitalize="false" size="sm" />
              <p class="truncate text-sm font-medium text-foreground">{{ item.itemName }}</p>
              <p class="text-xs tabular-nums text-muted-foreground">
                {{ item.quantidade }} x {{ formatCurrencyBR(Number(item.valor || 0)) }}
              </p>
            </div>
            <strong class="shrink-0 text-sm tabular-nums text-foreground">
              {{ formatCurrencyBR(getItemTotal(item)) }}
            </strong>
          </div>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
        <span class="font-semibold">Total em {{ titulo.toLowerCase() }}</span>
        <span class="flex items-center gap-3">
          <span class="tabular-nums text-muted-foreground">{{ quantidadeTotal }} un.</span>
          <strong class="tabular-nums">{{ formatCurrencyBR(totalItens) }}</strong>
        </span>
      </div>
    </template>
  </section>
</template>
