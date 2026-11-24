<script setup lang="ts">
import EntityLink from '@/components/navigation/EntityLink.vue'
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowDown,
  ArrowDownToLine,
  CalendarClock,
  Check,
  CircleCheck,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Link2,
  ListChecks,
  ReceiptText,
  RefreshCw,
  Trash2,
  WalletCards,
} from 'lucide-vue-next'
import { parseISO } from 'date-fns'
import { useToast } from 'vue-toastification'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FormSelect from '@/modofacil/components/FormSelect.vue'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  emprestimos,
  mensagemCotacaoEmprestimo,
  mensagemEmprestimo,
  type Baixa,
  type CotacaoEmprestimo,
  type EmprestimoDetalhe,
  type ParcelaEmprestimo,
} from '@/repositories/emprestimo-repository'
import type { MetodoPagamentoFinanceiro } from '@/types/schemas'
import { randomUUID } from '@/utils/uuid'
import {
  dataCurta,
  dia,
  diaDoCalendario,
  formas,
  moeda,
  percentual,
  resumoAjustes,
  situacaoPorParcelas,
  situacoesEmprestimo,
} from './format'

const props = defineProps<{ id?: number; podeExcluir?: boolean }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ alterado: [] }>()
const toast = useToast()
const router = useRouter()
const item = ref<EmprestimoDetalhe>()
const aba = ref('parcelas')
const formularioBaixa = ref<HTMLFormElement>()
const lista = ref<number[]>([])
const busy = ref(false)
const carregando = ref(false)
const erroCarregamento = ref('')
const erro = ref('')
const confirmarCancelamento = ref(false)
const confirmarExclusao = ref(false)
const erroExclusao = ref('')
const baixandoArquivo = ref(false)
const cotacao = ref<CotacaoEmprestimo>()
const erroCotacao = ref('')
const novaCotacao = ref(0)
const form = reactive<Baixa & { formaRecebimento: MetodoPagamentoFinanceiro }>({
  recebidoEm: dia(),
  formaRecebimento: 'PIX',
  lancarNoFinanceiro: false,
  contaEntradaId: null,
  categoriaId: null,
})
const ativo = computed(() =>
  item.value?.pagamentos.find((pagamento) => pagamento.emprestimoAtivoId),
)
const manual = computed(() => (ativo.value?.metodo === 'PIX_MANUAL' ? ativo.value : undefined))
const analise = computed(() => manual.value?.status === 'EM_ANALISE')
const pendentes = computed(() => item.value?.parcelas.filter((p) => !p.recebidoEm) ?? [])
const pagas = computed(() => (item.value?.parcelas.length ?? 0) - pendentes.value.length)
const motivoExclusao = computed(() => {
  if (pagas.value || item.value?.pagamentos.some((p) => p.status === 'PAGO'))
    return 'Empréstimo com recebimentos registrados.'
  if (ativo.value) return 'Resolva o Pix em aberto para excluir.'
  return ''
})
const previaPublica = computed(() => {
  if (!item.value?.linkPublico) return
  const { hash } = new URL(item.value.linkPublico, window.location.origin)
  return router.resolve({ name: 'emprestimo-publico', hash }).href
})
const proximaParcela = computed(() => pendentes.value[0])
const proximaEmAtraso = computed(
  () => !!proximaParcela.value && dia(new Date(proximaParcela.value.vencimento)) < dia(),
)
const progressoParcelas = computed(() =>
  item.value?.parcelas.length ? Math.round((pagas.value / item.value.parcelas.length) * 100) : 0,
)
const situacao = computed(
  () =>
    situacoesEmprestimo[
      item.value?.situacao ??
        situacaoPorParcelas(analise.value, proximaParcela.value?.vencimento ?? null)
    ],
)
const saldo = computed(() => pendentes.value.reduce((soma, p) => soma + valorParcela(p), 0))
const todasSelecionadas = computed(
  () => pendentes.value.length > 0 && lista.value.length === pendentes.value.length,
)
const podeRevisar = computed(
  () =>
    !!item.value &&
    aba.value === 'parcelas' &&
    (Boolean(manual.value) || (!ativo.value && lista.value.length > 0)) &&
    !confirmarCancelamento.value,
)
const total = computed(
  () =>
    item.value?.parcelas.reduce(
      (soma, p) => soma + p.principalCentavos + p.jurosCentavos - (p.descontoFixoCentavos ?? 0),
      0,
    ) ?? 0,
)
const recebido = computed(
  () => item.value?.parcelas.reduce((soma, p) => soma + (p.recebidoCentavos ?? 0), 0) ?? 0,
)
const valorBaixa = computed(() => manual.value?.totalCentavos ?? cotacao.value?.totalCentavos)
const ajustesBaixa = computed(() =>
  resumoAjustes(manual.value?.itens ?? cotacao.value?.itens ?? []),
)
let chave = ''
let buscaDetalhe: AbortController | undefined

