<script setup lang="ts">
import FormBack from '../components/FormBack.vue'
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'

import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api } from '../adapters/domain'
import { decimal, errorMessage, money } from '../application/format'
import { validateItems } from '../application/items'
import { useFlow } from '../application/useFlow'
import { useConfirmation } from '../application/confirmation'
import { useDomainMutation } from '../application/useDomainMutation'
import ItemComposer, { type FlowItem } from '../components/ItemComposer.vue'
import ItemSearch from '../components/ItemSearch.vue'
import Feedback from '../components/Feedback.vue'
const confirmReload = useConfirmation()
const route = useFormContext(),
  os = route.meta.operation === 'os',
  id = Number(route.params.id),
  path = os ? `/modofacil/servicos/ordens/${id}/edicao` : `/modofacil/vendas/${id}/edicao`,
  back = os ? `/modofacil/servicos/ordens/${id}` : `/modofacil/vendas/${id}`,
  record = ref<any>(null),
  revision = ref(''),
  items = ref<FlowItem[]>([]),
  initialItems = ref(''),
  step = ref(1),
  loading = ref(false),
  loadError = ref(''),
  validation = ref(''),
  dirty = ref(false),
  done = ref(false),
  personName = ref(''),
  form = reactive({
    status: '',
    data: '',
    clienteId: null as number | null,
    notes: '',
    need: '',
    desconto: '0',
    garantia: '0',
  })
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
watch(
  items,
  () => {
    if (!loading.value) dirty.value = true
  },
  { deep: true },
)
const statuses = os
  ? ['ABERTA', 'ORCAMENTO', 'APROVADA', 'ANDAMENTO', 'CANCELADA']
  : ['ORCAMENTO', 'ANDAMENTO', 'FINALIZADO', 'PENDENTE', 'CANCELADO']
