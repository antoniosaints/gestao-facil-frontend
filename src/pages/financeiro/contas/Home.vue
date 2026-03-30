<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { BadgePlus, BadgeQuestionMark, Loader, RotateCw, Search, Trash, Wallet } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import type { ContasFinanceiro } from '@/types/schemas'
import ModalConta from './ModalConta.vue'
import Tabela from './tabela/Tabela.vue'
import { useContasFinanceirasStore } from '@/stores/lancamentos/useContasFinanceiras'

const uiStore = useUiStore()
const store = useContasFinanceirasStore()
const toast = useToast()

const contas = ref<ContasFinanceiro[]>([])
const loading = ref(false)
const search = ref('')

const contasFiltradas = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return contas.value

  return contas.value.filter((item) => `${item.nome} ${item.id} ${item.Uid || ''}`.toLowerCase().includes(term))
})

async function loadContas() {
  try {
    loading.value = true
    const response = await LancamentosRepository.listarContas()
    contas.value = (response.data ?? []).map((item: ContasFinanceiro) => ({
      id: Number(item.id),
      Uid: item.Uid,
      nome: item.nome,
      saldoInicial: item.saldoInicial ?? 0,
    }))
  } catch (error) {
    console.log(error)
    toast.error('Erro ao carregar as contas')
  } finally {
    loading.value = false
  }
}

async function removeConta(item: ContasFinanceiro) {
  try {
    const confirmed = await useConfirm().confirm({
      title: 'Excluir conta',
      message: `Tem certeza que deseja excluir a conta "${item.nome}"?`,
    })

    if (!confirmed || !item.id) return

    await LancamentosRepository.deletarConta(item.id)
    toast.success('Conta excluída com sucesso!')
    store.updateTable()
  } catch (error) {
    console.log(error)
    toast.error('Erro ao excluir a conta')
  }
}

function handleSaved() {
  store.updateTable()
}

watch(
  () => store.filters.update,
  () => {
    loadContas()
  },
)

onMounted(loadContas)
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Wallet class="h-6 w-6" :stroke-width="2.5" />
          Contas financeiras
        </h2>
        <p class="text-sm text-muted-foreground">Gerencie as contas usadas para movimentação e pagamento</p>
      </div>
      <div class="justify-between gap-2 items-center hidden md:flex">
        <button
          @click="store.openSave"
          class="bg-primary text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1"
        >
          <BadgePlus class="h-5 w-5 inline-flex" />
          <span class="hidden md:inline">Nova conta</span>
        </button>
        <button @click="store.updateTable" class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
          <RotateCw class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto hidden md:block rounded-lg">
      <Tabela />
    </div>

    <div v-else class="space-y-3">
      <div class="space-y-2">
        <div class="flex items-center space-x-1 bg-card rounded-md border border-border pl-3">
          <Search class="h-4 w-4 text-muted-foreground" />
          <Input
            v-model="search"
            type="search"
            placeholder="Buscar conta..."
            class="border-none outline-none focus-visible:ring-0 shadow-none h-9"
          />
        </div>
        <button
          @click="store.openSave"
          class="w-full bg-primary text-white px-3 py-2 text-sm rounded-md flex items-center justify-center gap-2"
        >
          <BadgePlus class="h-5 w-5 inline-flex" />
          Nova conta
        </button>
      </div>

      <div v-if="loading && !contasFiltradas.length" class="rounded-lg border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 text-info animate-spin" />
            </EmptyMedia>
            <EmptyTitle>Carregando...</EmptyTitle>
            <EmptyDescription>Buscando contas financeiras cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-for="item in contasFiltradas" :key="item.id" class="rounded-lg border border-border bg-background p-3 space-y-2">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-medium text-foreground">{{ item.nome }}</div>
            <div class="text-xs text-muted-foreground">{{ item.Uid || `#${item.id}` }}</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="store.openUpdate(item)"
            class="flex-1 border border-border px-3 py-1.5 rounded-md text-sm hover:bg-muted"
          >
            Editar
          </button>
          <button
            @click="removeConta(item)"
            class="flex-1 bg-danger text-white px-3 py-1.5 rounded-md text-sm inline-flex items-center justify-center gap-1"
          >
            <Trash class="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      <div v-if="!loading && !contasFiltradas.length" class="rounded-lg border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BadgeQuestionMark />
            </EmptyMedia>
            <EmptyTitle>Nenhuma conta encontrada</EmptyTitle>
            <EmptyDescription>Cadastre contas para usar nos lançamentos e pagamentos.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>

    <ModalConta v-model:open="store.openModal" :conta="store.selectedConta" @saved="handleSaved" />
  </div>
</template>
