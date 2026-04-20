<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { BadgePlus, Layers3, RefreshCcw, Sparkles } from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  AssinaturaRepository,
  type AssinaturaClientePayload,
  type AssinaturaOption,
  type PlanoAssinaturaListItem,
} from '@/repositories/assinatura-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import {
  createEmptyItem,
  gatewayOptions,
  modoValorOptions,
  periodicidadeOptions,
  statusAssinaturaOptions,
  tipoCobrancaOptions,
} from './shared'
import AssinaturasTabela from './components/AssinaturasTabela.vue'
import AssinaturasMobile from './components/AssinaturasMobile.vue'

const toast = useToast()
const uiStore = useUiStore()
const store = useAssinaturasStore()

const saving = ref(false)
const loadingModal = ref(false)
const clientes = ref<AssinaturaOption[]>([])
const servicos = ref<AssinaturaOption[]>([])
const produtos = ref<AssinaturaOption[]>([])
const planos = ref<PlanoAssinaturaListItem[]>([])

const form = reactive<any>({
  clienteId: 0,
  planoId: 0,
  nomeContrato: '',
  status: 'ATIVA',
  modoValor: 'DINAMICO',
  valorManual: 0,
  periodicidade: 'MENSAL',
  intervaloDiasPersonalizado: 30,
  inicio: new Date().toISOString().slice(0, 16),
  fim: '',
  recorrenciaIndefinida: true,
  proximaCobranca: new Date().toISOString().slice(0, 16),
  cobrancaAutomatica: false,
  gateway: 'mercadopago',
  tipoCobranca: 'PIX',
  gerarLancamentoFinanceiro: false,
  observacoes: '',
  itens: [createEmptyItem()],
  gerarPrimeiroCiclo: true,
})

const modalTitle = computed(() => (store.editingAssinaturaId ? 'Editar assinatura' : 'Nova assinatura'))
const modalDescription = computed(() =>
  store.editingAssinaturaId
    ? 'Atualize contrato, cobrança e itens recorrentes no mesmo fluxo da listagem.'
    : 'Cadastre o contrato, defina cobrança e vincule itens recorrentes.',
)

function resetForm() {
  form.id = undefined
  form.clienteId = 0
  form.planoId = 0
  form.nomeContrato = ''
  form.status = 'ATIVA'
  form.modoValor = 'DINAMICO'
  form.valorManual = 0
  form.periodicidade = 'MENSAL'
  form.intervaloDiasPersonalizado = 30
  form.inicio = new Date().toISOString().slice(0, 16)
  form.fim = ''
  form.recorrenciaIndefinida = true
  form.proximaCobranca = new Date().toISOString().slice(0, 16)
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
  form.clienteId = data.cliente?.id || 0
  form.planoId = data.plano?.id || 0
  form.nomeContrato = data.nomeContrato
  form.status = data.status
  form.modoValor = data.modoValor
  form.valorManual = data.valorManual || 0
  form.periodicidade = data.periodicidade
  form.intervaloDiasPersonalizado = data.intervaloDiasPersonalizado || 30
  form.inicio = new Date(data.inicio).toISOString().slice(0, 16)
  form.fim = data.fim ? new Date(data.fim).toISOString().slice(0, 16) : ''
  form.recorrenciaIndefinida = !data.fim
  form.proximaCobranca = new Date(data.proximaCobranca).toISOString().slice(0, 16)
  form.cobrancaAutomatica = data.cobrancaAutomatica
  form.gateway = data.gateway || 'mercadopago'
  form.tipoCobranca = data.tipoCobranca || 'PIX'
  form.gerarLancamentoFinanceiro = data.gerarLancamentoFinanceiro
  form.observacoes = data.observacoes || ''
  form.itens = data.itens.length
    ? data.itens.map((item: any) => ({
        tipoItem: item.tipoItem,
        servicoId: item.servicoId || 0,
        produtoId: item.produtoId || 0,
        descricaoSnapshot: item.descricaoSnapshot,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        cobrar: item.cobrar,
        comodato: item.comodato,
        ativo: item.ativo,
        identificacao: item.comodatos?.[0]?.identificacao || '',
        dataPrevistaDevolucao: item.comodatos?.[0]?.dataPrevistaDevolucao
          ? new Date(item.comodatos[0].dataPrevistaDevolucao).toISOString().slice(0, 16)
          : '',
        observacoes: item.comodatos?.[0]?.observacoes || '',
      }))
    : [createEmptyItem()]
  form.gerarPrimeiroCiclo = false
}

