<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, Check, UserPlus, WalletCards } from 'lucide-vue-next'
import { vMaska } from 'maska/vue'
import { parseISO } from 'date-fns'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FormSelect from '@/modofacil/components/FormSelect.vue'
import { Switch } from '@/components/ui/switch'
import { cpfCnpjMaskOptions, moneyMaskOptions } from '@/lib/imaska'
import { ClienteRepository } from '@/repositories/cliente-repository'
import {
  emprestimos,
  mensagemEmprestimo,
  type TermosSimulacao,
} from '@/repositories/emprestimo-repository'
import type { MetodoPagamentoFinanceiro } from '@/types/schemas'
import { randomUUID } from '@/utils/uuid'
import { dia, diaDoCalendario, formas } from './format'
import PrevisaoParcelas from './PrevisaoParcelas.vue'

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ salvo: [id: number] }>()
const etapas = ['Dados', 'Juros e descontos', 'Financeiro']
type ModoAntecipacao = 'padrao' | 'percentual' | 'valor' | 'juros' | 'sem'
const modosAntecipacao: { value: ModoAntecipacao; label: string }[] = [
  { value: 'padrao', label: 'Padrão da conta' },
  { value: 'percentual', label: 'Percentual da parcela' },
  { value: 'valor', label: 'Valor fixo por parcela' },
  { value: 'juros', label: 'Percentual dos juros' },
  { value: 'sem', label: 'Sem desconto por antecipação' },
]
const instrucoesAntecipacao: Record<ModoAntecipacao, string> = {
  padrao: 'Aplica o percentual da conta sobre os juros do contrato.',
  percentual: 'Aplica o percentual ao valor da parcela após o desconto fixo do contrato.',
  valor: 'Abate um valor de cada parcela paga antes da data de vencimento.',
  juros: 'Aplica o percentual apenas aos juros do contrato incluídos na parcela.',
  sem: 'As parcelas antecipadas mantêm o valor previsto para o vencimento.',
}
const campos = () => ({
  clienteId: null as string | number | null,
  valor: '',
  juros: '0',
  jurosMora: '',
  multa: '',
  descontoFixo: '',
  modoAntecipacao: 'padrao' as ModoAntecipacao,
  descontoAntecipacao: '',
  numeroParcelas: 1,
  dataSaida: dia(),
  primeiroVencimento: '',
  formaSaida: 'PIX' as MetodoPagamentoFinanceiro,
  origem: 'avulso',
  contaSaidaId: null as string | number | null,
  lancamentoAutomatico: true,
  contaEntradaId: null as string | number | null,
  categoriaId: null as string | number | null,
})
const form = reactive(campos())
const novo = reactive({ nome: '', email: '', documento: '' })
const clienteAberto = ref(false)
const erroCliente = ref('')
const erro = ref('')
const salvando = ref(false)
const salvandoCliente = ref(false)
const etapa = ref(0)
const inicioEtapas = ref<HTMLOListElement>()
const diasSimulacao = ref<number | string>(0)
let chave = ''
const emCentavos = (valor: string) => Math.round(Number(valor.replace(',', '.')) * 100)
const principal = computed(() => emCentavos(form.valor))
const jurosBps = computed(() => emCentavos(form.juros))
const jurosMoraBps = computed(() => emCentavos(form.jurosMora))
const multaBps = computed(() => emCentavos(form.multa))
const descontoFixo = computed(() => emCentavos(form.descontoFixo))
const valorAntecipacao = computed(() => emCentavos(form.descontoAntecipacao))
const usaValorAntecipacao = computed(() =>
  ['percentual', 'valor', 'juros'].includes(form.modoAntecipacao),
)
const categoriasVisiveis = computed(() => form.origem === 'conta' || form.lancamentoAutomatico)
const erroValores = computed(() => {
  if (!(principal.value > 0) || !form.dataSaida || !form.primeiroVencimento) {
    return 'Informe o valor emprestado e as datas do empréstimo.'
  }
  if (form.dataSaida > dia() || form.primeiroVencimento < form.dataSaida) {
    return 'A data da saída deve ser até hoje, e o vencimento deve ser a partir da saída.'
  }
  if (
    !Number.isInteger(form.numeroParcelas) ||
    form.numeroParcelas < 1 ||
    form.numeroParcelas > 120
  ) {
    return 'Informe de 1 a 120 parcelas.'
  }
  if (principal.value > 100_000_000 || principal.value < form.numeroParcelas) {
    return 'Informe até R$ 1.000.000,00 e pelo menos um centavo de principal por parcela.'
  }
  return ''
})
const erroCondicoes = computed(() => {
  if (!(jurosBps.value >= 0 && jurosBps.value <= 100_000)) {
    return 'Informe juros sobre o valor emprestado entre 0% e 1.000%.'
  }
  if (![jurosMoraBps.value, multaBps.value].every((valor) => valor >= 0 && valor <= 10_000)) {
    return 'Informe juros por atraso e multa entre 0% e 100%.'
  }
  if (!(descontoFixo.value >= 0 && principal.value - descontoFixo.value >= form.numeroParcelas)) {
    return 'O desconto deve deixar pelo menos um centavo de principal por parcela.'
  }
  if (form.modoAntecipacao === 'juros' && jurosBps.value === 0) {
    return 'Informe juros do contrato ou escolha outra forma de desconto por antecipação.'
  }
  if (usaValorAntecipacao.value) {
    const limite = form.modoAntecipacao === 'valor' ? 100_000_000 : 10_000
    if (!(valorAntecipacao.value > 0 && valorAntecipacao.value <= limite)) {
      return form.modoAntecipacao === 'valor'
        ? 'Informe de R$ 0,01 a R$ 1.000.000,00 para o desconto por parcela.'
        : 'Informe de 0,01% a 100% para o desconto por antecipação.'
    }
  }
  return ''
})
const termosSimulacao = computed<TermosSimulacao | undefined>(() => {
  if (!open.value || erroValores.value || erroCondicoes.value) return
  return {
    principalCentavos: principal.value,
    dataSaida: form.dataSaida,
    primeiroVencimento: form.primeiroVencimento,
    jurosBps: jurosBps.value,
    jurosMoraBps: jurosMoraBps.value,
    multaBps: multaBps.value,
    descontoFixoCentavos: descontoFixo.value,
    descontoJurosBps:
      form.modoAntecipacao === 'padrao'
        ? null
        : form.modoAntecipacao === 'juros'
          ? valorAntecipacao.value
          : 0,
    antecipacaoParcelaBps: form.modoAntecipacao === 'percentual' ? valorAntecipacao.value : 0,
    antecipacaoParcelaCentavos: form.modoAntecipacao === 'valor' ? valorAntecipacao.value : 0,
    numeroParcelas: form.numeroParcelas,
  }
})

