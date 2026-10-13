<script setup lang="ts">
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { moneyMaskOptions } from '@/lib/imaska'
import { MetodoPagamento } from '@/types/schemas'
import { formatPaymentMethodLabel } from '@/utils/formatters'
import { vMaska } from 'maska/vue'

const amount = defineModel<string>('amount', { required: true })
const method = defineModel<MetodoPagamento>('method')
const methods = Object.values(MetodoPagamento)
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <label class="grid gap-1 text-sm font-medium">
      Antecipação do cliente
      <Input
        v-model="amount"
        v-maska="moneyMaskOptions"
        icon-label="R$"
        icon-label-position="left"
        type="text"
        inputmode="decimal"
        placeholder="0,00"
        aria-label="Antecipação do cliente"
      />
      <span class="text-xs font-normal text-muted-foreground">
        Total já pago pelo cliente; será abatido do saldo na conclusão da OS.
      </span>
    </label>
    <label class="grid content-start gap-1 text-sm font-medium">
      Forma de pagamento do cliente
      <Select v-model="method">
        <SelectTrigger aria-label="Forma de pagamento do cliente">
          <SelectValue placeholder="Selecione a forma de pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="item in methods" :key="item" :value="item">
            {{ formatPaymentMethodLabel(item) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </label>
  </div>
</template>
