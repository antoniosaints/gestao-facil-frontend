<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  BadgePlus,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FilePenLineIcon,
  Layers3,
  LoaderCircle,
  PackagePlus,
  RefreshCcw,
  Settings2,
  Trash,
  TriangleAlert,
} from 'lucide-vue-next'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  AssinaturaRepository,
  type AssinaturaClientePayload,
  type PlanoAssinaturaListItem,
} from '@/repositories/assinatura-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import {
  createEmptyItem,
  gatewayOptions,
  modoValorOptions,
  parseDateOnlyFromApi,
  periodicidadeOptions,
  statusAssinaturaOptions,
  tipoCobrancaOptions,
  toDateOnlyIso,
} from './shared'
import AssinaturasTabela from './components/AssinaturasTabela.vue'
import AssinaturasMobile from './components/AssinaturasMobile.vue'

const toast = useToast()
const uiStore = useUiStore()
const store = useAssinaturasStore()

const saving = ref(false)
const loadingModal = ref(false)
const planos = ref<PlanoAssinaturaListItem[]>([])
const steps = [
  { key: 'dados', label: 'Dados', icon: ClipboardList },
  { key: 'cobranca', label: 'Cobrança e datas', icon: CircleDollarSign },
  { key: 'itens', label: 'Itens', icon: PackagePlus },
  { key: 'automacao', label: 'Automação', icon: Settings2 },
] as const
type StepKey = (typeof steps)[number]['key']
const currentStep = ref<StepKey>('dados')
const currentStepIndex = computed(() => steps.findIndex((step) => step.key === currentStep.value))
const isFirstStep = computed(() => currentStepIndex.value <= 0)
const isLastStep = computed(() => currentStepIndex.value >= steps.length - 1)

// Erros por etapa, preenchidos só depois de uma tentativa de avançar/salvar —
// assim o formulário não nasce vermelho, mas nunca deixa o usuário no escuro.
const stepErrors = reactive<Record<StepKey, string[]>>({
  dados: [],
  cobranca: [],
  itens: [],
  automacao: [],
})

function validateStep(key: StepKey): string[] {
  const erros: string[] = []

  if (key === 'dados') {
    if (!form.clienteId) erros.push('Selecione o cliente do contrato.')
    if (form.nomeContrato.trim().length < 2) {
      erros.push('Informe o nome do contrato (mínimo de 2 caracteres).')
    }
    if (form.periodicidade === 'PERSONALIZADO' && Number(form.intervaloDiasPersonalizado || 0) < 1) {
      erros.push('Informe o intervalo em dias da periodicidade personalizada.')
    }
    if (form.modoValor === 'MANUAL' && Number(form.valorManual || 0) <= 0) {
      erros.push('Informe o valor manual do contrato.')
    }
  }

  if (key === 'cobranca') {
    if (!toDateOnlyIso(form.inicio)) erros.push('Informe a data de início do contrato.')
    if (!toDateOnlyIso(form.proximaCobranca)) erros.push('Informe a data da próxima cobrança.')

    if (!form.recorrenciaIndefinida) {
      if (!toDateOnlyIso(form.fim)) {
        erros.push('Informe a data final ou ative "Sem data final".')
      } else if (form.inicio && form.fim && new Date(form.fim) < new Date(form.inicio)) {
        erros.push('A data final deve ser posterior à data de início.')
      }
    }
  }

  if (key === 'itens') {
    form.itens.forEach((item: any, index: number) => {
      const rotulo = `Item ${index + 1}`

      if (item.tipoItem === 'SERVICO' && !item.servicoId) {
        erros.push(`${rotulo}: selecione o serviço.`)
      }
      if (item.tipoItem === 'PRODUTO' && !item.produtoId) {
        erros.push(`${rotulo}: selecione o produto.`)
      }
      if (!String(item.descricaoSnapshot || '').trim()) {
        erros.push(`${rotulo}: informe a descrição que aparecerá no contrato.`)
      }
      if (Number(item.quantidade || 0) < 1) {
        erros.push(`${rotulo}: a quantidade deve ser no mínimo 1.`)
      }
      if (Number(item.valorUnitario || 0) < 0) {
        erros.push(`${rotulo}: o valor unitário não pode ser negativo.`)
      }
      if (item.modoCobranca === 'PARCELADA' && Number(item.cobrarVezes || 0) < 1) {
        erros.push(`${rotulo}: informe quantas vezes o item será cobrado.`)
      }
    })
  }

  return erros
}

