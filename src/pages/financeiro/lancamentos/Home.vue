<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Tabela from './tabela/Tabela.vue'
import Mobile from './tabela/Mobile.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import LancamentoModal from './formulario/LancamentoModal.vue'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import {
  BadgePlus,
  BookOpenText,
  CircleChevronDown,
  FileText,
  Filter,
  RotateCw,
  Tags,
  Trash,
  Upload,
  Wallet,
  X,
} from 'lucide-vue-next'
import GerarDRE from './modais/GerarDRE.vue'
import ModalLoteLancamentos from './modais/ModalLoteLancamentos.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useToast } from 'vue-toastification'
import router from '@/router'
import ModalView from '@/components/formulario/ModalView.vue'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import type { CategoriaFinanceiro, ContasFinanceiro } from '@/types/schemas'
import { useSocketEvent } from '@/composables/useSocketEvent'

const store = useLancamentosStore()
const uiStore = useUiStore()
const toast = useToast()

const contas = reactive<{ data: ContasFinanceiro[] }>({ data: [] })
const categorias = reactive<{ data: CategoriaFinanceiro[] }>({ data: [] })
const openFiltersModal = ref(false)

const filtros = reactive({
  tipo: (store.filters.tipo as 'TODOS' | 'RECEITA' | 'DESPESA') || 'TODOS',
  status: (store.filters.status as 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO') || 'TODOS',
  origem: (store.filters.origem as 'TODOS' | 'ASSINATURA_PAGAR') || 'TODOS',
  contaFinanceiraId: store.filters.contaFinanceiraId ? String(store.filters.contaFinanceiraId) : 'all',
  categoriaId: store.filters.categoriaId ? String(store.filters.categoriaId) : 'all',
  clienteId: store.filters.clienteId || null,
  inicio: store.filters.inicio || '',
  fim: store.filters.fim || '',
})

const openByTipo = (tipo: 'RECEITA' | 'DESPESA') => {
  store.form.tipo = tipo
  store.openSave()
}

async function loadFilterOptions() {
  try {
    const [responseContas, responseCategorias] = await Promise.all([
      LancamentosRepository.listarContas(),
      LancamentosRepository.listarCategorias(),
    ])

    contas.data = responseContas.data ?? []
    categorias.data = responseCategorias.data ?? []
  } catch (error) {
    console.error(error)
    toast.warning('Não foi possível carregar contas e categorias dos filtros.')
  }
}

async function excluirEmLote() {
  try {
    if (!store.selectedIds.length) return toast.error('Nenhum lançamento selecionado')
    const confirm = await useConfirm().confirm({
      title: 'Excluir em lote',
      message: 'Tem certeza que deseja excluir esses lançamentos?',
    })
    if (!confirm) return
    await Promise.all(store.selectedIds.map((id) => LancamentosRepository.remove(id)))
    store.updateTable()
    toast.success('Lançamentos excluídos com sucesso')
  } catch (error) {
    toast.error('Erro ao excluir os lançamentos')
    console.log(error)
  }
}

function applyFilters() {
  store.filters.tipo = filtros.tipo
  store.filters.status = filtros.status
  store.filters.origem = filtros.origem
  store.filters.contaFinanceiraId = filtros.contaFinanceiraId !== 'all' ? Number(filtros.contaFinanceiraId) : null
  store.filters.categoriaId = filtros.categoriaId !== 'all' ? Number(filtros.categoriaId) : null
  store.filters.clienteId = filtros.clienteId || null
  store.filters.inicio = filtros.inicio || null
  store.filters.fim = filtros.fim || null
  openFiltersModal.value = false
  store.updateTable()
}

function clearFilters() {
  filtros.tipo = 'TODOS'
  filtros.status = 'TODOS'
  filtros.origem = 'TODOS'
  filtros.contaFinanceiraId = 'all'
  filtros.categoriaId = 'all'
  filtros.clienteId = null
  filtros.inicio = ''
  filtros.fim = ''
}

function clearAndApplyFilters() {
  clearFilters()
  applyFilters()
}

function goToCategorias() {
  router.push('/financeiro/categorias')
}

function goToContas() {
  router.push('/financeiro/contas')
}

onMounted(() => {
  loadFilterOptions()
})

useSocketEvent('financeiro:updated', () => {
  store.updateTable()
  loadFilterOptions()
})
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Wallet class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Lançamentos
        </h2>
        <p class="text-sm text-muted-foreground">Lançamentos financeiros do sistema</p>
      </div>
      <div class="hidden items-center justify-between gap-2 md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">
              <CircleChevronDown />
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem class="cursor-pointer" @click="goToCategorias">
                <Tags />
                <span>Categorias</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="goToContas">
                <BookOpenText />
                <span>Contas financeiras</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="openFiltersModal = true">
                <Filter />
                <span>Filtros avançados</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="store.openModalLote = true">
                <Upload />
                <span>Importar CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem v-if="store.selectedIds.length" class="cursor-pointer" @click="excluirEmLote">
                <Trash />
                <span>Excluir em lote</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          class="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          @click="openFiltersModal = true"
        >
          <Filter class="h-5 w-5" /> <span class="hidden md:inline">Filtros</span>
        </button>

        <button
          class="flex items-center gap-2 rounded-md bg-warning px-3 py-1.5 text-sm text-white"
          @click="store.openModalDre = true"
        >
          <FileText class="h-5 w-5" /> <span class="hidden md:inline">DRE</span>
        </button>
        <button
          class="flex items-center gap-2 rounded-md bg-success px-3 py-1.5 text-sm text-white"
          @click="openByTipo('RECEITA')"
        >
          <BadgePlus class="inline-flex h-5 w-5" /> <span class="hidden md:inline">Receita</span>
        </button>
        <button
          class="flex items-center gap-2 rounded-md bg-danger px-3 py-1.5 text-sm text-white"
          @click="openByTipo('DESPESA')"
        >
          <BadgePlus class="inline-flex h-5 w-5" /> <span class="hidden md:inline">Despesa</span>
        </button>
        <button class="rounded-md border border-border bg-background px-2 py-1.5 text-sm" @click="store.updateTable">
          <RotateCw class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <Tabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <Mobile />
    </div>

    <ModalView v-model:open="openFiltersModal" title="Filtros avançados" description="Aplique filtros estruturados na listagem principal de lançamentos." size="lg">
      <div class="grid gap-4 px-4 md:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-medium">Período inicial</label>
          <Input v-model="filtros.inicio" type="date" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Período final</label>
          <Input v-model="filtros.fim" type="date" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Tipo</label>
          <Select v-model="filtros.tipo">
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="RECEITA">Receita</SelectItem>
              <SelectItem value="DESPESA">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Status</label>
          <Select v-model="filtros.status">
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Origem</label>
          <Select v-model="filtros.origem">
            <SelectTrigger>
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas</SelectItem>
              <SelectItem value="ASSINATURA_PAGAR">Assinatura</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Conta financeira</label>
          <Select v-model="filtros.contaFinanceiraId">
            <SelectTrigger>
              <SelectValue placeholder="Conta financeira" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem v-for="conta in contas.data" :key="conta.id" :value="String(conta.id)">
                {{ conta.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Categoria</label>
          <Select v-model="filtros.categoriaId">
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem v-for="categoria in categorias.data" :key="categoria.id" :value="String(categoria.id)">
                {{ categoria.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-medium">Cliente / fornecedor</label>
          <Select2Ajax v-model="filtros.clienteId" url="/clientes/select2" allowClear />
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button variant="outline" @click="clearFilters">
            <X class="h-4 w-4" /> Limpar
          </Button>
          <Button variant="outline" @click="clearAndApplyFilters">Limpar e aplicar</Button>
          <Button variant="outline" @click="openFiltersModal = false">Cancelar</Button>
          <Button @click="applyFilters">
            <Filter class="h-4 w-4" /> Aplicar
          </Button>
        </div>
      </div>
    </ModalView>

    <LancamentoModal />
    <ModalLoteLancamentos />
    <ClientesModal />
    <GerarDRE />
  </div>
</template>
