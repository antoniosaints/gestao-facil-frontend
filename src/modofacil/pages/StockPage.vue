<script setup lang="ts">
import FormResultLink from '../components/FormResultLink.vue'
import ModalAction from '../components/ModalAction.vue'
import { useFormDestination } from '../application/formReturn'
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'

import { useConfirmation } from '../application/confirmation'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, type Row } from '../adapters/domain'
import { decimal, quantity, money, errorMessage, today } from '../application/format'
import { useFlow } from '../application/useFlow'
import ItemSearch from '../components/ItemSearch.vue'
import Feedback from '../components/Feedback.vue'
const route = useFormContext()
const discard = computed(() => route.params.operacao === 'descarte')
const product = ref<Row | null>(null),
  amount = ref(''),
  cost = ref(''),
  reason = ref(''),
  supplier = ref<Row | null>(null),
  note = ref(''),
  freight = ref('0'),
  discount = ref('0'),
  busy = ref(false),
  error = ref(''),
  message = ref(''),
  dirty = ref(false),
  uncertain = ref(false)
const after = computed(() => {
  try {
    return Number(product.value?.estoque) + (discard.value ? -1 : 1) * decimal(amount.value, 3)
  } catch {
    return null
  }
})
useFlow(dirty, busy)
async function select(row: Row) {
  product.value = row
  dirty.value = true
  cost.value = row.precoCompra == null ? '' : String(row.precoCompra)
}
onMounted(async () => {
  if (route.query.produtoId) {
    try {
      select(await api.read(`/modofacil/produtos/variantes/${Number(route.query.produtoId)}`))
    } catch (e) {
      error.value = errorMessage(e)
    }
  }
})
const confirmOperation = useConfirmation()
async function save() {
  if (busy.value || uncertain.value) return
  if (!product.value) return
  busy.value = true
  error.value = ''
  let sent = false
  try {
    const q = decimal(amount.value, 3)
    if (q <= 0) throw new Error('Informe uma quantidade maior que zero.')
    if (discard.value && !reason.value.trim()) throw new Error('Informe o motivo do descarte.')
    const body = discard.value
      ? { produtoId: product.value.id, quantidade: q, motivo: reason.value.trim() }
      : {
          produtoId: product.value.id,
          quantidade: q,
          custo: decimal(cost.value),
          fornecedor: supplier.value?.id || null,
          notaFiscal: note.value || undefined,
          frete: decimal(freight.value),
          desconto: decimal(discount.value),
        }
    if (
      !(await confirmOperation({
        title: discard.value ? 'Confirmar descarte?' : 'Confirmar reposição?',
        description: `${product.value.nome} · ${q} ${product.value.unidade || 'un'}. ${discard.value ? `Motivo: ${reason.value.trim()}. O saldo de estoque será reduzido.` : `Custo unitário: ${money(body.custo)}. O saldo de estoque será aumentado.`}`,
        confirmLabel: discard.value ? 'Confirmar descarte' : 'Confirmar reposição',
        danger: discard.value,
      }))
    )
      return
    sent = true
    await api.post(
      discard.value ? '/modofacil/estoque/descarte' : '/modofacil/estoque/reposicao',
      body,
    )
    message.value = 'Operação registrada. Consulte o histórico para conferir os movimentos.'
    dirty.value = false
    product.value = null
    amount.value = ''
    reason.value = ''
  } catch (e) {
    error.value = errorMessage(e)
    if (sent && (!(e as any).response || (e as any).response.status >= 500)) {
      uncertain.value = true
      error.value +=
        ' O envio pode ter sido processado. Confira o histórico antes de iniciar outra operação.'
    }
  } finally {
    busy.value = false
  }
}

const formDestination = useFormDestination()
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>{{ discard ? 'Registrar descarte' : 'Repor estoque' }}</template
      ><template #description>
        {{
          discard
            ? 'Registre perdas com uma justificativa.'
            : 'Informe o que chegou e quanto custou.'
        }}
      </template></PageHeader
    >

    <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
      <FormResultLink :to="formDestination('/modofacil/produtos')">Produtos</FormResultLink
      ><FormResultLink :to="formDestination('/modofacil/estoque/movimentacoes')"
        >Conferir histórico</FormResultLink
      >
    </div>
    <Feedback :error="error" :message="message" @retry="error = ''" />
    <ItemSearch v-if="!product && !uncertain" @select="select" />
    <form
      v-if="product"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="save"
      @input="dirty = true"
    >
      <h2>{{ product.nome }} · {{ product.nomeVariante || 'Padrão' }}</h2>
      <p>
        Saldo consultado: {{ quantity(product.estoque) }} {{ product.unidade }} ·
        {{
          product.controlaEstoque
            ? 'Estoque controlado'
            : 'Este produto não controla estoque; a operação será validada pelo servidor.'
        }}
      </p>
      <fieldset :disabled="busy || uncertain" class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
        <label
          >Quantidade {{ discard ? 'descartada' : 'recebida'
          }}<Input v-model="amount" inputmode="decimal" required /><small
            >Até 3 casas decimais.</small
          ></label
        ><label v-if="!discard"
          >Custo unitário<Input v-model="cost" inputmode="decimal" required /></label
        ><label v-else>Motivo<Textarea v-model="reason" required /></label>
        <p
          class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300 mf-full col-span-full"
          v-if="after !== null"
        >
          {{ quantity(product.estoque) }} → {{ discard ? 'Saída' : 'Entrada' }} {{ amount }} →
          {{ quantity(after) }} {{ product.unidade
          }}<small>Prévia. Reservas e outras operações serão conferidas pelo servidor.</small>
        </p>
        <details v-if="!discard" class="mf-full col-span-full">
          <summary>Detalhes da compra</summary>
          <p>Fornecedor: {{ supplier?.nome || 'Não informado' }}</p>
          <ItemSearch
            kind="PESSOA"
            person-type="FORNECEDOR"
            @select="
              (row) => {
                supplier = row
                dirty = true
              }
            "
          /><button v-if="supplier" type="button" @click="supplier = null">
            Remover fornecedor</button
          ><ModalAction form="pessoa-nova" :query="{ tipo: 'FORNECEDOR' }"
            >Cadastrar fornecedor</ModalAction
          >
          <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>Nota fiscal<Input v-model="note" /></label
            ><label>Frete<Input v-model="freight" inputmode="decimal" /></label
            ><label>Desconto<Input v-model="discount" inputmode="decimal" /></label>
          </div>
        </details>
        <div
          class="mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
        >
          <button type="button" @click="product = null">Escolher outro</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{ busy ? 'Registrando…' : discard ? 'Confirmar descarte' : 'Confirmar reposição' }}
          </button>
        </div>
      </fieldset>
    </form>
    <p class="mf-muted text-sm text-muted-foreground">
      Esta operação não cria uma despesa financeira extra. Reposição em lote e correção auditada de
      contagem ainda estão em adaptação.
    </p>
  </PageFrame>
</template>
