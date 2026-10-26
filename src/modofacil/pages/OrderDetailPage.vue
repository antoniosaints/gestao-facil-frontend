<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Textarea } from '@/components/ui/textarea'

import OperationItems from '../components/OperationItems.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import ModalDialog from '../components/ModalDialog.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api, OrdensServicoRepository } from '../adapters/domain'
import { money, quantity, errorMessage } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
import SettlementForm from '../components/SettlementForm.vue'
const ui = useUiStore(),
  note = ref(''),
  noteReview = ref(false)
const route = useRoute(),
  order = ref<any>(null),
  loading = ref(false),
  loadError = ref(''),
  action = ref<'faturar' | 'estornar' | null>(null)
const noteOpen = ref(false)
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(computed(() => !!note.value || action.value !== null))
const total = computed(() =>
  order.value
    ? order.value.ItensOrdensServico.reduce(
        (s: number, i: any) => s + Number(i.quantidade) * Number(i.valor),
        0,
      ) - Number(order.value.desconto || 0)
    : 0,
)
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    order.value = await OrdensServicoRepository.getDetalhes(Number(route.params.id))
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
async function pdf() {
  try {
    await OrdensServicoRepository.getOsPdf(Number(route.params.id), order.value.Uid, false, true)
  } catch (e) {
    loadError.value = errorMessage(e)
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
}
async function saveNote() {
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
    <RouterLink to="/modofacil/servicos/ordens">← Ordens de serviço</RouterLink
    ><Feedback :loading="loading" :error="loadError || error" :message="message" @retry="load" />
    <section
      v-if="order"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    >
      <div class="space-y-3 border-b border-border pb-4">
        <PageHeader
          ><template #title>{{ order.Uid || `OS #${order.id}` }}</template></PageHeader
        >
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge :value="order.status" /><span class="text-xs text-muted-foreground">{{
            order.Cliente?.nome || 'Cliente não informado'
          }}</span>
        </div>
      </div>

      <dl>
        <dt>Necessidade</dt>
        <dd>{{ order.descricaoCliente || '—' }}</dd>
        <dt>Descrição</dt>
        <dd>{{ order.descricao || '—' }}</dd>
        <dt>Responsável</dt>
        <dd>{{ order.Operador?.nome || '—' }}</dd>
      </dl>
      <OperationItems :items="order.ItensOrdensServico || []" />
      <ModalAction v-if="order.status !== 'FATURADA'" form="ordem-editar" :params="{ id: order.id }"
        >Editar itens, informações ou situação</ModalAction
      >
      <p class="mf-value break-words text-2xl font-bold tracking-tight text-foreground">
        Total: {{ money(total) }}
      </p>
      <ModalAction
        v-if="
          hasPermission(ui.usuarioLogged, 3) && !['FATURADA', 'CANCELADA'].includes(order.status)
        "
        form="financeiro-cobranca-nova"
        :query="{ tipo: 'os', origem: order.id }"
        >Criar cobrança vinculada</ModalAction
      >
      <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
        <button @click="pdf">Baixar ordem em PDF</button
        ><button
          v-if="!['FATURADA', 'CANCELADA'].includes(order.status)"
          :disabled="busy || uncertain"
          class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          @click="action = 'faturar'"
        >
          Registrar recebimento e faturar</button
        ><button
          v-if="order.status === 'FATURADA'"
          :disabled="busy || uncertain"
          class="mf-danger !border-red-500/30 !bg-red-500/10 !text-red-600 dark:!text-red-300 hover:!bg-red-500/15"
          @click="action = 'estornar'"
        >
          Estornar faturamento
        </button>
      </div>
    </section>
    <section
      v-if="order"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    >
      <h2>Histórico da OS</h2>
      <ul class="mf-list m-0 grid list-none gap-3 p-0">
        <li v-for="item in order.MensagensInteracoesOrdemServico" :key="item.id">
          <strong>{{ item.Autor?.nome || 'Equipe' }}</strong> · {{ item.mensagem }}
        </li>
      </ul>
      <button type="button" :disabled="busy || uncertain" @click="noteOpen = true">
        Adicionar nota interna
      </button>
      <ModalDialog
        v-if="noteOpen"
        title="Adicionar nota interna"
        :busy="busy"
        :error="error"
        :uncertain="uncertain"
        @close="closeNote"
      >
        <form @submit.prevent="noteReview ? saveNote() : (noteReview = true)">
          <fieldset :disabled="busy || uncertain">
            <label v-if="!noteReview"
              >Adicionar nota interna<Textarea v-model="note" maxlength="191" required />
            </label>
            <p v-else>{{ note }} · Será registrada no histórico interno desta OS.</p>
            <div
              class="mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
            >
              <button v-if="noteReview" type="button" @click="noteReview = false">Voltar</button
              ><button>
                {{ busy ? 'Salvando…' : noteReview ? 'Confirmar nota interna' : 'Conferir nota' }}
              </button>
            </div>
          </fieldset>
        </form>
      </ModalDialog>
    </section>
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
