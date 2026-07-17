<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  BadgePlus,
  CircleDollarSign,
  FileText,
  Layers3,
  LoaderCircle,
  PackagePlus,
  RefreshCcw,
} from 'lucide-vue-next'

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
  type PlanoAssinaturaListItem,
} from '@/repositories/assinatura-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import {
  createEmptyItem,
  gatewayOptions,
  modoValorOptions,
  periodicidadeOptions,
  statusPlanoOptions,
  tipoCobrancaOptions,
} from './shared'
import CollapsibleSection from '@/pages/produtos/formulario/CollapsibleSection.vue'
import PlanosTabela from './components/PlanosTabela.vue'
import PlanosMobile from './components/PlanosMobile.vue'

const toast = useToast()
const uiStore = useUiStore()
const store = useAssinaturasStore()

const saving = ref(false)
const secDescricao = ref(true)
const secCobranca = ref(true)
const secItens = ref(true)

const form = reactive<any>({
  id: undefined,
  nome: '',
  descricao: '',
  status: 'ATIVO',
  periodicidadePadrao: 'MENSAL',
  intervaloDiasPadrao: 30,
  valorBase: 0,
  modoValorPadrao: 'DINAMICO',
  gatewayPadrao: 'mercadopago',
  tipoCobrancaPadrao: 'PIX',
  itens: [createEmptyItem()],
})

const modalTitle = computed(() => (store.editingPlano ? 'Editar plano' : 'Novo plano'))
const modalDescription = computed(() =>
  store.editingPlano
    ? 'Ajuste itens padrão, cobrança e periodicidade no padrão dos formulários principais.'
    : 'Cadastre o plano que servirá como base para novos contratos recorrentes.',
)

function resetForm() {
  form.id = undefined
  form.nome = ''
  form.descricao = ''
  form.status = 'ATIVO'
  form.periodicidadePadrao = 'MENSAL'
  form.intervaloDiasPadrao = 30
  form.valorBase = 0
  form.modoValorPadrao = 'DINAMICO'
  form.gatewayPadrao = 'mercadopago'
  form.tipoCobrancaPadrao = 'PIX'
  form.itens = [createEmptyItem()]
}

function hydrateForm(plano: PlanoAssinaturaListItem) {
  form.id = plano.id
  form.nome = plano.nome
  form.descricao = plano.descricao || ''
  form.status = plano.status
  form.periodicidadePadrao = plano.periodicidadePadrao
  form.intervaloDiasPadrao = plano.intervaloDiasPadrao || 30
  form.valorBase = plano.valorBase
  form.modoValorPadrao = plano.modoValorPadrao
  form.gatewayPadrao = plano.gatewayPadrao || 'mercadopago'
  form.tipoCobrancaPadrao = plano.tipoCobrancaPadrao || 'PIX'
  form.itens = plano.itens.length
    ? plano.itens.map((item) => ({
      ...createEmptyItem(),
      ...item,
      servicoId: item.servicoId || null,
      produtoId: item.produtoId || null,
    }))
    : [createEmptyItem()]
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
  }
}

async function save() {
  try {
    if (!form.nome.trim()) {
      toast.error('Informe o nome do plano.')
      return
    }

    saving.value = true
    await AssinaturaRepository.salvarPlano({
      ...form,
      valorBase: Number(form.valorBase || 0),
      intervaloDiasPadrao:
        form.periodicidadePadrao === 'PERSONALIZADO' ? Number(form.intervaloDiasPadrao || 30) : undefined,
      itens: form.itens.map((item: any) => ({
        ...item,
        servicoId: item.tipoItem === 'SERVICO' ? Number(item.servicoId || 0) || undefined : undefined,
        produtoId: item.tipoItem === 'PRODUTO' ? Number(item.produtoId || 0) || undefined : undefined,
        quantidade: Number(item.quantidade || 1),
        valorUnitario: Number(item.valorUnitario || 0),
        comodato: item.tipoItem === 'PRODUTO' ? Boolean(item.comodato) : false,
      })),
    })

    toast.success(store.editingPlano ? 'Plano atualizado com sucesso.' : 'Plano salvo com sucesso.')
    store.closePlanoModal()
    resetForm()
    store.refreshPlanos()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar o plano.')
  } finally {
    saving.value = false
  }
}