watch(
  open,
  (value) => {
    if (!value) return
    chave = ''
    etapa.value = 0
    diasSimulacao.value = 0
    Object.assign(form, campos())
    Object.assign(novo, { nome: '', email: '', documento: '' })
    clienteAberto.value = false
    erro.value = ''
    erroCliente.value = ''
  },
  { immediate: true },
)

function mudarModoAntecipacao(modo: ModoAntecipacao) {
  form.modoAntecipacao = modo
  form.descontoAntecipacao = ''
  diasSimulacao.value = modo === 'sem' ? 0 : -7
  erro.value = ''
}

function irParaEtapa(indice: number) {
  etapa.value = indice
  erro.value = ''
  void nextTick(() => {
    const inicio = inicioEtapas.value
    inicio?.scrollIntoView({ block: 'nearest' })
    inicio?.querySelector<HTMLElement>('[aria-current="step"]')?.focus({ preventScroll: true })
  })
}

async function cadastrarCliente() {
  if (!novo.nome.trim() || salvandoCliente.value) return
  salvandoCliente.value = true
  erroCliente.value = ''
  try {
    const { data } = await ClienteRepository.save({
      nome: novo.nome.trim(),
      email: novo.email.trim() || undefined,
      documento: novo.documento || undefined,
      status: 'ATIVO',
      tipo: 'CLIENTE',
    })
    if (!data?.id) throw new Error()
    form.clienteId = data.id
    clienteAberto.value = false
    Object.assign(novo, { nome: '', email: '', documento: '' })
  } catch (error) {
    erroCliente.value = mensagemEmprestimo(error, 'Não foi possível cadastrar o cliente.')
  } finally {
    salvandoCliente.value = false
  }
}

