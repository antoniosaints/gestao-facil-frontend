<script setup lang="ts">
import { computed } from 'vue'
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const props = defineProps<{ modelValue: number[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: number[]): void }>()

const ANTES = [-30, -15, -7, -5, -3, -1]
const DEPOIS = [1, 3, 5, 7, 15, 30]

const PRESETS: Array<{ nome: string; dias: number[] }> = [
  { nome: 'Padrão (3, 1, 0, +1)', dias: [-3, -1, 0, 1] },
  { nome: 'Só antes', dias: [-5, -3, -1] },
  { nome: 'Cobrança de atraso', dias: [0, 1, 3, 7] },
  { nome: 'Agressivo', dias: [-3, -1, 0, 1, 3, 7, 15] },
]

const customDia = ref<number | null>(null)

const dias = computed(() => props.modelValue || [])

function setDias(next: number[]) {
  emit('update:modelValue', [...next].sort((a, b) => a - b))
}

function offsetLabel(offset: number) {
  if (offset < 0) {
    const d = Math.abs(offset)
    return d === 1 ? 'vence amanhã' : `faltam ${d} dias`
  }
  if (offset === 0) return 'vence hoje'
  return offset === 1 ? 'venceu ontem' : `venceu há ${offset} dias`
}

function toggleDia(offset: number) {
  if (dias.value.includes(offset)) setDias(dias.value.filter((d) => d !== offset))
  else setDias([...dias.value, offset])
}

function removeDia(offset: number) {
  setDias(dias.value.filter((d) => d !== offset))
}

function addCustomDia(sinal: -1 | 1) {
  const base = Number(customDia.value)
  if (!Number.isInteger(base) || base <= 0 || base > 60) return
  const offset = sinal * base
  if (!dias.value.includes(offset)) setDias([...dias.value, offset])
  customDia.value = null
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <Button
        v-for="preset in PRESETS"
        :key="preset.nome"
        type="button"
        variant="outline"
        size="sm"
        @click="setDias(preset.dias)"
      >
        {{ preset.nome }}
      </Button>
    </div>

    <div v-if="dias.length" class="flex flex-wrap gap-2">
      <Badge
        v-for="d in dias"
        :key="d"
        variant="secondary"
        class="cursor-pointer gap-1 py-1"
        @click="removeDia(d)"
      >
        {{ offsetLabel(d) }}
        <span class="text-muted-foreground">✕</span>
      </Badge>
    </div>
    <p v-else class="text-xs text-amber-600">Selecione ao menos um dia.</p>

    <div>
      <span class="text-xs text-muted-foreground">Antes do vencimento</span>
      <div class="mt-1 flex flex-wrap gap-1.5">
        <button
          v-for="d in ANTES"
          :key="d"
          type="button"
          class="rounded-full border px-2.5 py-1 text-xs transition"
          :class="dias.includes(d) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'"
          @click="toggleDia(d)"
        >
          {{ Math.abs(d) }}d
        </button>
      </div>
    </div>
    <div>
      <span class="text-xs text-muted-foreground">No dia / após o vencimento</span>
      <div class="mt-1 flex flex-wrap gap-1.5">
        <button
          type="button"
          class="rounded-full border px-2.5 py-1 text-xs transition"
          :class="dias.includes(0) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'"
          @click="toggleDia(0)"
        >
          No dia
        </button>
        <button
          v-for="d in DEPOIS"
          :key="d"
          type="button"
          class="rounded-full border px-2.5 py-1 text-xs transition"
          :class="dias.includes(d) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'"
          @click="toggleDia(d)"
        >
          +{{ d }}d
        </button>
      </div>
    </div>

    <div class="flex items-end gap-2">
      <div>
        <span class="text-xs text-muted-foreground">Dia personalizado</span>
        <Input v-model.number="customDia" type="number" min="1" max="60" placeholder="Ex.: 10" class="mt-1 w-28" />
      </div>
      <Button type="button" variant="outline" size="sm" @click="addCustomDia(-1)">Antes</Button>
      <Button type="button" variant="outline" size="sm" @click="addCustomDia(1)">Depois</Button>
    </div>
  </div>
</template>