const total = computed(
  () =>
    items.value.reduce((s, i) => s + Number(i.preco) * Number(i.quantidade), 0) -
    Number(form.desconto.replace(',', '.')),
)
const locked = computed(
  () => record.value?.faturado || ['FATURADO', 'FATURADA'].includes(record.value?.status),
)
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await api.read(path)
    record.value = data.registro
    revision.value = data.revisao
    const row = record.value
    Object.assign(form, {
      status: row.status,
      data: String(row.data).slice(0, 10),
      clienteId: row.clienteId ?? null,
      notes: (os ? row.descricao : row.observacoes) || '',
      need: row.descricaoCliente || '',
      desconto: String(row.desconto || 0),
      garantia: String(row.garantia ?? 0),
    })
    items.value = [
      ...(os ? row.ItensOrdensServico : row.ItensVendas).map((i: any) => ({
        id: i.produtoId ?? i.servicoId,
        nome: i.itemName || 'Item',
        tipo: i.produtoId ? 'PRODUTO' : 'SERVICO',
        quantidade: Number(i.quantidade),
        preco: Number(i.valor),
      })),
      ...(row.ComboSaidas || []).map((i: any) => ({
        id: i.comboId,
        nome: i.nomeSnapshot,
        tipo: 'COMBO',
        quantidade: Number(i.quantidade),
        preco: Number(i.precoUnitarioSnapshot),
      })),
    ]
    initialItems.value = JSON.stringify(items.value)
    personName.value = row.clienteId ? `Pessoa #${row.clienteId}` : 'Não informada'
    if (row.clienteId) {
      try {
        personName.value = (await api.read(`/modofacil/pessoas/${row.clienteId}`)).nome
      } catch {
        /* The existing link remains intact if name lookup is unavailable. */
      }
    }
    dirty.value = false
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
function patch() {
  if (!record.value) throw new Error('Carregue a operação.')
  const row = record.value,
    body: Record<string, unknown> = { revisao: revision.value }
  if (form.status !== row.status) body.status = form.status
  if (form.data !== String(row.data).slice(0, 10))
    body.data = new Date(form.data + 'T12:00:00').toISOString()
  if (form.clienteId !== (row.clienteId ?? null)) {
    if (os && !form.clienteId) throw new Error('Escolha o cliente da OS.')
    body.clienteId = form.clienteId
  }
  if (form.notes !== ((os ? row.descricao : row.observacoes) || ''))
    body[os ? 'descricao' : 'observacoes'] = form.notes || null
  if (os && form.need !== (row.descricaoCliente || '')) body.descricaoCliente = form.need || null
  if (Number(form.desconto.replace(',', '.')) !== Number(row.desconto || 0))
    body.desconto = decimal(form.desconto)
  if (form.garantia !== String(row.garantia ?? 0)) body.garantia = decimal(form.garantia, 0)
  if (JSON.stringify(items.value) !== initialItems.value) {
    validateItems(items.value)
    body.itens = items.value.map((i) => ({
      id: i.id,
      tipo: i.tipo,
      nome: i.nome,
      quantidade: i.quantidade,
      [os ? 'valor' : 'preco']: i.preco,
    }))
  }
  if (Object.keys(body).length === 1) throw new Error('Nenhuma alteração para salvar.')
  return body
}
function next() {
  validation.value = ''
  try {
    if (step.value === 2) {
      patch()
      if (total.value < 0) throw new Error('O desconto não pode tornar o total negativo.')
    }
    step.value++
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
async function save() {
  validation.value = ''
  let body
  try {
    body = patch()
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const result = await run(
    () => api.patch(path, body),
    'Operação atualizada. Campos omitidos preservados; concorrência conferida pelo servidor.',
  )
  if (result) {
    done.value = true
    dirty.value = false
  }
}
async function reload() {
  if (
    !dirty.value ||
    (await confirmReload({
      title: 'Recarregar formulário?',
      description: 'Recarregar descarta as alterações deste formulário. Continuar?',
      confirmLabel: 'Recarregar',
      danger: true,
    }))
  )
    load()
}
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>{{ os ? 'Editar ordem de serviço' : 'Editar venda ou orçamento' }}</template
      ><template #back><FormBack :to="back">← Voltar aos detalhes</FormBack></template></PageHeader
    >
    <Feedback
      :loading="loading"
      :error="validation || loadError || error"
      :message="message"
      @retry="validation = ''"
    /><button v-if="error || loadError" type="button" :disabled="busy" @click="reload">
      Recarregar dados atuais
    </button>
    <p
      v-if="locked"
      class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
    >
      Esta operação está faturada. Faça o estorno pelo fluxo de domínio antes de editar.
    </p>
    <template v-if="record && !loading && !done && !locked"
      ><ol
        class="mf-steps my-5 flex list-none flex-wrap gap-1 border-b border-border p-0 [&>li]:border-b-2 [&>li]:border-transparent [&>li]:px-4 [&>li]:py-3 [&>li]:text-sm [&>li]:text-muted-foreground [&>[aria-current]]:border-blue-600 [&>[aria-current]]:font-medium [&>[aria-current]]:text-blue-600 dark:[&>[aria-current]]:text-blue-300"
      >
        <li
          v-for="(label, i) in ['Informações', 'Itens e valores', 'Revisão']"
          :key="label"
          :aria-current="step === i + 1 ? 'step' : undefined"
        >
          {{ i + 1 }}. {{ label }}
        </li>
      </ol>
      <div
        class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
        @input="dirty = true"
      >
        <fieldset :disabled="busy || uncertain" class="mf-stack grid gap-4">
          <section v-if="step === 1" class="mf-stack grid gap-4">
            <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
              <label
                >Situação<select v-model="form.status">
                  <option v-for="status in statuses" :key="status">{{ status }}</option>
                </select></label
              ><label>Data<Input v-model="form.data" type="date" /></label
              ><label
                >{{ os ? 'Descrição interna' : 'Observações'
                }}<Textarea v-model="form.notes" /></label
              ><label v-if="os">Necessidade do cliente<Textarea v-model="form.need" /></label
              ><label>Garantia em dias<Input v-model="form.garantia" inputmode="numeric" /></label>
            </div>
            <p>Cliente: {{ personName }}</p>
            <ItemSearch
              kind="PESSOA"
              @select="
                (row) => {
                  form.clienteId = row.id
                  personName = row.nome || ''
                  dirty = true
                }
              "
            /><button
              v-if="!os"
              type="button"
              @click="
                () => {
                  form.clienteId = null
                  personName = 'Não informada'
                  dirty = true
                }
              "
            >
              Remover cliente
            </button>
          </section>
          <section v-if="step === 2" class="mf-stack grid gap-4">
            <ItemComposer v-model="items" /><label
              >Desconto total<Input v-model="form.desconto" inputmode="decimal"
            /></label>
          </section>
          <ReviewPanel v-if="step === 3">
            <template #title>Confira antes de salvar</template>
            <p>{{ record.Uid }} · {{ form.status }} · {{ form.data }}</p>
            <p>Cliente: {{ personName }} · {{ form.notes }}</p>
            <ul>
              <li v-for="item in items" :key="`${item.tipo}-${item.id}`">
                {{ item.nome }} · {{ item.quantidade }} × {{ money(item.preco) }}
              </li>
            </ul>
            <p class="mf-value break-words text-2xl font-bold tracking-tight text-foreground">
              Total: {{ money(total) }}
            </p>
            <p
              class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
            >
              A revisão recebida na leitura acompanha o salvamento. Se outra sessão alterou o
              registro, o servidor recusará com conflito. Mudanças de itens/valores reutilizam uma
              única transação do domínio.
            </p>
            <p
              v-if="['CANCELADO', 'CANCELADA'].includes(form.status)"
              class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
            >
              Mudar a situação para cancelada não realiza devolução de mercadoria nem restituição
              por gateway. Os movimentos de estoque existentes são preservados conforme o domínio.
            </p>
          </ReviewPanel>
          <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
            <button v-if="step > 1" @click="step--">Voltar</button
            ><button
              v-if="step < 3"
              class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
              @click="next"
            >
              Continuar</button
            ><button
              v-else
              class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
              @click="save"
            >
              {{ busy ? 'Salvando…' : 'Salvar alterações revisadas' }}
            </button>
          </div>
        </fieldset>
      </div></template
    >
  </PageFrame>
</template>
