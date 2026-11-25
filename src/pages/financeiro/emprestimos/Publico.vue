<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Building2,
  CheckCircle2,
  CalendarDays,
  Clock3,
  Copy,
  CreditCard,
  FileText,
  FileUp,
  Headphones,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Timer,
  UserRound,
  WalletCards,
} from 'lucide-vue-next'
import { vMaska } from 'maska/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cpfCnpjMaskOptions } from '@/lib/imaska'
import {
  emprestimoPublico,
  mensagemEmprestimo,
  mensagemLinkPublico,
  type EmprestimoPublico,
} from '@/repositories/emprestimo-repository'
import { resolveFileUrl } from '@/utils/fileUrl'
import { dataCurta, descreverAntecipacao, dia, moeda, percentual, resumoAjustes } from './format'

const route = useRoute()
const token = computed(() => new URLSearchParams(route.hash.slice(1)).get('token') ?? '')
const dados = ref<EmprestimoPublico>()
const regraAntecipacao = computed(() =>
  dados.value ? descreverAntecipacao(dados.value, dados.value.jurosBps > 0) : '',
)
const logoComErro = ref('')
const empresa = computed(() => dados.value?.estabelecimento?.trim() ?? '')
const logoEmpresa = computed(() => resolveFileUrl(dados.value?.logoEmpresa, { fallback: '' }))
const iniciaisEmpresa = computed(() =>
  empresa.value
    .split(/\s+/, 2)
    .map((palavra) => Array.from(palavra)[0])
    .join('')
    .toLocaleUpperCase('pt-BR'),
)
const primeiroNome = computed(() => dados.value?.cliente?.nome.trim().split(/\s+/, 1)[0])
const selecionadas = ref<number[]>([])
const metodo = ref<'PIX_MANUAL' | 'MERCADO_PAGO'>()
const email = ref('')
const documento = ref('')
const loading = ref(false)
const busy = ref(false)
const erro = ref('')
const mensagem = ref('')
const arquivo = ref<File>()
const confirmarCancelamento = ref(false)
const agora = ref(Date.now())
const painelPagamento = ref<HTMLElement>()
const aberto = computed(() => {
  const pagamento = dados.value?.pagamento
  if (!pagamento?.expiraEm || Date.parse(pagamento.expiraEm) > agora.value) return pagamento
  return { ...pagamento, expirada: true, pixCopiaCola: null, pixQr: null }
})
const pendentes = computed(() => dados.value?.parcelas.filter((p) => !p.recebidoEm) ?? [])
const proxima = computed(() => pendentes.value[0])
const pagas = computed(() => (dados.value?.parcelas.length ?? 0) - pendentes.value.length)
const progresso = computed(() =>
  dados.value?.parcelas.length ? (pagas.value / dados.value.parcelas.length) * 100 : 0,
)
const saldo = computed(() => pendentes.value.reduce((soma, p) => soma + p.totalCentavos, 0))
const escolhidas = computed(() => pendentes.value.filter((p) => selecionadas.value.includes(p.id)))
const total = computed(() => escolhidas.value.reduce((soma, p) => soma + p.totalCentavos, 0))
const ajustes = computed(() => resumoAjustes(escolhidas.value))
const ajustesPix = computed(() => resumoAjustes(aberto.value?.itens ?? []))
const recebido = computed(
  () => dados.value?.parcelas.reduce((soma, p) => soma + (p.recebidoCentavos ?? 0), 0) ?? 0,
)
const totalContrato = computed(
  () =>
    dados.value?.parcelas.reduce(
      (soma, p) => soma + p.nominalCentavos - (p.descontoFixoCentavos ?? 0),
      0,
    ) ?? 0,
)
const habilitado = computed(() => dados.value?.pixManual || dados.value?.mercadoPago)
const exibePagamento = computed(() => !!aberto.value || escolhidas.value.length > 0)
const tokenValido = computed(() => /^[a-f0-9]{64}$/.test(token.value))
const hoje = computed(() => dia(new Date(agora.value)))
const marcos = computed(() => {
  if (!dados.value) return []
  const pontos: { titulo: string; data: string; estado: 'pago' | 'atual' | 'previsto' }[] = []
  const { parcelas, dataContratacao } = dados.value
  const recebimentos = parcelas.flatMap((p) => (p.recebidoEm ? [p.recebidoEm] : [])).sort()
  const ultimaParcela = parcelas.at(-1)
  if (dataContratacao)
    pontos.push({ titulo: 'Empréstimo registrado', data: dataContratacao, estado: 'pago' })
  if (recebimentos[0])
    pontos.push({ titulo: 'Primeira parcela paga', data: recebimentos[0], estado: 'pago' })
  if (proxima.value) {
    pontos.push({
      titulo: `Parcela atual (${proxima.value.numero}/${parcelas.length})`,
      data: proxima.value.vencimento,
      estado: 'atual',
    })
    if (ultimaParcela)
      pontos.push({
        titulo: 'Quitação prevista',
        data: ultimaParcela.vencimento,
        estado: 'previsto',
      })
  } else if (recebimentos.length) {
    pontos.push({ titulo: 'Empréstimo quitado', data: recebimentos.at(-1)!, estado: 'pago' })
  }
  return pontos
})