function valorParcela(p: ParcelaEmprestimo) {
  return (
    p.recebidoCentavos ??
    p.cotacao?.totalCentavos ??
    p.principalCentavos + p.jurosCentavos - (p.descontoFixoCentavos ?? 0)
  )
}

function situacaoParcela(p: ParcelaEmprestimo) {
  if (p.recebidoEm) return { label: 'Recebida', color: 'green' } as const
  const dias = p.cotacao?.diasAtraso
  if (!dias) return { label: 'Em aberto', color: 'gray' } as const
  return { label: `${dias} ${dias === 1 ? 'dia' : 'dias'} de atraso`, color: 'red' } as const
}

function cotacaoDosDetalhes(dados: EmprestimoDetalhe, parcelas: number[], recebidoEm: string) {
  if (dados.dataCotacao !== recebidoEm) return
  const selecionadas = new Set(parcelas)
  const itens = dados.parcelas.flatMap((p) =>
    selecionadas.has(p.id) && !p.recebidoEm && p.cotacao ? [p.cotacao] : [],
  )
  if (itens.length !== parcelas.length) return
  const totalCentavos = itens.reduce((soma, item) => soma + item.totalCentavos, 0)
  if (totalCentavos < 1 || totalCentavos > 2_147_483_647) return
  return { itens, totalCentavos }
}

watch(
  [item, lista, () => form.recebidoEm, ativo, novaCotacao],
  ([dados, parcelas, recebidoEm, pagamento, revisao], anterior, onCleanup) => {
    cotacao.value = undefined
    erroCotacao.value = ''
    if (!dados || !parcelas.length || !recebidoEm || pagamento) return
    if (revisao === anterior[4]) {
      const existente = cotacaoDosDetalhes(dados, parcelas, recebidoEm)
      if (existente) {
        cotacao.value = existente
        return
      }
    }
    let atual = true
    const timer = window.setTimeout(async () => {
      try {
        const resultado = await emprestimos.cotar(dados.id, { parcelas, recebidoEm })
        if (atual) cotacao.value = resultado
      } catch (error) {
        if (atual) erroCotacao.value = mensagemCotacaoEmprestimo(error)
      }
    }, 150)
    onCleanup(() => {
      atual = false
      window.clearTimeout(timer)
    })
  },
)

async function carregar() {
  if (!open.value || !props.id) return
  buscaDetalhe?.abort()
  const busca = new AbortController()
  buscaDetalhe = busca
  carregando.value = true
  erroCarregamento.value = ''
  erro.value = ''
  try {
    const dados = await emprestimos.detalhe(props.id, busca.signal)
    if (busca.signal.aborted) return
    item.value = dados
    lista.value = []
    confirmarCancelamento.value = false
    chave = ''
    Object.assign(form, {
      recebidoEm: dia(),
      formaRecebimento: 'PIX',
      lancarNoFinanceiro: dados.lancamentoAutomatico,
      contaEntradaId: dados.contaEntradaId,
      categoriaId: dados.categoriaId,
    })
  } catch (error) {
    if (!busca.signal.aborted)
      erroCarregamento.value = mensagemEmprestimo(error, 'Não foi possível carregar o empréstimo.')
  } finally {
    if (buscaDetalhe === busca) {
      buscaDetalhe = undefined
      carregando.value = false
    }
  }
}
watch(
  () => [open.value, props.id] as const,
  ([aberto]) => {
    buscaDetalhe?.abort()
    item.value = undefined
    aba.value = 'parcelas'
    lista.value = []
    confirmarExclusao.value = false
    erroExclusao.value = ''
    if (aberto) void carregar()
  },
  { immediate: true },
)
onBeforeUnmount(() => buscaDetalhe?.abort())

async function compartilhar() {
  if (!item.value) return
  const url = item.value.linkPublico
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Acompanhe seu empréstimo', url })
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link público copiado.')
  } catch {
    toast.info('Selecione e copie o endereço exibido.')
  }
}

function abrirExclusao() {
  if (!item.value || motivoExclusao.value || busy.value) return
  erroExclusao.value = ''
  confirmarExclusao.value = true
}

