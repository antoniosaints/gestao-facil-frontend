<script setup lang="ts">
import EntityLink from '@/components/navigation/EntityLink.vue'
import DeleteRecord from '../components/DeleteRecord.vue'
import ModalAction from '../components/ModalAction.vue'
import OperationItems from '../components/OperationItems.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import ModalDialog from '../components/ModalDialog.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, VendaRepository, type Row } from '../adapters/domain'
import { money, quantity, errorMessage, dateLabel } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import SettlementForm from '../components/SettlementForm.vue'
import Feedback from '../components/Feedback.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageControls from '../components/PageControls.vue'
import { Input } from '@/components/ui/input'
import { Download, Pencil } from 'lucide-vue-next'
import { financeSummary, paymentLabel } from '../application/financeDetail'
import { saleItems, detailSearch } from '../application/detailRecords'
const route = useRoute(),
  ui = useUiStore(),
  sale = ref<Row | null>(null),
  loading = ref(false),
  loadError = ref(''),
  action = ref<'faturar' | 'estornar' | null>(null)
const { busy, error, message, uncertain, run } = useDomainMutation()
const itemSearch = ref(''),
  itemPage = ref(1)
const items = computed(() => saleItems(sale.value || {}))
const filteredItems = computed(() =>
  items.value.filter((item) =>
    detailSearch(`${item.itemName || item.produto?.nome || item.nome || ''}`).includes(
      detailSearch(itemSearch.value),
    ),
  ),
)
const itemPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / 10)))
const visibleItems = computed(() =>
  filteredItems.value.slice((itemPage.value - 1) * 10, itemPage.value * 10),
)
watch(itemSearch, () => (itemPage.value = 1))
watch(itemPages, (pages) => (itemPage.value = Math.min(itemPage.value, pages)))
const entries = computed<Row[]>(() => sale.value?.LancamentoFinanceiro || [])
const payment = computed(() => sale.value?.PagamentoVendas)
const payments = computed<Row[]>(() => {
  if (!payment.value) return []
  const details = Array.isArray(payment.value.detalhes)
    ? payment.value.detalhes.filter((part: any) => part && part.metodo && part.valor != null)
    : []
  return (
    details.length ? details : [{ metodo: payment.value.metodo, valor: payment.value.valor }]
  ).map((part: any, index: number) => ({ ...part, id: index }))
})
const paymentStatus = computed(
  () =>
    ({
      EFETIVADO: 'Efetivado',
      PAGO: 'Pago',
      PENDENTE: 'Pendente',
      ESTORNADO: 'Estornado',
      CANCELADO: 'Cancelado',
    })[payment.value?.status as string] ||
    payment.value?.status ||
    'Não informado',
)
const metrics = computed(() => [
  {
    label: 'Total da venda',
    value: money(sale.value?.valor),
    hint: 'Valor final registrado',
    tone: 'text-primary',
  },
  {
    label: 'Subtotal dos itens',
    value: money(
      items.value.reduce(
        (sum, item) => sum + Math.round(Number(item.quantidade) * Number(item.valor) * 100),
        0,
      ) / 100,
    ),
    hint: 'Antes do desconto',
  },
  { label: 'Desconto', value: money(sale.value?.desconto ?? 0), hint: 'Aplicado à venda' },
  {
    label: 'Quantidade de itens',
    value: quantity(items.value.reduce((sum, item) => sum + Number(item.quantidade), 0)),
    hint: `${items.value.length} linha(s) na venda`,
  },
])
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const result = await api.read(`/modofacil/vendas/${Number(route.params.id)}`)
    if (!result?.id) throw new Error('Venda não encontrada.')
    sale.value = result
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
async function receipt() {
  try {
    await VendaRepository.getCupomPDF(Number(route.params.id))
  } catch (e) {
    loadError.value = errorMessage(e)
  }
}
async function settle(payload: Record<string, unknown>) {
  const result = await run(
    () => VendaRepository.settle(Number(route.params.id), payload),
    'Recebimento e faturamento registrados.',
  )
  if (result) {
    action.value = null
    await load()
  }
}
async function reverse() {
  const result = await run(
    () => VendaRepository.reverse(Number(route.params.id)),
    'Faturamento estornado pelo domínio.',
  )
  if (result) {
    action.value = null
    await load()
  }
}
</script>
<template>
  <PageFrame>
    <Feedback :error="loadError || error" :loading="loading" :message="message" @retry="load" />
    <template v-if="sale">
      <PageHeader
        :title="sale.Uid || `Venda #${sale.id}`"
        :description="`Venda registrada em ${dateLabel(sale.data)}`"
        back="/modofacil/vendas"
        back-label="Vendas"
      >
        <template #actions>
          <button :disabled="loading" @click="receipt">
            <Download :size="15" />Baixar comprovante
          </button>
          <ModalAction
            v-if="!sale.faturado && sale.status !== 'FATURADO'"
            form="venda-editar"
            :params="{ id: sale.id }"
            ><Pencil :size="15" />Editar venda</ModalAction
          >
          <button
            v-if="!sale.faturado && !['FATURADO', 'CANCELADO'].includes(sale.status)"
            :disabled="busy || uncertain || loading"
            class="!border-primary !bg-primary !text-primary-foreground"
            @click="action = 'faturar'"
          >
            Registrar recebimento e faturar
          </button>
          <button
            v-if="sale.faturado || sale.status === 'FATURADO'"
            :disabled="busy || uncertain || loading"
            class="!border-red-500/30 !bg-red-500/10 !text-red-600 dark:!text-red-300"
            @click="action = 'estornar'"
          >
            Estornar faturamento
          </button>
          <DeleteRecord
            kind="sale"
            :record="sale"
            :disabled="loading || busy || uncertain"
            redirect="/modofacil/vendas"
        /></template>
      </PageHeader>
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :value="sale.status" /><span class="text-xs text-muted-foreground"
          >Venda #{{ sale.id }}</span
        >
      </div>
      <DetailMetrics label="Resumo da venda" :metrics="metrics" />
      <section
        class="rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="sale-info-title"
      >
        <h2 id="sale-info-title">Informações da venda</h2>
        <dl class="mf-info-grid">
          <div>
            <dt>Cliente</dt>
            <dd>
              <EntityLink kind="cliente" :record-id="sale.clienteId ?? sale.cliente?.id" :label="sale.cliente?.nome || 'Não informado'" />
            </dd>
          </div>
          <div>
            <dt>Vendedor</dt>
            <dd>{{ sale.vendedor?.nome || 'Não informado' }}</dd>
          </div>
          <div>
            <dt>Data da venda</dt>
            <dd>{{ dateLabel(sale.data) }}</dd>
          </div>
          <div>
            <dt>Garantia</dt>
            <dd>
              {{ Number(sale.garantia) > 0 ? `${sale.garantia} dia(s)` : 'Sem garantia informada' }}
            </dd>
          </div>
          <div v-if="sale.createdAt">
            <dt>Criada em</dt>
            <dd>{{ dateLabel(sale.createdAt) }}</dd>
          </div>
          <div v-if="sale.updatedAt">
            <dt>Última atualização</dt>
            <dd>{{ dateLabel(sale.updatedAt) }}</dd>
          </div>
          <div v-if="sale.caixaId">
            <dt>Caixa</dt>
            <dd>#{{ sale.caixaId }}</dd>
          </div>
        </dl>
        <div v-if="sale.observacoes" class="mt-4 border-t border-border pt-4">
          <h3 class="mb-1 text-xs font-medium text-muted-foreground">Observações</h3>
          <p class="!mb-0 whitespace-pre-wrap">{{ sale.observacoes }}</p>
        </div>
      </section>
      <section
        class="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="sale-items-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="sale-items-title" class="!mb-0">Itens da venda</h2>
            <small>{{ items.length }} linha(s) · produtos, serviços e combos</small>
          </div>
          <label class="w-full sm:w-64"
            ><span class="sr-only">Buscar itens da venda</span
            ><Input
              v-model="itemSearch"
              type="search"
              placeholder="Buscar itens da venda"
              aria-label="Buscar itens da venda"
          /></label>
        </div>
        <OperationItems :items="visibleItems" />
        <PageControls
          :loading="loading"
          v-if="filteredItems.length > 10"
          :page="itemPage"
          :pages="itemPages"
          :total="filteredItems.length"
          @change="itemPage = $event"
        />
      </section>
      <section
        class="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="sale-payment-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="sale-payment-title" class="!mb-0">Pagamento</h2>
          <StatusBadge v-if="payment" :value="payment.status" :label="paymentStatus" /><span
            v-else
            class="text-xs text-muted-foreground"
            >Sem pagamento registrado</span
          >
        </div>
        <p v-if="payment?.data" class="!mb-0 text-xs text-muted-foreground">
          Registrado em {{ dateLabel(payment.data) }}
        </p>
        <RecordsTable
          v-if="payments.length"
          :rows="payments"
          caption="Formas de pagamento da venda"
          :min-width="400"
          :columns="[
            { key: 'method', label: 'Forma de pagamento' },
            { key: 'value', label: 'Valor registrado', right: true },
          ]"
          ><template #method="{ row }">{{
            row.metodo === 'CREDIARIO' ? 'A prazo / crediário' : paymentLabel(row.metodo)
          }}</template
          ><template #value="{ row }"
            ><strong>{{ money(row.valor) }}</strong></template
          ></RecordsTable
        >
        <p v-else class="!mb-0 text-sm text-muted-foreground">
          As formas e os valores serão apresentados após o registro do pagamento.
        </p>
      </section>
      <section
        class="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="sale-finance-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="sale-finance-title" class="!mb-0">Financeiro vinculado</h2>
          <ModalAction
            v-if="
              hasPermission(ui.usuarioLogged, 3) && !['FATURADO', 'CANCELADO'].includes(sale.status)
            "
            form="financeiro-cobranca-nova"
            :query="{ tipo: 'venda', origem: sale.id }"
            >Criar cobrança vinculada</ModalAction
          >
        </div>
        <RecordsTable
          v-if="entries.length"
          :rows="entries"
          caption="Lançamentos vinculados à venda"
          :columns="[
            { key: 'name', label: 'Lançamento' },
            { key: 'status', label: 'Situação' },
            { key: 'total', label: 'Total', right: true },
            { key: 'pending', label: 'Em aberto', right: true },
          ]"
          ><template #name="{ row }"
            ><strong><EntityLink kind="lancamento" :record-id="row.id" :label="row.descricao || row.Uid || `Lançamento #${row.id}`" /></strong
            ><small v-if="row.parcelas">{{ row.parcelas.length }} parcela(s)</small></template
          ><template #status="{ row }"
            ><StatusBadge :value="row.status" /><StatusBadge
              v-if="row.ignorado"
              value="IGNORADO" /></template
          ><template #total="{ row }">{{ money(row.valorTotal) }}</template
          ><template #pending="{ row }">{{
            Array.isArray(row.parcelas) ? money(financeSummary(row).pending) : 'Não informado'
          }}</template
          ></RecordsTable
        >
        <p class="!mb-0 text-xs text-muted-foreground">
          {{
            entries.length
              ? 'Receba as parcelas pelo lançamento vinculado para manter o histórico da venda.'
              : 'Nenhum lançamento financeiro vinculado a esta venda.'
          }}
        </p>
      </section>
      <p
        v-if="uncertain"
        class="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"
      >
        Resultado incerto. Atualize a consulta para conferir o estado da venda antes de tentar
        novamente.
      </p>
    </template>
    <SettlementForm
      v-if="action === 'faturar' && sale"
      kind="VENDA"
      :total="Number(sale.valor)"
      :busy="busy"
      :uncertain="uncertain"
      :operation-error="error"
      @confirm="settle"
      @cancel="action = null"
    />
    <ModalDialog
      v-if="action === 'estornar' && sale"
      title="Confirmar estorno do faturamento"
      :busy="busy"
      :error="error"
      :uncertain="uncertain"
      danger
      @close="action = null"
    >
      <p>{{ sale.Uid }} · {{ money(sale.valor) }}</p>
      <p
        class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
      >
        O domínio retorna a venda para PENDENTE, remove o pagamento e os lançamentos financeiros
        vinculados e marca cobranças efetivadas como estornadas. Esta ação não é uma devolução de
        mercadoria nem restituição automática do gateway.
      </p>
      <template #footer>
        <button :disabled="busy" @click="action = null">Voltar</button
        ><button
          class="!border-red-600 !bg-red-600 !text-white hover:!bg-red-700"
          :disabled="busy || uncertain"
          @click="reverse"
        >
          Confirmar estorno do faturamento
        </button>
      </template>
    </ModalDialog>
  </PageFrame>
</template>