function checkStep(key: StepKey) {
  stepErrors[key] = validateStep(key)
  return stepErrors[key].length === 0
}

function reportStep(key: StepKey) {
  const erros = stepErrors[key]
  if (!erros.length) return
  toast.error(erros.length === 1 ? erros[0] : `${erros.length} campo(s) pendentes nesta etapa.`)
}

function goToStep(key: StepKey) {
  const alvo = steps.findIndex((step) => step.key === key)

  // Voltar é sempre livre; avançar exige que as etapas anteriores estejam válidas.
  if (alvo > currentStepIndex.value) {
    for (let i = currentStepIndex.value; i < alvo; i++) {
      const stepKey = steps[i].key
      if (!checkStep(stepKey)) {
        currentStep.value = stepKey
        reportStep(stepKey)
        return
      }
    }
  }

  currentStep.value = key
}

function nextStep() {
  if (isLastStep.value) return

  if (!checkStep(currentStep.value)) {
    reportStep(currentStep.value)
    return
  }

  currentStep.value = steps[currentStepIndex.value + 1].key
}

function prevStep() {
  if (!isFirstStep.value) currentStep.value = steps[currentStepIndex.value - 1].key
}

const form = reactive<any>({
  id: undefined,
  clienteId: null,
  planoId: null,
  nomeContrato: '',
  status: 'ATIVA',
  modoValor: 'DINAMICO',
  valorManual: 0,
  periodicidade: 'MENSAL',
  intervaloDiasPersonalizado: 30,
  inicio: new Date(),
  fim: null,
  recorrenciaIndefinida: true,
  proximaCobranca: new Date(),
  cobrancaAutomatica: false,
  gateway: 'mercadopago',
  tipoCobranca: 'PIX',
  gerarLancamentoFinanceiro: false,
  contaFinanceiraId: null,
  categoriaId: null,
  observacoes: '',
  itens: [createEmptyItem()],
  gerarPrimeiroCiclo: true,
})

const opcoesContasFinanceiro = ref<{ id: number; label: string }[]>([])
const opcoesCategorias = ref<{ id: number; label: string }[]>([])

const modalTitle = computed(() => (store.editingAssinaturaId ? 'Editar contrato' : 'Novo contrato'))
const modalDescription = computed(() =>
  store.editingAssinaturaId
    ? 'Atualize cliente, cobrança e itens recorrentes no padrão dos formulários principais.'
    : 'Cadastre o contrato recorrente, os dados de cobrança e os itens vinculados.',
)

function clearStepErrors() {
  stepErrors.dados = []
  stepErrors.cobranca = []
  stepErrors.itens = []
  stepErrors.automacao = []
}

function resetForm() {
  clearStepErrors()
  form.id = undefined
  form.clienteId = null
  form.planoId = null
  form.nomeContrato = ''
  form.status = 'ATIVA'
  form.modoValor = 'DINAMICO'
  form.valorManual = 0
  form.periodicidade = 'MENSAL'
  form.intervaloDiasPersonalizado = 30
  form.inicio = new Date()
  form.fim = null
  form.recorrenciaIndefinida = true
  form.proximaCobranca = new Date()
  form.cobrancaAutomatica = false
  form.gateway = 'mercadopago'
  form.tipoCobranca = 'PIX'
  form.gerarLancamentoFinanceiro = false
  form.contaFinanceiraId = null
  form.categoriaId = null
  form.observacoes = ''
  form.itens = [createEmptyItem()]
  form.gerarPrimeiroCiclo = true
}