async function loadOptions() {
  const [optionsResponse, planosResponse] = await Promise.all([
    AssinaturaRepository.opcoes(),
    AssinaturaRepository.listarPlanos({ status: 'ATIVO' }),
  ])

  clientes.value = optionsResponse.data.clientes
  servicos.value = optionsResponse.data.servicos
  produtos.value = optionsResponse.data.produtos
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

watch(
  () => form.planoId,
  (value) => {
    if (!value || Number(value) === 0 || store.editingAssinaturaId) return
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
          ...item,
          servicoId: item.servicoId || 0,
          produtoId: item.produtoId || 0,
          ativo: true,
          identificacao: '',
          dataPrevistaDevolucao: '',
          observacoes: '',
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
      await loadOptions()

      if (store.editingAssinaturaId) {
        const response = await AssinaturaRepository.detalhes(store.editingAssinaturaId)
        hydrateFormFromDetalhe(response.data)
      } else {
        resetForm()
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao preparar o formulário da assinatura.')
      store.closeAssinaturaModal()
    } finally {
      loadingModal.value = false
    }
  },
)

async function save() {
  try {
    if (!form.clienteId) {
      toast.error('Selecione um cliente para a assinatura.')
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
      inicio: new Date(form.inicio).toISOString(),
      fim: form.recorrenciaIndefinida || !form.fim ? undefined : new Date(form.fim).toISOString(),
      proximaCobranca: form.proximaCobranca ? new Date(form.proximaCobranca).toISOString() : undefined,
      itens: form.itens.map((item: any) => ({
        ...item,
        servicoId: item.tipoItem === 'SERVICO' ? Number(item.servicoId || 0) || undefined : undefined,
        produtoId: item.tipoItem === 'PRODUTO' ? Number(item.produtoId || 0) || undefined : undefined,
        quantidade: Number(item.quantidade || 1),
        valorUnitario: Number(item.valorUnitario || 0),
      })),
    }

    await AssinaturaRepository.salvarAssinatura(payload)
    toast.success(store.editingAssinaturaId ? 'Assinatura atualizada com sucesso.' : 'Assinatura salva com sucesso.')
    store.closeAssinaturaModal()
    resetForm()
    store.refreshAssinaturas()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar a assinatura.')
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
          Assinaturas
        </h2>
        <p class="text-sm text-muted-foreground">
          Contratos recorrentes em tabela/mobile, com edição e geração operacional no mesmo fluxo.
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
          <BadgePlus class="h-4 w-4" /> Nova assinatura
        </Button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <AssinaturasTabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <AssinaturasMobile />
    </div>

    <ModalView
      v-model:open="store.openAssinaturaModal"
      :title="modalTitle"
      :description="modalDescription"
      size="4xl"
    >
      <div v-if="loadingModal" class="px-4 py-8 text-center text-sm text-muted-foreground">
        Preparando formulário da assinatura...
      </div>

      <div v-else class="grid gap-4 px-4 md:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-medium">Cliente</label>
          <Select v-model="form.clienteId">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in clientes" :key="item.id" :value="item.id">{{ item.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Plano base</label>
          <Select v-model="form.planoId">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="0">Sem plano</SelectItem>
              <SelectItem v-for="item in planos" :key="item.id" :value="item.id">{{ item.nome }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Nome do contrato</label>
          <Input v-model="form.nomeContrato" placeholder="Ex: Mensalidade suporte premium" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Modo de valor</label>
          <Select v-model="form.modoValor">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in modoValorOptions" :key="item.value" :value="item.value">{{ item.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="form.modoValor === 'MANUAL'" class="space-y-2">
          <label class="text-sm font-medium">Valor manual</label>
          <Input v-model="form.valorManual" type="number" min="0" step="0.01" placeholder="0,00" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Periodicidade</label>
          <Select v-model="form.periodicidade">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Periodicidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in periodicidadeOptions" :key="item.value" :value="item.value">{{ item.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="form.periodicidade === 'PERSONALIZADO'" class="space-y-2">
          <label class="text-sm font-medium">Intervalo em dias</label>
          <Input v-model="form.intervaloDiasPersonalizado" type="number" min="1" step="1" placeholder="30" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Início</label>
          <Input v-model="form.inicio" type="datetime-local" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Próxima cobrança</label>
          <Input v-model="form.proximaCobranca" type="datetime-local" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Gateway</label>
          <Select v-model="form.gateway">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Selecione o gateway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="item in gatewayOptions"
                :key="item.value"
                :value="item.value"
                :disabled="item.disabled"
              >
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Tipo de pagamento</label>
          <Select v-model="form.tipoCobranca">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in tipoCobrancaOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            Cobrança automática monitorada funciona hoje com PIX e boleto. Link permanece como opção manual/assistida.
          </p>
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Observações</label>
          <Textarea v-model="form.observacoes" rows="4" placeholder="Contexto do contrato, SLA, regra de renovação..." />
        </div>

        <div class="space-y-3 rounded-2xl border border-border/70 p-4 md:col-span-2">
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="font-medium text-foreground">Itens da assinatura</p>
              <p class="text-sm text-muted-foreground">Monte o valor dinâmico e marque comodatos quando necessário.</p>
            </div>
            <Button type="button" variant="outline" size="sm" @click="addItem">Adicionar item</Button>
          </div>

          <div v-for="(item, index) in form.itens" :key="index" class="rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">Tipo</label>
                <Select v-model="item.tipoItem">
                  <SelectTrigger class="w-full bg-card">
                    <SelectValue placeholder="Tipo do item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICO">Serviço</SelectItem>
                    <SelectItem value="PRODUTO">Produto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div v-if="item.tipoItem === 'SERVICO'" class="space-y-2 xl:col-span-2">
                <label class="text-sm font-medium">Serviço</label>
                <Select v-model="item.servicoId">
                  <SelectTrigger class="w-full bg-card">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in servicos" :key="option.id" :value="option.id">{{ option.label }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div v-else class="space-y-2 xl:col-span-2">
                <label class="text-sm font-medium">Produto</label>
                <Select v-model="item.produtoId">
                  <SelectTrigger class="w-full bg-card">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in produtos" :key="option.id" :value="option.id">{{ option.label }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">Quantidade</label>
                <Input v-model="item.quantidade" type="number" min="1" step="1" />
              </div>

              <div class="space-y-2 xl:col-span-2">
                <label class="text-sm font-medium">Descrição</label>
                <Input v-model="item.descricaoSnapshot" placeholder="Como o item deve aparecer no contrato" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">Valor unitário</label>
                <Input v-model="item.valorUnitario" type="number" min="0" step="0.01" />
              </div>

              <div class="space-y-2 xl:col-span-4">
                <div class="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card p-3">
                  <label class="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox :checked="item.cobrar" @update:checked="item.cobrar = Boolean($event)" />
                    Cobrar no valor recorrente
                  </label>
                  <label class="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox :checked="item.comodato" @update:checked="item.comodato = Boolean($event)" />
                    Item em comodato
                  </label>
                  <label class="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox :checked="item.ativo ?? true" @update:checked="item.ativo = Boolean($event)" />
                    Item ativo
                  </label>
                  <Button type="button" variant="ghost" size="sm" class="ml-auto text-rose-600" @click="removeItem(index as number)">
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-3 rounded-2xl border border-border/70 p-4 md:col-span-2 md:grid-cols-3">
          <label class="flex items-center gap-2 text-sm text-foreground">
            <Checkbox :checked="form.cobrancaAutomatica" @update:checked="form.cobrancaAutomatica = Boolean($event)" />
            Cobrança automática
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <Checkbox :checked="form.gerarLancamentoFinanceiro" @update:checked="form.gerarLancamentoFinanceiro = Boolean($event)" />
            Gerar lançamento financeiro
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <Checkbox :checked="form.gerarPrimeiroCiclo" @update:checked="form.gerarPrimeiroCiclo = Boolean($event)" />
            Gerar primeiro ciclo agora
          </label>
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button variant="outline" @click="store.closeAssinaturaModal()">Cancelar</Button>
          <Button :disabled="saving" @click="save">
            <RefreshCcw v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ store.editingAssinaturaId ? 'Salvar alterações' : 'Salvar assinatura' }}
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
