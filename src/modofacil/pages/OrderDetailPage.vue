<script setup lang="ts">
import EntityLink from '@/components/navigation/EntityLink.vue'
import ModalAction from '../components/ModalAction.vue'
import { Textarea } from '@/components/ui/textarea'

import OperationItems from '../components/OperationItems.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import ModalDialog from '../components/ModalDialog.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api, OrdensServicoRepository } from '../adapters/domain'
import { money, quantity, dateLabel, errorMessage } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
import SettlementForm from '../components/SettlementForm.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageControls from '../components/PageControls.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import { Input } from '@/components/ui/input'
import { Download, Pencil, Plus, MessageSquare, CalendarDays, Receipt } from 'lucide-vue-next'
import { operationItems, orderAmounts, detailSearch } from '../application/detailRecords'
import type { Row } from '../adapters/domain'
const ui = useUiStore(),
  note = ref(''),
  noteReview = ref(false),
  noteError = ref(''),
  downloading = ref(false)
const route = useRoute(),
  order = ref<any>(null),
  loading = ref(false),
  loadError = ref(''),
  action = ref<'faturar' | 'estornar' | null>(null)
const noteOpen = ref(false)
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(
  computed(() => !!note.value || action.value !== null),
  busy,
)
const itemSearch = ref(''),
  itemPage = ref(1),
  historySearch = ref(''),
  historyPage = ref(1),
  chargePage = ref(1)
