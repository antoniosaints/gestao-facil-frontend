<script setup lang="ts">
import EntityLink from '@/components/navigation/EntityLink.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useElementBounding, useSessionStorage } from '@vueuse/core'
import http from '@/utils/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ArrowRight,
  BadgePlus,
  Info,
  Link,
  MoreHorizontal,
  PenLine,
  RotateCw,
  Search,
  Trash,
} from 'lucide-vue-next'
import { useClientesStore } from '@/stores/clientes/useClientes'
import type { ClientesFornecedores } from '@/types/schemas'
import { useConfirm } from '@/composables/useConfirm'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { useToast } from 'vue-toastification'

import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import ModalView from '@/components/formulario/ModalView.vue'

const showSearchModal = ref(false)
const showActionsModal = ref(false)
const listViewport = ref<HTMLElement | null>(null)
const bottomBar = ref<InstanceType<typeof MobileBottomBar> | null>(null)
const { top: listTop } = useElementBounding(listViewport)
const { top: barTop } = useElementBounding(bottomBar)
const listMaxHeight = computed(() => `${Math.max(0, barTop.value - listTop.value - 8)}px`)
const store = useClientesStore()
const toast = useToast()
const mobileData = ref<ClientesFornecedores[]>([])
const savedState = useSessionStorage('gestaofacil:clientes:mobile', { search: '', page: 1 })
const searchQuery = ref(savedState.value.search)
const appliedSearch = ref(savedState.value.search)
const currentPage = ref(savedState.value.page)
const requestedPage = ref(currentPage.value)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const deleting = ref<number | null>(null)
let requestId = 0

async function renderMobile(page = currentPage.value) {
  requestedPage.value = page
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const response = await http.get('/clientes/mobile', {
      params: { search: appliedSearch.value, limit: 10, page },
    })
    if (id !== requestId) return
    totalPages.value = Math.max(1, Number(response.data.pagination.totalPages) || 1)
    if (page > totalPages.value) {
      await renderMobile(totalPages.value)
      return
    }
    mobileData.value = response.data.data
    showSearchModal.value = false
    if (listViewport.value) listViewport.value.scrollTop = 0
    currentPage.value = Math.max(1, Number(response.data.pagination.page) || 1)
    savedState.value = { search: appliedSearch.value, page: currentPage.value }
  } catch {
    if (id === requestId)
      error.value =
        'Não foi possível carregar clientes e fornecedores. Verifique sua conexão e tente novamente.'
  } finally {
    if (id === requestId) loading.value = false
  }
}
function changePage(page: number) {
  if (loading.value || error.value || page < 1 || page > totalPages.value) return
  void renderMobile(page)
}
function openCreate() {
  showActionsModal.value = false
  store.openSave()
}
function openPublicLink() {
  showActionsModal.value = false
  store.openModalLink = true
}
function refresh() {
  showActionsModal.value = false
  store.updateTable()
}
function search() {
  appliedSearch.value = searchQuery.value.trim()
  void renderMobile(1)
}
function clearSearch() {
  searchQuery.value = ''
  search()
}
async function edit(id: number) {
  try {
    await store.openUpdate(id)
  } catch {
    toast.error('Não foi possível abrir o cadastro. Tente novamente.')
  }
}
async function deletar(row: ClientesFornecedores) {
  if (!row.id || deleting.value) return
  const confirmed = await useConfirm().confirm({
    title: 'Excluir cadastro',
    message: `Deseja excluir o cadastro de ${row.nome}? Esta ação não pode ser desfeita.`,
    confirmText: 'Excluir cadastro',
  })
  if (!confirmed) return
  deleting.value = row.id
  try {
    await ClienteRepository.remove(row.id)
    store.updateTable()
    toast.success('Cadastro excluído com sucesso')
  } catch {
    toast.error('Não foi possível excluir o cadastro. Tente novamente.')
  } finally {
    deleting.value = null
  }
}
watch(
  () => store.filters.update,
  () => void renderMobile(),
)
onMounted(() => void renderMobile())
onUnmounted(() => {
  requestId++
})
</script>