watch(
  () => store.openPlanoModal,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
      return
    }

    secDescricao.value = true
    secCobranca.value = true
    secItens.value = true

    if (store.editingPlano) {
      hydrateForm(store.editingPlano)
      return
    }

    resetForm()
  },
)
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Layers3 class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Planos de contratos
        </h2>
        <p class="text-sm text-muted-foreground">
          Modelos reutilizáveis para contratos recorrentes, cobranças e comodatos.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Select v-model="store.planosFilters.status">
          <SelectTrigger class="w-[180px] bg-card">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in statusPlanoOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" class="gap-2" @click="store.refreshPlanos()">
          <RefreshCcw class="h-4 w-4" /> Atualizar
        </Button>
        <Button class="gap-2" @click="store.openCreatePlano()">
          <BadgePlus class="h-4 w-4" /> Novo plano
        </Button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <PlanosTabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <PlanosMobile />
    </div>

    <ModalView v-model:open="store.openPlanoModal" :title="modalTitle" :description="modalDescription" size="4xl">
      <form class="grid gap-4 px-4 pb-1" @submit.prevent="save">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-6">
            <Label for="planoNome" class="mb-1.5 block text-sm font-medium">
              Nome do plano <span class="text-red-500">*</span>
            </Label>
            <Input id="planoNome" v-model="form.nome" class="bg-background dark:bg-background/60" placeholder="Ex: Plano suporte + comodato" />
          </div>
          <div class="md:col-span-3">
            <Label class="mb-1.5 block text-sm font-medium">Status</Label>
            <Select v-model="form.status">
              <SelectTrigger class="w-full bg-background dark:bg-background/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="md:col-span-3">
            <Label class="mb-1.5 block text-sm font-medium">Modo de valor</Label>
            <Select v-model="form.modoValorPadrao">
              <SelectTrigger class="w-full bg-background dark:bg-background/60">
                <SelectValue placeholder="Modo de valor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in modoValorOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CollapsibleSection v-model:open="secDescricao" title="Descrição" class="bg-black/5 dark:bg-card" :icon="FileText">
          <Textarea id="planoDescricao" v-model="form.descricao" rows="4" placeholder="Explique o que este plano entrega e como deve ser usado pelo time." class="bg-background dark:bg-background/70" />
        </CollapsibleSection>

        <CollapsibleSection v-model:open="secCobranca" title="Cobrança padrão" class="bg-black/5 dark:bg-card" :icon="CircleDollarSign">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div class="md:col-span-3">
              <Label class="mb-1.5 block text-sm font-medium">Periodicidade</Label>
              <Select v-model="form.periodicidadePadrao">
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
            <div v-if="form.periodicidadePadrao === 'PERSONALIZADO'" class="md:col-span-3">
              <Label for="intervaloDiasPlano" class="mb-1.5 block text-sm font-medium">Intervalo em dias</Label>
              <Input id="intervaloDiasPlano" v-model="form.intervaloDiasPadrao" class="bg-background dark:bg-background/60" type="number" min="1" step="1" placeholder="30" />
            </div>
            <div class="md:col-span-3">
              <Label for="valorBasePlano" class="mb-1.5 block text-sm font-medium">Valor base</Label>
              <Input id="valorBasePlano" v-model="form.valorBase" class="bg-background dark:bg-background/60" type="number" min="0" step="0.01" />
            </div>
            <div class="md:col-span-3">
              <Label class="mb-1.5 block text-sm font-medium">Gateway padrão</Label>
              <Select v-model="form.gatewayPadrao">
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
              <Select v-model="form.tipoCobrancaPadrao">
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

        <CollapsibleSection v-model:open="secItens" title="Itens do plano" class="bg-black/5 dark:bg-card" :icon="PackagePlus">
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
                  <Input v-model="item.descricaoSnapshot" class="bg-background dark:bg-background/60" placeholder="Item padrão do plano" />
                </div>
                <div class="xl:col-span-2">
                  <Label class="mb-1.5 block text-sm font-medium">Valor unitário</Label>
                  <Input v-model="item.valorUnitario" class="bg-background dark:bg-background/60" type="number" min="0" step="0.01" />
                </div>
              </div>
              <div class="mt-3 grid gap-2 md:grid-cols-2">
                <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
                  <span>Cobrar no ciclo</span>
                  <Switch v-model:model-value="item.cobrar" />
                </label>
                <label class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40 dark:bg-background/40">
                  <span>Comodato padrão</span>
                  <Switch v-model:model-value="item.comodato" :disabled="item.tipoItem !== 'PRODUTO'" />
                </label>
              </div>
              <div class="mt-3 flex justify-end">
                <Button type="button" variant="ghost" size="sm" class="text-rose-600" @click="removeItem(index as number)">Remover item</Button>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <div class="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" :disabled="saving" @click="store.closePlanoModal()">
            Cancelar
          </Button>
          <Button type="submit" class="text-white" :disabled="saving">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ saving ? 'Salvando...' : store.editingPlano ? 'Salvar alterações' : 'Salvar plano' }}
          </Button>
        </div>
      </form>
    </ModalView>
  </div>
</template>
