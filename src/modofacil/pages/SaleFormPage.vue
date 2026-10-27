<script setup lang="ts">
import FormSelect from '../components/FormSelect.vue'
import FormResultLink from '../components/FormResultLink.vue'
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'

import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { useUiStore } from '@/stores/ui/uiStore'
import { CaixaRepository, VendaRepository, type Row } from '../adapters/domain'
import { decimal, money, today, errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import { useDomainMutation } from '../application/useDomainMutation'
import { preparePayments, type PaymentDraft } from '../application/payments'
import { validateItems } from '../application/items'
import ItemComposer, { type FlowItem } from '../components/ItemComposer.vue'
import ItemSearch from '../components/ItemSearch.vue'
import PaymentComposer from '../components/PaymentComposer.vue'
import Feedback from '../components/Feedback.vue'
const route = useFormContext(),
  ui = useUiStore(),
  kind = ref(route.query.orcamento === '1' ? 'ORCAMENTO' : 'VENDA'),
  items = ref<FlowItem[]>([]),
  step = ref(1),
  client = ref<Row | null>(null),
  method = ref('PIX'),
  compound = ref(false),
  payments = ref<PaymentDraft[]>([
    { metodo: 'PIX', valor: '' },
    { metodo: 'DINHEIRO', valor: '' },
  ]),
  discount = ref('0'),
  received = ref(''),
  installments = ref(1),
  due = ref(today()),
  date = ref(today()),
  notes = ref(''),
  context = ref<Awaited<ReturnType<typeof CaixaRepository.contexto>> | null>(null),
  savedId = ref(0),
  dirty = ref(false),
  validation = ref('')
const { busy, error, message, uncertain, run } = useDomainMutation()
const subtotal = computed(
  () =>
    items.value.reduce(
      (sum, item) => sum + Math.round(Number(item.preco) * 100) * Number(item.quantidade),
      0,
    ) / 100,
)
const total = computed(
  () => Math.round((subtotal.value - Number(discount.value.replace(',', '.'))) * 100) / 100,
)
const credit = computed(() =>
  compound.value
    ? payments.value.some((p) => p.metodo === 'CREDIARIO')
    : method.value === 'CREDIARIO',
)
watch(items, () => (dirty.value = true), { deep: true })
useFlow(dirty, busy)
async function load() {
  try {
    context.value = await CaixaRepository.contexto()
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
onMounted(load)
function validatePayment() {
  if (kind.value === 'ORCAMENTO') return
  preparePayments(total.value, method.value, compound.value, payments.value, received.value)
  if (
    credit.value &&
    (!client.value ||
      !Number.isInteger(installments.value) ||
      installments.value < 1 ||
      installments.value > 36 ||
      !due.value)
  )
    throw new Error(
      'Para vender a prazo, escolha cliente, de 1 a 36 parcelas e o primeiro vencimento.',
    )
}
function next() {
  validation.value = ''
  try {
    validateItems(items.value)
    if (step.value === 2) {
      decimal(discount.value)
      if (total.value <= 0) throw new Error('Confira o total e o desconto.')
      validatePayment()
    }
    step.value++
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
async function save() {
  validation.value = ''
  let payload: any
  try {
    validateItems(items.value)
    const desconto = decimal(discount.value)
    if (total.value <= 0) throw new Error('O total deve ser maior que zero.')
    const common = {
      clienteId: client.value?.id || null,
      data: date.value,
      desconto,
      itens: items.value.map((i) => ({
        id: i.id,
        nome: i.nome,
        tipo: i.tipo,
        quantidade: i.quantidade,
        preco: i.preco,
      })),
    }
    if (kind.value === 'ORCAMENTO')
      payload = {
        ...common,
        status: 'ORCAMENTO',
        observacoes: notes.value,
        vendedorId: ui.usuarioLogged.id,
        pagamento: 'OUTRO',
      }
    else {
      validatePayment()
      if (!context.value?.caixaAtivo)
        throw new Error('Abra ou entre em um caixa antes de concluir.')
      const payment = preparePayments(
        total.value,
        method.value,
        compound.value,
        payments.value,
        received.value,
      )
      payload = {
        ...common,
        caixaId: context.value.caixaAtivo.id,
        ...payment,
        crediarioParcelas: payment.crediario ? installments.value : undefined,
        crediarioPrimeiroVencimento: payment.crediario ? due.value : undefined,
      }
      delete payload.crediario
    }
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const result = await run(
    () =>
      kind.value === 'ORCAMENTO'
        ? VendaRepository.create(payload)
        : VendaRepository.finalizarVendaPdv(payload),
    kind.value === 'ORCAMENTO'
      ? 'Orçamento registrado.'
      : 'Venda concluída pelo domínio, com os efeitos de estoque e financeiro da conta.',
  )
  if (result) {
    savedId.value = result.value.id
    dirty.value = false
  }
}

const formDestination = useFormDestination()
</script>
<template>
  <PageFrame>
    <PageHeader
      ><template #title>{{
        kind === 'ORCAMENTO' ? 'Preparar orçamento' : 'Fazer uma venda'
      }}</template
      ><template #description>Escolha os itens, combine as condições e confira.</template
      ><template #back
        ><FormBack :to="formDestination('/modofacil/vendas')">← Vendas</FormBack></template
      ></PageHeader
    >

    <Feedback :error="validation || error" :message="message" @retry="validation = ''" />
    <p
      v-if="uncertain"
      class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
    >
      <FormResultLink :to="formDestination('/modofacil/vendas')"
        >Consultar vendas antes de continuar</FormResultLink
      >
    </p>
    <ol
      class="mf-steps grid grid-cols-3 border-b border-border p-0 [&>li]:min-w-0 [&>li]:break-words [&>li]:border-b-2 [&>li]:border-transparent [&>li]:px-2 [&>li]:py-3 [&>li]:text-center [&>li]:text-[11px] [&>li]:text-muted-foreground sm:[&>li]:text-sm [&>[aria-current]]:border-blue-600 [&>[aria-current]]:font-medium [&>[aria-current]]:text-blue-600 dark:[&>[aria-current]]:text-blue-300"
    >
      <li
        v-for="(label, i) in ['Itens', 'Cliente e condições', 'Conferir']"
        :key="label"
        :aria-current="step === i + 1 ? 'step' : undefined"
      >
        {{ i + 1 }}. {{ label }}
      </li>
    </ol>
    <div
      v-if="!savedId"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @input="dirty = true"
    >
      <fieldset :disabled="busy || uncertain" class="mf-stack grid gap-4">
        <template v-if="step === 1"
          ><label
            >O que deseja registrar?<FormSelect
              v-model="kind"
              :options="[
                { value: 'VENDA', label: 'Venda com pagamento' },
                { value: 'ORCAMENTO', label: 'Orçamento' },
              ]" /></label
          ><ItemComposer v-model="items"
        /></template>
        <section v-if="step === 2" class="mf-stack grid gap-4">
          <p>Cliente: {{ client?.nome || 'Não informado' }}</p>
          <ItemSearch
            kind="PESSOA"
            @select="
              (row) => {
                client = row
                dirty = true
              }
            "
          /><button v-if="client" type="button" @click="client = null">Remover cliente</button>
          <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>Data<Input placeholder="dd/mm/aaaa" v-model="date" type="date" required /></label
            ><label
              >Desconto total<Input
                placeholder="0,00"
                v-model="discount"
                inputmode="decimal" /></label
            ><label v-if="kind === 'ORCAMENTO'" class="mf-full col-span-full"
              >Condições / observações<Textarea
                placeholder="Informe condições de pagamento ou observações da venda"
                v-model="notes"
              />
            </label>
          </div>
          <PaymentComposer
            v-if="kind === 'VENDA'"
            :total="total"
            v-model:method="method"
            v-model:compound="compound"
            v-model:payments="payments"
            v-model:received="received"
          />
          <div
            v-if="kind === 'VENDA' && credit"
            class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <label
              >Parcelas do crediário<Input
                placeholder="Ex.: 3"
                v-model.number="installments"
                type="number"
                min="1"
                max="36"
                step="1" /></label
            ><label
              >Primeiro vencimento<Input placeholder="dd/mm/aaaa" v-model="due" type="date"
            /></label>
          </div>
        </section>
        <ReviewPanel v-if="step === 3">
          <template #title>Confira antes de confirmar</template>
          <ul>
            <li v-for="item in items" :key="`${item.tipo}-${item.id}`">
              {{ item.nome }} · {{ item.quantidade }} × {{ money(item.preco) }}
            </li>
          </ul>
          <p>Cliente: {{ client?.nome || 'Não informado' }} · {{ date }}</p>
          <p class="mf-value break-words text-2xl font-bold tracking-tight text-foreground">
            Total: {{ money(total) }}
          </p>
          <template v-if="kind === 'VENDA'"
            ><ul v-if="compound">
              <li v-for="(payment, i) in payments" :key="i">
                {{ payment.metodo }}: {{ payment.valor }}
              </li>
            </ul>
            <p v-else>Pagamento: {{ method }}</p>
            <p>Caixa: {{ context?.caixaAtivo?.codigo || 'Ainda não aberto' }}</p>
            <p v-if="credit">
              Crediário: {{ installments }} parcela(s), primeiro vencimento {{ due }}.
            </p>
            <p
              class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
            >
              A conclusão realiza uma única operação. O financeiro automático segue a conta; o
              crediário gera o saldo a receber.
            </p>
            <div
              v-if="!context?.caixaAtivo"
              class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
            >
              <FormResultLink :to="formDestination('/modofacil/caixa')"
                >Abrir ou entrar em um caixa</FormResultLink
              ><button type="button" @click="load">Verificar caixa</button>
            </div></template
          >
          <p
            v-else
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            O orçamento usa a operação de vendas atual: registra a saída dos produtos no estoque,
            com pagamento pendente. Não significa recebimento. Confira esse efeito antes de salvar.
          </p>
        </ReviewPanel>
        <div class="mf-form-actions mf-actions my-4 flex flex-wrap items-end gap-3">
          <button v-if="step > 1" type="button" @click="step--">Voltar</button
          ><button
            v-if="step < 3"
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
            type="button"
            @click="next"
          >
            Continuar</button
          ><button
            v-else
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
            type="button"
            @click="save"
          >
            {{
              busy
                ? 'Registrando…'
                : kind === 'ORCAMENTO'
                  ? 'Confirmar orçamento e saída de estoque'
                  : 'Confirmar e concluir venda'
            }}
          </button>
        </div>
      </fieldset>
    </div>
    <FormResultLink
      v-if="savedId"
      class="mf-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/90 no-underline transition-colors hover:bg-muted/50 mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
      :to="`/modofacil/vendas/${savedId}`"
      >Ver registro salvo</FormResultLink
    >
  </PageFrame>
</template>
