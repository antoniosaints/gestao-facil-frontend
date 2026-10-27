<script setup lang="ts">
import FormSelect from './FormSelect.vue'
import { Input } from '@/components/ui/input'

import { ref, computed } from 'vue'
import ItemSearch from './ItemSearch.vue'
import type { Row } from '../adapters/domain'
import { money } from '../application/format'
export interface FlowItem {
  id: number
  nome: string
  tipo: 'PRODUTO' | 'SERVICO' | 'COMBO'
  quantidade: number
  preco: number
}
const items = defineModel<FlowItem[]>({ required: true })
const kind = ref<'PRODUTO' | 'SERVICO'>('PRODUTO')
const total = computed(() =>
  items.value.reduce((sum, item) => sum + Number(item.quantidade) * Number(item.preco), 0),
)
function add(row: Row) {
  const existing = items.value.find((item) => item.id === row.id && item.tipo === kind.value)
  if (existing) {
    existing.quantidade = Number(existing.quantidade) + 1
  } else
    items.value.push({
      id: row.id,
      nome: [row.nome, row.nomeVariante].filter(Boolean).join(' · '),
      tipo: kind.value,
      quantidade: 1,
      preco: Number(row.precoPromocional ?? row.preco),
    })
}
</script>
<template>
  <div class="mf-stack grid gap-4">
    <label
      >O que deseja incluir?<FormSelect
        v-model="kind"
        :options="[
          { value: 'PRODUTO', label: 'Produto / variante' },
          { value: 'SERVICO', label: 'Serviço' },
        ]" /></label
    ><ItemSearch :key="kind" :kind="kind" @select="add" />
    <ul class="mf-list m-0 grid list-none gap-3 p-0">
      <li
        v-for="(item, index) in items"
        :key="`${item.tipo}-${item.id}`"
        class="grid min-w-0 grid-cols-1 gap-3 rounded-[6px] border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_100px_140px_auto] lg:items-end"
      >
        <div>
          <strong>{{ item.nome }}</strong
          ><small>{{ item.tipo }} #{{ item.id }} · {{ money(item.quantidade * item.preco) }}</small>
        </div>
        <label
          >Quantidade<Input
            placeholder="Ex.: 1"
            v-model.number="item.quantidade"
            type="number"
            min="1"
            step="1"
            required /></label
        ><label
          >Preço unitário<Input
            placeholder="Ex.: 1"
            v-model.number="item.preco"
            :readonly="item.tipo === 'COMBO'"
            type="number"
            min="0"
            step="0.01"
            required /></label
        ><button type="button" @click="items.splice(index, 1)">Remover</button>
      </li>
    </ul>
    <p class="mf-muted text-sm text-muted-foreground">
      O contrato de vendas e OS permite quantidades inteiras. Estoque fracionado permanece
      disponível nas operações de estoque.
    </p>
    <p
      class="rounded-[6px] bg-muted/50 p-4 mf-value break-words text-2xl font-bold tracking-tight text-foreground"
    >
      Subtotal: {{ money(total) }}
    </p>
  </div>
</template>
