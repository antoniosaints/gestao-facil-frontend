<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { BadgePlus, Layers3, RefreshCcw, Sparkles } from 'lucide-vue-next'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const modalTitle = computed(() => (store.editingAssinaturaId ? 'Editar assinatura' : 'Nova assinatura'))
const modalDescription = computed(() =>
  store.editingAssinaturaId
    ? 'Atualize contrato, cobrança e itens recorrentes usando o mesmo padrão de modal do restante do projeto.'
    : 'Cadastre o contrato recorrente com select com busca, datepicker padrão e estrutura consistente com os outros formulários.',
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
      await loadPlanos()

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

    if (!form.nomeContrato.trim()) {
      toast.error('Informe o nome do contrato.')
      return
    }

    const inicio = toDateOnlyIso(form.inicio)
    const fim = form.recorrenciaIndefinida ? undefined : toDateOnlyIso(form.fim)
    const proximaCobranca = toDateOnlyIso(form.proximaCobranca)

    if (!inicio || !proximaCobranca) {
      toast.error('Preencha as datas obrigatórias da assinatura.')
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
          Contratos recorrentes e assinaturas.
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

    <ModalView v-model:open="store.openAssinaturaModal" :title="modalTitle" :description="modalDescription" size="4xl">
      <div v-if="loadingModal" class="px-4 py-8 text-center text-sm text-muted-foreground">
        Preparando formulário da assinatura...
      </div>

      <form v-else class="grid gap-4 px-4" @submit.prevent="save">
        <Card class="border-none shadow-none bg-transparent">
          <CardContent class="grid gap-2 md:grid-cols-4 p-0">
            <div class="space-y-1 md:col-span-2">
              <Label for="assinaturaCliente">Cliente</Label>
              <Select2Ajax id="assinaturaCliente" v-model="form.clienteId" url="/clientes/select2" class="w-full" />
            </div>

            <div class="space-y-1 md:col-span-2">
              <Label for="assinaturaPlano">Plano base</Label>
              <Select2Ajax id="assinaturaPlano" v-model="form.planoId" url="/assinaturas/planos/select2" allowClear
                class="w-full" />
            </div>

            <div class="space-y-1 md:col-span-2">
              <Label for="nomeContrato">Nome do contrato</Label>
              <Input id="nomeContrato" v-model="form.nomeContrato" placeholder="Ex: Mensalidade suporte premium" />
            </div>

            <div class="space-y-1 md:col-span-2">
              <Label>Status da assinatura</Label>
              <Select v-model="form.status">
                <SelectTrigger class="w-full bg-card">
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

            <div class="space-y-1">
              <Label>Modo de valor</Label>
              <Select v-model="form.modoValor">
                <SelectTrigger class="w-full bg-card">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in modoValorOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="form.modoValor === 'MANUAL'" class="space-y-1">
              <Label for="valorManualAssinatura">Valor manual</Label>
              <Input id="valorManualAssinatura" v-model="form.valorManual" type="number" min="0" step="0.01"
                placeholder="0,00" />
            </div>

            <div class="space-y-1">
              <Label>Periodicidade</Label>
              <Select v-model="form.periodicidade">
                <SelectTrigger class="w-full bg-card">
                  <SelectValue placeholder="Periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in periodicidadeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="form.periodicidade === 'PERSONALIZADO'" class="space-y-1">
              <Label for="intervaloPersonalizadoAssinatura">Intervalo em dias</Label>
              <Input id="intervaloPersonalizadoAssinatura" v-model="form.intervaloDiasPersonalizado" type="number"
                min="1" step="1" placeholder="30" />
            </div>

            <div class="space-y-1">
              <Label for="inicioAssinatura">Início</Label>
              <Calendarpicker id="inicioAssinatura" v-model="form.inicio" :teleport="true" />
            </div>

            <div class="space-y-1">
              <Label for="proximaCobrancaAssinatura">Próxima cobrança</Label>
              <Calendarpicker id="proximaCobrancaAssinatura" v-model="form.proximaCobranca" :teleport="true" />
            </div>

            <div v-if="!form.recorrenciaIndefinida" class="space-y-1 md:col-span-2">
              <Label for="fimAssinatura">Data final</Label>
              <Calendarpicker id="fimAssinatura" v-model="form.fim" :teleport="true" />
            </div>

            <div class="space-y-1">
              <Label>Gateway</Label>
              <Select v-model="form.gateway">
                <SelectTrigger class="w-full bg-card">
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

            <div class="space-y-1">
              <Label>Tipo de pagamento</Label>
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
            </div>

            <div class="space-y-1 md:col-span-2">
              <label for="recorrenciaIndefinida" class="flex items-center gap-2 rounded-md cursor-pointer border border-border/60 bg-card p-3">
                <Checkbox id="recorrenciaIndefinida" v-model="form.recorrenciaIndefinida" />
                <div>
                  <Label class="cursor-pointer">Recorrência sem data final</Label>
                  <p class="text-xs text-muted-foreground">Desmarque para informar uma data de encerramento do contrato.
                  </p>
                </div>
              </label>
            </div>

            <div class="space-y-1 md:col-span-4">
              <Label for="observacoesAssinatura">Observações</Label>
              <Textarea id="observacoesAssinatura" v-model="form.observacoes" rows="4"
                placeholder="Contexto do contrato, SLA, regra de renovação..." />
            </div>
          </CardContent>
        </Card>

        <div class="grid gap-3 md:grid-cols-3">
          <label class="flex items-center gap-2 rounded-md cursor-pointer border border-border/60 bg-card px-3 py-2 text-sm text-foreground">
            <Checkbox :checked="form.cobrancaAutomatica" @update:checked="form.cobrancaAutomatica = Boolean($event)" />
            Cobrança automática
          </label>
          <label class="flex items-center gap-2 rounded-md cursor-pointer border border-border/60 bg-card px-3 py-2 text-sm text-foreground">
            <Checkbox :checked="form.gerarLancamentoFinanceiro"
              @update:checked="form.gerarLancamentoFinanceiro = Boolean($event)" />
            Gerar lançamento financeiro
          </label>
          <label class="flex items-center gap-2 rounded-md cursor-pointer border border-border/60 bg-card px-3 py-2 text-sm text-foreground">
            <Checkbox :checked="form.gerarPrimeiroCiclo" @update:checked="form.gerarPrimeiroCiclo = Boolean($event)" />
            Gerar primeiro ciclo agora
          </label>
        </div>

        <Card class="border-none bg-card shadow-sm dark:bg-card rounded-md flex flex-col gap-1">
          <CardHeader class="flex flex-row items-center justify-between py-2 gap-4 space-y-0 px-2 pl-4 border border-border rounded-md">
            <div>
              <CardTitle class="text-base">Itens da assinatura</CardTitle>
            </div>
            <Button type="button" variant="outline" size="sm" @click="addItem">Adicionar item</Button>
          </CardHeader>
          <div v-for="(item, index) in form.itens" :key="index"
              class="rounded-md border border-border/60 bg-muted/10 p-4">
              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-1">
                  <Label>Tipo</Label>
                  <Select :model-value="item.tipoItem"
                    @update:model-value="handleTipoItemChange(item, $event as 'SERVICO' | 'PRODUTO')">
                    <SelectTrigger class="w-full bg-card">
                      <SelectValue placeholder="Tipo do item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICO">Serviço</SelectItem>
                      <SelectItem value="PRODUTO">Produto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div v-if="item.tipoItem === 'SERVICO'" class="space-y-1 xl:col-span-2">
                  <Label>Serviço</Label>
                  <Select2Ajax v-model="item.servicoId" url="/servicos/select2" allowClear class="w-full" />
                </div>

                <div v-else class="space-y-1 xl:col-span-2">
                  <Label>Produto</Label>
                  <Select2Ajax v-model="item.produtoId" url="/produtos/select2" allowClear class="w-full" />
                </div>

                <div class="space-y-1">
                  <Label>Quantidade</Label>
                  <Input v-model="item.quantidade" type="number" min="1" step="1" />
                </div>

                <div class="space-y-1 xl:col-span-2">
                  <Label>Descrição</Label>
                  <Input v-model="item.descricaoSnapshot" placeholder="Como o item deve aparecer no contrato" />
                </div>

                <div class="space-y-1 xl:col-span-2">
                  <Label>Valor unitário</Label>
                  <Input v-model="item.valorUnitario" type="number" min="0" step="0.01" />
                </div>

                <div class="space-y-1 xl:col-span-4">
                  <div class="flex flex-wrap items-center gap-4 rounded-md border border-border/60 bg-card px-2 py-1">
                    <label class="flex items-center gap-2 text-sm border py-1 px-2 rounded-md cursor-pointer border-border text-foreground">
                      <Checkbox :checked="item.cobrar" @update:checked="item.cobrar = Boolean($event)" />
                      Cobrar no valor recorrente
                    </label>
                    <label class="flex items-center gap-2 text-sm border py-1 px-2 rounded-md cursor-pointer border-border text-foreground">
                      <Checkbox :checked="item.comodato" :disabled="item.tipoItem !== 'PRODUTO'"
                        @update:checked="item.comodato = Boolean($event)" />
                      Item em comodato
                    </label>
                    <label class="flex items-center gap-2 text-sm border py-1 px-2 rounded-md cursor-pointer border-border text-foreground">
                      <Checkbox :checked="item.ativo ?? true" @update:checked="item.ativo = Boolean($event)" />
                      Item ativo
                    </label>
                    <Button type="button" variant="ghost" size="sm" class="ml-auto text-rose-600"
                      @click="removeItem(index as number)">
                      Remover
                    </Button>
                  </div>
                </div>

                <template v-if="item.tipoItem === 'PRODUTO' && item.comodato">
                  <div class="space-y-1">
                    <Label>Identificação</Label>
                    <Input v-model="item.identificacao" placeholder="Patrimônio, série ou referência" />
                  </div>
                  <div class="space-y-1">
                    <Label>Previsão de devolução</Label>
                    <Calendarpicker v-model="item.dataPrevistaDevolucao" :teleport="true" />
                  </div>
                  <div class="space-y-1 md:col-span-2 xl:col-span-2">
                    <Label>Observações do comodato</Label>
                    <Textarea v-model="item.observacoes" rows="3"
                      placeholder="Condição, observações de entrega, restrições..." />
                  </div>
                </template>
              </div>
            </div>
        </Card>

        <div class="flex justify-end gap-2 pb-1">
          <Button type="button" variant="secondary" :disabled="saving" @click="store.closeAssinaturaModal()">
            Cancelar
          </Button>
          <Button type="submit" class="text-white" :disabled="saving">
            <RefreshCcw v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ saving ? 'Salvando...' : store.editingAssinaturaId ? 'Salvar alterações' : 'Salvar assinatura' }}
          </Button>
        </div>
      </form>
    </ModalView>
  </div>
</template>
