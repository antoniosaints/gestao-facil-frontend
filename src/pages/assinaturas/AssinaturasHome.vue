<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  BadgePlus,
  CircleDollarSign,
  FileText,
  Layers3,
  LoaderCircle,
  PackagePlus,
  RefreshCcw,
  Settings2,
  Sparkles,
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
import CollapsibleSection from '@/pages/produtos/formulario/CollapsibleSection.vue'
import AssinaturasTabela from './components/AssinaturasTabela.vue'
import AssinaturasMobile from './components/AssinaturasMobile.vue'

const toast = useToast()
const uiStore = useUiStore()
const store = useAssinaturasStore()

const saving = ref(false)
const loadingModal = ref(false)
const planos = ref<PlanoAssinaturaListItem[]>([])
const secCobranca = ref(true)
const secObservacoes = ref(false)
const secItens = ref(true)
const secControle = ref(false)

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
  observacoes: '',
  itens: [createEmptyItem()],
  gerarPrimeiroCiclo: true,
})

const modalTitle = computed(() => (store.editingAssinaturaId ? 'Editar contrato' : 'Novo contrato'))
const modalDescription = computed(() =>
  store.editingAssinaturaId
    ? 'Atualize cliente, cobrança e itens recorrentes no padrão dos formulários principais.'
    : 'Cadastre o contrato recorrente, os dados de cobrança e os itens vinculados.',
)

