<script setup lang="ts">
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'

import ModalDialog from '../components/ModalDialog.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { api, type Row } from '../adapters/domain'
import { money, dateLabel, errorMessage } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import Feedback from '../components/Feedback.vue'
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
      >Buscar por código, situação ou valor<Input v-model="search" @input="page = 1"
    /></label>
    <p>{{ matches.length }} cobrança(s). Lista integral recebida do servidor; navegação local.</p>
    <ul class="mf-list m-0 grid list-none gap-3 p-0">
      <li
        v-for="row in visible"
        :key="row.id"
        class="mf-row flex flex-wrap items-center justify-between gap-4 break-words rounded-[6px] border border-border p-4 [&>div]:min-w-0 min-w-0 bg-card"
      >
        <div>
          <strong>{{ row.Uid }} · {{ money(row.valor) }}</strong>
          <p>{{ row.status }} · vence {{ dateLabel(row.dataVencimento) }}</p>
          <a
            v-if="row.externalLink && /^https?:\/\//.test(row.externalLink)"
            :href="row.externalLink"
            target="_blank"
            rel="noopener noreferrer"
            >Abrir link da cobrança</a
          >
          <details v-if="row.pixCopiaCola">
            <summary>Código PIX</summary>
            <Textarea readonly :value="row.pixCopiaCola" aria-label="PIX copia e cola" />
          </details>
          <RouterLink v-if="row.vendaId" :to="`/modofacil/vendas/${row.vendaId}`"
            >Venda vinculada</RouterLink
          ><RouterLink
            v-if="row.ordemServicoId"
            :to="`/modofacil/servicos/ordens/${row.ordemServicoId}`"
            >OS vinculada</RouterLink
          >
        </div>
        <button
          v-if="['PENDENTE', 'ATRASADO'].includes(row.status)"
          :disabled="busy || uncertain"
          @click="
            () => {
              selected = row
              action = 'cancelar'
            }
          "
        >
          Cancelar cobrança</button
        ><button
          v-if="row.status === 'PAGO'"
          class="mf-danger !border-red-500/30 !bg-red-500/10 !text-red-600 dark:!text-red-300 hover:!bg-red-500/15"
          :disabled="busy || uncertain"
          @click="
            () => {
              selected = row
              action = 'estornar'
            }
          "
        >
          Estornar no gateway
        </button>
      </li>
    </ul>
    <nav class="mf-actions my-4 flex flex-wrap items-end gap-3" aria-label="Páginas de cobranças">
      <button :disabled="page <= 1" @click="page--">Anterior</button
      ><span>{{ page }} de {{ pages }}</span
      ><button :disabled="page >= pages" @click="page++">Próxima</button>
    </nav>
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
