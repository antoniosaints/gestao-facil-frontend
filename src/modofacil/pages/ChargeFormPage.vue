<script setup lang="ts">
import FormResultLink from '../components/FormResultLink.vue'
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'

import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { useUiStore } from '@/stores/ui/uiStore'
import { api, type Row } from '../adapters/domain'
import { decimal, money, errorMessage } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
const route = useFormContext(),
  ui = useUiStore(),
  kind = String(route.query.tipo || ''),
  id = Number(route.query.origem),
  launch = Number(route.query.lancamento),
  record = ref<any>(null),
  client = ref<number | undefined>(),
  value = ref(''),
  type = ref('PIX'),
  review = ref(false),
  result = ref<any>(null),
  loading = ref(false),
  validation = ref(''),
  dirty = ref(false),
  existing = ref<Row[]>([])
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
const allowed = computed(() => ui.canCreateCharge !== false)
onMounted(async () => {
  loading.value = true
  try {
    if (!['venda', 'os', 'parcela'].includes(kind) || !id)
      throw new Error('Abra uma venda, OS ou parcela para escolher a origem.')
    const path =
      kind === 'venda'
        ? `/modofacil/vendas/${id}`
        : kind === 'os'
          ? `/modofacil/servicos/ordens/${id}`
          : `/modofacil/financeiro/lancamentos/${launch}`
    record.value = await api.read(path)
    existing.value = (await api.read('/modofacil/financeiro/cobrancas')).filter((c: Row) =>
      kind === 'venda'
        ? c.vendaId === id
        : kind === 'os'
          ? c.ordemServicoId === id
          : c.lancamentoId === id,
    )
    if (kind === 'parcela') {
      const p = record.value.parcelas.find((p: Row) => p.id === id)
      if (!p || p.pago) throw new Error('Escolha uma parcela pendente deste lançamento.')
      value.value = String(p.valor)
    } else {
      if (['FATURADO', 'FATURADA', 'CANCELADO', 'CANCELADA'].includes(record.value.status))
        throw new Error('A origem deve estar pendente e ativa.')
      value.value = String(
        kind === 'venda'
          ? record.value.valorTotal
          : record.value.ItensOrdensServico.reduce(
              (s: number, i: Row) => s + Number(i.valor) * i.quantidade,
              0,
            ) - Number(record.value.desconto || 0),
      )
    }
    client.value = record.value.clienteId || undefined
  } catch (e) {
    validation.value = errorMessage(e)
    record.value = null
  } finally {
    loading.value = false
  }
})
function body() {
  if (!allowed.value) throw new Error('Criação de cobrança desabilitada nesta conta.')
  if (existing.value.some((c) => ['PENDENTE', 'ATRASADO'].includes(c.status)))
    throw new Error('Já existe cobrança pendente para esta origem. Confira-a antes de criar outra.')
  const amount = decimal(value.value)
  if (amount <= 0) throw new Error('Informe um valor positivo.')
  return {
    type: type.value,
    value: amount,
    gateway: 'mercadopago',
    ...(client.value ? { clienteId: client.value } : {}),
    vinculo: { id, tipo: kind },
  }
}
function next() {
  try {
    body()
    review.value = true
    validation.value = ''
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
async function save() {
  let payload
  try {
    payload = body()
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const saved = await run(
    () => api.post('/modofacil/financeiro/cobrancas', payload),
    'Cobrança solicitada ao gateway.',
  )
  if (saved) {
    result.value = saved.value
    dirty.value = false
  }
}

const formDestination = useFormDestination()
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Criar cobrança vinculada</template
      ><template #back
        ><FormBack :to="formDestination('/modofacil/financeiro/cobrancas')"
          >← Cobranças</FormBack
        ></template
      ></PageHeader
    >

    <Feedback
      :loading="loading"
      :error="validation || error"
      :message="message"
      @retry="validation = ''"
    />
    <p
      v-if="!allowed"
      class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
    >
      Criação de cobrança desabilitada pela conta.
    </p>
    <form
      v-if="record && !result && allowed"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : next()"
      @input="dirty = true"
    >
      <p>
        Origem {{ kind }} #{{ id }} · {{ record.descricao || record.Uid || record.Cliente?.nome }}
      </p>
      <fieldset class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2" :disabled="busy || uncertain">
        <template v-if="!review"
          ><label
            >Tipo<select v-model="type">
              <option>PIX</option>
              <option>BOLETO</option>
              <option value="LINK">Link de pagamento</option>
            </select></label
          ><label>Valor da cobrança<Input v-model="value" inputmode="decimal" required /></label
        ></template>
        <ReviewPanel v-else>
          <template #title>Confira antes de enviar ao Mercado Pago</template>
          <p>{{ type }} · {{ value }} · {{ kind }} #{{ id }}</p>
          <p
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            A confirmação cria uma cobrança externa real quando o gateway da conta está configurado.
            Não equivale a receber ou faturar. Confirme apenas uma vez; consulte as cobranças após
            falha de comunicação.
          </p>
        </ReviewPanel>
        <div
          class="mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
        >
          <button v-if="review" type="button" @click="review = false">Voltar</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{ busy ? 'Enviando…' : review ? 'Confirmar criação no gateway' : 'Conferir cobrança' }}
          </button>
        </div>
      </fieldset>
    </form>
    <section
      v-if="result"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    >
      <h2>Cobrança criada</h2>
      <a
        v-if="result.paymentLink && /^https?:\/\//.test(result.paymentLink)"
        :href="result.paymentLink"
        target="_blank"
        rel="noopener noreferrer"
        >Abrir link de pagamento</a
      ><label v-if="result.pixCopiaCola"
        >PIX copia e cola<Textarea readonly :value="result.pixCopiaCola" /></label
      ><FormResultLink :to="formDestination('/modofacil/financeiro/cobrancas')"
        >Conferir situação da cobrança</FormResultLink
      >
    </section>
  </PageFrame>
</template>
