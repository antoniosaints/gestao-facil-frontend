<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import router from '@/router'
import { goBack } from '@/hooks/links'
import { ProdutoRepository, ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { useUiStore } from '@/stores/ui/uiStore'
import type { ProdutoBase, ProdutoVariante } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import ModalProdutos from '../formulario/ModalProdutos.vue'
import ModalVariante from '../formulario/ModalVariante.vue'
import ModalReposicao from '../formulario/ModalReposicao.vue'
import ModalRelatorio from '../formulario/ModalRelatorio.vue'
import GerarEtiquetas from './GerarEtiquetas.vue'
import {
  ArchiveRestore,
  ArrowLeft,
  Box,
  Boxes,
  Edit,
  FileText,
  PackagePlus,
  PencilLine,
  Tag,
  Trash2,
  Undo2,
} from 'lucide-vue-next'

interface ResumoVariante {
  totalGasto: string
  lucroLiquido: string
  totalEntradas: number
  totalSaidas: number
  estoqueAtual: number
  custoMedio: string
  valorEstoque: string
  margemLucro: string
  ticketMedio: string
}

const route = useRoute()
const store = useProdutoStore()
const uiStore = useUiStore()
const toast = useToast()

const produto = ref<ProdutoBase | null>(null)
const resumo = ref<ResumoVariante | null>(null)
const loading = ref(false)
const selectedVariantId = ref<string>('')

const variants = computed(() => produto.value?.variantes ?? [])
const selectedVariant = computed<ProdutoVariante | null>(() => {
  const id = Number(selectedVariantId.value)
  return variants.value.find((item) => Number(item.id) === id) ?? null
})

async function loadProduto() {
  const id = Number(route.query.id)
  if (!id || Number.isNaN(id)) {
    toast.error('ID de produto invalido')
    return
  }

  try {
    loading.value = true
    const response = await ProdutoRepository.get(id)
    produto.value = response.data
    const nextVariantId =
      selectedVariantId.value && variants.value.some((item) => Number(item.id) === Number(selectedVariantId.value))
        ? selectedVariantId.value
        : String(response.data?.variantePadraoId || response.data?.variantes?.[0]?.id || '')
    selectedVariantId.value = nextVariantId
  } catch (error) {
    console.log(error)
    toast.error('Erro ao buscar o produto')
  } finally {
    loading.value = false
  }
}

async function loadResumoVariante() {
  if (!selectedVariantId.value) {
    resumo.value = null
    return
  }

  try {
    resumo.value = await ProdutoVarianteRepository.resumo(Number(selectedVariantId.value))
  } catch (error) {
    console.log(error)
    toast.error('Erro ao buscar o resumo da variante')
  }
}

function openReposicao() {
  if (!selectedVariant.value?.id) return toast.error('Selecione uma variante')
  store.idMutation = selectedVariant.value.id
  store.openModalReposicao = true
}

function openRelatorio() {
  if (!selectedVariant.value?.id) return toast.error('Selecione uma variante')
  store.idMutation = selectedVariant.value.id
  store.openModalRelatorio = true
}

function openEtiquetas() {
  if (!selectedVariant.value?.id) return toast.error('Selecione uma variante')
  store.idMutation = selectedVariant.value.id
  store.openModalEtiquetas = true
}

async function deletarProdutoBase() {
  if (!produto.value?.id) return
  const confirm = await useConfirm().confirm({
    title: 'Excluir produto',
    message: 'Tem certeza que deseja excluir este produto base e todas as variantes?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return

  try {
    await ProdutoRepository.remove(produto.value.id)
    store.updateTable()
    toast.success('Produto deletado com sucesso')
    router.push('/produtos')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao deletar o produto')
  }
}

async function deletarVariante(varianteId?: number) {
  if (!varianteId) return
  const confirm = await useConfirm().confirm({
    title: 'Excluir variante',
    message: 'Tem certeza que deseja excluir esta variante?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return

  try {
    await ProdutoVarianteRepository.remove(varianteId)
    toast.success('Variante excluida com sucesso')
    await loadProduto()
    await loadResumoVariante()
    store.updateTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir a variante')
  }
}

watch(selectedVariantId, () => {
  loadResumoVariante()
})

watch(
  () => [store.openModal, store.openModalVariante, store.openModalReposicao, store.openModalRelatorio],
  ([produtoModal, varianteModal, reposicaoModal, relatorioModal], [prevProduto, prevVariante, prevReposicao, prevRelatorio]) => {
    const closedAny =
      (prevProduto && !produtoModal) ||
      (prevVariante && !varianteModal) ||
      (prevReposicao && !reposicaoModal) ||
      (prevRelatorio && !relatorioModal)
    if (closedAny) {
      loadProduto()
      loadResumoVariante()
    }
  },
)

onMounted(async () => {
  await loadProduto()
  await loadResumoVariante()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-lg font-semibold text-foreground md:text-2xl">
          <Box class="h-6 w-6 text-primary" />
          {{ produto?.nome || 'Produto' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ produto?.categoria || 'Sem categoria' }} • {{ produto?.totalVariantes || 0 }} variantes
        </p>
      </div>

      <div class="hidden gap-2 md:flex">
        <Button variant="outline" @click="goBack">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button variant="outline" @click="store.openUpdate(produto?.id!)">
          <Edit class="mr-2 h-4 w-4" />
          Editar produto
        </Button>
        <Button class="text-white" @click="store.openSaveVariante(produto?.id!)">
          <PackagePlus class="mr-2 h-4 w-4" />
          Nova variante
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card class="border-border">
        <CardHeader>
          <CardTitle>Resumo do produto base</CardTitle>
          <CardDescription>Dados compartilhados e visao consolidada do catalogo.</CardDescription>
        </CardHeader>
        <CardContent class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-xl border border-border bg-background p-4">
            <div class="text-xs text-muted-foreground">Descricao</div>
            <div class="mt-1 text-sm text-foreground">{{ produto?.descricao || 'Sem descricao' }}</div>
          </div>
          <div class="rounded-xl border border-border bg-background p-4">
            <div class="text-xs text-muted-foreground">Estoque total</div>
            <div class="mt-1 text-sm font-semibold text-foreground">
              {{ produto?.estoqueTotal || 0 }} {{ produto?.unidade || 'un' }}
            </div>
          </div>
          <div class="rounded-xl border border-border bg-background p-4">
            <div class="text-xs text-muted-foreground">Variante padrao</div>
            <div class="mt-1 text-sm font-semibold text-foreground">{{ produto?.nomeVariante || 'Padrao' }}</div>
          </div>
          <div class="rounded-xl border border-border bg-background p-4">
            <div class="text-xs text-muted-foreground">Preco padrao</div>
            <div class="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {{ formatCurrencyBR(Number(produto?.preco || 0)) }}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border">
        <CardHeader>
          <CardTitle>Variante ativa</CardTitle>
          <CardDescription>Use a variante selecionada nas acoes de estoque, etiquetas e relatorios.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-foreground">Variante selecionada</label>
            <Select v-model="selectedVariantId">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Selecione uma variante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in variants" :key="item.id" :value="String(item.id)">
                  {{ item.nomeVariante || 'Padrao' }} • {{ item.codigo || 'Sem codigo' }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl border border-border bg-background p-3">
              <div class="text-xs text-muted-foreground">Preco</div>
              <div class="font-semibold text-emerald-600 dark:text-emerald-400">
                {{ formatCurrencyBR(Number(selectedVariant?.preco || 0)) }}
              </div>
            </div>
            <div class="rounded-xl border border-border bg-background p-3">
              <div class="text-xs text-muted-foreground">Estoque</div>
              <div class="font-semibold text-foreground">
                {{ selectedVariant?.estoque || 0 }} {{ selectedVariant?.unidade || 'un' }}
              </div>
            </div>
            <div class="rounded-xl border border-border bg-background p-3">
              <div class="text-xs text-muted-foreground">Codigo</div>
              <div class="font-semibold text-foreground">{{ selectedVariant?.codigo || 'Sem codigo' }}</div>
            </div>
            <div class="rounded-xl border border-border bg-background p-3">
              <div class="text-xs text-muted-foreground">Minimo</div>
              <div class="font-semibold text-foreground">
                {{ selectedVariant?.minimo || 0 }} {{ selectedVariant?.unidade || 'un' }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" @click="openReposicao">
              <ArchiveRestore class="mr-2 h-4 w-4" />
              Reposicao
            </Button>
            <Button variant="outline" @click="openEtiquetas">
              <Tag class="mr-2 h-4 w-4" />
              Etiquetas
            </Button>
            <Button variant="outline" @click="openRelatorio">
              <FileText class="mr-2 h-4 w-4" />
              Relatorio
            </Button>
            <Button variant="outline" @click="store.openUpdateVariante(selectedVariant?.id!)">
              <PencilLine class="mr-2 h-4 w-4" />
              Editar variante
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        <div class="text-xs">Entradas</div>
        <div class="mt-1 text-lg font-semibold">{{ resumo?.totalEntradas || 0 }}</div>
      </div>
      <div class="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
        <div class="text-xs">Saidas</div>
        <div class="mt-1 text-lg font-semibold">{{ resumo?.totalSaidas || 0 }}</div>
      </div>
      <div class="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300">
        <div class="text-xs">Valor em estoque</div>
        <div class="mt-1 text-lg font-semibold">{{ formatCurrencyBR(Number(resumo?.valorEstoque || 0)) }}</div>
      </div>
      <div class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
        <div class="text-xs">Lucro liquido</div>
        <div class="mt-1 text-lg font-semibold">{{ formatCurrencyBR(Number(resumo?.lucroLiquido || 0)) }}</div>
      </div>
    </div>

    <Card class="border-border">
      <CardHeader class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle class="flex items-center gap-2">
            <Boxes class="h-5 w-5" />
            Variantes do produto
          </CardTitle>
          <CardDescription>Gerencie codigos, precos e estoque de cada variante.</CardDescription>
        </div>
        <Button class="text-white" @click="store.openSaveVariante(produto?.id!)">
          <PackagePlus class="mr-2 h-4 w-4" />
          Nova variante
        </Button>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="text-sm text-muted-foreground">Carregando variantes...</div>
        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="item in variants"
            :key="item.id"
            class="rounded-2xl border border-border bg-background p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-semibold text-foreground">{{ item.nomeVariante || 'Padrao' }}</div>
                <div class="text-xs text-muted-foreground">{{ item.codigo || 'Sem codigo' }}</div>
              </div>
              <BadgeCell :label="item.ehPadrao ? 'Padrao' : 'Variante'" :color="item.ehPadrao ? 'green' : 'gray'" />
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div class="text-xs text-muted-foreground">Preco</div>
                <div class="font-semibold text-emerald-600 dark:text-emerald-400">
                  {{ formatCurrencyBR(Number(item.preco || 0)) }}
                </div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Estoque</div>
                <div class="font-semibold text-foreground">{{ item.estoque }} {{ item.unidade || 'un' }}</div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" @click="selectedVariantId = String(item.id)">Selecionar</Button>
              <Button variant="outline" @click="store.openUpdateVariante(item.id!)">Editar</Button>
              <Button variant="outline" @click="store.idMutation = item.id!; store.openModalReposicao = true">
                Reposicao
              </Button>
              <Button variant="outline" @click="deletarVariante(item.id)" :disabled="item.ehPadrao">
                Excluir
              </Button>
            </div>
          </article>
        </div>
      </CardContent>
    </Card>

    <div class="hidden gap-2 md:flex">
      <Button variant="outline" @click="store.openUpdate(produto?.id!)">
        <Edit class="mr-2 h-4 w-4" />
        Editar produto
      </Button>
      <Button variant="destructive" @click="deletarProdutoBase">
        <Trash2 class="mr-2 h-4 w-4" />
        Excluir produto
      </Button>
    </div>

    <nav
      v-if="uiStore.isMobile"
      class="fixed bottom-0 left-0 z-20 flex h-20 w-full justify-around border-t border-border bg-card pt-4 shadow-lg"
    >
      <button
        type="button"
        @click="store.openUpdate(produto?.id!)"
        class="flex flex-col items-center text-foreground transition hover:text-primary"
      >
        <PencilLine />
        <span class="text-xs">Editar</span>
      </button>
      <button
        type="button"
        @click="store.openSaveVariante(produto?.id!)"
        class="flex flex-col items-center text-foreground transition hover:text-primary"
      >
        <PackagePlus />
        <span class="text-xs">Variante</span>
      </button>
      <button
        type="button"
        @click="openReposicao"
        class="flex flex-col items-center text-foreground transition hover:text-primary"
      >
        <ArchiveRestore />
        <span class="text-xs">Reposicao</span>
      </button>
      <button type="button" @click="goBack" class="flex flex-col items-center text-foreground transition hover:text-primary">
        <Undo2 />
        <span class="text-xs">Voltar</span>
      </button>
    </nav>

    <ModalProdutos />
    <ModalVariante />
    <ModalReposicao />
    <ModalRelatorio />
    <GerarEtiquetas />
  </div>
</template>