<template>
  <section aria-label="Clientes e fornecedores">
    <p class="mb-2 text-xs text-muted-foreground" aria-live="polite">
      Página {{ currentPage }} de {{ totalPages }}
    </p>
    <div
      ref="listViewport"
      class="mt-2 flex flex-col gap-2 overflow-auto"
      :style="{ maxHeight: listMaxHeight }"
      :aria-busy="loading"
    >
      <div
        v-if="error"
        role="alert"
        class="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
      >
        <p>{{ error }}</p>
        <Button
          variant="outline"
          class="mt-3"
          :disabled="loading"
          @click="renderMobile(requestedPage)"
          >Tentar novamente</Button
        >
      </div>
      <p v-if="loading" role="status" class="py-8 text-center text-muted-foreground">
        Carregando cadastros…
      </p>
      <div
        v-else-if="!error && !mobileData.length"
        class="rounded-xl border bg-card p-6 text-center"
      >
        <h3 class="font-semibold">
          {{ appliedSearch ? 'Nenhum resultado para esta busca' : 'Nenhum cadastro ainda' }}
        </h3>
        <p class="mt-2 text-sm text-muted-foreground">
          {{
            appliedSearch
              ? 'Tente outro nome ou limpe a busca.'
              : 'Cadastre seu primeiro cliente ou fornecedor para começar.'
          }}
        </p>
        <Button class="mt-4" @click="appliedSearch ? clearSearch() : store.openSave()">{{
          appliedSearch ? 'Limpar busca' : 'Novo cliente'
        }}</Button>
      </div>
      <div v-if="!loading && !error" class="flex flex-col gap-2 pb-2">
        <article
          v-for="row in mobileData"
          :key="row.id"
          class="rounded-2xl border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
        >
          <div class="flex items-start justify-between gap-3">
            <h3 class="min-w-0 break-words text-sm font-semibold"><EntityLink kind="cliente" :record-id="row.id" :label="row.nome" /></h3>
            <span
              class="shrink-0 text-xs"
              :class="
                row.status === 'ATIVO' ? 'text-green-700 dark:text-green-300' : 'text-destructive'
              "
              >{{ row.status === 'ATIVO' ? 'Ativo' : 'Inativo' }}</span
            >
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ row.tipo === 'FORNECEDOR' ? 'Fornecedor' : 'Cliente' }}
          </p>
          <p class="mt-2 break-words text-sm text-muted-foreground">
            {{ row.documento || 'Documento não informado' }}
          </p>
          <p class="break-words text-sm text-muted-foreground">
            {{ row.telefone || 'Telefone não informado' }}
          </p>
          <p
            v-if="row.observacaos"
            class="mt-2 line-clamp-2 break-words text-sm text-muted-foreground"
          >
            {{ row.observacaos }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              class="min-h-11"
              :aria-label="`Editar ${row.nome}`"
              @click="edit(row.id!)"
              ><PenLine aria-hidden="true" />Editar</Button
            >
            <Button variant="outline" class="min-h-11" as-child>
              <RouterLink
                :to="{ name: 'clientes-detalhes', params: { id: row.id } }"
                :aria-label="`Ver detalhes de ${row.nome}`"
                ><Info aria-hidden="true" />Detalhes</RouterLink
              >
            </Button>
            <Button
              variant="outline"
              class="min-h-11 text-destructive"
              :disabled="deleting !== null"
              :aria-label="`Excluir ${row.nome}`"
              @click="deletar(row)"
              ><Trash aria-hidden="true" />{{
                deleting === row.id ? 'Excluindo…' : 'Excluir'
              }}</Button
            >
          </div>
        </article>
      </div>
    </div>
    <ModalView
      v-model:open="showSearchModal"
      title="Buscar clientes e fornecedores"
      description="Busque pelo nome do cliente ou fornecedor."
    >
      <form class="flex flex-wrap gap-2 px-4 pb-4" @submit.prevent="search">
        <label class="sr-only" for="clientes-mobile-search">Buscar clientes e fornecedores</label>
        <Input
          id="clientes-mobile-search"
          v-model="searchQuery"
          type="search"
          placeholder="Buscar clientes e fornecedores…"
          class="min-w-0 flex-1"
        />
        <Button type="submit" variant="outline" :disabled="loading">Buscar</Button>
        <Button
          v-if="appliedSearch"
          type="button"
          variant="outline"
          :disabled="loading"
          @click="clearSearch"
          >Limpar busca</Button
        >
      </form>
    </ModalView>
    <ModalView
      v-model:open="showActionsModal"
      title="Clientes e fornecedores"
      description="Ações da listagem."
    >
      <div class="flex flex-col gap-2 px-4 pb-4">
        <Button class="min-h-11 justify-start" @click="openCreate"
          ><BadgePlus aria-hidden="true" />Novo cliente</Button
        >
        <Button variant="outline" class="min-h-11 justify-start" @click="openPublicLink"
          ><Link aria-hidden="true" />Link público</Button
        >
        <Button
          variant="outline"
          class="min-h-11 justify-start"
          :disabled="loading"
          @click="refresh"
          ><RotateCw aria-hidden="true" />Atualizar</Button
        >
      </div>
    </ModalView>
    <MobileBottomBar ref="bottomBar" aria-label="Navegação de clientes e fornecedores">
      <button
        type="button"
        class="mobile-client-action"
        :disabled="loading || !!error || currentPage <= 1"
        @click="changePage(currentPage - 1)"
      >
        <ArrowLeft class="h-5 w-5" aria-hidden="true" /><span class="text-xs">Anterior</span>
      </button>
      <button type="button" class="mobile-client-action" @click="showSearchModal = true">
        <Search class="h-5 w-5" aria-hidden="true" /><span class="text-xs">Busca</span>
      </button>
      <button type="button" class="mobile-client-action" @click="showActionsModal = true">
        <MoreHorizontal class="h-5 w-5" aria-hidden="true" /><span class="text-xs">Mais</span>
      </button>
      <button
        type="button"
        class="mobile-client-action"
        :disabled="loading || !!error || currentPage >= totalPages"
        @click="changePage(currentPage + 1)"
      >
        <ArrowRight class="h-5 w-5" aria-hidden="true" /><span class="text-xs">Pr&oacute;ximo</span>
      </button>
    </MobileBottomBar>
  </section>
</template>

<style scoped>
.mobile-client-action {
  @apply flex min-h-11 flex-col items-center px-3 text-gray-700 transition hover:text-primary disabled:cursor-not-allowed disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600;
}
</style>