type ParcelaPublica = EmprestimoPublico['parcelas'][number]
function situacaoParcela(p: ParcelaPublica) {
  if (p.recebidoEm)
    return { label: 'Paga', classe: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
  if (dia(new Date(p.vencimento)) < hoje.value)
    return { label: 'Em atraso', classe: 'bg-red-100 text-red-800', icon: Clock3 }
  if (p.id === proxima.value?.id)
    return { label: 'Em aberto', classe: 'bg-amber-100 text-amber-800', icon: Clock3 }
  return { label: 'A vencer', classe: 'bg-slate-100 text-slate-700', icon: Clock3 }
}

const parcelasExibidas = computed(() =>
  (dados.value?.parcelas ?? []).map((parcela) => ({
    parcela,
    situacao: situacaoParcela(parcela),
    ajustes: parcela.recebidoEm ? '' : resumoAjustes([parcela]),
  })),
)

async function irAoPagamento(id?: number) {
  if (!aberto.value) {
    const parcela = id ?? (!escolhidas.value.length ? proxima.value?.id : undefined)
    if (parcela !== undefined) selecionadas.value = [parcela]
  }
  await nextTick()
  painelPagamento.value?.focus()
}

let request = 0
let consultando = false

function atualizar(estado: EmprestimoPublico) {
  dados.value = estado
  selecionadas.value = selecionadas.value.filter((id) => pendentes.value.some((p) => p.id === id))
  if (!metodo.value || (metodo.value === 'PIX_MANUAL' ? !estado.pixManual : !estado.mercadoPago)) {
    metodo.value = estado.pixManual ? 'PIX_MANUAL' : estado.mercadoPago ? 'MERCADO_PAGO' : undefined
  }
}

async function carregar() {
  const seq = ++request
  loading.value = true
  erro.value = ''
  try {
    if (!tokenValido.value) {
      erro.value =
        'Link de acompanhamento inválido. Solicite um novo endereço ao responsável pelo empréstimo.'
      return
    }
    const estado = await emprestimoPublico(token.value).carregar()
    if (seq === request) atualizar(estado)
  } catch (error) {
    if (seq === request) erro.value = mensagemLinkPublico(error)
  } finally {
    if (seq === request) loading.value = false
  }
}

watch(
  token,
  () => {
    dados.value = undefined
    logoComErro.value = ''
    selecionadas.value = []
    metodo.value = undefined
    email.value = ''
    documento.value = ''
    arquivo.value = undefined
    mensagem.value = ''
    confirmarCancelamento.value = false
    void carregar()
  },
  { immediate: true },
)

async function emitir() {
  if (!metodo.value || !escolhidas.value.length || busy.value) return
  busy.value = true
  erro.value = ''
  mensagem.value = ''
  const atual = token.value
  const parcelas = escolhidas.value.map((p) => p.id)
  try {
    const estado = await emprestimoPublico(atual).pagar(
      metodo.value === 'PIX_MANUAL'
        ? { metodo: 'PIX_MANUAL', parcelas, totalCentavos: total.value }
        : {
            metodo: 'MERCADO_PAGO',
            parcelas,
            totalCentavos: total.value,
            email: email.value,
            documento: documento.value,
          },
    )
    if (atual !== token.value) return
    atualizar(estado)
    email.value = ''
    documento.value = ''
    if (!estado.pagamento)
      mensagem.value =
        'Confira a situação das parcelas. Se continuarem em aberto, você pode gerar outro Pix.'
  } catch (error) {
    if (atual !== token.value) return
    const mensagemErro = mensagemEmprestimo(error, 'Não foi possível gerar o Pix.')
    await carregar()
    if (atual === token.value) erro.value = mensagemErro
  } finally {
    busy.value = false
  }
}

async function consultar(cancelar = false, silencioso = false) {
  if (busy.value || consultando || aberto.value?.metodo !== 'MERCADO_PAGO') return
  const atual = token.value
  const pagamento = aberto.value.id
  consultando = true
  if (!silencioso) {
    busy.value = true
    erro.value = ''
    mensagem.value = ''
  }
  try {
    const estado = await emprestimoPublico(atual).consultar(pagamento, cancelar)
    if (atual !== token.value) return
    atualizar(estado)
    if (!estado.pagamento) {
      mensagem.value = cancelar
        ? 'A cobrança foi encerrada. Confira a situação das parcelas.'
        : 'A situação do pagamento foi atualizada.'
      confirmarCancelamento.value = false
    } else if (!silencioso) {
      mensagem.value = 'O Mercado Pago ainda está aguardando a confirmação.'
    }
  } catch (error) {
    if (!silencioso && atual === token.value)
      erro.value = mensagemEmprestimo(
        error,
        'Não foi possível consultar o Mercado Pago. Tente novamente em instantes.',
      )
  } finally {
    consultando = false
    if (!silencioso) busy.value = false
  }
}

const timer = window.setInterval(() => {
  if (document.visibilityState !== 'visible') return
  agora.value = Date.now()
  if (aberto.value?.podeConsultar && !confirmarCancelamento.value) {
    void consultar(false, true)
  }
}, 15_000)
onBeforeUnmount(() => {
  window.clearInterval(timer)
  request++
})

function selecionarArquivo(event: Event) {
  arquivo.value = (event.target as HTMLInputElement).files?.[0]
}
async function enviarComprovante() {
  if (!arquivo.value || !aberto.value || busy.value) return
  erro.value = ''
  mensagem.value = ''
  if (arquivo.value.size > 3 * 1024 * 1024) {
    erro.value = 'O comprovante deve ter até 3 MB.'
    return
  }
  busy.value = true
  const atual = token.value
  try {
    const estado = await emprestimoPublico(atual).enviarComprovante(aberto.value.id, arquivo.value)
    if (atual !== token.value) return
    atualizar(estado)
    arquivo.value = undefined
    mensagem.value = 'Comprovante enviado. Aguarde a confirmação do responsável pelo empréstimo.'
  } catch (error) {
    if (atual === token.value)
      erro.value = mensagemEmprestimo(error, 'Não foi possível enviar o comprovante.')
  } finally {
    busy.value = false
  }
}

async function copiar() {
  if (
    !aberto.value?.pixCopiaCola ||
    (aberto.value.expiraEm && Date.parse(aberto.value.expiraEm) <= Date.now())
  )
    return
  try {
    await navigator.clipboard.writeText(aberto.value.pixCopiaCola)
    mensagem.value = 'Código Pix copiado.'
  } catch {
    mensagem.value = 'Selecione e copie o código Pix exibido.'
  }
}
</script>

<template>
  <div class="loan-public flex min-h-dvh flex-col text-foreground">
    <header class="border-b border-blue-100/90 bg-white/75">
      <div
        class="mx-auto flex max-w-[96rem] items-center justify-between gap-3 px-4 py-3 sm:px-7 lg:px-9"
      >
        <div class="flex min-w-0 items-center gap-3 sm:gap-6">
          <div class="flex min-w-0 items-center gap-2.5">
            <div
              aria-hidden="true"
              class="grid size-9 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-primary sm:size-11"
            >
              <img
                v-if="logoEmpresa && logoComErro !== logoEmpresa"
                :src="logoEmpresa"
                alt=""
                width="44"
                height="44"
                referrerpolicy="no-referrer"
                class="size-full rounded-[inherit] bg-white object-contain"
                @error="logoComErro = logoEmpresa"
              />
              <span v-else-if="iniciaisEmpresa">{{ iniciaisEmpresa }}</span>
              <Building2 v-else class="size-5" />
            </div>
            <div class="min-w-0 leading-tight">
              <p class="break-words text-sm font-bold tracking-tight sm:text-xl">
                {{ empresa || 'Empréstimos' }}
              </p>
              <p v-if="empresa" class="text-xs font-medium text-muted-foreground sm:text-sm">
                Empréstimos
              </p>
            </div>
          </div>
          <span aria-hidden="true" class="hidden h-8 w-px bg-border md:block" />
          <span class="hidden text-sm font-semibold text-muted-foreground md:block"
            >Acompanhamento do empréstimo</span
          >
        </div>
        <details class="relative shrink-0">
          <summary
            class="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"
          >
            <Headphones class="size-4 shrink-0" aria-hidden="true" />
            <span class="sm:hidden">Ajuda</span
            ><span class="hidden sm:inline">Precisa de ajuda?</span>
          </summary>
          <div
            class="public-card absolute right-0 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] p-4 text-sm"
          >
            <p class="font-semibold">{{ empresa || 'Ajuda com o empréstimo' }}</p>
            <p class="mt-1 text-muted-foreground">
              Entre em contato pelo mesmo canal em que você recebeu este link.
            </p>
          </div>
        </details>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[96rem] flex-1 px-4 pb-12 pt-5 sm:px-7 sm:pt-7 lg:px-9">
      <div v-if="!dados" class="public-card mx-auto max-w-xl space-y-3 p-6 sm:mt-8">
        <h1 class="text-xl font-bold tracking-tight">Acompanhe seu empréstimo</h1>
        <p v-if="loading" class="text-sm text-muted-foreground" role="status">
          Carregando empréstimo…
        </p>
        <p v-if="erro" class="text-sm text-destructive" role="alert">{{ erro }}</p>
        <Button v-if="erro && tokenValido" variant="outline" @click="carregar"
          >Tentar novamente</Button
        >
      </div>

      <template v-if="dados">
        <div v-if="!exibePagamento && (erro || mensagem)" class="mb-4">
          <p
            v-if="erro"
            role="alert"
            class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-destructive"
          >
            {{ erro }}
          </p>
          <p
            v-if="mensagem"
            role="status"
            class="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm"
          >
            {{ mensagem }}
          </p>
        </div>

        <div
          class="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] lg:items-start"
        >
          <div class="contents lg:block lg:min-w-0 lg:space-y-5">
            <div class="order-1 min-w-0 space-y-5 lg:order-none">
              <div class="space-y-1">
                <h1 class="break-words text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
                  {{ primeiroNome ? `Olá, ${primeiroNome}!` : 'Acompanhe seu empréstimo' }}
                </h1>
                <p class="text-sm text-muted-foreground sm:text-base">
                  Consulte suas parcelas, vencimentos e pagamentos.
                </p>
              </div>

              <div class="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.23fr)_minmax(0,1fr)]">
                <section
                  aria-labelledby="emprestimo-resumo"
                  class="loan-hero min-w-0 space-y-5 rounded-2xl p-4 text-white shadow-sm sm:p-5"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2.5">
                    <div class="flex min-w-0 items-center gap-3">
                      <span
                        class="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 sm:size-12"
                      >
                        <WalletCards class="size-5 sm:size-6" aria-hidden="true" />
                      </span>
                      <div class="min-w-0">
                        <h2 id="emprestimo-resumo" class="text-lg font-bold tracking-tight">
                          Seu empréstimo
                        </h2>
                        <p
                          v-if="dados.referencia"
                          class="break-words text-xs text-blue-50 sm:text-sm"
                        >
                          {{ dados.referencia }}
                        </p>
                      </div>
                    </div>
                    <span
                      class="rounded-full px-3 py-1 text-xs font-semibold"
                      :class="
                        proxima ? 'bg-white/15 text-white' : 'bg-emerald-100 text-emerald-900'
                      "
                    >
                      {{ proxima ? 'Ativo' : 'Quitado' }}
                    </span>
                  </div>
                  <dl
                    class="grid grid-cols-[1.35fr_.66fr_1fr] divide-x divide-blue-100/25 border-t border-blue-100/25 pt-4"
                  >
                    <div class="min-w-0 pr-2.5">
                      <dt class="text-xs text-blue-100 sm:text-sm">Valor contratado</dt>
                      <dd class="mt-1 break-words text-sm font-bold tabular-nums sm:text-lg">
                        {{ moeda(dados.principalCentavos) }}
                      </dd>
                    </div>
                    <div class="min-w-0 px-2.5 sm:px-3">
                      <dt class="text-xs text-blue-100 sm:text-sm">Parcelas</dt>
                      <dd class="mt-1 text-sm font-bold tabular-nums sm:text-lg">
                        {{ dados.parcelas.length }}x
                      </dd>
                    </div>
                    <div class="min-w-0 pl-2.5 sm:pl-3">
                      <dt class="text-xs text-blue-100 sm:text-sm">Juros do contrato</dt>
                      <dd class="mt-1 text-sm font-bold tabular-nums sm:text-lg">
                        {{ percentual(dados.jurosBps) }}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section
                  aria-label="Progresso dos pagamentos"
                  class="public-card grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 p-4 sm:gap-4 sm:p-5"
                >
                  <div
                    class="progress-ring grid size-[6rem] shrink-0 place-items-center rounded-full p-2 sm:size-[7rem] xl:size-[7.75rem]"
                    :style="{ '--progresso': `${progresso}%` }"
                    role="progressbar"
                    aria-label="Parcelas pagas"
                    :aria-valuenow="Math.round(progresso)"
                    :aria-valuetext="`${pagas} de ${dados.parcelas.length} parcelas pagas`"
                  >
                    <div class="grid size-full content-center rounded-full bg-white text-center">
                      <span class="text-base font-bold tracking-tight tabular-nums sm:text-lg"
                        >{{ pagas }} de {{ dados.parcelas.length }}</span
                      >
                      <span class="text-[0.66rem] font-medium text-muted-foreground sm:text-xs"
                        >parcelas pagas</span
                      >
                    </div>
                  </div>
                  <dl class="min-w-0 space-y-2 border-l pl-3 sm:pl-4">
                    <div>
                      <dt class="text-xs font-medium text-muted-foreground sm:text-sm">
                        Pago até agora
                      </dt>
                      <dd
                        class="mt-0.5 break-words text-base font-bold text-emerald-700 tabular-nums sm:text-xl"
                      >
                        {{ moeda(recebido) }}
                      </dd>
                    </div>
                    <div class="border-t pt-2">
                      <dt class="text-xs font-medium text-muted-foreground sm:text-sm">
                        Saldo em aberto
                      </dt>
                      <dd class="mt-0.5 break-words text-base font-bold tabular-nums sm:text-xl">
                        {{ moeda(saldo) }}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>

            <section
              aria-labelledby="parcelas-emprestimo"
              class="public-card order-3 min-w-0 overflow-hidden lg:order-none"
            >
              <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div class="min-w-0 space-y-1">
                  <h2
                    id="parcelas-emprestimo"
                    class="flex items-center gap-2 text-base font-bold tracking-tight sm:text-xl"
                  >
                    <CalendarDays class="size-5 shrink-0 text-primary" aria-hidden="true" />
                    Parcelas do empréstimo
                  </h2>
                  <p
                    v-if="proxima && habilitado && !aberto"
                    class="text-xs text-muted-foreground sm:text-sm"
                  >
                    Selecione uma ou mais parcelas para pagar ou antecipar.
                  </p>
                </div>
                <Button
                  v-if="escolhidas.length && !aberto && habilitado"
                  variant="outline"
                  size="sm"
                  :disabled="busy"
                  @click="irAoPagamento()"
                >
                  {{
                    escolhidas.length === 1
                      ? 'Pagar parcela selecionada'
                      : `Pagar ${escolhidas.length} parcelas`
                  }}
                </Button>
                <Button
                  v-else-if="!aberto"
                  variant="ghost"
                  size="icon"
                  aria-label="Atualizar parcelas"
                  :disabled="loading || busy"
                  @click="carregar"
                >
                  <RefreshCw
                    class="size-4"
                    :class="{ 'animate-spin': loading }"
                    aria-hidden="true"
                  />
                </Button>
              </div>

              <table class="public-table w-full text-left text-sm">
                <thead class="bg-slate-100/80 text-xs font-semibold text-slate-700 sm:text-sm">
                  <tr>
                    <th scope="col">Parcela</th>
                    <th scope="col" class="hidden sm:table-cell">Vencimento</th>
                    <th scope="col">Valor</th>
                    <th scope="col" class="hidden md:table-cell">Situação</th>
                    <th v-if="habilitado && !aberto && proxima" scope="col" class="text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="{ parcela: p, situacao, ajustes: detalhamento } in parcelasExibidas"
                    :key="p.id"
                    class="transition-colors hover:bg-slate-50"
                    :class="{ 'bg-blue-50': p.id === proxima?.id || selecionadas.includes(p.id) }"
                  >
                    <th scope="row" class="font-semibold">
                      <div class="flex items-start gap-1.5 sm:gap-2">
                        <input
                          v-if="!p.recebidoEm && habilitado && !aberto"
                          v-model="selecionadas"
                          :id="`parcela-${p.id}`"
                          :value="p.id"
                          :aria-label="`Pagar parcela ${p.numero}`"
                          :disabled="busy"
                          type="checkbox"
                          class="mt-0.5 size-4 shrink-0 accent-blue-600"
                        />
                        <div class="min-w-0">
                          <template v-if="!p.recebidoEm && habilitado && !aberto">
                            <label
                              :for="`parcela-${p.id}`"
                              class="cursor-pointer whitespace-nowrap tabular-nums"
                              >{{ p.numero }}/{{ dados.parcelas.length }}</label
                            >
                          </template>
                          <span v-else class="whitespace-nowrap tabular-nums"
                            >{{ p.numero }}/{{ dados.parcelas.length }}</span
                          >
                          <span
                            class="block whitespace-nowrap text-[0.68rem] font-medium text-muted-foreground sm:hidden"
                            >{{ dataCurta(p.vencimento) }}</span
                          >
                        </div>
                      </div>
                    </th>
                    <td class="hidden whitespace-nowrap tabular-nums sm:table-cell">
                      {{ dataCurta(p.vencimento) }}
                    </td>
                    <td class="min-w-0">
                      <p class="whitespace-nowrap font-semibold tabular-nums">
                        {{ moeda(p.recebidoCentavos ?? p.totalCentavos) }}
                      </p>
                      <p
                        v-if="detalhamento"
                        class="mt-0.5 max-w-44 break-words text-[0.68rem] leading-snug text-muted-foreground"
                      >
                        {{ detalhamento }}
                      </p>
                      <span class="status-pill mt-1 inline-flex md:hidden" :class="situacao.classe">
                        <component :is="situacao.icon" class="size-3" aria-hidden="true" />
                        {{ situacao.label }}
                      </span>
                      <p
                        v-if="p.recebidoEm"
                        class="mt-0.5 text-[0.66rem] text-muted-foreground md:hidden"
                      >
                        Paga em {{ dataCurta(p.recebidoEm) }}
                      </p>
                    </td>
                    <td class="hidden md:table-cell">
                      <span class="status-pill inline-flex" :class="situacao.classe">
                        <component :is="situacao.icon" class="size-3" aria-hidden="true" />
                        {{ situacao.label }}
                      </span>
                      <p
                        v-if="p.recebidoEm"
                        class="mt-1 whitespace-nowrap text-xs text-muted-foreground"
                      >
                        {{ dataCurta(p.recebidoEm) }}
                      </p>
                    </td>
                    <td v-if="habilitado && !aberto && proxima" class="text-right">
                      <Button
                        v-if="!p.recebidoEm"
                        size="sm"
                        :variant="p.id === proxima.id ? 'default' : 'outline'"
                        :aria-label="`Pagar agora parcela ${p.numero}`"
                        :disabled="busy"
                        class="px-2 sm:px-3"
                        @click="irAoPagamento(p.id)"
                      >
                        <CreditCard class="hidden size-3.5 xl:inline" aria-hidden="true" />
                        <span
                          >Pagar<span v-if="p.id === proxima.id" class="hidden xl:inline">
                            agora</span
                          ></span
                        >
                      </Button>
                      <span v-else class="text-slate-400" aria-label="Parcela paga">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          <aside
            aria-label="Pagamento e contrato"
            class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4"
          >
            <div class="order-2 space-y-4 lg:order-none">
              <section aria-labelledby="proxima-parcela" class="public-card space-y-3 p-4 sm:p-5">
                <h2
                  id="proxima-parcela"
                  class="flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg"
                >
                  <CalendarDays class="size-5 text-primary" aria-hidden="true" />
                  {{ proxima ? 'Próxima parcela' : 'Empréstimo quitado' }}
                </h2>
                <template v-if="proxima">
                  <dl class="grid grid-cols-2 divide-x rounded-lg bg-slate-50 p-3">
                    <div class="min-w-0 pr-2.5">
                      <dt class="text-xs font-medium text-muted-foreground">Vencimento</dt>
                      <dd class="mt-1 text-base font-bold tabular-nums sm:text-xl">
                        {{ dataCurta(proxima.vencimento) }}
                      </dd>
                    </div>
                    <div class="min-w-0 pl-2.5 sm:pl-4">
                      <dt class="text-xs font-medium text-muted-foreground">Valor atualizado</dt>
                      <dd class="mt-1 break-words text-base font-bold tabular-nums sm:text-xl">
                        {{ moeda(proxima.totalCentavos) }}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    v-if="habilitado || aberto"
                    class="public-cta w-full"
                    :disabled="busy"
                    @click="irAoPagamento()"
                  >
                    <CreditCard class="size-4" aria-hidden="true" />
                    {{
                      aberto
                        ? 'Ver cobrança'
                        : escolhidas.length
                          ? 'Continuar pagamento'
                          : 'Pagar agora'
                    }}
                  </Button>
                  <p v-else class="text-sm text-muted-foreground">
                    O responsável pelo empréstimo ainda não disponibilizou o pagamento online.
                  </p>
                </template>
                <p v-else class="flex items-center gap-2 text-sm font-medium text-emerald-800">
                  <CheckCircle2 class="size-4" aria-hidden="true" /> Todas as parcelas foram pagas.
                </p>
              </section>

              <section
                v-if="exibePagamento"
                ref="painelPagamento"
                tabindex="-1"
                aria-labelledby="emprestimo-pagamento"
                class="public-card min-w-0 space-y-4 p-4 focus:outline-blue-500 sm:p-5"
              >
                <h2
                  id="emprestimo-pagamento"
                  class="flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg"
                >
                  <QrCode class="size-5 text-primary" aria-hidden="true" /> Pagamento
                </h2>
                <p
                  v-if="erro"
                  role="alert"
                  class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-destructive"
                >
                  {{ erro }}
                </p>
                <p
                  v-if="mensagem"
                  role="status"
                  class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm"
                >
                  {{ mensagem }}
                </p>
                <template v-if="aberto">
                  <div class="rounded-lg bg-muted/50 p-3">
                    <p class="text-xs text-muted-foreground">
                      {{ aberto.metodo === 'PIX_MANUAL' ? 'Pix manual' : 'Pix via Mercado Pago' }} ·
                      Parcelas {{ aberto.itens.map((p) => p.numero).join(', ') }}
                    </p>
                    <p class="text-xl font-semibold tabular-nums">
                      {{ moeda(aberto.totalCentavos) }}
                    </p>
                    <p v-if="ajustesPix" class="text-xs text-muted-foreground">{{ ajustesPix }}</p>
                    <p v-if="aberto.expiraEm" class="text-xs text-muted-foreground">
                      Expira em {{ dataCurta(aberto.expiraEm) }},
                      {{
                        new Date(aberto.expiraEm).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Sao_Paulo',
                        })
                      }}
                    </p>
                  </div>
                  <p v-if="aberto.comprovante" class="flex gap-2 text-sm text-muted-foreground">
                    <ShieldCheck class="size-5 shrink-0 text-primary" /> Comprovante recebido e em
                    análise.
                  </p>
                  <template v-else>
                    <template v-if="aberto.pixCopiaCola">
                      <img
                        v-if="aberto.pixQr"
                        :src="aberto.pixQr"
                        alt="QR Code do Pix"
                        width="176"
                        height="176"
                        class="mx-auto rounded-lg border bg-white p-1"
                      />
                      <div class="space-y-2">
                        <Input
                          aria-label="Código Pix copia e cola"
                          :model-value="aberto.pixCopiaCola"
                          readonly
                          class="text-xs"
                          @focus="($event.target as HTMLInputElement).select()"
                        />
                        <Button variant="outline" class="w-full" @click="copiar"
                          ><Copy class="size-4" /> Copiar código Pix</Button
                        >
                      </div>
                    </template>
                    <p v-else-if="aberto.expirada" class="text-sm text-muted-foreground">
                      {{
                        aberto.metodo === 'PIX_MANUAL'
                          ? 'O prazo desta cotação terminou. Caso já tenha pago, envie o comprovante. Para gerar um novo Pix, fale com o responsável.'
                          : 'O prazo do Pix terminou. Atualize para consultar o pagamento.'
                      }}
                    </p>
                    <p v-else class="text-sm text-muted-foreground">
                      A emissão está pendente. Atualize para retomar a mesma cobrança.
                    </p>
                    <form
                      v-if="aberto.metodo === 'PIX_MANUAL'"
                      class="space-y-2 border-t pt-3"
                      @submit.prevent="enviarComprovante"
                    >
                      <label for="comprovante-emprestimo" class="text-sm font-medium"
                        >Anexar comprovante após pagar</label
                      >
                      <Input
                        id="comprovante-emprestimo"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        @change="selecionarArquivo"
                      />
                      <p class="text-xs text-muted-foreground">PDF, JPG ou PNG de até 3 MB.</p>
                      <Button type="submit" class="w-full" :disabled="!arquivo || busy"
                        ><FileUp class="size-4" /> Enviar comprovante</Button
                      >
                    </form>
                    <div v-else class="space-y-2 border-t pt-3">
                      <p class="text-xs text-muted-foreground">
                        A confirmação do Mercado Pago atualiza as parcelas automaticamente.
                      </p>
                      <Button variant="outline" class="w-full" :disabled="busy" @click="consultar()"
                        ><RefreshCw class="size-4" /> Atualizar pagamento</Button
                      >
                      <Button
                        v-if="aberto.podeConsultar && !confirmarCancelamento"
                        variant="ghost"
                        size="sm"
                        class="w-full"
                        :disabled="busy"
                        @click="confirmarCancelamento = true"
                        >Cancelar cobrança</Button
                      >
                      <div v-if="confirmarCancelamento" class="space-y-2">
                        <p class="text-xs">
                          Se ainda não pagou, confirme o cancelamento para escolher outras parcelas
                          ou outra forma de Pix.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          class="w-full"
                          :disabled="busy"
                          @click="consultar(true)"
                          >Confirmar cancelamento</Button
                        >
                        <Button
                          variant="ghost"
                          size="sm"
                          class="w-full"
                          @click="confirmarCancelamento = false"
                          >Voltar</Button
                        >
                      </div>
                    </div>
                  </template>
                  <Button
                    v-if="aberto.metodo === 'PIX_MANUAL'"
                    variant="ghost"
                    size="sm"
                    class="w-full"
                    :disabled="loading || busy"
                    @click="carregar"
                    >Atualizar situação</Button
                  >
                </template>

                <p v-else-if="!habilitado" class="text-sm text-muted-foreground">
                  O responsável pelo empréstimo ainda não disponibilizou o pagamento online.
                </p>

                <form v-else class="space-y-4" @submit.prevent="emitir">
                  <div class="rounded-lg bg-muted/50 p-3">
                    <p class="text-xs text-muted-foreground">
                      {{
                        escolhidas.length
                          ? escolhidas.length === 1
                            ? '1 parcela selecionada'
                            : escolhidas.length + ' parcelas selecionadas'
                          : 'Selecione as parcelas'
                      }}
                    </p>
                    <p class="text-xl font-semibold tabular-nums">{{ moeda(total) }}</p>
                    <p v-if="ajustes" class="text-xs text-muted-foreground">{{ ajustes }}</p>
                    <p v-else-if="regraAntecipacao" class="text-xs text-muted-foreground">
                      Desconto ao antecipar · {{ regraAntecipacao }}
                    </p>
                  </div>
                  <fieldset class="space-y-2">
                    <legend class="mb-2 text-sm font-semibold">Forma de pagamento</legend>
                    <label
                      v-if="dados.pixManual"
                      class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
                    >
                      <input
                        v-model="metodo"
                        type="radio"
                        name="metodo"
                        value="PIX_MANUAL"
                        class="size-4 accent-primary"
                      />
                      Pix manual
                    </label>
                    <label
                      v-if="dados.mercadoPago"
                      class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
                    >
                      <input
                        v-model="metodo"
                        type="radio"
                        name="metodo"
                        value="MERCADO_PAGO"
                        class="size-4 accent-primary"
                      />
                      Pix via Mercado Pago
                    </label>
                  </fieldset>
                  <div v-if="metodo === 'MERCADO_PAGO'" class="space-y-2">
                    <label class="block space-y-1 text-sm"
                      ><span>E-mail do pagador</span
                      ><Input
                        v-model="email"
                        type="email"
                        autocomplete="email"
                        maxlength="191"
                        required
                    /></label>
                    <label class="block space-y-1 text-sm"
                      ><span>CPF ou CNPJ do pagador</span
                      ><Input
                        v-model="documento"
                        v-maska="cpfCnpjMaskOptions"
                        inputmode="numeric"
                        required
                    /></label>
                  </div>
                  <Button
                    type="submit"
                    class="w-full"
                    :disabled="busy || !escolhidas.length || !metodo"
                    >{{ busy ? 'Gerando Pix…' : 'Gerar Pix' }}</Button
                  >
                </form>
              </section>
            </div>

            <div class="order-4 space-y-4 lg:order-none">
              <section
                v-if="dados.cliente?.nome"
                aria-labelledby="dados-cliente"
                class="public-card p-4 sm:p-5"
              >
                <h2
                  id="dados-cliente"
                  class="flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg"
                >
                  <UserRound class="size-5 text-primary" aria-hidden="true" /> Dados do cliente
                </h2>
                <dl class="mt-3 divide-y text-sm">
                  <div class="contract-row">
                    <dt>Nome</dt>
                    <dd>{{ dados.cliente.nome }}</dd>
                  </div>
                  <div v-if="dados.cliente.documento" class="contract-row">
                    <dt>{{ dados.cliente.documento.tipo }}</dt>
                    <dd>{{ dados.cliente.documento.mascarado }}</dd>
                  </div>
                  <div v-if="dados.cliente.emailMascarado" class="contract-row">
                    <dt>E-mail</dt>
                    <dd>{{ dados.cliente.emailMascarado }}</dd>
                  </div>
                  <div v-if="dados.cliente.telefoneMascarado" class="contract-row">
                    <dt>Telefone</dt>
                    <dd>{{ dados.cliente.telefoneMascarado }}</dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby="resumo-contrato" class="public-card p-4 sm:p-5">
                <h2
                  id="resumo-contrato"
                  class="flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg"
                >
                  <FileText class="size-5 text-primary" aria-hidden="true" /> Resumo do contrato
                </h2>
                <dl class="mt-3 divide-y text-sm">
                  <div v-if="dados.referencia" class="contract-row">
                    <dt>Contrato</dt>
                    <dd>{{ dados.referencia }}</dd>
                  </div>
                  <div v-if="dados.dataContratacao" class="contract-row">
                    <dt>Data da contratação</dt>
                    <dd>{{ dataCurta(dados.dataContratacao) }}</dd>
                  </div>
                  <div class="contract-row">
                    <dt>Total sem atraso</dt>
                    <dd>{{ moeda(totalContrato) }}</dd>
                  </div>
                  <div class="contract-row">
                    <dt>Juros do contrato</dt>
                    <dd>{{ percentual(dados.jurosBps) }}</dd>
                  </div>
                  <div v-if="dados.jurosMoraBps" class="contract-row">
                    <dt>Juros por atraso</dt>
                    <dd>{{ percentual(dados.jurosMoraBps) }} ao mês</dd>
                  </div>
                  <div v-if="dados.multaBps" class="contract-row">
                    <dt>Multa por atraso</dt>
                    <dd>{{ percentual(dados.multaBps) }}</dd>
                  </div>
                  <div v-if="dados.descontoFixoCentavos" class="contract-row">
                    <dt>Desconto fixo</dt>
                    <dd>{{ moeda(dados.descontoFixoCentavos) }}</dd>
                  </div>
                  <div v-if="regraAntecipacao" class="contract-row">
                    <dt>Desconto por antecipação</dt>
                    <dd>{{ regraAntecipacao }}</dd>
                  </div>
                </dl>
              </section>

              <section
                v-if="marcos.length"
                aria-labelledby="linha-do-tempo"
                class="public-card p-4 sm:p-5"
              >
                <h2
                  id="linha-do-tempo"
                  class="flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg"
                >
                  <Timer class="size-5 text-primary" aria-hidden="true" /> Linha do tempo
                </h2>
                <ol class="mt-4">
                  <li
                    v-for="marco in marcos"
                    :key="marco.titulo"
                    class="timeline-item relative flex gap-3 pb-4 last:pb-0"
                  >
                    <span
                      class="grid size-6 shrink-0 place-items-center rounded-full border-2"
                      :class="{
                        'border-emerald-600 bg-emerald-600 text-white': marco.estado === 'pago',
                        'border-blue-600 bg-white': marco.estado === 'atual',
                        'border-slate-300 bg-white': marco.estado === 'previsto',
                      }"
                      aria-hidden="true"
                    >
                      <CheckCircle2 v-if="marco.estado === 'pago'" class="size-3.5" />
                    </span>
                    <div>
                      <p class="text-sm font-semibold">{{ marco.titulo }}</p>
                      <p class="text-xs text-muted-foreground">{{ dataCurta(marco.data) }}</p>
                    </div>
                  </li>
                </ol>
              </section>
            </div>
          </aside>
        </div>
      </template>
    </main>
    <div class="loan-wave" aria-hidden="true" />
  </div>