const items = computed(() =>
  operationItems(order.value?.ItensOrdensServico || [], order.value?.ComboSaidas || []),
)
const amounts = computed(() => orderAmounts(order.value || {}))
const subtotal = computed(() => amounts.value.subtotal)
const total = computed(() => amounts.value.total)
const filteredItems = computed(() =>
  items.value.filter((item) =>
    detailSearch(
      item.itemName || item.produto?.nome || item.servico?.nome || item.nome || '',
    ).includes(detailSearch(itemSearch.value)),
  ),
)
const itemPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / 10)))
const visibleItems = computed(() =>
  filteredItems.value.slice((itemPage.value - 1) * 10, itemPage.value * 10),
)
const history = computed<Row[]>(() =>
  [...(order.value?.MensagensInteracoesOrdemServico || [])].sort(
    (a, b) =>
      new Date(b.data || b.createdAt || 0).getTime() -
        new Date(a.data || a.createdAt || 0).getTime() || b.id - a.id,
  ),
)
const filteredHistory = computed(() =>
  history.value.filter((item) =>
    detailSearch(`${item.mensagem || ''} ${item.Autor?.nome || ''}`).includes(
      detailSearch(historySearch.value),
    ),
  ),
)
const historyPages = computed(() => Math.max(1, Math.ceil(filteredHistory.value.length / 10)))
const visibleHistory = computed(() =>
  filteredHistory.value.slice((historyPage.value - 1) * 10, historyPage.value * 10),
)
const charges = computed<Row[]>(() => order.value?.CobrancasFinanceiras || [])
const chargePages = computed(() => Math.max(1, Math.ceil(charges.value.length / 10)))
const visibleCharges = computed(() =>
  charges.value.slice((chargePage.value - 1) * 10, chargePage.value * 10),
)
const canFinance = computed(() => hasPermission(ui.usuarioLogged, 3))
const metrics = computed(() => [
  {
    label: 'Total da OS',
    value: money(total.value),
    hint: 'Valor após o desconto',
    tone: 'text-primary',
  },
  {
    label: 'Subtotal dos itens',
    value: money(subtotal.value),
    hint: 'Produtos, serviços e combos',
  },
  { label: 'Desconto', value: money(order.value?.desconto ?? 0), hint: 'Aplicado ao atendimento' },
  {
    label: 'Quantidade de itens',
    value: quantity(items.value.reduce((sum, item) => sum + Number(item.quantidade), 0)),
    hint: `${items.value.length} linha(s) na ordem`,
  },
])
const historyType: Record<string, string> = {
  ABERTURA: 'Abertura',
  MENSAGEM: 'Nota interna',
  ENCERRAMENTO: 'Encerramento',
}
function dateTime(value?: string) {
  if (!value) return 'Data não informada'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Data não informada'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
const warranty = computed(() => {
  const value = order.value?.garantia
  if (value == null || String(value).trim() === '' || Number(value) === 0)
    return 'Sem garantia informada'
  return /^\d+$/.test(String(value)) ? `${value} dia(s)` : String(value)
})
watch(itemSearch, () => (itemPage.value = 1))
watch(historySearch, () => (historyPage.value = 1))
watch(itemPages, (pages) => (itemPage.value = Math.min(itemPage.value, pages)))
watch(historyPages, (pages) => (historyPage.value = Math.min(historyPage.value, pages)))
watch(chargePages, (pages) => (chargePage.value = Math.min(chargePage.value, pages)))
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const result = await OrdensServicoRepository.getDetalhes(Number(route.params.id))
    if (!result?.id) throw new Error('Ordem de serviço não encontrada.')
    order.value = result
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
async function pdf() {
  if (downloading.value || !order.value) return
  downloading.value = true
  try {
    await OrdensServicoRepository.getOsPdf(Number(route.params.id), order.value.Uid, false, true)
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    downloading.value = false
  }
}
async function settle(payload: Record<string, unknown>) {
  const result = await run(
    () => OrdensServicoRepository.settle(Number(route.params.id), payload),
    'OS faturada pelo domínio.',
  )
  if (result) {
    action.value = null
    await load()
  }
}
function closeNote() {
  noteOpen.value = false
  note.value = ''
  noteReview.value = false
  noteError.value = ''
}
function validateNote() {
  noteError.value = ''
  if (!note.value.trim() || note.value.trim().length > 191) {
    noteError.value = 'Escreva uma nota de 1 a 191 caracteres.'
    return false
  }
  return true
}
function reviewNote() {
  if (validateNote()) noteReview.value = true
}
async function saveNote() {
  if (!validateNote()) return
  const result = await run(
    () =>
      api.post(`/modofacil/servicos/ordens/${order.value.id}/mensagens`, {
        mensagem: note.value.trim(),
      }),
    'Nota adicionada ao histórico da OS.',
  )
  if (result) {
    note.value = ''
    noteOpen.value = false
    noteReview.value = false
    historySearch.value = ''
    historyPage.value = 1
    await load()
  }
}
async function reverse() {
  const result = await run(
    () => OrdensServicoRepository.reverse(Number(route.params.id)),
    'Faturamento estornado; OS retornou a APROVADA.',
  )
  if (result) {
    action.value = null
    await load()
  }
}
</script>
<template>
  <PageFrame>
    <Feedback :loading="loading" :error="loadError || error" :message="message" @retry="load" />
    <template v-if="order">
      <PageHeader
        :title="order.Uid || `OS #${order.id}`"
        :description="`Ordem de serviço · ${dateLabel(order.data)}`"
        back="/modofacil/servicos/ordens"
        back-label="Ordens de serviço"
      >
        <template #actions>
          <button :disabled="loading || downloading" @click="pdf">
            <Download :size="15" />{{ downloading ? 'Preparando PDF…' : 'Baixar ordem em PDF' }}
          </button>
          <ModalAction
            v-if="order.status !== 'FATURADA'"
            form="ordem-editar"
            :params="{ id: order.id }"
            :disabled="loading || busy"
            ><Pencil :size="15" />Editar ordem</ModalAction
          >
          <button
            v-if="!['FATURADA', 'CANCELADA'].includes(order.status)"
            :disabled="busy || uncertain || loading"
            class="!border-primary !bg-primary !text-primary-foreground"
            @click="action = 'faturar'"
          >
            Registrar recebimento e faturar
          </button>
          <button
            v-if="order.status === 'FATURADA'"
            :disabled="busy || uncertain || loading"
            class="!border-red-500/30 !bg-red-500/10 !text-red-600 dark:!text-red-300"
            @click="action = 'estornar'"
          >
            Estornar faturamento
          </button>
        </template>
      </PageHeader>
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :value="order.status" /><span class="text-xs text-muted-foreground"
          >Ordem #{{ order.id }}</span
        >
      </div>
      <DetailMetrics label="Resumo da ordem de serviço" :metrics="metrics" />
      <section
        class="rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="order-info-title"
      >
        <h2 id="order-info-title">Informações do atendimento</h2>
        <dl class="mf-info-grid">
          <div>
            <dt>Cliente</dt>
            <dd>
              <EntityLink kind="cliente" :record-id="order.clienteId ?? order.Cliente?.id" :label="order.Cliente?.nome || 'Não informado'" />
            </dd>
          </div>
          <div>
            <dt>Responsável</dt>
            <dd>{{ order.Operador?.nome || 'Não informado' }}</dd>
          </div>
          <div>
            <dt>Data da ordem</dt>
            <dd>{{ dateLabel(order.data) }}</dd>
          </div>
          <div>
            <dt>Garantia</dt>
            <dd>{{ warranty }}</dd>
          </div>
          <div v-if="order.createdAt">
            <dt>Criada em</dt>
            <dd>{{ dateTime(order.createdAt) }}</dd>
          </div>
          <div v-if="order.updatedAt">
            <dt>Última atualização</dt>
            <dd>{{ dateTime(order.updatedAt) }}</dd>
          </div>
        </dl>
        <div class="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
          <div>
            <h3 class="mb-2 text-xs font-medium text-muted-foreground">Necessidade do cliente</h3>
            <p class="!mb-0 whitespace-pre-wrap">
              {{ order.descricaoCliente || 'Nenhuma necessidade registrada.' }}
            </p>
          </div>
          <div>
            <h3 class="mb-2 text-xs font-medium text-muted-foreground">Descrição do atendimento</h3>
            <p class="!mb-0 whitespace-pre-wrap">
              {{ order.descricao || 'Nenhuma descrição registrada.' }}
            </p>
          </div>
        </div>
      </section>
      <section
        class="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="order-items-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="order-items-title" class="!mb-0">Itens da ordem</h2>
            <small>{{ filteredItems.length }} de {{ items.length }} linha(s)</small>
          </div>
          <label class="w-full sm:w-64"
            ><span class="sr-only">Buscar itens da OS</span
            ><Input
              v-model="itemSearch"
              type="search"
              placeholder="Buscar itens da ordem"
              aria-label="Buscar itens da OS"
          /></label>
        </div>
        <OperationItems
          :items="visibleItems"
          caption="Itens da ordem de serviço"
          :empty="
            itemSearch ? 'Nenhum item encontrado para esta busca.' : 'Esta ordem não possui itens.'
          "
        />
        <PageControls
          v-if="filteredItems.length > 10"
          :page="itemPage"
          :pages="itemPages"
          :total="filteredItems.length"
          :loading="loading"
          @change="itemPage = $event"
        />
      </section>
      <section
        v-if="canFinance"
        class="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="order-charges-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="order-charges-title" class="!mb-0">Cobranças vinculadas</h2>
            <small>{{ charges.length }} cobrança(s) nesta ordem</small>
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink to="/modofacil/financeiro/cobrancas" class="mf-button"
              ><Receipt :size="15" />Gerenciar cobranças</RouterLink
            ><ModalAction
              v-if="!['FATURADA', 'CANCELADA'].includes(order.status)"
              form="financeiro-cobranca-nova"
              :query="{ tipo: 'os', origem: order.id }"
              :disabled="busy || loading || uncertain"
              ><Plus :size="15" />Criar cobrança vinculada</ModalAction
            >
          </div>
        </div>
        <RecordsTable
          v-if="charges.length"
          :rows="visibleCharges"
          caption="Cobranças da ordem de serviço"
          :columns="[
            { key: 'code', label: 'Cobrança' },
            { key: 'status', label: 'Situação' },
            { key: 'value', label: 'Valor', right: true },
            { key: 'due', label: 'Vencimento' },
          ]"
          ><template #code="{ row }"
            ><strong>{{ row.Uid || `Cobrança #${row.id}` }}</strong
            ><small v-if="row.tipo">{{ row.tipo }}</small></template
          ><template #status="{ row }"><StatusBadge :value="row.status" /></template
          ><template #value="{ row }"
            ><strong>{{ money(row.valor) }}</strong></template
          ><template #due="{ row }">{{ dateLabel(row.dataVencimento) }}</template></RecordsTable
        >
        <p v-else class="!mb-0 text-sm text-muted-foreground">
          Nenhuma cobrança vinculada a esta ordem.
        </p>
        <PageControls
          v-if="charges.length > 10"
          :page="chargePage"
          :pages="chargePages"
          :total="charges.length"
          :loading="loading"
          @change="chargePage = $event"
        />
      </section>
      <section
        class="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="order-history-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="order-history-title" class="!mb-0">Histórico da OS</h2>
            <small>{{ history.length }} atualização(ões) · mais recentes primeiro</small>
          </div>
          <button type="button" :disabled="busy || uncertain || loading" @click="noteOpen = true">
            <Plus :size="15" />Adicionar nota interna
          </button>
        </div>
        <label class="block sm:max-w-sm"
          ><span class="sr-only">Buscar no histórico da OS</span
          ><Input
            v-model="historySearch"
            type="search"
            placeholder="Buscar mensagem ou autor"
            aria-label="Buscar no histórico da OS"
        /></label>
        <ol
          v-if="visibleHistory.length"
          aria-label="Atualizações da ordem de serviço"
          class="list-none divide-y divide-border"
        >
          <li
            v-for="item in visibleHistory"
            :key="item.id"
            class="flex min-w-0 gap-3 py-4 first:pt-0 last:pb-0"
          >
            <span
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              ><MessageSquare :size="15" aria-hidden="true"
            /></span>
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <strong class="text-sm">{{ item.Autor?.nome || 'Equipe' }}</strong
                  ><span
                    class="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >{{ historyType[item.tipo] || 'Nota interna' }}</span
                  >
                </div>
                <span class="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                  ><CalendarDays :size="12" aria-hidden="true" />{{
                    dateTime(item.data || item.createdAt)
                  }}</span
                >
              </div>
              <p class="!mb-0 whitespace-pre-wrap break-words text-sm">{{ item.mensagem }}</p>
            </div>
          </li>
        </ol>
        <p
          v-else
          class="!mb-0 rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground"
        >
          {{
            historySearch
              ? 'Nenhuma atualização encontrada para esta busca.'
              : 'Nenhuma atualização registrada nesta ordem.'
          }}
        </p>
        <PageControls
          v-if="filteredHistory.length > 10"
          :page="historyPage"
          :pages="historyPages"
          :total="filteredHistory.length"
          :loading="loading"
          @change="historyPage = $event"
        />
      </section>
      <ModalDialog
        v-if="noteOpen"
        title="Adicionar nota interna"
        :description="order.Uid || `OS #${order.id}`"
        :busy="busy"
        :error="noteError || error"
        :uncertain="uncertain"
        @close="closeNote"
      >
        <form @submit.prevent="noteReview ? saveNote() : reviewNote()">
          <fieldset :disabled="busy || uncertain" class="space-y-4">
            <label v-if="!noteReview"
              >Nota interna<Textarea
                v-model="note"
                placeholder="Registre uma atualização ou observação interna"
                maxlength="191"
                :rows="4"
                required
              /><small
                >{{ note.length }}/191 caracteres · Visível no histórico interno da ordem.</small
              ></label
            ><ReviewPanel v-else title="Confira a nota antes de registrar"
              ><p class="!mb-0 whitespace-pre-wrap">{{ note.trim() }}</p>
              <small
                >Esta atualização será registrada no histórico interno da OS.</small
              ></ReviewPanel
            >
            <div class="mf-form-actions">
              <button v-if="!noteReview" type="button" @click="closeNote">Cancelar</button
              ><button v-else type="button" @click="noteReview = false">Voltar</button
              ><button class="!border-primary !bg-primary !text-primary-foreground">
                {{ busy ? 'Salvando…' : noteReview ? 'Confirmar nota interna' : 'Conferir nota' }}
              </button>
            </div>
          </fieldset>
        </form>
      </ModalDialog>
    </template>
    <SettlementForm
      v-if="order && action === 'faturar'"
      kind="OS"
      :total="total"
      :busy="busy"
      :uncertain="uncertain"
      :operation-error="error"
      @confirm="settle"
      @cancel="action = null"
    />
    <ModalDialog
      v-if="order && action === 'estornar'"
      title="Confirmar estorno do faturamento"
      :busy="busy"
      :error="error"
      :uncertain="uncertain"
      danger
      @close="action = null"
    >
      <p>{{ order.Uid }} · {{ money(total) }}.</p>
      <p
        class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
      >
        O domínio remove a receita de faturamento correspondente e retorna a OS para APROVADA.
        Cobranças ativas precisam ser regularizadas antes. Não é devolução de materiais nem
        restituição automática do gateway.
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
