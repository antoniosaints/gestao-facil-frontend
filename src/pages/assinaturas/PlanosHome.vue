<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { BadgePlus, Layers3, RefreshCcw } from 'lucide-vue-next'

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
import PlanosTabela from './components/PlanosTabela.vue'
import PlanosMobile from './components/PlanosMobile.vue'

const toast = useToast()
const uiStore = useUiStore()
const store = useAssinaturasStore()

const saving = ref(false)

const form = reactive<any>({
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
    ? 'Ajuste itens padrão, cobrança e periodicidade diretamente da listagem.'
    : 'Defina itens padrão e política de cobrança.',
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
  form.itens = plano.itens.length ? plano.itens.map((item) => ({ ...item })) : [createEmptyItem()]
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

async function save() {
  try {
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
          Planos de assinatura
        </h2>
        <p class="text-sm text-muted-foreground">
          Visão principal em tabela/mobile, com edição no mesmo modal da listagem.
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

    <ModalView
      v-model:open="store.openPlanoModal"
      :title="modalTitle"
      :description="modalDescription"
      size="4xl"
    >
      <div class="grid gap-4 px-4 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Nome do plano</label>
          <Input v-model="form.nome" placeholder="Ex: Plano suporte + comodato" />
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Descrição</label>
          <Textarea v-model="form.descricao" rows="4" placeholder="Explique o que este plano entrega e como deve ser usado pelo time." />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Status</label>
          <Select v-model="form.status">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ATIVO">Ativo</SelectItem>
              <SelectItem value="INATIVO">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Modo de valor</label>
          <Select v-model="form.modoValorPadrao">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Modo de valor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in modoValorOptions" :key="item.value" :value="item.value">{{ item.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Periodicidade</label>
          <Select v-model="form.periodicidadePadrao">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Periodicidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in periodicidadeOptions" :key="item.value" :value="item.value">{{ item.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="form.periodicidadePadrao === 'PERSONALIZADO'" class="space-y-2">
          <label class="text-sm font-medium">Intervalo em dias</label>
          <Input v-model="form.intervaloDiasPadrao" type="number" min="1" step="1" placeholder="30" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Valor base</label>
          <Input v-model="form.valorBase" type="number" min="0" step="0.01" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Gateway padrão</label>
          <Select v-model="form.gatewayPadrao">
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
          <label class="text-sm font-medium">Tipo de pagamento padrão</label>
          <Select v-model="form.tipoCobrancaPadrao">
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
            Para automação recorrente monitorada, prefira PIX ou boleto. Link fica disponível apenas para uso assistido.
          </p>
        </div>

        <div class="space-y-3 rounded-2xl border border-border/70 p-4 md:col-span-2">
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="font-medium text-foreground">Itens padrão</p>
              <p class="text-sm text-muted-foreground">Use snapshots descritivos para reutilizar o plano em novas assinaturas.</p>
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
              <div class="space-y-2 xl:col-span-2">
                <label class="text-sm font-medium">Descrição</label>
                <Input v-model="item.descricaoSnapshot" placeholder="Item padrão do plano" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Quantidade</label>
                <Input v-model="item.quantidade" type="number" min="1" step="1" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Valor unitário</label>
                <Input v-model="item.valorUnitario" type="number" min="0" step="0.01" />
              </div>
              <div class="space-y-2 xl:col-span-3">
                <div class="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card p-3">
                  <label class="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox :checked="item.cobrar" @update:checked="item.cobrar = Boolean($event)" />
                    Cobrar no ciclo
                  </label>
                  <label class="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox :checked="item.comodato" @update:checked="item.comodato = Boolean($event)" />
                    Comodato padrão
                  </label>
                  <Button type="button" variant="ghost" size="sm" class="ml-auto text-rose-600" @click="removeItem(index as number)">
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button variant="outline" @click="store.closePlanoModal()">Cancelar</Button>
          <Button :disabled="saving" @click="save">
            <RefreshCcw v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ store.editingPlano ? 'Salvar alterações' : 'Salvar plano' }}
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