function hydrateFormFromDetalhe(data: any) {
  form.id = data.id
  form.clienteId = data.cliente?.id || null
  form.planoId = data.plano?.id || null
  form.nomeContrato = data.nomeContrato
  form.status = data.status
  form.modoValor = data.modoValor
  form.valorManual = data.valorManual || 0
  form.periodicidade = data.periodicidade
  form.intervaloDiasPersonalizado = data.intervaloDiasPersonalizado || 30
  form.inicio = parseDateOnlyFromApi(data.inicio) || new Date()
  form.fim = parseDateOnlyFromApi(data.fim)
  form.recorrenciaIndefinida = !data.fim
  form.proximaCobranca = parseDateOnlyFromApi(data.proximaCobranca) || parseDateOnlyFromApi(data.inicio) || new Date()
  form.cobrancaAutomatica = data.cobrancaAutomatica
  form.gateway = data.gateway || 'mercadopago'
  form.tipoCobranca = data.tipoCobranca || 'PIX'
  form.gerarLancamentoFinanceiro = data.gerarLancamentoFinanceiro
  form.contaFinanceiraId = data.contaFinanceiraId ? String(data.contaFinanceiraId) : null
  form.categoriaId = data.categoriaId ? String(data.categoriaId) : null
  form.observacoes = data.observacoes || ''
  form.itens = data.itens.length
    ? data.itens.map((item: any) => ({
      ...createEmptyItem(),
      ...item,
      servicoId: item.servicoId || null,
      produtoId: item.produtoId || null,
      identificacao: item.comodatos?.[0]?.identificacao || '',
      dataPrevistaDevolucao: parseDateOnlyFromApi(item.comodatos?.[0]?.dataPrevistaDevolucao),
      observacoes: item.comodatos?.[0]?.observacoes || '',
    }))
    : [createEmptyItem()]
  form.gerarPrimeiroCiclo = false
}

async function loadPlanos() {
  const planosResponse = await AssinaturaRepository.listarPlanos({ status: 'TODOS' })
  planos.value = planosResponse.data
}

async function loadOpcoesFinanceiras() {
  try {
    const { data } = await AssinaturaRepository.opcoes()
    opcoesContasFinanceiro.value = data.contasFinanceiro || []
    opcoesCategorias.value = data.categorias || []
  } catch (error) {
    console.error(error)
  }
}

function addItem() {
  form.itens.push(createEmptyItem())
}

function removeItem(index: number) {
  if (form.itens.length === 1) {
    form.itens = [createEmptyItem()]
    return
  }

  form.itens.splice(index, 1)
}

function handleTipoItemChange(item: any, tipo: 'SERVICO' | 'PRODUTO') {
  item.tipoItem = tipo
  item.servicoId = null
  item.produtoId = null
  if (tipo === 'SERVICO') {
    item.comodato = false
    item.identificacao = ''
    item.dataPrevistaDevolucao = null
    item.observacoes = ''
  }
}

watch(
  () => form.planoId,
  (value) => {
    if (!value || store.editingAssinaturaId) return
    const plano = planos.value.find((item) => item.id === Number(value))
    if (!plano) return

    form.nomeContrato = form.nomeContrato || plano.nome
    form.periodicidade = plano.periodicidadePadrao
    form.intervaloDiasPersonalizado = plano.intervaloDiasPadrao || 30
    form.modoValor = plano.modoValorPadrao
    form.valorManual = plano.modoValorPadrao === 'MANUAL' ? plano.valorBase : 0
    form.gateway = plano.gatewayPadrao || form.gateway
    form.tipoCobranca = plano.tipoCobrancaPadrao || form.tipoCobranca
    form.itens = plano.itens.length
      ? plano.itens.map((item) => ({
        ...createEmptyItem(),
        ...item,
        servicoId: item.servicoId || null,
        produtoId: item.produtoId || null,
        ativo: true,
      }))
      : [createEmptyItem()]
  },
)

