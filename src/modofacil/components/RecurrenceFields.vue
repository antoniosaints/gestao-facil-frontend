<script setup lang="ts">
import { Input } from '@/components/ui/input'

import { frequencies, recurrenceDraft } from '../application/recurrence'
const model = defineModel<ReturnType<typeof recurrenceDraft>>({ required: true })
</script>
<template>
  <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
    <label
      >Frequência<select v-model="model.frequencia">
        <option v-for="f in frequencies" :key="f">{{ f }}</option>
      </select></label
    ><label v-if="model.frequencia === 'PERSONALIZADO'"
      >Intervalo em dias<Input
        v-model.number="model.intervaloDias"
        type="number"
        min="1"
        max="3650"
        required /></label
    ><label
      >Valor de cada ocorrência<Input
        v-model="model.valorParcela"
        inputmode="decimal"
        required /></label
    ><label>Começa em<Input v-model="model.dataInicio" type="date" required /></label
    ><label>Termina em (opcional)<Input v-model="model.dataFim" type="date" /></label
    ><label
      >Mínimo de parcelas geradas<Input
        v-model.number="model.minimoGerado"
        type="number"
        min="1"
        max="24"
        required /></label
    ><label
      >Máximo de parcelas em aberto<Input
        v-model.number="model.maximoEmAberto"
        type="number"
        min="1"
        max="60"
        required /></label
    ><label
      >Antecedência para gerar (dias)<Input
        v-model.number="model.diasAntecedencia"
        type="number"
        min="0"
        max="365"
        required /></label
    ><label
      class="mf-choice mb-3 !flex items-center gap-3 rounded-[6px] border border-border p-4 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10"
      ><input v-model="model.geracaoAutomatica" type="checkbox" />Gerar automaticamente conforme
      regras da conta</label
    >
  </div>
</template>
