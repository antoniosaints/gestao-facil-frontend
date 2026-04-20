<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { BadgePlus, Layers3, RefreshCcw } from 'lucide-vue-next'

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
    ? 'Ajuste itens padrão, cobrança e periodicidade seguindo o mesmo padrão de formulário do projeto.'
    : 'Cadastre o plano com estrutura, ações e campos consistentes com os demais modais do sistema.',
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
          Visão principal em tabela/mobile, com modal alinhado ao padrão global de formulários do projeto.
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
      <form class="grid gap-4 px-4" @submit.prevent="save">
        <Card class="border-none shadow-none bg-transparent">
          <CardContent class="grid gap-4 md:grid-cols-2 p-0">
            <div class="space-y-2 md:col-span-2">
              <Label for="planoNome">Nome do plano</Label>
              <Input id="planoNome" v-model="form.nome" placeholder="Ex: Plano suporte + comodato" />
            </div>

            <div class="space-y-2 md:col-span-2">
              <Label for="planoDescricao">Descrição</Label>
              <Textarea id="planoDescricao" v-model="form.descricao" rows="4"
                placeholder="Explique o que este plano entrega e como deve ser usado pelo time." />
            </div>

            <div class="space-y-2">
              <Label>Status</Label>
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
              <Label>Modo de valor</Label>
              <Select v-model="form.modoValorPadrao">
                <SelectTrigger class="w-full bg-card">
                  <SelectValue placeholder="Modo de valor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in modoValorOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Periodicidade</Label>
              <Select v-model="form.periodicidadePadrao">
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

            <div v-if="form.periodicidadePadrao === 'PERSONALIZADO'" class="space-y-2">
              <Label for="intervaloDiasPlano">Intervalo em dias</Label>
              <Input id="intervaloDiasPlano" v-model="form.intervaloDiasPadrao" type="number" min="1" step="1"
                placeholder="30" />
            </div>

            <div class="space-y-2">
              <Label for="valorBasePlano">Valor base</Label>
              <Input id="valorBasePlano" v-model="form.valorBase" type="number" min="0" step="0.01" />
            </div>

            <div class="space-y-2">
              <Label>Gateway padrão</Label>
              <Select v-model="form.gatewayPadrao">
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

            <div class="space-y-2">
              <Label>Tipo de pagamento padrão</Label>
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
            </div>
          </CardContent>
        </Card>

        <Card class="border-none bg-card shadow-sm dark:bg-card rounded-md flex flex-col gap-1">
          <CardHeader class="flex flex-row items-center justify-between py-2 gap-4 space-y-0 border border-border rounded-md">
            <div>
              <CardTitle class="text-base">Itens da assinatura</CardTitle>
            </div>
            <Button type="button" variant="outline" size="xs" @click="addItem">Adicionar item</Button>
          </CardHeader>
          <div v-for="(item, index) in form.itens" :key="index"
            class="rounded-md border border-border/60 bg-muted/10 px-4 py-2">
            <div class="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
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
                <Input v-model="item.descricaoSnapshot" placeholder="Item padrão do plano" />
              </div>

              <div class="space-y-1 xl:col-span-2">
                <Label>Valor unitário</Label>
                <Input v-model="item.valorUnitario" type="number" min="0" step="0.01" />
              </div>

              <div class="space-y-2 xl:col-span-4">
                <div class="flex flex-wrap items-center gap-4 rounded-md border border-border/60 bg-card px-2 py-1">
                  <label
                    class="flex items-center gap-2 text-sm border py-1 px-2 rounded-md border-border text-foreground">
                    <Checkbox :checked="item.cobrar" @update:checked="item.cobrar = Boolean($event)" />
                    Cobrar no ciclo
                  </label>
                  <label
                    class="flex items-center gap-2 text-sm border py-1 px-2 rounded-md border-border text-foreground">
                    <Checkbox :checked="item.comodato" :disabled="item.tipoItem !== 'PRODUTO'"
                      @update:checked="item.comodato = Boolean($event)" />
                    Comodato padrão
                  </label>
                  <Button type="button" variant="outline" size="sm" class="ml-auto text-rose-600"
                    @click="removeItem(index as number)">
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div class="flex justify-end gap-2 pb-1">
          <Button type="button" variant="secondary" :disabled="saving" @click="store.closePlanoModal()">
            Cancelar
          </Button>
          <Button type="submit" class="text-white" :disabled="saving">
            <RefreshCcw v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ saving ? 'Salvando...' : store.editingPlano ? 'Salvar alterações' : 'Salvar plano' }}
          </Button>
        </div>
      </form>
    </ModalView>
  </div>
</template>
