<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  BadgePlus,
  BadgeQuestionMark,
  Loader,
  RefreshCcw,
  RotateCw,
  Search,
  Trash,
  Wallet,
  X,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
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
const showSearchModal = ref(false)

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

function applySearch() {
  showSearchModal.value = false
}

function clearSearch() {
  search.value = ''
  showSearchModal.value = false
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
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Wallet class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Contas financeiras
        </h2>
        <p class="text-sm text-muted-foreground">Gerencie as contas usadas para movimentação e pagamento</p>
      </div>
      <div class="hidden items-center justify-between gap-2 md:flex">
        <button
          @click="store.openSave"
          class="flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-sm text-white"
        >
          <BadgePlus class="inline-flex h-5 w-5" />
          <span class="hidden md:inline">Nova conta</span>
        </button>
        <button @click="store.updateTable" class="rounded-md border border-border bg-background px-2 py-1.5 text-sm">
          <RotateCw class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="hidden overflow-x-auto rounded-lg md:block">
      <Tabela />
    </div>

    <div v-else class="flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-auto md:max-h-full">
      <div class="text-xs text-muted-foreground">{{ contasFiltradas.length }} conta(s) encontrada(s)</div>

      <div v-if="loading && !contasFiltradas.length" class="rounded-2xl border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando...</EmptyTitle>
            <EmptyDescription>Buscando contas financeiras cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="flex flex-col gap-2 pb-20">
        <div v-if="!loading && !contasFiltradas.length" class="rounded-2xl border border-border p-6">
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

        <article
          v-for="item in contasFiltradas"
          :key="item.id"
          class="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div class="flex justify-between gap-3">
            <div class="text-sm font-semibold text-foreground">{{ item.Uid || `#${item.id}` }}</div>
            <div class="text-xs text-muted-foreground">Conta</div>
          </div>
          <div class="text-sm font-medium text-foreground">{{ item.nome }}</div>
          <div class="text-xs text-muted-foreground">Saldo inicial configurado no cadastro da conta.</div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <button
              @click="store.openUpdate(item)"
              class="rounded-md bg-slate-200 px-3 py-1.5 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            >
              Editar
            </button>
            <button
              @click="removeConta(item)"
              class="inline-flex items-center gap-1 rounded-md bg-red-200 px-3 py-1.5 text-sm text-red-900 dark:bg-red-800 dark:text-red-100"
            >
              <Trash class="h-4 w-4" />
              Excluir
            </button>
          </div>
        </article>
      </div>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar contas" description="Encontre uma conta pelo nome ou identificador.">
      <div class="space-y-3 px-4">
        <Input
          v-model="search"
          type="search"
          placeholder="Buscar conta..."
          @keyup.enter="applySearch"
        />
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="clearSearch">Limpar</Button>
          <Button class="flex-1" @click="applySearch">Buscar</Button>
        </div>
      </div>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="showSearchModal = true"
      >
        <Search class="h-5 w-5" />
        <span class="text-xs">Busca</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="clearSearch"
      >
        <X class="h-5 w-5" />
        <span class="text-xs">Limpar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="store.openSave"
      >
        <BadgePlus class="h-5 w-5" />
        <span class="text-xs">Nova</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="loadContas"
      >
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
    </MobileBottomBar>

    <ModalConta v-model:open="store.openModal" :conta="store.selectedConta" @saved="handleSaved" />
  </div>
</template>
