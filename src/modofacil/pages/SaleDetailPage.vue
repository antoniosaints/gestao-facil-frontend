<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import OperationItems from '../components/OperationItems.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import ModalDialog from '../components/ModalDialog.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, VendaRepository, type Row } from '../adapters/domain'
import { money, quantity, errorMessage, dateLabel } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import SettlementForm from '../components/SettlementForm.vue'
import Feedback from '../components/Feedback.vue'
const route = useRoute(),
  ui = useUiStore(),
  sale = ref<Row | null>(null),
  loading = ref(false),
  loadError = ref(''),
  action = ref<'faturar' | 'estornar' | null>(null)
const { busy, error, message, uncertain, run } = useDomainMutation()
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    sale.value = await api.read(`/modofacil/vendas/${Number(route.params.id)}`)
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
    <RouterLink to="/modofacil/vendas">← Vendas</RouterLink
    ><Feedback :error="loadError || error" :loading="loading" :message="message" @retry="load" />
    <section
      v-if="sale"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    >
      <div class="space-y-3 border-b border-border pb-4">
        <PageHeader
          ><template #title>{{ sale.Uid || `Venda #${sale.id}` }}</template></PageHeader
        >
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge :value="sale.status" /><span class="text-xs text-muted-foreground">{{
            dateLabel(sale.data)
          }}</span>
        </div>
      </div>

      <dl>
        <dt>Cliente</dt>
        <dd>{{ sale.cliente?.nome || 'Não informado' }}</dd>
        <dt>Total</dt>
        <dd>{{ money(sale.valor) }}</dd>
        <dt>Pagamento</dt>
        <dd>
          {{ sale.PagamentoVendas?.metodo || 'Sem pagamento registrado' }} ·
          {{ sale.PagamentoVendas?.status }}
        </dd>
      </dl>
      <ul v-if="Array.isArray(sale.PagamentoVendas?.detalhes)">
        <li v-for="(payment, i) in sale.PagamentoVendas.detalhes" :key="i">
          {{ payment.metodo }} · {{ money(payment.valor) }}
        </li>
      </ul>
      <ModalAction
        v-if="!sale.faturado && sale.status !== 'FATURADO'"
        form="venda-editar"
        :params="{ id: sale.id }"
        >Editar itens, informações ou situação</ModalAction
      >
      <h2>Itens</h2>
      <OperationItems :items="sale.ItensVendas || []" />
      <ModalAction
        v-if="
          hasPermission(ui.usuarioLogged, 3) && !['FATURADO', 'CANCELADO'].includes(sale.status)
        "
        form="financeiro-cobranca-nova"
        :query="{ tipo: 'venda', origem: sale.id }"
        >Criar cobrança vinculada</ModalAction
      >
      <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
        <button @click="receipt">Baixar comprovante</button
        ><button
          v-if="!sale.faturado && sale.status !== 'CANCELADO'"
          :disabled="busy || uncertain"
          class="!border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
          @click="action = 'faturar'"
        >
          Registrar recebimento e faturar</button
        ><button
          v-if="sale.faturado || sale.status === 'FATURADO'"
          :disabled="busy || uncertain"
          class="mf-danger !border-red-500/30 !bg-red-500/10 !text-red-600 dark:!text-red-300 hover:!bg-red-500/15"
          @click="action = 'estornar'"
        >
          Estornar faturamento
        </button>
      </div>
      <section v-if="sale.LancamentoFinanceiro?.length">
        <h2>Financeiro vinculado</h2>
        <ul>
          <li v-for="entry in sale.LancamentoFinanceiro" :key="entry.id">
            <RouterLink
              v-if="hasPermission(ui.usuarioLogged, 3)"
              :to="`/modofacil/financeiro/lancamentos/${entry.id}`"
              >{{ entry.descricao || entry.Uid }} · {{ money(entry.valorTotal) }}</RouterLink
            ><span v-else>{{ entry.status }}</span>
          </li>
        </ul>
        <p>Receba parcelas existentes pelo vínculo, sem criar uma segunda receita.</p>
      </section>
      <p
        v-if="uncertain"
        class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
      >
        Resultado incerto. A consulta pode ser atualizada; nenhuma operação será reenviada
        automaticamente.
      </p>
    </section>
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
