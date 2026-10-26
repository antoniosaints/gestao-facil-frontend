<script setup lang="ts">
import FormResultLink from '../components/FormResultLink.vue'
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Input } from '@/components/ui/input'

import SuccessPanel from '../components/SuccessPanel.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed } from 'vue'
import { api, type Row } from '../adapters/domain'
import { decimal, today, money, quantity, errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import { useDomainMutation } from '../application/useDomainMutation'
import ItemSearch from '../components/ItemSearch.vue'
import Feedback from '../components/Feedback.vue'
interface BatchItem {
  produtoId: number
  nome: string
  unidade: string
  quantidade: string
  custo: string
}
const items = ref<BatchItem[]>([]),
  supplier = ref<Row | null>(null),
  date = ref(today()),
  note = ref(''),
  freight = ref('0'),
  discount = ref('0'),
  review = ref(false),
  dirty = ref(false),
  done = ref(false),
  validation = ref(''),
  key = crypto.randomUUID()
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
const total = computed(
  () =>
    items.value.reduce(
      (s, i) => s + Number(i.quantidade.replace(',', '.')) * Number(i.custo.replace(',', '.')),
      0,
    ) +
    Number(freight.value.replace(',', '.')) -
    Number(discount.value.replace(',', '.')),
)
function add(row: Row) {
  validation.value = ''
  if (items.value.some((i) => i.produtoId === row.id)) {
    validation.value = 'Este item já está na compra. Altere sua quantidade na lista.'
    return
  }
  items.value.push({
    produtoId: row.id,
    nome: [row.nome, row.nomeVariante].filter(Boolean).join(' · '),
    unidade: row.unidade || '',
    quantidade: '1',
    custo: row.precoCompra == null ? '' : String(row.precoCompra),
  })
  dirty.value = true
}
function payload() {
  if (!items.value.length) throw new Error('Inclua pelo menos um produto.')
  return {
    chaveOperacao: key,
    data: new Date(date.value + 'T12:00:00').toISOString(),
    fornecedor: supplier.value?.id || null,
    notaFiscal: note.value || null,
    frete: decimal(freight.value),
    desconto: decimal(discount.value),
    itens: items.value.map((i) => {
      const q = decimal(i.quantidade, 3)
      if (q <= 0) throw new Error('Cada quantidade precisa ser maior que zero.')
      return { produtoId: i.produtoId, quantidade: q, custo: decimal(i.custo) }
    }),
  }
}
function next() {
  validation.value = ''
  try {
    payload()
    review.value = true
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
async function save() {
  let body
  try {
    body = payload()
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const result = await run(
    () => api.post('/modofacil/estoque/reposicao/lote', body),
    'Compra registrada em uma única operação de reposição em lote.',
  )
  if (result) {
    done.value = true
    dirty.value = false
  }
}

const formDestination = useFormDestination()
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Repor vários produtos</template
      ><template #description>Uma compra, vários itens, um único registro de estoque.</template
      ><template #back
        ><FormBack :to="formDestination('/modofacil/produtos')">← Produtos</FormBack></template
      ></PageHeader
    >

    <Feedback :error="validation || error" :message="message" @retry="validation = ''" />
    <form
      v-if="!done"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : next()"
      @input="dirty = true"
    >
      <fieldset :disabled="busy || uncertain" class="mf-stack grid gap-4">
        <template v-if="!review"
          ><ItemSearch @select="add" />
          <ul class="mf-list m-0 grid list-none gap-3 p-0">
            <li
              v-for="(item, i) in items"
              :key="item.produtoId"
              class="mf-row flex flex-wrap items-center justify-between gap-4 break-words rounded-[6px] border border-border p-4 [&>div]:min-w-0 min-w-0 bg-card"
            >
              <strong>{{ item.nome }} · {{ item.unidade }}</strong
              ><label
                >Quantidade {{ i + 1
                }}<Input v-model="item.quantidade" inputmode="decimal" required /></label
              ><label
                >Custo unitário {{ i + 1
                }}<Input v-model="item.custo" inputmode="decimal" required /></label
              ><button type="button" @click="items.splice(i, 1)">Remover {{ item.nome }}</button>
            </li>
          </ul>
          <details>
            <summary>Fornecedor e dados da compra</summary>
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
              Remover fornecedor
            </button>
            <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
              <label>Data de entrada<Input v-model="date" type="date" required /></label
              ><label>Nota fiscal<Input v-model="note" maxlength="191" /></label
              ><label>Frete<Input v-model="freight" inputmode="decimal" /></label
              ><label>Desconto<Input v-model="discount" inputmode="decimal" /></label>
            </div></details
        ></template>
        <ReviewPanel v-else>
          <template #title>Confira a compra</template>
          <p>
            {{ date }} · {{ supplier?.nome || 'Sem fornecedor' }} · Nota
            {{ note || 'não informada' }}
          </p>
          <ul>
            <li v-for="item in items" :key="item.produtoId">
              {{ item.nome }} · {{ item.quantidade }} {{ item.unidade }} × {{ item.custo }}
            </li>
          </ul>
          <p>Frete {{ freight }} · Desconto {{ discount }}.</p>
          <p class="mf-value break-words text-2xl font-bold tracking-tight text-foreground">
            Total da compra: {{ money(total) }}
          </p>
          <p
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            O domínio rateia frete e desconto e registra todas as entradas na transação. Nenhuma
            despesa financeira adicional é criada pela tela.
          </p>
        </ReviewPanel>
        <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
          <button v-if="review" type="button" @click="review = false">Voltar</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{ busy ? 'Registrando…' : review ? 'Confirmar reposição em lote' : 'Conferir compra' }}
          </button>
        </div>
      </fieldset>
    </form>
    <FormResultLink
      v-if="done || uncertain"
      :to="formDestination('/modofacil/estoque/movimentacoes')"
      >Consultar movimentos registrados</FormResultLink
    >
    <SuccessPanel
      v-if="done"
      title="Reposição registrada"
      :to="formDestination('/modofacil/estoque/movimentacoes')"
      label="Ver movimentações"
    />
  </PageFrame>
</template>
