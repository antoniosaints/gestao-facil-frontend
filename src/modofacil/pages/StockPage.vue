<script setup lang="ts">
import FormResultLink from '../components/FormResultLink.vue'
import ModalAction from '../components/ModalAction.vue'
import { useFormDestination } from '../application/formReturn'
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRight,
  History,
  ChevronDown,
  Truck,
  Info,
} from 'lucide-vue-next'

import { useConfirmation } from '../application/confirmation'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, type Row } from '../adapters/domain'
import { decimal, quantity, money, errorMessage } from '../application/format'
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
    const q = decimal(amount.value, 3)
    if (!product.value || q <= 0) return null
    return Math.round((Number(product.value.estoque) + (discard.value ? -q : q)) * 1000) / 1000
  } catch {
    return null
  }
})
const purchase = computed(() => {
  try {
    const q = decimal(amount.value, 3)
    if (q <= 0) return null
    const subtotal = Math.round(q * decimal(cost.value) * 100)
    return {
      subtotal: subtotal / 100,
      total:
        (subtotal +
          Math.round(decimal(freight.value) * 100) -
          Math.round(decimal(discount.value) * 100)) /
        100,
    }
  } catch {
    return null
  }
})
function reset() {
  product.value = null
  amount.value = ''
  cost.value = ''
  reason.value = ''
  supplier.value = null
  note.value = ''
  freight.value = '0'
  discount.value = '0'
  dirty.value = false
}
function removeSupplier() {
  supplier.value = null
  dirty.value = true
}
useFlow(dirty, busy)
async function select(row: Row) {
  reset()
  error.value = ''
  message.value = ''
  product.value = row
  dirty.value = true
  cost.value = row.precoCompra == null ? '' : Number(row.precoCompra).toFixed(2).replace('.', ',')
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
  message.value = ''
  let sent = false
  try {
    const q = decimal(amount.value, 3)
    if (q <= 0) throw new Error('Informe uma quantidade maior que zero.')
    if (discard.value && !reason.value.trim()) throw new Error('Informe o motivo do descarte.')
    if (discard.value && reason.value.trim().length > 191)
      throw new Error('Use até 191 caracteres no motivo do descarte.')
    if (!discard.value && note.value.length > 191)
      throw new Error('Use até 191 caracteres na nota fiscal.')
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
        description: `${product.value.nome} · ${product.value.nomeVariante || 'Padrão'}. ${discard.value ? 'Saída' : 'Entrada'} de ${quantity(q)} ${product.value.unidade || 'un'}. Saldo previsto: ${quantity(after.value)} ${product.value.unidade || 'un'}. ${discard.value ? `Motivo: ${reason.value.trim()}.` : `Custo unitário: ${money(body.custo)}. Total previsto: ${money(purchase.value?.total)}. Fornecedor: ${supplier.value?.nome || 'não informado'}.`}`,
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
    reset()
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
  <PageFrame compact class="!space-y-4">
    <PageHeader
      :title="discard ? 'Registrar descarte' : 'Repor estoque'"
      :description="
        discard
          ? 'Registre uma saída por perda e informe o motivo.'
          : 'Registre a entrada do produto e confira o novo saldo.'
      "
    />
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span
        class="inline-flex items-center gap-2 text-xs font-medium"
        :class="discard ? 'text-orange-600 dark:text-orange-300' : 'text-primary'"
      >
        <ArrowUpFromLine v-if="discard" :size="16" aria-hidden="true" />
        <ArrowDownToLine v-else :size="16" aria-hidden="true" />
        {{ discard ? 'Saída por descarte' : 'Entrada de estoque' }}
      </span>
      <FormResultLink
        :to="formDestination('/modofacil/estoque/movimentacoes')"
        class="mf-button !h-8 !min-h-8 !px-3 !text-xs"
      >
        <History :size="14" aria-hidden="true" />Conferir histórico
      </FormResultLink>
    </div>
    <Feedback :error="error" :message="message" @retry="error = ''" />
    <section v-if="!product && !uncertain" class="rounded-lg border border-border bg-muted/20 p-4">
      <h2 class="!mb-1 !text-sm">Qual produto deseja movimentar?</h2>
      <p class="!mb-0 text-xs text-muted-foreground">
        Busque pelo nome ou código e escolha a variante.
      </p>
      <ItemSearch @select="select" />
    </section>
    <form v-if="product" class="min-w-0" @submit.prevent="save" @input="dirty = true">
      <fieldset :disabled="busy || uncertain" class="grid min-w-0 gap-4">
        <section
          class="min-w-0 rounded-lg border border-border bg-muted/20 p-4"
          aria-label="Produto e prévia do estoque"
        >
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary"
              ><Package :size="21" aria-hidden="true"
            /></span>
            <div class="min-w-0 flex-1">
              <h2 class="!mb-1 !text-sm break-words">{{ product.nome }}</h2>
              <p class="!mb-0 text-xs text-muted-foreground">
                {{ product.nomeVariante || 'Padrão' }} ·
                {{ product.controlaEstoque ? 'Estoque controlado' : 'Sem controle de estoque' }}
              </p>
            </div>
            <button type="button" class="!h-8 !min-h-8 !px-3 !text-xs" @click="reset">
              Trocar
            </button>
          </div>
          <dl
            class="mt-4 grid !grid-cols-3 gap-2 border-t border-border pt-3"
            aria-label="Prévia do saldo"
          >
            <div class="min-w-0">
              <dt class="text-[11px] text-muted-foreground">Saldo atual</dt>
              <dd class="mt-1 break-words text-sm font-semibold">
                {{ quantity(product.estoque) }}
                <span class="text-xs font-normal">{{ product.unidade || 'un' }}</span>
              </dd>
            </div>
            <div class="min-w-0">
              <dt class="text-[11px] text-muted-foreground">{{ discard ? 'Saída' : 'Entrada' }}</dt>
              <dd
                class="mt-1 break-words text-sm font-semibold"
                :class="discard ? 'text-orange-600 dark:text-orange-300' : 'text-primary'"
              >
                {{ after !== null ? `${discard ? '−' : '+'}${quantity(decimal(amount, 3))}` : '—' }}
                <span v-if="after !== null" class="text-xs font-normal">{{
                  product.unidade || 'un'
                }}</span>
              </dd>
            </div>
            <div class="min-w-0">
              <dt class="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ArrowRight :size="12" aria-hidden="true" />Saldo previsto
              </dt>
              <dd class="mt-1 break-words text-sm font-semibold">
                {{ after !== null ? quantity(after) : '—' }}
                <span v-if="after !== null" class="text-xs font-normal">{{
                  product.unidade || 'un'
                }}</span>
              </dd>
            </div>
          </dl>
          <p v-if="!product.controlaEstoque" class="!mb-0 mt-3 text-xs text-muted-foreground">
            A disponibilidade desta operação será validada ao registrar.
          </p>
        </section>
        <section class="space-y-3" aria-labelledby="stock-fields-title">
          <h2 id="stock-fields-title" class="!mb-0 !text-sm">Dados da movimentação</h2>
          <div class="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <label
              >Quantidade {{ discard ? 'descartada' : 'recebida' }}
              <span class="text-destructive">*</span>
              <Input
                v-model="amount"
                placeholder="Ex.: 10,500"
                inputmode="decimal"
                required
                aria-describedby="stock-quantity-hint"
              />
              <small id="stock-quantity-hint"
                >Em {{ product.unidade || 'un' }}, com até 3 casas decimais.</small
              >
            </label>
            <label v-if="!discard"
              >Custo unitário <span class="text-destructive">*</span>
              <Input
                v-model="cost"
                placeholder="Ex.: 50,00"
                inputmode="decimal"
                required
                aria-describedby="stock-cost-hint"
              />
              <small id="stock-cost-hint">Valor em reais por {{ product.unidade || 'un' }}.</small>
            </label>
            <label v-else class="sm:col-span-2"
              >Motivo do descarte <span class="text-destructive">*</span>
              <Textarea
                v-model="reason"
                placeholder="Ex.: produto avariado durante o transporte"
                :rows="3"
                maxlength="191"
                required
              />
              <small>{{ reason.length }}/191 caracteres · Registrado no histórico.</small>
            </label>
          </div>
        </section>
        <details v-if="!discard" class="group rounded-lg border border-border !p-0">
          <summary
            class="flex cursor-pointer list-none items-center gap-2 !mb-0 !p-3 [&::-webkit-details-marker]:hidden"
          >
            <Truck :size="17" class="shrink-0 text-muted-foreground" aria-hidden="true" />
            <span class="flex-1 text-sm font-medium"
              >Detalhes da compra
              <span class="ml-1 text-[11px] font-normal text-muted-foreground">Opcional</span></span
            >
            <ChevronDown
              :size="16"
              class="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div class="space-y-4 border-t border-border p-4">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm font-medium">Fornecedor</span>
                <ModalAction
                  form="pessoa-nova"
                  :query="{ tipo: 'FORNECEDOR' }"
                  class="!h-8 !min-h-8 !px-2 !text-xs"
                  >Cadastrar fornecedor</ModalAction
                >
              </div>
              <div
                v-if="supplier"
                class="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-2"
              >
                <span class="min-w-0 break-words text-sm">{{ supplier.nome }}</span>
                <button type="button" class="!h-8 !min-h-8 !px-2 !text-xs" @click="removeSupplier">
                  Remover fornecedor
                </button>
              </div>
              <ItemSearch
                v-if="!supplier"
                kind="PESSOA"
                person-type="FORNECEDOR"
                class="!my-0"
                @select="
                  (row) => {
                    supplier = row
                    dirty = true
                  }
                "
              />
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label
                >Nota fiscal<Input v-model="note" placeholder="Ex.: NF 12345" maxlength="191"
              /></label>
              <label
                >Frete (R$)<Input v-model="freight" placeholder="Ex.: 15,00" inputmode="decimal"
              /></label>
              <label
                >Desconto (R$)<Input v-model="discount" placeholder="Ex.: 5,00" inputmode="decimal"
              /></label>
            </div>
          </div>
        </details>
        <section
          v-if="!discard"
          class="rounded-lg border border-primary/20 bg-primary/5 p-3"
          aria-label="Resumo do custo da entrada"
          aria-live="polite"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="!mb-0 text-xs text-muted-foreground">Total previsto da entrada</p>
              <small>Quantidade × custo + frete − desconto</small>
            </div>
            <strong class="text-lg text-primary">{{
              purchase ? money(purchase.total) : '—'
            }}</strong>
          </div>
        </section>
        <p class="!mb-0 flex items-start gap-2 text-xs text-muted-foreground">
          <Info :size="15" class="mt-0.5 shrink-0" aria-hidden="true" /><span>{{
            discard
              ? 'O descarte reduz o estoque. Reservas e saldo disponível serão conferidos ao registrar.'
              : 'Esta entrada atualiza o estoque e não gera uma despesa no financeiro.'
          }}</span>
        </p>
        <div class="mf-form-actions !mt-0">
          <FormResultLink :to="formDestination('/modofacil/produtos')" class="mf-button"
            >Produtos</FormResultLink
          >
          <button
            :class="
              discard
                ? '!border-red-600 !bg-red-600 !text-white hover:!bg-red-700'
                : 'mf-primary !border-primary !bg-primary !text-primary-foreground'
            "
          >
            {{ busy ? 'Registrando…' : discard ? 'Confirmar descarte' : 'Confirmar reposição' }}
          </button>
        </div>
      </fieldset>
    </form>
  </PageFrame>
</template>
