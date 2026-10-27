<script setup lang="ts">
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Input } from '@/components/ui/input'

import { Textarea } from '@/components/ui/textarea'

import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import SuccessPanel from '../components/SuccessPanel.vue'
import { ref, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { OrdensServicoRepository, type Row } from '../adapters/domain'
import { today, decimal, money, errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import ItemSearch from '../components/ItemSearch.vue'
import ItemComposer, { type FlowItem } from '../components/ItemComposer.vue'
import Feedback from '../components/Feedback.vue'
import { validateItems } from '../application/items'
const ui = useUiStore(),
  client = ref<Row | null>(null),
  description = ref(''),
  need = ref(''),
  date = ref(today()),
  discount = ref('0'),
  warranty = ref(0),
  items = ref<FlowItem[]>([]),
  step = ref(1),
  busy = ref(false),
  error = ref(''),
  dirty = ref(false),
  done = ref(false),
  uncertain = ref(false)
useFlow(dirty, busy)
watch(items, () => (dirty.value = true), { deep: true })
const total = computed(
  () =>
    items.value.reduce((s, i) => s + Number(i.quantidade) * Number(i.preco), 0) -
    Number(discount.value.replace(',', '.')),
)
function next() {
  error.value = ''
  if (step.value === 1 && !client.value) {
    error.value = 'Escolha o cliente deste atendimento.'
    return
  }
  if (step.value === 2 && !items.value.length) {
    error.value = 'Inclua pelo menos um serviço ou material.'
    return
  }
  if (step.value === 2) {
    try {
      validateItems(items.value)
    } catch (e) {
      error.value = errorMessage(e)
      return
    }
  }
  step.value++
}
async function save() {
  if (busy.value || uncertain.value || done.value) return
  busy.value = true
  error.value = ''
  let sent = false
  try {
    validateItems(items.value)
    if (!client.value || !items.value.length) throw new Error('Confira cliente e itens.')
    const desconto = decimal(discount.value)
    const subtotal = items.value.reduce((sum, item) => sum + item.quantidade * item.preco, 0)
    if (desconto > subtotal) throw new Error('O desconto não pode ser maior que o total dos itens.')
    if (!date.value) throw new Error('Informe a data de abertura.')
    if (!Number.isInteger(warranty.value) || warranty.value < 0)
      throw new Error('Informe a garantia em dias inteiros, a partir de zero.')
    sent = true
    await OrdensServicoRepository.save({
      data: date.value,
      clienteId: client.value.id,
      vendedorId: ui.usuarioLogged.id!,
      descricao: description.value,
      descricaoCliente: need.value,
      status: 'ABERTA',
      desconto,
      garantia: warranty.value,
      itens: items.value.map((i) => ({
        id: i.id,
        tipo: i.tipo,
        nome: i.nome,
        valor: i.preco,
        quantidade: i.quantidade,
      })),
    })
    done.value = true
    dirty.value = false
  } catch (e) {
    error.value = errorMessage(e)
    if (sent && (!(e as any).response || (e as any).response.status >= 500)) {
      uncertain.value = true
      error.value += ' Confira as ordens antes de repetir o envio.'
    }
  } finally {
    busy.value = false
  }
}

const formDestination = useFormDestination()
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Iniciar atendimento</template
      ><template #description>Organize a necessidade, os serviços e os materiais.</template
      ><template #back
        ><FormBack :to="formDestination('/modofacil/servicos/ordens')"
          >← Ordens de serviço</FormBack
        ></template
      ></PageHeader
    >

    <Feedback
      :error="error"
      :message="done ? 'Ordem aberta. Ela ainda não foi faturada.' : ''"
      @retry="error = ''"
    />
    <ol
      class="mf-steps grid grid-cols-3 border-b border-border p-0 [&>li]:min-w-0 [&>li]:break-words [&>li]:border-b-2 [&>li]:border-transparent [&>li]:px-2 [&>li]:py-3 [&>li]:text-center [&>li]:text-[11px] [&>li]:text-muted-foreground sm:[&>li]:text-sm [&>[aria-current]]:border-blue-600 [&>[aria-current]]:font-medium [&>[aria-current]]:text-blue-600 dark:[&>[aria-current]]:text-blue-300"
    >
      <li
        v-for="(label, i) in ['Cliente e necessidade', 'Serviços e materiais', 'Revisão']"
        :key="label"
        :aria-current="step === i + 1 ? 'step' : undefined"
      >
        {{ i + 1 }}. {{ label }}
      </li>
    </ol>
    <div
      v-if="!done"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @input="dirty = true"
    >
      <section v-if="step === 1" class="mf-stack grid gap-4">
        <p>Cliente: {{ client?.nome || 'Escolha abaixo' }}</p>
        <ItemSearch
          kind="PESSOA"
          @select="
            ($event) => {
              client = $event
              dirty = true
            }
          "
        /><label
          >O que o cliente precisa?<Textarea
            placeholder="Descreva a solicitação do cliente"
            v-model="need" /></label
        ><label
          >Descrição interna<Textarea
            placeholder="Registre informações internas da ordem de serviço"
            v-model="description"
        /></label>
      </section>
      <ItemComposer v-if="step === 2" v-model="items" />
      <ReviewPanel v-if="step === 3" title="Confira a ordem de serviço">
        <h2>{{ client?.nome }}</h2>
        <p>{{ need }}</p>
        <ul>
          <li v-for="item in items" :key="`${item.tipo}-${item.id}`">
            {{ item.nome }} · {{ item.quantidade }} × {{ money(item.preco) }}
          </li>
        </ul>
        <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
          <label
            >Data de abertura<Input placeholder="dd/mm/aaaa" v-model="date" type="date" /></label
          ><label>Desconto<Input placeholder="0,00" v-model="discount" inputmode="decimal" /></label
          ><label
            >Garantia em dias<Input
              placeholder="Ex.: 90"
              v-model.number="warranty"
              type="number"
              min="0"
              step="1"
          /></label>
        </div>
        <p class="mf-value break-words text-2xl font-bold tracking-tight text-foreground">
          Total previsto: {{ money(total) }}
        </p>
        <p
          class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
        >
          A ordem será criada em ABERTA. Abertura não é recebimento nem faturamento. Estoque,
          cobrança e financeiro seguem os contratos do atendimento.
        </p>
      </ReviewPanel>
      <div class="mf-form-actions mf-actions my-4 flex flex-wrap items-end gap-3">
        <button v-if="step > 1" :disabled="busy" @click="step--">Voltar</button
        ><button
          v-if="step < 3"
          class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          @click="next"
        >
          Continuar</button
        ><button
          v-else
          class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          :disabled="busy || uncertain"
          @click="save"
        >
          {{ busy ? 'Abrindo…' : 'Confirmar abertura da OS' }}
        </button>
      </div>
    </div>
    <SuccessPanel
      v-if="done"
      title="Ordem de serviço aberta"
      description="A ordem foi registrada e ainda não foi faturada."
      :to="formDestination('/modofacil/servicos/ordens')"
      label="Ver ordens de serviço"
    />
    <p class="mf-muted text-sm text-muted-foreground">
      Equipamentos, assinatura, anexos, prazo e faturamento ainda estão em adaptação.
    </p>
  </PageFrame>
</template>
