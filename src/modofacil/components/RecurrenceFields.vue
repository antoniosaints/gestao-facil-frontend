<script setup lang="ts">
import FormSwitch from './FormSwitch.vue'
import FormSelect from './FormSelect.vue'
import { Input } from '@/components/ui/input'

import { frequencies, recurrenceDraft } from '../application/recurrence'
const model = defineModel<ReturnType<typeof recurrenceDraft>>({ required: true })
</script>
<template>
  <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
    <label
      >Frequência<FormSelect
        v-model="model.frequencia"
        :options="[...frequencies.map((f) => ({ value: f, label: f }))]" /></label
    ><label v-if="model.frequencia === 'PERSONALIZADO'"
      >Intervalo em dias<Input
        placeholder="Ex.: 30"
        v-model.number="model.intervaloDias"
        type="number"
        min="1"
        max="3650"
        required /></label
    ><label
      >Valor de cada ocorrência<Input
        placeholder="0,00"
        v-model="model.valorParcela"
        inputmode="decimal"
        required /></label
    ><label
      >Começa em<Input
        placeholder="dd/mm/aaaa"
        v-model="model.dataInicio"
        type="date"
        required /></label
    ><label
      >Termina em (opcional)<Input
        placeholder="dd/mm/aaaa"
        v-model="model.dataFim"
        type="date" /></label
    ><label
      >Mínimo de parcelas geradas<Input
        placeholder="Ex.: 1"
        v-model.number="model.minimoGerado"
        type="number"
        min="1"
        max="24"
        required /></label
    ><label
      >Máximo de parcelas em aberto<Input
        placeholder="Ex.: 3"
        v-model.number="model.maximoEmAberto"
        type="number"
        min="1"
        max="60"
        required /></label
    ><label
      >Antecedência para gerar (dias)<Input
        placeholder="Ex.: 5"
        v-model.number="model.diasAntecedencia"
        type="number"
        min="0"
        max="365"
        required /></label
    ><label
      class="mf-choice mb-3 !flex items-center gap-3 rounded-[6px] border border-border p-4 has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-500/10"
      ><FormSwitch v-model="model.geracaoAutomatica" />Gerar automaticamente conforme regras da
      conta</label
    >
  </div>
</template>