function resetForm() {
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
      secCobranca.value = true
      secObservacoes.value = false
      secItens.value = true
      secControle.value = false
      await loadPlanos()

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
    if (!form.clienteId) {
      toast.error('Selecione um cliente para o contrato.')
      return
    }

    if (!form.nomeContrato.trim()) {
      toast.error('Informe o nome do contrato.')
      return
    }

    const inicio = toDateOnlyIso(form.inicio)
    const fim = form.recorrenciaIndefinida ? undefined : toDateOnlyIso(form.fim)
    const proximaCobranca = toDateOnlyIso(form.proximaCobranca)

    if (!inicio || !proximaCobranca) {
      toast.error('Preencha as datas obrigatórias do contrato.')
      return
    }

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
      itens: form.itens.map((item: any) => ({
        ...item,
        servicoId: item.tipoItem === 'SERVICO' ? Number(item.servicoId || 0) || undefined : undefined,
        produtoId: item.tipoItem === 'PRODUTO' ? Number(item.produtoId || 0) || undefined : undefined,
        quantidade: Number(item.quantidade || 1),
        valorUnitario: Number(item.valorUnitario || 0),
        comodato: item.tipoItem === 'PRODUTO' ? Boolean(item.comodato) : false,
        dataPrevistaDevolucao:
          item.tipoItem === 'PRODUTO' && item.comodato ? toDateOnlyIso(item.dataPrevistaDevolucao) : undefined,
      })),
    }

    await AssinaturaRepository.salvarAssinatura(payload)
    toast.success(store.editingAssinaturaId ? 'Contrato atualizado com sucesso.' : 'Contrato salvo com sucesso.')
    store.closeAssinaturaModal()
    resetForm()
    store.refreshAssinaturas()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar o contrato.')
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
          <Sparkles class="h-6 w-6 text-primary" :stroke-width="2.5" />
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
            <Input id="nomeContrato" v-model="form.nomeContrato" class="bg-background dark:bg-background/60" placeholder="Ex: Suporte premium mensal" />
          </div>
          <div class="md:col-span-3">
            <Label class="mb-1.5 block text-sm font-medium">Status</Label>
            <Select v-model="form.status">
              <SelectTrigger class="w-full bg-background dark:bg-background/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in statusAssinaturaOptions.filter((entry) => entry.value !== 'TODOS')" :key="item.value" :value="item.value">
                  {{ item.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-5">
            <Label for="assinaturaPlano" class="mb-1.5 block text-sm font-medium">Plano base</Label>
            <Select2Ajax id="assinaturaPlano" v-model="form.planoId" url="/assinaturas/planos/select2" allowClear class="w-full" />
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
          <div v-if="form.periodicidade === 'PERSONALIZADO'" class="md:col-span-3">
            <Label for="intervaloPersonalizadoAssinatura" class="mb-1.5 block text-sm font-medium">Intervalo em dias</Label>
            <Input id="intervaloPersonalizadoAssinatura" v-model="form.intervaloDiasPersonalizado" class="bg-background dark:bg-background/60" type="number" min="1" step="1" placeholder="30" />
          </div>
          <div v-else class="md:col-span-3">
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
        </div>

        <CollapsibleSection v-model:open="secCobranca" title="Cobrança e datas" class="bg-black/5 dark:bg-card" :icon="CircleDollarSign">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div v-if="form.periodicidade === 'PERSONALIZADO'" class="md:col-span-3">
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
            <div v-if="form.modoValor === 'MANUAL'" class="md:col-span-3">
              <Label for="valorManualAssinatura" class="mb-1.5 block text-sm font-medium">Valor manual</Label>
              <Input id="valorManualAssinatura" v-model="form.valorManual" class="bg-background dark:bg-background/60" type="number" min="0" step="0.01" placeholder="0,00" />
            </div>
            <div class="md:col-span-3">
              <Label for="inicioAssinatura" class="mb-1.5 block text-sm font-medium">Início</Label>
              <Calendarpicker id="inicioAssinatura" v-model="form.inicio" :teleport="true" />
            </div>
            <div class="md:col-span-3">
              <Label for="proximaCobrancaAssinatura" class="mb-1.5 block text-sm font-medium">Próxima cobrança</Label>
              <Calendarpicker id="proximaCobrancaAssinatura" v-model="form.proximaCobranca" :teleport="true" />
            </div>
            <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40 md:col-span-3">
              <span>Sem data final</span>
              <Switch v-model:model-value="form.recorrenciaIndefinida" />
            </label>
            <div v-if="!form.recorrenciaIndefinida" class="md:col-span-3">
              <Label for="fimAssinatura" class="mb-1.5 block text-sm font-medium">Data final</Label>
              <Calendarpicker id="fimAssinatura" v-model="form.fim" :teleport="true" />
            </div>
            <div class="md:col-span-3">
              <Label class="mb-1.5 block text-sm font-medium">Gateway</Label>
              <Select v-model="form.gateway">
                <SelectTrigger class="w-full bg-background dark:bg-background/60">
                  <SelectValue placeholder="Selecione o gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in gatewayOptions" :key="item.value" :value="item.value" :disabled="item.disabled">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="md:col-span-3">
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
        </CollapsibleSection>

        <CollapsibleSection v-model:open="secObservacoes" title="Observações" class="bg-black/5 dark:bg-card" :icon="FileText">
          <Textarea id="observacoesAssinatura" v-model="form.observacoes" rows="4" placeholder="Contexto do contrato, SLA, regra de renovação..." class="bg-background dark:bg-background/70" />
        </CollapsibleSection>

        <CollapsibleSection v-model:open="secItens" title="Itens do contrato" class="bg-black/5 dark:bg-card" :icon="PackagePlus">
          <div class="space-y-3">
            <div class="flex justify-end">
              <Button type="button" variant="outline" size="sm" @click="addItem">Adicionar item</Button>
            </div>
            <div v-for="(item, index) in form.itens" :key="index" class="rounded-xl border border-border/70 bg-background/60 p-4 dark:bg-background/30">
              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label class="mb-1.5 block text-sm font-medium">Tipo</Label>
                  <Select :model-value="item.tipoItem" @update:model-value="handleTipoItemChange(item, $event as 'SERVICO' | 'PRODUTO')">
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
                  <Label class="mb-1.5 block text-sm font-medium">Serviço</Label>
                  <Select2Ajax v-model="item.servicoId" url="/servicos/select2" allowClear class="w-full" />
                </div>
                <div v-else class="xl:col-span-2">
                  <Label class="mb-1.5 block text-sm font-medium">Produto</Label>
                  <Select2Ajax v-model="item.produtoId" url="/produtos/select2" allowClear class="w-full" />
                </div>
                <div>
                  <Label class="mb-1.5 block text-sm font-medium">Quantidade</Label>
                  <Input v-model="item.quantidade" class="bg-background dark:bg-background/60" type="number" min="1" step="1" />
                </div>
                <div class="xl:col-span-2">
                  <Label class="mb-1.5 block text-sm font-medium">Descrição</Label>
                  <Input v-model="item.descricaoSnapshot" class="bg-background dark:bg-background/60" placeholder="Como o item deve aparecer no contrato" />
                </div>
                <div class="xl:col-span-2">
                  <Label class="mb-1.5 block text-sm font-medium">Valor unitário</Label>
                  <Input v-model="item.valorUnitario" class="bg-background dark:bg-background/60" type="number" min="0" step="0.01" />
                </div>
                <template v-if="item.tipoItem === 'PRODUTO' && item.comodato">
                  <div>
                    <Label class="mb-1.5 block text-sm font-medium">Identificação</Label>
                    <Input v-model="item.identificacao" class="bg-background dark:bg-background/60" placeholder="Patrimônio, série ou referência" />
                  </div>
                  <div>
                    <Label class="mb-1.5 block text-sm font-medium">Previsão de devolução</Label>
                    <Calendarpicker v-model="item.dataPrevistaDevolucao" :teleport="true" />
                  </div>
                  <div class="md:col-span-2 xl:col-span-2">
                    <Label class="mb-1.5 block text-sm font-medium">Observações do comodato</Label>
                    <Input v-model="item.observacoes" class="bg-background dark:bg-background/60" placeholder="Condição, observações de entrega, restrições..." />
                  </div>
                </template>
              </div>
              <div class="mt-3 grid gap-2 md:grid-cols-3">
                <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
                  <span>Cobrar no valor recorrente</span>
                  <Switch v-model:model-value="item.cobrar" />
                </label>
                <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
                  <span>Item em comodato</span>
                  <Switch v-model:model-value="item.comodato" :disabled="item.tipoItem !== 'PRODUTO'" />
                </label>
                <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
                  <span>Item ativo</span>
                  <Switch v-model:model-value="item.ativo" />
                </label>
              </div>
              <div class="mt-3 flex justify-end">
                <Button type="button" variant="ghost" size="sm" class="text-rose-600" @click="removeItem(index as number)">Remover item</Button>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection v-model:open="secControle" title="Controle e automação" class="bg-black/5 dark:bg-card" :icon="Settings2">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
              <span>Cobrança automática</span>
              <Switch v-model:model-value="form.cobrancaAutomatica" />
            </label>
            <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
              <span>Gerar lançamento financeiro</span>
              <Switch v-model:model-value="form.gerarLancamentoFinanceiro" />
            </label>
            <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
              <span>Gerar primeiro ciclo agora</span>
              <Switch v-model:model-value="form.gerarPrimeiroCiclo" />
            </label>
          </div>
        </CollapsibleSection>

        <div class="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" :disabled="saving" @click="store.closeAssinaturaModal()">
            Cancelar
          </Button>
          <Button type="submit" class="text-white" :disabled="saving">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ saving ? 'Salvando...' : store.editingAssinaturaId ? 'Salvar alterações' : 'Salvar contrato' }}
          </Button>
        </div>
      </form>
    </ModalView>
  </div>
</template>