// Assim que o usuário corrige um campo, o aviso da etapa some sozinho —
// só revalida etapas que já falharam, para não acusar erro antes da hora.
watch(
  form,
  () => {
    for (const step of steps) {
      if (stepErrors[step.key].length) {
        stepErrors[step.key] = validateStep(step.key)
      }
    }
  },
  { deep: true },
)

watch(
  () => store.openAssinaturaModal,
  async (isOpen) => {
    if (!isOpen) {
      resetForm()
      loadingModal.value = false
      return
    }

    try {
      loadingModal.value = true
      currentStep.value = 'dados'
      clearStepErrors()
      await Promise.all([loadPlanos(), loadOpcoesFinanceiras()])

      if (store.editingAssinaturaId) {
        const response = await AssinaturaRepository.detalhes(store.editingAssinaturaId)
        hydrateFormFromDetalhe(response.data)
      } else {
        resetForm()
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao preparar o formulário do contrato.')
      store.closeAssinaturaModal()
    } finally {
      loadingModal.value = false
    }
  },
)

async function save() {
  try {
    // Revalida tudo e leva o usuário direto para a primeira etapa pendente.
    let primeiraPendente: StepKey | null = null
    for (const step of steps) {
      if (!checkStep(step.key) && !primeiraPendente) {
        primeiraPendente = step.key
      }
    }

    if (primeiraPendente) {
      currentStep.value = primeiraPendente
      reportStep(primeiraPendente)
      return
    }

    const inicio = toDateOnlyIso(form.inicio)
    const fim = form.recorrenciaIndefinida ? undefined : toDateOnlyIso(form.fim)
    const proximaCobranca = toDateOnlyIso(form.proximaCobranca)

    saving.value = true
    const payload: AssinaturaClientePayload = {
      ...form,
      clienteId: Number(form.clienteId),
      planoId: Number(form.planoId || 0) > 0 ? Number(form.planoId) : undefined,
      valorManual: form.modoValor === 'MANUAL' ? Number(form.valorManual || 0) : undefined,
      intervaloDiasPersonalizado:
        form.periodicidade === 'PERSONALIZADO' ? Number(form.intervaloDiasPersonalizado || 30) : undefined,
      inicio,
      fim,
      proximaCobranca,
      contaFinanceiraId: form.contaFinanceiraId ? Number(form.contaFinanceiraId) : undefined,
      categoriaId: form.categoriaId ? Number(form.categoriaId) : undefined,
      itens: form.itens.map((item: any) => ({
        ...item,
        servicoId: item.tipoItem === 'SERVICO' ? Number(item.servicoId || 0) || undefined : undefined,
        produtoId: item.tipoItem === 'PRODUTO' ? Number(item.produtoId || 0) || undefined : undefined,
        quantidade: Number(item.quantidade || 1),
        valorUnitario: Number(item.valorUnitario || 0),
        comodato: item.tipoItem === 'PRODUTO' ? Boolean(item.comodato) : false,
        modoCobranca: item.modoCobranca || 'MENSALIDADE',
        cobrarVezes:
          item.modoCobranca === 'PARCELADA' ? Number(item.cobrarVezes || 0) || undefined : undefined,
        dataPrevistaDevolucao:
          item.tipoItem === 'PRODUTO' && item.comodato ? toDateOnlyIso(item.dataPrevistaDevolucao) : undefined,
      })),
    }

    await AssinaturaRepository.salvarAssinatura(payload)
    toast.success(store.editingAssinaturaId ? 'Contrato atualizado com sucesso.' : 'Contrato salvo com sucesso.')
    store.closeAssinaturaModal()
    resetForm()
    store.refreshAssinaturas()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao salvar o contrato.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <FilePenLineIcon class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Contratos
        </h2>
        <p class="text-sm text-muted-foreground">
          Contratos recorrentes, ciclos e cobranças.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Select v-model="store.assinaturasFilters.status">
          <SelectTrigger class="w-[180px] bg-card">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in statusAssinaturaOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <RouterLink to="/assinaturas/planos">
          <Button variant="outline" class="gap-2">
            <Layers3 class="h-4 w-4" /> Planos
          </Button>
        </RouterLink>
        <Button variant="outline" class="gap-2" @click="store.refreshAssinaturas()">
          <RefreshCcw class="h-4 w-4" /> Atualizar
        </Button>
        <Button class="gap-2" @click="store.openCreateAssinatura()">
          <BadgePlus class="h-4 w-4" /> Novo contrato
        </Button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <AssinaturasTabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <AssinaturasMobile />
    </div>

    <ModalView v-model:open="store.openAssinaturaModal" :title="modalTitle" :description="modalDescription" size="5xl">
      <div v-if="loadingModal" class="px-4 py-8 text-center text-sm text-muted-foreground">
        Preparando formulário do contrato...
      </div>

      <form v-else class="grid gap-4 px-4 pb-1" @submit.prevent="save">
        <nav class="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-muted/40 p-2 sm:grid-cols-4">
          <button v-for="(step, index) in steps" :key="step.key" type="button"
            class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition" :class="[
              currentStep === step.key ? 'bg-background shadow-sm ring-1 ring-primary/40' : 'hover:bg-background/60',
              stepErrors[step.key].length && currentStep !== step.key ? 'ring-1 ring-red-400/60' : '',
            ]" @click="goToStep(step.key)">
            <span class="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold" :class="stepErrors[step.key].length
              ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300'
              : index < currentStepIndex || currentStep === step.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-background text-muted-foreground'">
              <TriangleAlert v-if="stepErrors[step.key].length" class="h-4 w-4" />
              <Check v-else-if="index < currentStepIndex" class="h-4 w-4" />
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span class="flex min-w-0 flex-col leading-tight">
              <span class="text-[10px] uppercase tracking-wide text-muted-foreground">Etapa {{ index + 1 }}</span>
              <span class="truncate text-sm font-medium"
                :class="currentStep === step.key ? 'text-foreground' : 'text-muted-foreground'">{{ step.label }}</span>
            </span>
          </button>
        </nav>

        <!-- Lista o que falta na etapa aberta, em vez de só reprovar no salvar -->
        <div v-if="stepErrors[currentStep].length"
          class="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm dark:border-red-900/60 dark:bg-red-950/30">
          <p class="flex items-center gap-2 font-medium text-red-700 dark:text-red-300">
            <TriangleAlert class="h-4 w-4 shrink-0" />
            Para continuar, preencha:
          </p>
          <ul class="mt-1.5 list-disc space-y-0.5 pl-8 text-red-700 dark:text-red-300">
            <li v-for="erro in stepErrors[currentStep]" :key="erro">{{ erro }}</li>
          </ul>
        </div>

        <div v-show="currentStep === 'dados'" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div class="md:col-span-5">
              <Label for="assinaturaCliente" class="mb-1.5 block text-sm font-medium">
                Cliente <span class="text-red-500">*</span>
              </Label>
              <Select2Ajax id="assinaturaCliente" v-model="form.clienteId" url="/clientes/select2" class="w-full" />
            </div>
            <div class="md:col-span-4">
              <Label for="nomeContrato" class="mb-1.5 block text-sm font-medium">
                Nome do contrato <span class="text-red-500">*</span>
              </Label>
              <Input id="nomeContrato" v-model="form.nomeContrato" class="bg-background dark:bg-background/60"
                placeholder="Ex: Suporte premium mensal" />
            </div>
            <div class="md:col-span-3">
              <Label class="mb-1.5 block text-sm font-medium">Status</Label>
              <Select v-model="form.status">
                <SelectTrigger class="w-full bg-background dark:bg-background/60">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in statusAssinaturaOptions.filter((entry) => entry.value !== 'TODOS')"
                    :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div class="md:col-span-5">
              <Label for="assinaturaPlano" class="mb-1.5 block text-sm font-medium">Plano base</Label>
              <Select2Ajax id="assinaturaPlano" v-model="form.planoId" url="/assinaturas/planos/select2" allowClear
                class="w-full" />
            </div>
            <div class="md:col-span-4">
              <Label class="mb-1.5 block text-sm font-medium">Periodicidade</Label>
              <Select v-model="form.periodicidade">
                <SelectTrigger class="w-full bg-background dark:bg-background/60">
                  <SelectValue placeholder="Periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in periodicidadeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="md:col-span-3">
              <Label class="mb-1.5 block text-sm font-medium">Modo de valor</Label>
              <Select v-model="form.modoValor">
                <SelectTrigger class="w-full bg-background dark:bg-background/60">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in modoValorOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Campos condicionais ficam sempre no fim da grade, para não empurrar os fixos -->
            <div v-if="form.periodicidade === 'PERSONALIZADO'" class="md:col-span-3">
              <Label for="intervaloPersonalizadoAssinatura" class="mb-1.5 block text-sm font-medium">
                Intervalo em dias <span class="text-red-500">*</span>
              </Label>
              <Input id="intervaloPersonalizadoAssinatura" v-model="form.intervaloDiasPersonalizado"
                class="bg-background dark:bg-background/60" type="number" min="1" step="1" placeholder="30" />
            </div>
            <div v-if="form.modoValor === 'MANUAL'" class="md:col-span-3">
              <Label for="valorManualAssinatura" class="mb-1.5 block text-sm font-medium">
                Valor manual <span class="text-red-500">*</span>
              </Label>
              <Input id="valorManualAssinatura" v-model="form.valorManual" class="bg-background dark:bg-background/60"
                type="number" min="0" step="0.01" placeholder="0,00" />
            </div>
          </div>

        </div>

        <div v-show="currentStep === 'cobranca'" class="space-y-4">
          <!-- Grade fixa: a data final ocupa sempre o mesmo lugar (desabilitada quando -->
          <!-- a recorrência é indefinida), então nada muda de posição ao usar o switch. -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div class="md:col-span-3">
              <Label for="inicioAssinatura" class="mb-1.5 block text-sm font-medium">
                Início <span class="text-red-500">*</span>
              </Label>
              <Calendarpicker id="inicioAssinatura" v-model="form.inicio" :teleport="true" />
            </div>
            <div class="md:col-span-3">
              <Label for="proximaCobrancaAssinatura" class="mb-1.5 block text-sm font-medium">
                Próxima cobrança <span class="text-red-500">*</span>
              </Label>
              <Calendarpicker id="proximaCobrancaAssinatura" v-model="form.proximaCobranca" :teleport="true" />
            </div>
            <div class="md:col-span-3">
              <Label for="recorrenciaIndefinida" class="mb-1.5 block text-sm font-medium">
                Definir final
              </Label>
              <label
                class="flex items-center justify-between rounded-md border border-border/70 bg-background/70 px-4 py-2 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40 md:col-span-3">
                <span>Sem data final</span>
                <Switch id="recorrenciaIndefinida" v-model:model-value="form.recorrenciaIndefinida" />
              </label>
            </div>
            <div class="md:col-span-3" :class="form.recorrenciaIndefinida ? 'opacity-50' : ''">
              <Label for="fimAssinatura" class="mb-1.5 block text-sm font-medium">
                Data final <span v-if="!form.recorrenciaIndefinida" class="text-red-500">*</span>
              </Label>
              <Calendarpicker id="fimAssinatura" v-model="form.fim" :teleport="true"
                :disabled="form.recorrenciaIndefinida" />
            </div>

            <div class="md:col-span-6">
              <Label class="mb-1.5 block text-sm font-medium">Gateway</Label>
              <Select v-model="form.gateway">
                <SelectTrigger class="w-full bg-background dark:bg-background/60">
                  <SelectValue placeholder="Selecione o gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in gatewayOptions" :key="item.value" :value="item.value"
                    :disabled="item.disabled">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="md:col-span-6">
              <Label class="mb-1.5 block text-sm font-medium">Tipo de pagamento</Label>
              <Select v-model="form.tipoCobranca">
                <SelectTrigger class="w-full bg-background dark:bg-background/60">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in tipoCobrancaOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 'itens'" class="space-y-4">
          <div class="space-y-3">
            <div class="flex justify-end">
              <Button type="button" variant="outline" size="sm" @click="addItem">Adicionar item</Button>
            </div>
            <div v-for="(item, index) in form.itens" :key="index"
              class="rounded-xl border border-border/70 bg-background/60 p-4 dark:bg-background/30">
              <div class="mb-3 flex items-center justify-between gap-2">
                <span class="text-sm font-semibold text-foreground">Item {{ (String(index as number + 1)) }}</span>
                <button type="button" class="rounded-full p-1 hover:bg-foreground/10"
                  @click="removeItem(index as number)">
                  <Trash class="h-4 w-4 text-red-500" />
                </button>
              </div>
              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <div>
                  <Label class="mb-1.5 block text-sm font-medium">Tipo</Label>
                  <Select :model-value="item.tipoItem"
                    @update:model-value="handleTipoItemChange(item, $event as 'SERVICO' | 'PRODUTO')">
                    <SelectTrigger class="w-full bg-background dark:bg-background/60">
                      <SelectValue placeholder="Tipo do item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICO">Serviço</SelectItem>
                      <SelectItem value="PRODUTO">Produto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div v-if="item.tipoItem === 'SERVICO'" class="xl:col-span-2">
                  <Label class="mb-1.5 block text-sm font-medium">
                    Serviço <span class="text-red-500">*</span>
                  </Label>
                  <Select2Ajax v-model="item.servicoId" url="/servicos/select2" allowClear class="w-full" />
                </div>
                <div v-else class="xl:col-span-2">
                  <Label class="mb-1.5 block text-sm font-medium">
                    Produto <span class="text-red-500">*</span>
                  </Label>
                  <Select2Ajax v-model="item.produtoId" url="/produtos/select2" allowClear class="w-full" />
                </div>
                <div>
                  <Label class="mb-1.5 block text-sm font-medium">Quantidade</Label>
                  <Input v-model="item.quantidade" class="bg-background dark:bg-background/60" type="number" min="1"
                    step="1" />
                </div>
                <div class="xl:col-span-2">
                  <Label class="mb-1.5 block text-sm font-medium">
                    Descrição <span class="text-red-500">*</span>
                  </Label>
                  <Input v-model="item.descricaoSnapshot" class="bg-background dark:bg-background/60"
                    placeholder="Como o item deve aparecer no contrato" />
                </div>
                <div class="xl:col-span-1">
                  <Label class="mb-1.5 block text-sm font-medium">Valor unitário</Label>
                  <Input v-model="item.valorUnitario" class="bg-background dark:bg-background/60" type="number" min="0"
                    step="0.01" />
                </div>
                <div class="xl:col-span-2">
                  <Label class="mb-1.5 block text-sm font-medium">Forma de cobrança</Label>
                  <Select v-model="item.modoCobranca">
                    <SelectTrigger class="w-full bg-background dark:bg-background/60">
                      <SelectValue placeholder="Forma de cobrança" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MENSALIDADE">Sempre (entra na mensalidade)</SelectItem>
                      <SelectItem value="UNICA">Uma única vez</SelectItem>
                      <SelectItem value="PARCELADA">Cobrar N vezes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div v-if="item.modoCobranca === 'PARCELADA'" class="xl:col-span-1">
                  <Label class="mb-1.5 block text-sm font-medium">
                    Cobrar por (vezes) <span class="text-red-500">*</span>
                  </Label>
                  <Input v-model="item.cobrarVezes" class="bg-background dark:bg-background/60" type="number" min="1"
                    step="1" placeholder="Ex.: 3" />
                </div>
                <template v-if="item.tipoItem === 'PRODUTO' && item.comodato">
                  <div class="md:col-span-2">
                    <Label class="mb-1.5 block text-sm font-medium">Identificação</Label>
                    <Input v-model="item.identificacao" class="bg-background dark:bg-background/60"
                      placeholder="Patrimônio, série ou referência" />
                  </div>
                  <div class="md:col-span-1">
                    <Label class="mb-1.5 block text-sm font-medium">Devolução</Label>
                    <Calendarpicker v-model="item.dataPrevistaDevolucao" :teleport="true" />
                  </div>
                  <div class="md:col-span-2 xl:col-span-6">
                    <Label class="mb-1.5 block text-sm font-medium">Observações do comodato</Label>
                    <Input v-model="item.observacoes" class="bg-background dark:bg-background/60"
                      placeholder="Condição, observações de entrega, restrições..." />
                  </div>
                </template>
              </div>
              <div class="mt-3 grid gap-2 md:grid-cols-3">
                <label
                  class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
                  <span>Cobrar no valor recorrente</span>
                  <Switch v-model:model-value="item.cobrar" />
                </label>
                <label
                  class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
                  <span>Item em comodato</span>
                  <Switch v-model:model-value="item.comodato" :disabled="item.tipoItem !== 'PRODUTO'" />
                </label>
                <label
                  class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
                  <span>Item ativo</span>
                  <Switch v-model:model-value="item.ativo" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 'automacao'" class="space-y-4">
          <div>
            <Label for="observacoesAssinatura" class="mb-1.5 block text-sm font-medium">Observações</Label>
            <Textarea id="observacoesAssinatura" v-model="form.observacoes" rows="4"
              placeholder="Contexto do contrato, SLA, regra de renovação..."
              class="bg-background dark:bg-background/70" />
          </div>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
              <span>Cobrança automática</span>
              <Switch v-model:model-value="form.cobrancaAutomatica" />
            </label>
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
              <span>Gerar lançamento financeiro</span>
              <Switch v-model:model-value="form.gerarLancamentoFinanceiro" />
            </label>
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
              <span>Gerar primeiro ciclo agora</span>
              <Switch v-model:model-value="form.gerarPrimeiroCiclo" />
            </label>
          </div>

          <div v-if="form.gerarLancamentoFinanceiro" class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label class="mb-1.5 block text-sm font-medium">Conta financeira</Label>
              <Select v-model="form.contaFinanceiraId">
                <SelectTrigger class="w-full bg-background dark:bg-background/60">
                  <SelectValue placeholder="Padrão (primeira conta cadastrada)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in opcoesContasFinanceiro" :key="opt.id" :value="String(opt.id)">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label class="mb-1.5 block text-sm font-medium">Categoria financeira</Label>
              <Select v-model="form.categoriaId">
                <SelectTrigger class="w-full bg-background dark:bg-background/60">
                  <SelectValue placeholder="Padrão (primeira categoria)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in opcoesCategorias" :key="opt.id" :value="String(opt.id)">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" class="gap-1" :disabled="isFirstStep || saving" @click="prevStep">
            <ChevronLeft class="h-4 w-4" />
            Voltar
          </Button>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" :disabled="saving" @click="store.closeAssinaturaModal()">
              Cancelar
            </Button>
            <Button v-if="!isLastStep" type="button" class="gap-1 text-white" @click="nextStep">
              Próximo
              <ChevronRight class="h-4 w-4" />
            </Button>
            <Button v-else type="submit" class="text-white" :disabled="saving">
              <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
              {{ saving ? 'Salvando...' : store.editingAssinaturaId ? 'Salvar alterações' : 'Salvar contrato' }}
            </Button>
          </div>
        </div>
      </form>
    </ModalView>
  </div>
</template>
