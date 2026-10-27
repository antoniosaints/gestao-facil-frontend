<script setup lang="ts">
import FormSwitch from './FormSwitch.vue'
import FormSelect from './FormSelect.vue'
import { Input } from '@/components/ui/input'

import { computed } from 'vue'
import { money } from '../application/format'
import { paymentMethods, type PaymentDraft } from '../application/payments'
const props = withDefaults(
  defineProps<{ total: number; allowCredit?: boolean; allowCompound?: boolean }>(),
  { allowCredit: true, allowCompound: true },
)
const compound = defineModel<boolean>('compound', { required: true }),
  method = defineModel<string>('method', { required: true }),
  payments = defineModel<PaymentDraft[]>('payments', { required: true }),
  received = defineModel<string>('received', { required: true })
const methods = computed(() =>
  paymentMethods.filter(([code]) => props.allowCredit !== false || code !== 'CREDIARIO'),
)
const allocated = computed(() =>
  payments.value.reduce((sum, p) => sum + Number(p.valor.replace(',', '.')), 0),
)
</script>
<template>
  <section class="mf-stack grid gap-4">
    <label
      v-if="allowCompound !== false"
      class="mf-choice mb-3 !flex items-center gap-3 rounded-[6px] border border-border p-4 has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-500/10"
      ><FormSwitch v-model="compound" />Dividir em mais de uma forma de pagamento</label
    ><template v-if="!compound || allowCompound === false"
      ><label
        >Forma de pagamento<FormSelect
          v-model="method"
          :options="[...methods.map(([code, label]) => ({ value: code, label: label }))]" /></label
      ><label v-if="method === 'DINHEIRO'"
        >Valor recebido em dinheiro<Input
          placeholder="0,00"
          v-model="received"
          inputmode="decimal"
        /><small
          >Troco: {{ money(Math.max(0, Number(received.replace(',', '.')) - total)) }}</small
        ></label
      ></template
    ><template v-else
      ><ol class="mf-list m-0 grid list-none gap-3 p-0">
        <li
          v-for="(payment, index) in payments"
          :key="index"
          class="grid min-w-0 grid-cols-1 items-end gap-3 rounded-[6px] border border-border bg-card p-4 sm:grid-cols-2"
        >
          <label
            >Forma {{ index + 1
            }}<FormSelect
              v-model="payment.metodo"
              :options="[
                ...methods.map(([code, label]) => ({ value: code, label: label })),
              ]" /></label
          ><label
            >Valor {{ index + 1
            }}<Input placeholder="0,00" v-model="payment.valor" inputmode="decimal" /></label
          ><button
            type="button"
            class="sm:col-span-2 !text-red-600 dark:!text-red-300"
            :disabled="payments.length <= 1"
            @click="payments.splice(index, 1)"
          >
            Remover forma {{ index + 1 }}
          </button>
        </li>
      </ol>
      <button
        type="button"
        :disabled="payments.length >= 8"
        @click="payments.push({ metodo: 'PIX', valor: '' })"
      >
        Adicionar forma de pagamento
      </button>
      <p role="status">
        Distribuído: {{ money(allocated) }} · Falta: {{ money(total - allocated) }}
      </p>
      <small
        >Informe o valor líquido recebido em cada forma. Nesta divisão, o sistema não calcula troco
        por forma.</small
      ></template
    >
    <p class="mf-muted text-sm text-muted-foreground">
      Registre aqui pagamentos já realizados. Esta escolha não envia uma cobrança ao cliente.
    </p>
  </section>
</template>