async function salvar() {
  if (salvando.value || clienteAberto.value) return
  erro.value = ''
  const erroDados = form.clienteId ? erroValores.value : 'Selecione o cliente do empréstimo.'
  if (erroDados) {
    if (etapa.value !== 0) irParaEtapa(0)
    erro.value = erroDados
    return
  }
  if (etapa.value === 0) {
    irParaEtapa(1)
    return
  }
  const termos = termosSimulacao.value
  if (!termos) {
    if (etapa.value !== 1) irParaEtapa(1)
    erro.value = erroCondicoes.value
    return
  }
  if (etapa.value === 1) {
    irParaEtapa(2)
    return
  }
  if (
    (form.origem === 'conta' && !form.contaSaidaId) ||
    (form.lancamentoAutomatico && !form.contaEntradaId) ||
    (categoriasVisiveis.value && !form.categoriaId)
  ) {
    erro.value = 'Preencha a conta financeira e a categoria dos lançamentos.'
    return
  }
  salvando.value = true
  try {
    const { id } = await emprestimos.criar({
      ...termos,
      chaveOperacao: (chave ||= randomUUID()),
      clienteId: Number(form.clienteId),
      formaSaida: form.formaSaida,
      contaSaidaId: form.origem === 'conta' ? Number(form.contaSaidaId) : null,
      contaEntradaId: form.lancamentoAutomatico ? Number(form.contaEntradaId) : null,
      categoriaId: categoriasVisiveis.value ? Number(form.categoriaId) : null,
      lancamentoAutomatico: form.lancamentoAutomatico,
    })
    open.value = false
    emit('salvo', id)
  } catch (error) {
    erro.value = mensagemEmprestimo(error, 'Não foi possível registrar o empréstimo.')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    title="Novo empréstimo"
    description="Informe os dados, defina as condições e revise os pagamentos."
    :icon="WalletCards"
    size="6xl"
    content-class="max-h-[92dvh] gap-0 overflow-hidden md:w-[calc(100%-2rem)] md:rounded-2xl"
    header-class="shrink-0 border-b px-4 pb-3 pt-4 text-left sm:px-6 md:pt-5"
    body-class="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-py-4 px-4 py-4 sm:px-6"
  >
    <ol
      ref="inicioEtapas"
      aria-label="Etapas do empréstimo"
      class="mb-4 grid grid-cols-3 gap-1.5 sm:gap-2"
    >
      <li
        v-for="(nome, indice) in etapas"
        :key="nome"
        :aria-current="indice === etapa ? 'step' : undefined"
        :tabindex="indice === etapa ? -1 : undefined"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-center text-xs font-medium sm:flex-row sm:gap-2 sm:px-3 sm:text-sm"
        :class="
          indice === etapa
            ? 'border-primary/40 bg-primary/10 text-foreground'
            : 'bg-card text-muted-foreground'
        "
      >
        <span
          aria-hidden="true"
          class="grid size-5 shrink-0 place-items-center rounded-full text-xs"
          :class="indice === etapa ? 'bg-primary text-primary-foreground' : 'bg-muted'"
        >
          <Check v-if="indice < etapa" class="size-3" />
          <template v-else>{{ indice + 1 }}</template>
        </span>
        {{ nome }}
      </li>
    </ol>
    <div class="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <section v-if="etapa === 0" class="min-w-0 space-y-3 lg:col-start-1 lg:row-start-1">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <Label for="emprestimo-cliente">Cliente</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            :aria-expanded="clienteAberto"
            aria-controls="emprestimo-novo-cliente"
            :disabled="salvando || salvandoCliente"
            @click="clienteAberto = !clienteAberto"
          >
            <UserPlus class="size-4" /> Cadastrar cliente
          </Button>
        </div>
        <Select2Ajax
          id="emprestimo-cliente"
          v-model="form.clienteId"
          aria-label="Cliente"
          url="/clientes/select2"
          linked-kind="cliente"
          :params="[{ key: 'clienteAtivo', value: true }]"
          :disabled="salvando"
          placeholder="Buscar cliente ativo"
        />
        <form
          v-if="clienteAberto"
          id="emprestimo-novo-cliente"
          class="space-y-4 rounded-xl border bg-muted/30 p-4"
          @submit.prevent="cadastrarCliente"
        >
          <fieldset :disabled="salvandoCliente" class="grid min-w-0 gap-4 sm:grid-cols-2">
            <div class="space-y-2 sm:col-span-2">
              <Label for="emprestimo-cliente-nome">Nome</Label>
              <Input
                id="emprestimo-cliente-nome"
                v-model="novo.nome"
                required
                maxlength="191"
                autocomplete="off"
              />
            </div>
            <div class="space-y-2">
              <Label for="emprestimo-cliente-email">E-mail (opcional)</Label>
              <Input
                id="emprestimo-cliente-email"
                v-model="novo.email"
                type="email"
                maxlength="191"
                autocomplete="off"
              />
            </div>
            <div class="space-y-2">
              <Label for="emprestimo-cliente-documento">CPF ou CNPJ (opcional)</Label>
              <Input
                id="emprestimo-cliente-documento"
                v-model="novo.documento"
                v-maska="cpfCnpjMaskOptions"
                inputmode="numeric"
              />
            </div>
          </fieldset>
          <p v-if="erroCliente" role="alert" class="text-sm text-destructive">{{ erroCliente }}</p>
          <div class="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="salvandoCliente"
              @click="clienteAberto = false"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" :disabled="salvandoCliente">
              {{ salvandoCliente ? 'Cadastrando…' : 'Salvar cliente' }}
            </Button>
          </div>
        </form>
      </section>

      <form
        id="emprestimo-cadastro-form"
        class="min-w-0 space-y-4 lg:col-start-1"
        :class="etapa === 0 ? 'lg:row-start-2' : 'lg:row-start-1'"
        @submit.prevent="salvar"
      >
        <fieldset
          v-if="etapa === 0"
          class="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-2"
          :disabled="salvando"
        >
          <legend class="px-1 text-sm font-medium">Valor e parcelas</legend>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-valor" class="block leading-5">Valor emprestado (R$)</Label>
            <Input
              id="emprestimo-valor"
              v-model="form.valor"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0,00"
              required
            />
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-parcelas" class="block leading-5">Número de parcelas</Label>
            <Input
              id="emprestimo-parcelas"
              v-model.number="form.numeroParcelas"
              type="number"
              min="1"
              max="120"
              required
            />
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="dp-input-emprestimo-saida" class="block leading-5">Data da saída</Label>
            <Calendarpicker
              uid="emprestimo-saida"
              :aria-labels="{ input: 'Data da saída' }"
              :model-value="form.dataSaida || null"
              :max-date="parseISO(dia())"
              :disabled="salvando"
              placeholder="dd/mm/aaaa"
              teleport
              @update:model-value="form.dataSaida = diaDoCalendario($event)"
            />
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="dp-input-emprestimo-vencimento" class="block leading-5"
              >Primeiro vencimento</Label
            >
            <Calendarpicker
              uid="emprestimo-vencimento"
              :aria-labels="{ input: 'Primeiro vencimento' }"
              :model-value="form.primeiroVencimento || null"
              :min-date="form.dataSaida ? parseISO(form.dataSaida) : null"
              :disabled="salvando"
              placeholder="dd/mm/aaaa"
              teleport
              @update:model-value="form.primeiroVencimento = diaDoCalendario($event)"
            />
          </div>
        </fieldset>
        <fieldset
          v-if="etapa === 1"
          class="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-2"
          :disabled="salvando"
        >
          <legend class="px-1 text-sm font-medium">Juros e multa</legend>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-juros" class="block leading-5">Juros do contrato (%)</Label>
            <Input
              id="emprestimo-juros"
              v-model="form.juros"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0"
              aria-describedby="emprestimo-juros-ajuda"
            />
            <p id="emprestimo-juros-ajuda" class="text-xs text-muted-foreground">
              Percentual sobre o valor emprestado. Deixe em 0 para cobrar juros somente em caso de
              atraso.
            </p>
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-juros-mora" class="block leading-5"
              >Juros por atraso (% ao mês)</Label
            >
            <Input
              id="emprestimo-juros-mora"
              v-model="form.jurosMora"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0"
              aria-describedby="emprestimo-juros-mora-ajuda"
            />
            <p id="emprestimo-juros-mora-ajuda" class="text-xs text-muted-foreground">
              Juros simples sobre o valor líquido da parcela, por dia de atraso, com mês de 30 dias.
            </p>
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-multa" class="block leading-5">Multa por atraso (%)</Label>
            <Input
              id="emprestimo-multa"
              v-model="form.multa"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0"
              aria-describedby="emprestimo-multa-ajuda"
            />
            <p id="emprestimo-multa-ajuda" class="text-xs text-muted-foreground">
              Cobrada uma vez sobre o valor líquido de cada parcela vencida.
            </p>
          </div>
        </fieldset>
        <fieldset
          v-if="etapa === 1"
          class="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-2"
          :disabled="salvando"
        >
          <legend class="px-1 text-sm font-medium">Descontos</legend>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-desconto-fixo" class="block leading-5"
              >Desconto do contrato (R$)</Label
            >
            <Input
              id="emprestimo-desconto-fixo"
              v-model="form.descontoFixo"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0,00"
              aria-describedby="emprestimo-desconto-fixo-ajuda"
            />
            <p id="emprestimo-desconto-fixo-ajuda" class="text-xs text-muted-foreground">
              Desconto fixo distribuído entre todas as parcelas, inclusive em atraso.
            </p>
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-modo-antecipacao" class="block leading-5"
              >Desconto por antecipação</Label
            >
            <FormSelect
              id="emprestimo-modo-antecipacao"
              :model-value="form.modoAntecipacao"
              :options="modosAntecipacao"
              :disabled="salvando"
              aria-label="Desconto por antecipação"
              aria-describedby="emprestimo-modo-antecipacao-ajuda"
              @update:model-value="mudarModoAntecipacao"
            />
            <p id="emprestimo-modo-antecipacao-ajuda" class="text-xs text-muted-foreground">
              {{ instrucoesAntecipacao[form.modoAntecipacao] }}
            </p>
          </div>
          <div v-if="usaValorAntecipacao" class="min-w-0 space-y-2 sm:col-start-2">
            <Label for="emprestimo-desconto-antecipacao" class="block leading-5">
              {{
                form.modoAntecipacao === 'valor'
                  ? 'Desconto por parcela (R$)'
                  : 'Desconto por antecipação (%)'
              }}
            </Label>
            <Input
              id="emprestimo-desconto-antecipacao"
              v-model="form.descontoAntecipacao"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              :placeholder="form.modoAntecipacao === 'valor' ? 'Ex.: 20,00' : 'Ex.: 10'"
              aria-describedby="emprestimo-desconto-antecipacao-ajuda"
            />
            <p id="emprestimo-desconto-antecipacao-ajuda" class="text-xs text-muted-foreground">
              Vale para pagamentos antes do vencimento. A parcela mantém o mínimo de R$ 0,01.
            </p>
          </div>
        </fieldset>
        <fieldset
          v-if="etapa === 2"
          class="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-2"
          :disabled="salvando"
        >
          <legend class="px-1 text-sm font-medium">Movimentação financeira</legend>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-forma-saida" class="block leading-5">Forma da saída</Label>
            <FormSelect
              id="emprestimo-forma-saida"
              v-model="form.formaSaida"
              :options="formas"
              :disabled="salvando"
              aria-label="Forma da saída"
            />
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-origem">Origem do dinheiro</Label>
            <FormSelect
              id="emprestimo-origem"
              v-model="form.origem"
              :options="[
                { value: 'avulso', label: 'Avulso' },
                { value: 'conta', label: 'Conta financeira' },
              ]"
              :disabled="salvando"
              aria-label="Origem do dinheiro"
            />
          </div>
          <div v-if="form.origem === 'conta'" class="min-w-0 space-y-2">
            <Label for="emprestimo-conta-saida">Conta da saída</Label>
            <Select2Ajax
              id="emprestimo-conta-saida"
              v-model="form.contaSaidaId"
              aria-label="Conta da saída"
              url="/lancamentos/contas/select2"
              linked-kind="conta"
              :disabled="salvando"
            />
          </div>
          <p v-else class="text-xs text-muted-foreground sm:col-span-2">
            A saída avulsa fica registrada no empréstimo.
          </p>
          <div class="flex items-center justify-between gap-4 border-t pt-4 sm:col-span-2">
            <div class="space-y-1">
              <Label for="emprestimo-lancamento-automatico">Lançamento automático</Label>
              <p id="emprestimo-lancamento-automatico-ajuda" class="text-xs text-muted-foreground">
                Ao dar baixa, registra a receita no Financeiro na data do pagamento.
              </p>
            </div>
            <Switch
              id="emprestimo-lancamento-automatico"
              v-model="form.lancamentoAutomatico"
              :disabled="salvando"
              aria-describedby="emprestimo-lancamento-automatico-ajuda"
              class="shrink-0"
            />
          </div>
          <div v-if="form.lancamentoAutomatico" class="min-w-0 space-y-2">
            <Label for="emprestimo-conta-entrada">Conta dos recebimentos</Label>
            <Select2Ajax
              id="emprestimo-conta-entrada"
              v-model="form.contaEntradaId"
              aria-label="Conta dos recebimentos"
              url="/lancamentos/contas/select2"
              linked-kind="conta"
              :disabled="salvando"
            />
          </div>
          <div v-if="categoriasVisiveis" class="min-w-0 space-y-2">
            <Label for="emprestimo-categoria">Categoria financeira</Label>
            <Select2Ajax
              id="emprestimo-categoria"
              v-model="form.categoriaId"
              aria-label="Categoria financeira"
              url="/lancamentos/categorias/select2"
              linked-kind="categoria"
              :disabled="salvando"
            />
          </div>
        </fieldset>
        <p v-if="erro" role="alert" class="text-sm text-destructive">{{ erro }}</p>
      </form>
      <PrevisaoParcelas
        v-model:dias="diasSimulacao"
        :termos="termosSimulacao"
        class="lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:max-h-[calc(92dvh-11rem)] lg:overflow-y-auto"
        :class="etapa === 0 ? 'lg:row-span-2' : ''"
      />
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          class="flex-1 sm:flex-none"
          :disabled="salvando || salvandoCliente"
          @click="etapa === 0 ? (open = false) : irParaEtapa(etapa - 1)"
        >
          <ArrowLeft v-if="etapa > 0" class="size-4" aria-hidden="true" />
          {{ etapa === 0 ? 'Cancelar' : 'Voltar' }}
        </Button>
        <Button
          type="submit"
          form="emprestimo-cadastro-form"
          class="flex-1 sm:flex-none"
          :disabled="salvando || clienteAberto"
        >
          {{
            salvando
              ? 'Registrando…'
              : etapa < etapas.length - 1
                ? 'Continuar'
                : 'Registrar empréstimo'
          }}
          <ArrowRight v-if="etapa < etapas.length - 1" class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </template>
  </ModalView>
</template>
