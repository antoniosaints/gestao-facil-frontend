<script setup lang="ts">
import { Input } from '@/components/ui/input'

import { computed } from 'vue'
import { money } from '../application/format'
import { paymentMethods, type PaymentDraft } from '../application/payments'
const props = withDefaults(
  defineProps<{ total: number; allowCredit?: boolean; allowCompound?: boolean }>(),
  { allowCompound: true },
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
      class="mf-choice mb-3 !flex items-center gap-3 rounded-[6px] border border-border p-4 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10"
      ><input v-model="compound" type="checkbox" />Dividir em mais de uma forma de pagamento</label
    ><template v-if="!compound || allowCompound === false"
      ><label
        >Forma de pagamento<select v-model="method">
          <option v-for="[code, label] in methods" :key="code" :value="code">{{ label }}</option>
        </select></label
      ><label v-if="method === 'DINHEIRO'"
        >Valor recebido em dinheiro<Input v-model="received" inputmode="decimal" /><small
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
            }}<select v-model="payment.metodo">
              <option v-for="[code, label] in methods" :key="code" :value="code">
                {{ label }}
              </option>
            </select></label
          ><label>Valor {{ index + 1 }}<Input v-model="payment.valor" inputmode="decimal" /></label
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