</template>

<style scoped>
.loan-public {
  color-scheme: light;
  --background: 220 60% 98%;
  --foreground: 223 57% 13%;
  --card: 0 0% 100%;
  --card-foreground: 223 57% 13%;
  --primary: 220 94% 43%;
  --primary-foreground: 0 0% 100%;
  --muted: 220 34% 94%;
  --muted-foreground: 218 24% 32%;
  --accent: 220 67% 95%;
  --accent-foreground: 223 57% 13%;
  --border: 218 39% 87%;
  --input: 218 40% 81%;
  --ring: 218 94% 46%;
  --destructive: 0 73% 40%;
  background: radial-gradient(ellipse at 75% 100%, #e5eeff, transparent 60%), #f3f6fc;
}
.public-card {
  border: 1px solid #dbe4f4;
  border-radius: 1rem;
  background: #fff;
  box-shadow:
    0 2px 5px #213d7410,
    0 9px 22px #213d7408;
}
.loan-hero {
  background: linear-gradient(145deg, #075de5 0%, #0649bc 55%, #063690 100%);
}
.progress-ring {
  background: conic-gradient(#128642 var(--progresso), #e3e9f2 0);
}
.public-cta {
  min-height: 2.75rem;
}
.contract-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0;
}
.contract-row dt {
  color: hsl(var(--muted-foreground));
}
.contract-row dd {
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}
.timeline-item:not(:last-child)::before {
  position: absolute;
  top: 1.5rem;
  bottom: 0;
  left: 0.69rem;
  width: 2px;
  background: #dbe4f4;
  content: '';
}
.public-table th,
.public-table td {
  padding: 0.72rem 0.55rem;
  vertical-align: middle;
}
.public-table th:first-child,
.public-table td:first-child {
  padding-left: 1rem;
}
.public-table th:last-child,
.public-table td:last-child {
  padding-right: 1rem;
}
.status-pill {
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  border-radius: 999px;
  padding: 0.2rem 0.45rem;
  font-size: 0.68rem;
  font-weight: 600;
}
.loan-wave {
  height: 1.45rem;
  background: linear-gradient(100deg, #104fd4, #5ca8ed);
  border-radius: 52% 35% 0 0 / 68% 82% 0 0;
  transform: translateZ(0);
}
</style>
