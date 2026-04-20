<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { BadgePlus, Layers3, RefreshCcw, Search, Trash2 } from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  type PlanoAssinaturaPayload,
} from '@/repositories/assinatura-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR } from '@/utils/formatters'
import {
  createEmptyItem,
  gatewayOptions,
  getPeriodicidadeLabel,
  getStatusPlanoMeta,
  modoValorOptions,
  periodicidadeOptions,
  statusPlanoOptions,
  tipoCobrancaOptions,
} from './shared'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(false)
const saving = ref(false)
const showSearchModal = ref(false)
const showFormModal = ref(false)
const search = ref('')
const status = ref<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS')
const planos = ref<PlanoAssinaturaListItem[]>([])

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
  form.tipoCobrancaPadrao = 'LINK'
  form.itens = [createEmptyItem()]
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

async function loadPlanos(showFeedback = false) {
  try {
    loading.value = true
    const response = await AssinaturaRepository.listarPlanos({
      search: search.value || undefined,
      status: status.value,
    })
    planos.value = response.data

    if (showFeedback) {
      toast.success('Lista de planos atualizada.')
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar os planos.')
  } finally {
    loading.value = false
  }
}

async function save() {
  try {
    saving.value = true
    await AssinaturaRepository.salvarPlano({
      ...form,
      valorBase: Number(form.valorBase || 0),
      intervaloDiasPadrao: form.periodicidadePadrao === 'PERSONALIZADO' ? Number(form.intervaloDiasPadrao || 30) : undefined,
      itens: form.itens.map((item: any) => ({
        ...item,
        servicoId: item.tipoItem === 'SERVICO' ? Number(item.servicoId || 0) || undefined : undefined,
        produtoId: item.tipoItem === 'PRODUTO' ? Number(item.produtoId || 0) || undefined : undefined,
        quantidade: Number(item.quantidade || 1),
        valorUnitario: Number(item.valorUnitario || 0),
      })),
    })

    toast.success('Plano salvo com sucesso.')
    showFormModal.value = false
    resetForm()
    await loadPlanos()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar o plano.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPlanos()
})
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
          Padronize itens recorrentes, periodicidade e gateway para reaproveitar nas assinaturas.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button variant="outline" class="gap-2" @click="showSearchModal = true">
          <Search class="h-4 w-4" /> Buscar
        </Button>
        <Button class="gap-2" @click="resetForm(); showFormModal = true">
          <BadgePlus class="h-4 w-4" /> Novo plano
        </Button>
        <Button variant="outline" class="gap-2" @click="loadPlanos(true)">
          <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" /> Atualizar
        </Button>
      </div>
    </div>

    <Card class="border-border/70 bg-card shadow-sm">
      <CardContent class="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{{ planos.length }} plano(s)</Badge>
          <Badge v-if="status !== 'TODOS'" variant="outline">Status: {{ status }}</Badge>
          <Badge v-if="search" variant="outline">Busca: {{ search }}</Badge>
        </div>
        <div class="flex flex-wrap gap-2">
          <Select v-model="status">
            <SelectTrigger class="w-[180px] bg-card">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in statusPlanoOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" @click="loadPlanos(true)">Aplicar</Button>
        </div>
      </CardContent>
    </Card>

    <div v-if="loading" class="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
      Carregando planos...
    </div>

    <div v-else-if="!planos.length" class="rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center">
      <p class="font-medium text-foreground">Nenhum plano cadastrado</p>
      <p class="mt-1 text-sm text-muted-foreground">Crie seus pacotes base antes de massificar a operação recorrente.</p>
      <Button class="mt-4 gap-2" @click="resetForm(); showFormModal = true">
        <BadgePlus class="h-4 w-4" /> Criar plano
      </Button>
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-2">
      <Card v-for="item in planos" :key="item.id" class="border-border/70 bg-card shadow-sm">
        <CardHeader class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle class="text-lg">{{ item.nome }}</CardTitle>
              <p class="text-sm text-muted-foreground">{{ item.Uid }}</p>
            </div>
            <Badge :class="getStatusPlanoMeta(item.status).className">
              {{ getStatusPlanoMeta(item.status).label }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-xl border border-border/60 bg-muted/10 p-3">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Valor base</p>
              <p class="mt-1 text-base font-semibold text-foreground">{{ formatCurrencyBR(item.valorBase) }}</p>
            </div>
            <div class="rounded-xl border border-border/60 bg-muted/10 p-3">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Periodicidade</p>
              <p class="mt-1 text-sm font-medium text-foreground">{{ getPeriodicidadeLabel(item.periodicidadePadrao) }}</p>
            </div>
            <div class="rounded-xl border border-border/60 bg-muted/10 p-3">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Modo</p>
              <p class="mt-1 text-sm font-medium text-foreground">{{ item.modoValorPadrao }}</p>
            </div>
          </div>

          <div class="text-sm text-muted-foreground">
            {{ item.descricao || 'Sem descrição operacional.' }}
          </div>

          <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{{ item.resumo.itens }} item(ns)</span>
            <span>•</span>
            <span>{{ item.resumo.itensCobrados }} item(ns) cobrados</span>
            <span>•</span>
            <span>{{ item.resumo.assinaturasVinculadas }} assinatura(s) vinculada(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar planos" description="Refine por nome, UID ou descrição.">
      <div class="space-y-4 px-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Busca</label>
          <Input v-model="search" placeholder="Nome, UID ou descrição" @keyup.enter="loadPlanos(true); showSearchModal = false" />
        </div>
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="search = ''; status = 'TODOS'">Limpar</Button>
          <Button class="flex-1" @click="loadPlanos(true); showSearchModal = false">Aplicar</Button>
        </div>
      </div>
    </ModalView>

    <ModalView v-model:open="showFormModal" title="Novo plano" description="Defina itens padrão e política de cobrança." size="4xl">
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
                  <Button type="button" variant="ghost" size="sm" class="ml-auto text-rose-600" @click="removeItem(index)">
                    <Trash2 class="mr-2 h-4 w-4" /> Remover
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button variant="outline" @click="showFormModal = false">Cancelar</Button>
          <Button :disabled="saving" @click="save">
            <RefreshCcw v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            Salvar plano
          </Button>
        </div>
      </div>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="showSearchModal = true">
        <Search class="h-5 w-5" />
        <span class="text-xs">Busca</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="resetForm(); showFormModal = true">
        <BadgePlus class="h-5 w-5" />
        <span class="text-xs">Novo</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="loadPlanos(true)">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="status = 'TODOS'; search = ''; loadPlanos(true)">
        <Layers3 class="h-5 w-5" />
        <span class="text-xs">Limpar</span>
      </button>
    </MobileBottomBar>
  </div>
</template>