async function excluir() {
  if (!item.value || motivoExclusao.value || busy.value) return
  busy.value = true
  erroExclusao.value = ''
  try {
    await emprestimos.excluir(item.value.id)
    confirmarExclusao.value = false
    open.value = false
    emit('alterado')
    toast.success('Empréstimo excluído.')
  } catch (error) {
    erroExclusao.value = mensagemEmprestimo(error, 'Não foi possível excluir o empréstimo.')
  } finally {
    busy.value = false
  }
}
async function baixarArquivo() {
  if (!item.value || !manual.value || baixandoArquivo.value) return
  baixandoArquivo.value = true
  try {
    const blob = await emprestimos.comprovante(item.value.id, manual.value.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download =
      'comprovante.' +
      ({ 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' }[blob.type] ?? 'bin')
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    toast.error(mensagemEmprestimo(error, 'Não foi possível baixar o comprovante.'))
  } finally {
    baixandoArquivo.value = false
  }
}
function selecionarParcela(id: number, selecionada: boolean) {
  lista.value = selecionada
    ? [...new Set([...lista.value, id])]
    : lista.value.filter((parcela) => parcela !== id)
}

async function abrirBaixaManual(id?: number) {
  if (ativo.value || busy.value || carregando.value) return
  erro.value = ''
  if (id !== undefined) lista.value = [id]
  await nextTick()
  formularioBaixa.value?.focus()
}

function revisarProximaParcela() {
  if (!proximaParcela.value) return
  aba.value = 'parcelas'
  void abrirBaixaManual(proximaParcela.value.id)
}

async function salvarBaixa() {
  const cotacaoManual = cotacao.value
  if (!item.value || busy.value || carregando.value || (!manual.value && !cotacaoManual)) return
  erro.value = ''
  if (
    !form.recebidoEm ||
    form.recebidoEm < dia(new Date(item.value.dataSaida)) ||
    form.recebidoEm > dia()
  ) {
    erro.value = 'Informe uma data de recebimento entre a saída do empréstimo e hoje.'
    return
  }
  if (form.lancarNoFinanceiro && (!form.contaEntradaId || !form.categoriaId)) {
    erro.value = 'Selecione a conta e a categoria para o recebimento.'
    return
  }
  const payload = {
    recebidoEm: form.recebidoEm,
    lancarNoFinanceiro: form.lancarNoFinanceiro,
    contaEntradaId: Number(form.contaEntradaId) || null,
    categoriaId: Number(form.categoriaId) || null,
  }
  busy.value = true
  try {
    if (manual.value) await emprestimos.aprovar(item.value.id, manual.value.id, payload)
    else if (cotacaoManual)
      await emprestimos.baixar(item.value.id, {
        ...payload,
        chaveOperacao: (chave ||= randomUUID()),
        parcelas: lista.value,
        totalCentavos: cotacaoManual.totalCentavos,
        formaRecebimento: form.formaRecebimento,
      })
    await carregar()
    emit('alterado')
    toast.success('Recebimento confirmado.')
  } catch (error) {
    erro.value = mensagemEmprestimo(error, 'Não foi possível confirmar o recebimento.')
    if (!manual.value) novaCotacao.value++
  } finally {
    busy.value = false
  }
}
async function cancelar() {
  if (!item.value || !manual.value || busy.value) return
  busy.value = true
  try {
    await emprestimos.cancelarPix(item.value.id, manual.value.id)
    await carregar()
    emit('alterado')
    toast.success('Pix manual encerrado.')
  } catch (error) {
    erro.value = mensagemEmprestimo(error, 'Não foi possível encerrar o Pix manual.')
  } finally {
    busy.value = false
  }
}

async function consultarGateway() {
  if (!item.value || !ativo.value || busy.value) return
  busy.value = true
  erro.value = ''
  try {
    await emprestimos.consultarGateway(item.value.id, ativo.value.id)
    await carregar()
    emit('alterado')
  } catch (error) {
    erro.value = mensagemEmprestimo(error, 'Não foi possível consultar o Mercado Pago.')
  } finally {
    busy.value = false
  }
}

const status = {
  PENDENTE: { label: 'Pendente', color: 'gray' },
  EM_ANALISE: { label: 'Em análise', color: 'yellow' },
  PAGO: { label: 'Recebido', color: 'green' },
  CANCELADO: { label: 'Cancelado', color: 'red' },
} as const
const metodos = { PIX_MANUAL: 'Pix manual', MERCADO_PAGO: 'Mercado Pago', INTERNO: 'Baixa interna' }
const revisaoGateway = new Set(['refunded', 'charged_back', 'partial_refund'])
</script>

<template>
  <ModalView
    v-model:open="open"
    :title="item ? `Empréstimo #${item.id}` : 'Detalhes do empréstimo'"
    :icon="WalletCards"
    size="5xl"
    content-class="max-h-[92dvh] gap-0 overflow-hidden md:w-[calc(100%-2rem)] md:rounded-2xl"
    header-class="shrink-0 border-b bg-card px-4 pb-4 pt-4 text-left sm:px-6 md:pt-5"
    body-class="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-py-4 bg-muted/20 px-4 py-4 sm:px-6 sm:py-5"
  >
    <template #title>
      <span class="font-semibold tracking-tight">
        {{ item ? `Empréstimo #${item.id}` : 'Detalhes do empréstimo' }}
      </span>
    </template>
    <template #description>
      <span v-if="item" class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <EntityLink
          kind="cliente"
          :record-id="item.cliente.id"
          :label="item.cliente.nome"
          class="dark:text-blue-300"
        />
        <BadgeCell v-bind="situacao" size="sm" :capitalize="false" />
      </span>
      <template v-else>Parcelas e pagamentos do empréstimo</template>
    </template>
    <div v-if="carregando && !item" class="space-y-4" role="status">
      <span class="sr-only">Carregando empréstimo…</span>
      <div class="grid gap-3 sm:grid-cols-2">
        <Skeleton v-for="i in 2" :key="i" class="h-36 rounded-xl" />
      </div>
      <Skeleton class="h-44 rounded-lg" />
    </div>
    <div
      v-if="erroCarregamento"
      class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
    >
      <p role="alert" class="text-sm text-destructive">{{ erroCarregamento }}</p>
      <Button variant="outline" size="sm" @click="carregar"
        ><RefreshCw class="size-4" /> Tentar novamente</Button
      >
    </div>

    <div v-if="item" class="space-y-5" :aria-busy="carregando">
      <section
        aria-label="Resumo do empréstimo"
        class="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      >
        <div
          class="grid min-w-0 content-between gap-4 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5"
        >
          <dl>
            <dt class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span
                class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:text-blue-300"
              >
                <WalletCards class="size-4" aria-hidden="true" />
              </span>
              Saldo em aberto
            </dt>
            <dd
              class="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"
            >
              {{ moeda(saldo) }}
            </dd>
          </dl>
          <div class="space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-x-2 text-xs">
              <span class="font-medium"
                >{{ pagas }} de {{ item.parcelas.length }} parcelas recebidas</span
              >
              <span class="font-semibold tabular-nums text-primary dark:text-blue-300"
                >{{ progressoParcelas }}%</span
              >
            </div>
            <div
              role="progressbar"
              aria-label="Progresso das parcelas recebidas"
              :aria-valuenow="progressoParcelas"
              :aria-valuetext="`${pagas} de ${item.parcelas.length} parcelas recebidas`"
              class="h-2 overflow-hidden rounded-full bg-primary/15"
            >
              <div
                class="h-full rounded-full bg-primary"
                :style="{ width: `${progressoParcelas}%` }"
              />
            </div>
          </div>
        </div>

        <div class="min-w-0 overflow-hidden rounded-xl border bg-card">
          <dl class="grid grid-cols-2 divide-x border-b">
            <div class="min-w-0 px-4 py-3.5 sm:px-5">
              <dt class="text-xs font-medium text-muted-foreground">Emprestado</dt>
              <dd class="mt-1 break-words text-lg font-semibold tabular-nums">
                {{ moeda(item.principalCentavos) }}
              </dd>
            </div>
            <div class="min-w-0 px-4 py-3.5 sm:px-5">
              <dt class="text-xs font-medium text-muted-foreground">Total recebido</dt>
              <dd class="mt-1 break-words text-lg font-semibold tabular-nums">
                {{ moeda(recebido) }}
              </dd>
            </div>
          </dl>
          <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-lg"
                :class="
                  proximaEmAtraso
                    ? 'bg-destructive/10 text-destructive dark:text-red-300'
                    : 'bg-muted text-muted-foreground'
                "
              >
                <CalendarClock v-if="proximaParcela" class="size-4" aria-hidden="true" />
                <CircleCheck v-else class="size-4" aria-hidden="true" />
              </span>
              <div v-if="proximaParcela" class="min-w-0">
                <p
                  class="text-xs font-medium"
                  :class="
                    proximaEmAtraso ? 'text-destructive dark:text-red-300' : 'text-muted-foreground'
                  "
                >
                  {{ proximaEmAtraso ? 'Parcela vencida' : 'Próximo vencimento' }}
                </p>
                <p
                  class="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-sm font-semibold tabular-nums"
                >
                  <span>{{ dataCurta(proximaParcela.vencimento) }}</span>
                  <span class="text-xs font-medium text-muted-foreground"
                    >· {{ moeda(valorParcela(proximaParcela)) }}</span
                  >
                </p>
              </div>
              <p v-else class="text-sm font-medium">Todas as parcelas foram recebidas.</p>
            </div>
            <Button
              v-if="proximaParcela && !ativo"
              type="button"
              variant="outline"
              size="sm"
              :disabled="busy || carregando"
              :aria-label="`Dar baixa na próxima parcela, número ${proximaParcela.numero}`"
              @click="revisarProximaParcela"
              ><ArrowDownToLine class="size-4" aria-hidden="true" /> Dar baixa</Button
            >
          </div>
        </div>
      </section>

      <Tabs v-model="aba" class="space-y-4">
        <TabsList
          aria-label="Seções do empréstimo"
          class="grid h-auto w-full grid-cols-3 rounded-lg border bg-card p-1"
        >
          <TabsTrigger
            value="parcelas"
            class="h-9 rounded-md px-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:text-blue-300"
          >
            <ListChecks class="hidden size-4 shrink-0 min-[370px]:inline" aria-hidden="true" />
            Parcelas
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            class="h-9 rounded-md px-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:text-blue-300"
          >
            <History class="hidden size-4 shrink-0 min-[370px]:inline" aria-hidden="true" />
            Histórico
          </TabsTrigger>
          <TabsTrigger
            value="contrato"
            class="h-9 rounded-md px-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:text-blue-300"
          >
            <FileText class="hidden size-4 shrink-0 min-[370px]:inline" aria-hidden="true" />
            Contrato
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parcelas" class="min-w-0 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-base font-semibold tracking-tight">Parcelas do empréstimo</h3>
            <span
              v-if="lista.length && !ativo"
              class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:text-blue-300"
            >
              <ListChecks class="size-3.5" aria-hidden="true" />
              {{
                lista.length === 1
                  ? '1 parcela selecionada'
                  : `${lista.length} parcelas selecionadas`
              }}
            </span>
          </div>
          <div
            v-if="ativo"
            class="space-y-3 rounded-xl border border-primary/25 border-l-4 border-l-primary bg-card p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="flex min-w-0 gap-3">
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:text-blue-300"
                >
                  <ReceiptText class="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p class="text-sm font-semibold">
                    {{
                      manual
                        ? analise
                          ? 'Comprovante aguardando análise'
                          : 'Pix manual aguardando comprovante'
                        : 'Pix via Mercado Pago aguardando confirmação'
                    }}
                  </p>
                  <p class="mt-0.5 text-xs text-muted-foreground">
                    {{ moeda(ativo.totalCentavos) }} · Parcelas
                    {{ ativo.itens.map((p) => p.numero).join(', ') }}
                  </p>
                </div>
              </div>
              <Button
                v-if="analise"
                variant="outline"
                size="sm"
                :disabled="baixandoArquivo"
                @click="baixarArquivo"
                ><Download class="size-4" /> Baixar comprovante</Button
              >
              <Button
                v-else-if="!manual"
                variant="outline"
                size="sm"
                :disabled="busy"
                @click="consultarGateway"
                >Consultar Mercado Pago</Button
              >
            </div>
            <p class="text-sm text-muted-foreground">
              Resolva o Pix em aberto para liberar a baixa manual.
            </p>
            <Button
              v-if="manual && !confirmarCancelamento"
              variant="outline"
              size="sm"
              @click="confirmarCancelamento = true"
              >{{ analise ? 'Recusar comprovante' : 'Encerrar Pix manual' }}</Button
            >
            <div v-if="confirmarCancelamento" class="space-y-2">
              <p class="text-sm">
                Confira no extrato que o valor integral ainda está em aberto antes de liberar as
                parcelas para uma nova tentativa.
              </p>
              <div class="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" @click="confirmarCancelamento = false"
                  >Voltar</Button
                >
                <Button variant="destructive" size="sm" :disabled="busy" @click="cancelar"
                  >Confirmar encerramento</Button
                >
              </div>
            </div>
          </div>

          <div class="overflow-x-auto rounded-xl border bg-card">
            <table class="w-full text-left text-sm">
              <caption class="sr-only">
                Parcelas do empréstimo
              </caption>
              <thead class="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th v-if="!ativo && pendentes.length" scope="col" class="w-10 p-2">
                    <Checkbox
                      aria-label="Selecionar todas as parcelas em aberto"
                      :model-value="
                        todasSelecionadas ? true : lista.length ? 'indeterminate' : false
                      "
                      :disabled="busy || carregando"
                      @update:model-value="
                        lista = $event === true ? pendentes.map((p) => p.id) : []
                      "
                    />
                  </th>
                  <th scope="col" class="px-2 py-3 font-medium sm:px-3">Parcela</th>
                  <th scope="col" class="hidden px-3 py-3 font-medium sm:table-cell">Vencimento</th>
                  <th scope="col" class="px-2 py-3 font-medium sm:px-3">Valor atualizado</th>
                  <th scope="col" class="hidden px-3 py-3 font-medium sm:table-cell">
                    Recebimento
                  </th>
                  <th
                    v-if="!ativo && pendentes.length"
                    scope="col"
                    class="px-2 py-3 text-right font-medium sm:px-4"
                  >
                    Baixa
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="p in item.parcelas"
                  :key="p.id"
                  class="transition-colors hover:bg-muted/45 data-[selecionada=true]:bg-primary/5"
                  :data-selecionada="lista.includes(p.id)"
                >
                  <td v-if="!ativo && pendentes.length" class="p-2">
                    <Checkbox
                      v-if="!p.recebidoEm"
                      :model-value="lista.includes(p.id)"
                      :aria-label="`Selecionar parcela ${p.numero}`"
                      :disabled="busy || carregando"
                      @update:model-value="selecionarParcela(p.id, $event === true)"
                    />
                    <Check v-else class="size-4 text-emerald-600" aria-label="Quitada" />
                  </td>
                  <td class="px-2 py-3 font-medium sm:px-3">
                    <span
                      class="inline-flex min-w-6 items-center justify-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums"
                    >
                      {{ p.numero }}
                    </span>
                    <span class="block whitespace-nowrap text-xs text-muted-foreground sm:hidden">
                      {{ dataCurta(p.vencimento) }}
                    </span>
                  </td>
                  <td class="hidden whitespace-nowrap px-3 py-3 tabular-nums sm:table-cell">
                    {{ dataCurta(p.vencimento) }}
                  </td>
                  <td class="px-2 py-3 tabular-nums sm:px-3">
                    <span class="whitespace-nowrap font-medium">{{ moeda(valorParcela(p)) }}</span>
                    <span v-if="p.cotacao" class="block text-xs text-muted-foreground">{{
                      resumoAjustes([p.cotacao])
                    }}</span>
                    <div
                      class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:hidden"
                    >
                      <BadgeCell v-bind="situacaoParcela(p)" size="sm" :capitalize="false" />
                      <span v-if="p.recebidoEm" class="whitespace-nowrap">{{
                        dataCurta(p.recebidoEm)
                      }}</span>
                    </div>
                  </td>
                  <td class="hidden px-3 py-3 text-xs text-muted-foreground sm:table-cell">
                    <BadgeCell v-bind="situacaoParcela(p)" size="sm" :capitalize="false" />
                    <span v-if="p.recebidoEm" class="mt-1 block whitespace-nowrap">{{
                      dataCurta(p.recebidoEm)
                    }}</span>
                  </td>
                  <td v-if="!ativo && pendentes.length" class="px-2 py-3 text-right sm:px-4">
                    <Button
                      v-if="!p.recebidoEm"
                      type="button"
                      variant="outline"
                      size="sm"
                      :aria-label="`Dar baixa manual na parcela ${p.numero}`"
                      :disabled="busy || carregando"
                      @click="abrirBaixaManual(p.id)"
                    >
                      <span class="sm:hidden">Baixa</span>
                      <span class="hidden sm:inline">Dar baixa</span>
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <form
            v-if="podeRevisar"
            ref="formularioBaixa"
            tabindex="-1"
            class="scroll-mt-3 space-y-4 rounded-xl border border-primary/20 bg-card p-4 shadow-sm focus:outline-none sm:p-5"
            @submit.prevent="salvarBaixa"
          >
            <div class="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <h3 class="flex items-center gap-2 text-base font-semibold tracking-tight">
                <ReceiptText
                  class="size-4 shrink-0 text-primary dark:text-blue-300"
                  aria-hidden="true"
                />
                {{
                  analise
                    ? 'Confirmar comprovante'
                    : manual
                      ? 'Confirmar recebimento do Pix'
                      : 'Registrar baixa manual'
                }}
              </h3>
              <span
                v-if="valorBaixa !== undefined"
                class="rounded-lg bg-primary/10 px-3 py-1 text-lg font-semibold tabular-nums text-primary dark:text-blue-300"
                >{{ moeda(valorBaixa) }}</span
              >
              <span
                v-else-if="form.recebidoEm && !erroCotacao"
                class="text-xs text-muted-foreground"
                role="status"
                >Calculando…</span
              >
            </div>
            <p v-if="ajustesBaixa" class="text-xs text-muted-foreground">{{ ajustesBaixa }}</p>
            <div v-if="erroCotacao" class="flex flex-wrap items-center gap-2">
              <p class="text-xs text-destructive" role="alert">{{ erroCotacao }}</p>
              <Button type="button" variant="ghost" size="sm" @click="novaCotacao++"
                >Recalcular</Button
              >
            </div>
            <p v-if="manual" class="text-sm text-muted-foreground">
              Confira o valor no extrato e informe a data efetiva do Pix.
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="min-w-0 space-y-2">
                <Label for="dp-input-emprestimo-baixa-data">Data efetiva do recebimento</Label>
                <Calendarpicker
                  uid="emprestimo-baixa-data"
                  :aria-labels="{ input: 'Data efetiva do recebimento' }"
                  :model-value="form.recebidoEm || null"
                  :min-date="parseISO(dia(new Date(item.dataSaida)))"
                  :max-date="parseISO(dia())"
                  :disabled="busy"
                  teleport
                  @update:model-value="form.recebidoEm = diaDoCalendario($event)"
                />
              </div>
              <div v-if="!manual" class="min-w-0 space-y-2">
                <Label for="emprestimo-baixa-forma">Forma de recebimento</Label>
                <FormSelect
                  id="emprestimo-baixa-forma"
                  v-model="form.formaRecebimento"
                  :options="formas"
                  :disabled="busy"
                  aria-label="Forma de recebimento"
                />
              </div>
            </div>
            <div class="flex items-center justify-between gap-4 rounded-lg border bg-muted/25 p-3">
              <Label for="emprestimo-baixa-lancamento"
                >Lançar receita já efetivada no Financeiro</Label
              >
              <Switch
                id="emprestimo-baixa-lancamento"
                v-model="form.lancarNoFinanceiro"
                :disabled="busy"
              />
            </div>
            <div v-if="form.lancarNoFinanceiro" class="grid gap-4 sm:grid-cols-2">
              <div class="min-w-0 space-y-2">
                <Label for="emprestimo-baixa-conta">Conta do recebimento</Label>
                <Select2Ajax
                  id="emprestimo-baixa-conta"
                  v-model="form.contaEntradaId"
                  aria-label="Conta do recebimento"
                  url="/lancamentos/contas/select2"
                  linked-kind="conta"
                  :disabled="busy"
                />
              </div>
              <div class="min-w-0 space-y-2">
                <Label for="emprestimo-baixa-categoria">Categoria financeira</Label>
                <Select2Ajax
                  id="emprestimo-baixa-categoria"
                  v-model="form.categoriaId"
                  aria-label="Categoria financeira"
                  url="/lancamentos/categorias/select2"
                  linked-kind="categoria"
                  :disabled="busy"
                />
              </div>
            </div>
            <p v-if="erro" role="alert" class="text-sm text-destructive">{{ erro }}</p>
            <div class="flex justify-end">
              <Button
                type="submit"
                :disabled="busy || carregando || !form.recebidoEm || valorBaixa === undefined"
                >{{ busy ? 'Confirmando…' : 'Confirmar recebimento' }}</Button
              >
            </div>
          </form>
          <p v-else-if="!ativo && pendentes.length > 1" class="text-xs text-muted-foreground">
            Selecione várias parcelas para registrar uma baixa em lote.
          </p>

          <p v-if="erro && !podeRevisar" role="alert" class="text-sm text-destructive">
            {{ erro }}
          </p>
        </TabsContent>
        <TabsContent value="historico" class="space-y-4">
          <h3 class="text-base font-semibold tracking-tight">Histórico de pagamentos</h3>
          <div
            v-if="!item.pagamentos.length"
            class="grid justify-items-center gap-2 rounded-xl border bg-card px-4 py-7 text-center text-sm"
          >
            <span class="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
              <ReceiptText class="size-5" aria-hidden="true" />
            </span>
            <p class="font-medium">Nenhum pagamento registrado.</p>
          </div>
          <ol v-else class="divide-y rounded-xl border bg-card">
            <li
              v-for="p in item.pagamentos"
              :key="p.id"
              class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-3.5 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-5"
            >
              <span
                class="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"
              >
                <ReceiptText class="size-4" aria-hidden="true" />
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium">{{ metodos[p.metodo] }}</span>
                  <BadgeCell v-bind="status[p.status]" size="sm" :capitalize="false" />
                </div>
                <span class="mt-1 block break-words text-xs text-muted-foreground"
                  >{{ dataCurta(p.recebidoEm || p.criadoEm) }} · Parcelas
                  {{ p.itens.map((i) => i.numero).join(', ') }}</span
                >
                <span v-if="resumoAjustes(p.itens)" class="block text-xs text-muted-foreground">{{
                  resumoAjustes(p.itens)
                }}</span>
                <span
                  v-if="p.gatewaySituacao && revisaoGateway.has(p.gatewaySituacao)"
                  class="block text-xs font-medium text-destructive"
                  >O Mercado Pago informou estorno ou contestação. Confira o lançamento no
                  Financeiro.</span
                >
              </div>
              <div class="col-start-2 tabular-nums sm:col-start-3 sm:text-right">
                <span class="font-semibold">{{ moeda(p.totalCentavos) }}</span>
                <span v-if="p.lancamentoId" class="block text-xs text-muted-foreground"
                  ><EntityLink
                    kind="lancamento"
                    :record-id="p.lancamentoId"
                    label="Lançado no Financeiro"
                /></span>
              </div>
            </li>
          </ol>
        </TabsContent>
        <TabsContent value="contrato" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <section class="min-w-0 space-y-3 rounded-xl border bg-card px-4 py-4 sm:px-5">
              <h3 class="flex items-center gap-2 border-b pb-3 text-sm font-semibold">
                <FileText class="size-4 text-primary dark:text-blue-300" aria-hidden="true" />
                Condições do empréstimo
              </h3>
              <dl class="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                <div>
                  <dt class="text-xs text-muted-foreground">Total sem atraso</dt>
                  <dd class="font-semibold tabular-nums">{{ moeda(total) }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">Juros do contrato</dt>
                  <dd class="font-medium">{{ percentual(item.jurosBps) }}</dd>
                </div>
                <div v-if="item.jurosMoraBps">
                  <dt class="text-xs text-muted-foreground">Juros por atraso</dt>
                  <dd class="font-medium">{{ percentual(item.jurosMoraBps) }} ao mês</dd>
                </div>
                <div v-if="item.multaBps">
                  <dt class="text-xs text-muted-foreground">Multa por parcela atrasada</dt>
                  <dd class="font-medium">{{ percentual(item.multaBps) }}</dd>
                </div>
                <div v-if="item.descontoFixoCentavos">
                  <dt class="text-xs text-muted-foreground">Desconto fixo</dt>
                  <dd class="font-medium">{{ moeda(item.descontoFixoCentavos) }}</dd>
                </div>
                <div v-if="item.jurosBps && item.descontoJurosBps">
                  <dt class="text-xs text-muted-foreground">Desconto por antecipação</dt>
                  <dd class="font-medium">
                    {{ percentual(item.descontoJurosBps) }} sobre os juros do contrato
                  </dd>
                </div>
              </dl>
            </section>
            <section class="min-w-0 space-y-3 rounded-xl border bg-card px-4 py-4 sm:px-5">
              <h3 class="flex items-center gap-2 border-b pb-3 text-sm font-semibold">
                <WalletCards class="size-4 text-primary dark:text-blue-300" aria-hidden="true" />
                Movimentação financeira
              </h3>
              <dl class="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                <div>
                  <dt class="text-xs text-muted-foreground">Data e forma da saída</dt>
                  <dd>
                    {{ dataCurta(item.dataSaida) }} ·
                    {{
                      formas.find((forma) => forma.value === item?.formaSaida)?.label ??
                      item.formaSaida
                    }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">Origem do dinheiro</dt>
                  <dd>
                    <EntityLink
                      kind="conta"
                      :record-id="item.contaSaidaId"
                      :label="item.contaSaidaId ? 'Conta da saída' : 'Saída avulsa'"
                    />
                  </dd>
                </div>
                <div v-if="item.lancamentoSaidaId">
                  <dt class="text-xs text-muted-foreground">Lançamento da saída</dt>
                  <dd>
                    <EntityLink
                      kind="lancamento"
                      :record-id="item.lancamentoSaidaId"
                      label="Despesa efetivada"
                    />
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">Recebimento no Financeiro</dt>
                  <dd>
                    {{ item.lancamentoAutomatico ? 'Lançamento automático' : 'Lançamento manual' }}
                  </dd>
                </div>
                <div v-if="item.contaEntradaId">
                  <dt class="text-xs text-muted-foreground">Conta dos recebimentos</dt>
                  <dd>
                    <EntityLink kind="conta" :record-id="item.contaEntradaId" label="Abrir conta" />
                  </dd>
                </div>
                <div v-if="item.categoriaId">
                  <dt class="text-xs text-muted-foreground">Categoria financeira</dt>
                  <dd>
                    <EntityLink
                      kind="categoria"
                      :record-id="item.categoriaId"
                      label="Abrir categoria"
                    />
                  </dd>
                </div>
              </dl>
            </section>
          </div>
          <div class="rounded-xl border border-primary/20 bg-card p-4 sm:px-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <label for="emprestimo-link" class="flex items-center gap-2 text-sm font-semibold"
                ><Link2 class="size-4 text-primary dark:text-blue-300" aria-hidden="true" /> Link de
                acompanhamento</label
              >
              <div class="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" @click="compartilhar"
                  ><Copy class="size-4" /> Compartilhar link</Button
                >
                <Button
                  as="a"
                  :href="previaPublica"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                  ><ExternalLink class="size-4" /> Abrir prévia</Button
                >
              </div>
            </div>
            <Input
              id="emprestimo-link"
              :model-value="item.linkPublico"
              readonly
              class="mt-3 bg-muted/35 text-xs text-muted-foreground"
              @focus="($event.target as HTMLInputElement).select()"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
    <ModalView
      v-model:open="confirmarExclusao"
      :title="`Excluir empréstimo #${item?.id ?? ''}?`"
      :icon="Trash2"
      size="sm"
    >
      <div class="space-y-2 px-4 text-sm">
        <p>
          Esta ação é permanente. As parcelas, as cobranças encerradas e o acesso pelo link público
          serão removidos.
        </p>
        <p v-if="item?.lancamentoSaidaId" class="font-medium">
          A despesa de saída vinculada também será removida do Financeiro.
        </p>
        <p v-if="erroExclusao" role="alert" class="text-destructive">{{ erroExclusao }}</p>
      </div>
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <Button variant="outline" :disabled="busy" @click="confirmarExclusao = false"
            >Cancelar</Button
          >
          <Button variant="destructive" :disabled="busy" @click="excluir">
            {{ busy ? 'Excluindo…' : 'Excluir definitivamente' }}
          </Button>
        </div>
      </template>
    </ModalView>
    <template #footer>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <div v-if="item && podeExcluir" class="mr-auto">
          <Button
            v-if="!motivoExclusao"
            variant="ghost"
            class="text-destructive hover:text-destructive"
            :disabled="busy || carregando"
            @click="abrirExclusao"
            ><Trash2 class="size-4" /> Excluir empréstimo</Button
          >
          <p v-else class="text-xs text-muted-foreground">{{ motivoExclusao }}</p>
        </div>
        <Button variant="outline" :disabled="busy" @click="open = false">Fechar</Button>
        <Button
          v-if="podeRevisar"
          :disabled="busy || carregando"
          @click="manual ? formularioBaixa?.focus() : abrirBaixaManual()"
        >
          <ArrowDown class="size-4" />
          {{ manual ? 'Revisar recebimento' : `Baixa manual (${lista.length})` }}
        </Button>
      </div>
    </template>
  </ModalView>
</template>
