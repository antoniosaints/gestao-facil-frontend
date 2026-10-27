<script setup lang="ts">
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'

import ModalDialog from '../components/ModalDialog.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import RecordsTable from '../components/RecordsTable.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PageControls from '../components/PageControls.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { api, type Row } from '../adapters/domain'
import { money, dateLabel, errorMessage } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import Feedback from '../components/Feedback.vue'
const pix = ref<Row | null>(null)
const rows = ref<Row[]>([]),
  selected = ref<Row | null>(null),
  action = ref('cancelar'),
  search = ref(''),
  page = ref(1),
  loading = ref(false),
  loadError = ref('')
const { busy, error, message, uncertain, run } = useDomainMutation()
const matches = computed(() =>
    rows.value.filter((r) =>
      `${r.Uid} ${r.status} ${r.valor}`.toLowerCase().includes(search.value.toLowerCase()),
    ),
  ),
  pages = computed(() => Math.max(1, Math.ceil(matches.value.length / 12))),
  visible = computed(() => matches.value.slice((page.value - 1) * 12, page.value * 12))
watch(pages, (value) => (page.value = Math.min(page.value, value)))
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = await api.read('/modofacil/financeiro/cobrancas')
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
function choose(row: Row, next: 'cancelar' | 'estornar') {
  selected.value = row
  action.value = next
}
async function confirm() {
  const result = await run(
    () =>
      api.post(`/modofacil/financeiro/cobrancas/${action.value}`, {
        cobrancaId: selected.value!.id,
      }),
    'Operação da cobrança registrada.',
  )
  if (result) {
    selected.value = null
    await load()
  }
}
</script>
<template>
  <PageFrame>
    <PageHeader
      ><template #title>Cobranças</template
      ><template #back
        ><RouterLink to="/modofacil/financeiro">← Dinheiro</RouterLink></template
      ></PageHeader
    >

    <p>Para criar, abra a venda, OS ou parcela pendente que dará origem à cobrança.</p>
    <Feedback
      :loading="loading"
      :error="loadError || error"
      :message="message"
      @retry="load"
    /><label
      >Buscar por código, situação ou valor<Input
        placeholder="Buscar por código, situação ou valor"
        v-model="search"
        @input="page = 1"
    /></label>
    <p class="text-xs text-muted-foreground">{{ matches.length }} cobrança(s) encontrada(s).</p>
    <RecordsTable
      :rows="visible"
      :loading="loading"
      :failed="!!loadError"
      caption="Cobranças financeiras"
      empty="Nenhuma cobrança encontrada."
      :columns="[
        { key: 'code', label: 'Cobrança' },
        { key: 'status', label: 'Situação' },
        { key: 'value', label: 'Valor', right: true },
        { key: 'due', label: 'Vencimento' },
        { key: 'origin', label: 'Vínculo' },
        { key: 'actions', label: 'Ações', right: true },
      ]"
    >
      <template #code="{ row }"
        ><strong>{{ row.Uid || `Cobrança #${row.id}` }}</strong></template
      >
      <template #status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #value="{ row }">{{ money(row.valor) }}</template>
      <template #due="{ row }">{{ dateLabel(row.dataVencimento) }}</template>
      <template #origin="{ row }"
        ><RouterLink v-if="row.vendaId" :to="`/modofacil/vendas/${row.vendaId}`"
          >Venda #{{ row.vendaId }}</RouterLink
        ><RouterLink
          v-else-if="row.ordemServicoId"
          :to="`/modofacil/servicos/ordens/${row.ordemServicoId}`"
          >OS #{{ row.ordemServicoId }}</RouterLink
        ><span v-else>{{ row.parcelaId ? `Parcela #${row.parcelaId}` : '—' }}</span></template
      >
      <template #actions="{ row }"
        ><div class="flex flex-wrap gap-2 md:justify-end">
          <a
            v-if="row.externalLink && /^https?:\/\//.test(row.externalLink)"
            class="mf-button"
            :href="row.externalLink"
            target="_blank"
            rel="noopener noreferrer"
            >Abrir cobrança</a
          >
          <button v-if="row.pixCopiaCola" @click="pix = row">Código Pix</button>
          <button
            v-if="['PENDENTE', 'ATRASADO'].includes(row.status)"
            :disabled="busy || uncertain"
            @click="choose(row, 'cancelar')"
          >
            Cancelar cobrança
          </button>
          <button
            v-if="row.status === 'PAGO'"
            class="!text-destructive"
            :disabled="busy || uncertain"
            @click="choose(row, 'estornar')"
          >
            Estornar no gateway
          </button>
        </div></template
      >
    </RecordsTable>
    <PageControls
      :page="page"
      :pages="pages"
      :total="matches.length"
      :loading="loading"
      @change="page = $event"
    />
    <ModalDialog
      v-if="pix"
      title="Código Pix da cobrança"
      :description="`${pix.Uid || `Cobrança #${pix.id}`} · ${money(pix.valor)}`"
      @close="pix = null"
    >
      <label
        >Pix copia e cola<Textarea
          :model-value="pix.pixCopiaCola"
          readonly
          placeholder="O código Pix aparecerá aqui"
      /></label>
      <template #footer><button @click="pix = null">Fechar</button></template>
    </ModalDialog>
    <ModalDialog
      v-if="selected"
      :title="action === 'cancelar' ? 'Cancelar cobrança' : 'Solicitar estorno no gateway'"
      :busy="busy"
      :error="error"
      :uncertain="uncertain"
      danger
      @close="selected = null"
    >
      <p>{{ selected.Uid }} · {{ money(selected.valor) }}.</p>
      <p
        class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
      >
        Esta ação se comunica com o gateway e pode cancelar a cobrança ou restituir dinheiro.
        Confira o vínculo antes de confirmar. Não registra pagamento ou movimentação de estoque
        extra.
      </p>
      <template #footer>
        <button :disabled="busy" @click="selected = null">Voltar</button
        ><button
          class="!border-red-600 !bg-red-600 !text-white hover:!bg-red-700"
          :disabled="busy || uncertain"
          @click="confirm"
        >
          Confirmar {{ action === 'cancelar' ? 'cancelamento' : 'estorno' }} no gateway
        </button>
      </template>
    </ModalDialog>
  </PageFrame>
</template>
