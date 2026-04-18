<script setup lang="ts">
import { computed, onMounted, ref, watch, type Component } from 'vue'
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import ModalProdutos from '../formulario/ModalProdutos.vue'
import ModalVariante from '../formulario/ModalVariante.vue'
import ModalReposicao from '../formulario/ModalReposicao.vue'
import ModalRelatorio from '../formulario/ModalRelatorio.vue'
import GerarEtiquetas from './GerarEtiquetas.vue'
import {
  ArchiveRestore,
  ArrowLeft,
  BadgeCheck,
  Box,
  Boxes,
  CircleAlert,
  CircleDollarSign,
  CircleOff,
  Edit,
  FileBarChart,
  FileText,
  Package,
  PackagePlus,
  PencilLine,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Tag,
  Trash2,
  Undo2,
} from 'lucide-vue-next'

interface ResumoEstoque {
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

type BadgeColor = 'cyan' | 'yellow' | 'gray' | 'violet' | 'purple' | 'green' | 'emerald' | 'orange' | 'red' | 'blue'
type ActiveTab = 'variante' | 'variantes' | 'visao-geral'

type RuleConfig = {
  label: string
  color: BadgeColor
  icon?: Component
}

const route = useRoute()
const store = useProdutoStore()
const uiStore = useUiStore()
const toast = useToast()

const produto = ref<ProdutoBase | null>(null)
const resumoProduto = ref<ResumoEstoque | null>(null)
const resumoVariante = ref<ResumoEstoque | null>(null)
const loading = ref(false)
const loadingResumoProduto = ref(false)
const loadingResumoVariante = ref(false)
const activeTab = ref<ActiveTab>('variante')
const selectedVariantId = ref<string>('')

const variants = computed(() => produto.value?.variantes ?? [])
const selectedVariant = computed<ProdutoVariante | null>(() => {
  const id = Number(selectedVariantId.value)
  return variants.value.find((item) => Number(item.id) === id) ?? null
})

const pageTitle = computed(() => {
  if (!produto.value) return 'Produto'
  if (!selectedVariant.value) return produto.value.nome
  return `${produto.value.nome} • ${selectedVariant.value.nomeVariante || 'Padrão'}`
})

const pageSubtitle = computed(() => {
  if (!produto.value) return 'Detalhes do produto'
  return `${produto.value.categoria || 'Sem categoria'} • ${produto.value.totalVariantes || 0} variante(s) cadastrada(s)`
})

const overviewHighlights = computed(() => {
  if (!produto.value) return []

  return [
    {
      label: 'Produto base',
      value: produto.value.nome || 'Sem nome',
      color: 'blue' as BadgeColor,
      icon: Package,
    },
    {
      label: 'Variantes cadastradas',
      value: `${produto.value.totalVariantes || variants.value.length}`,
      color: 'purple' as BadgeColor,
      icon: Boxes,
    },
    {
      label: 'Estoque total monitorado',
      value: `${produto.value.estoqueTotal || 0} ${produto.value.unidade || 'un'}`,
      color: 'emerald' as BadgeColor,
      icon: BadgeCheck,
    },
  ]
})

const fiscalFields = computed(() => {
  const base = produto.value
  if (!base) return []

  const fields = [
    { label: 'Código fiscal', value: base.codigoProduto },
    { label: 'NCM', value: base.ncm },
    { label: 'CEST', value: base.cest },
    { label: 'CFOP', value: base.cfop },
    { label: 'Origem', value: base.origem },
    { label: 'ICMS', value: base.aliquotaIcms != null && base.aliquotaIcms !== '' ? `${base.aliquotaIcms}%` : null },
    { label: 'IPI', value: base.aliquotaIpi != null && base.aliquotaIpi !== '' ? `${base.aliquotaIpi}%` : null },
    { label: 'PIS', value: base.aliquotaPis != null && base.aliquotaPis !== '' ? `${base.aliquotaPis}%` : null },
    {
      label: 'COFINS',
      value: base.aliquotaCofins != null && base.aliquotaCofins !== '' ? `${base.aliquotaCofins}%` : null,
    },
    { label: 'ISS', value: base.issAliquota != null && base.issAliquota !== '' ? `${base.issAliquota}%` : null },
  ]

  return fields.filter((field) => field.value != null && String(field.value).trim() !== '')
})

const productStatusBadge = computed(() => getStatusBadge(produto.value?.status))
const variantStatusBadge = computed(() => getStatusBadge(selectedVariant.value?.status))
const variantStockBadge = computed(() =>
  getStockBadge(selectedVariant.value?.estoque, selectedVariant.value?.minimo, selectedVariant.value?.controlaEstoque),
)
const productRules = computed(() => getRuleBadges(produto.value))
const variantRules = computed(() => getRuleBadges(selectedVariant.value))

function getStatusBadge(status?: string) {
  switch (status) {
    case 'ATIVO':
      return { label: 'Ativo', color: 'green' as BadgeColor, icon: BadgeCheck }
    case 'INATIVO':
      return { label: 'Inativo', color: 'gray' as BadgeColor, icon: CircleOff }
    case 'BLOQUEADO':
      return { label: 'Bloqueado', color: 'red' as BadgeColor, icon: CircleAlert }
    default:
      return { label: status || 'Sem status', color: 'gray' as BadgeColor, icon: CircleOff }
  }
}

function getStockBadge(
  estoque?: number | string | null,
  minimo?: number | string | null,
  controlaEstoque?: boolean | null,
) {
  if (controlaEstoque === false) {
    return { label: 'Sem controle', color: 'gray' as BadgeColor, icon: Boxes }
  }

  const current = Number(estoque ?? 0)
  const minimum = Number(minimo ?? 0)

  if (current <= 0) {
    return { label: 'Sem estoque', color: 'red' as BadgeColor, icon: CircleAlert }
  }

  if (current <= minimum) {
    return { label: 'Baixo', color: 'orange' as BadgeColor, icon: CircleAlert }
  }

  return { label: 'Ok', color: 'emerald' as BadgeColor, icon: BadgeCheck }
}

function getRuleBadges(
  item?: Pick<ProdutoBase, 'entradas' | 'saidas' | 'controlaEstoque' | 'producaoLocal' | 'mostrarNoPdv' | 'materiaPrima'> | null,
): RuleConfig[] {
  if (!item) return []

  const rules: RuleConfig[] = []

  if (item.entradas !== false) {
    rules.push({ label: 'Entradas', color: 'emerald', icon: ArchiveRestore })
  }

  if (item.saidas !== false) {
    rules.push({ label: 'Saídas', color: 'green', icon: BadgeCheck })
  }

  if (item.controlaEstoque !== false) {
    rules.push({ label: 'Controla estoque', color: 'yellow', icon: Boxes })
  }

  if (item.mostrarNoPdv !== false) {
    rules.push({ label: 'Visível no PDV', color: 'blue', icon: CircleDollarSign })
  }

  if (item.producaoLocal) {
    rules.push({ label: 'Produção local', color: 'purple', icon: Package })
  }

  if (item.materiaPrima) {
    rules.push({ label: 'Matéria-prima', color: 'violet', icon: Tag })
  }

  return rules
}

async function loadProduto() {
  const id = Number(route.query.id)
  if (!id || Number.isNaN(id)) {
    toast.error('ID de produto inválido')
    return
  }

  try {
    loading.value = true
    const response = await ProdutoRepository.get(id)
    produto.value = response.data

    const variantFromQuery = Number(route.query.varianteId)
    const hasVariantFromQuery = !Number.isNaN(variantFromQuery)
      && response.data?.variantes?.some((item: ProdutoVariante) => Number(item.id) === variantFromQuery)

    const nextVariantId = hasVariantFromQuery
      ? String(variantFromQuery)
      : selectedVariantId.value && response.data?.variantes?.some((item: ProdutoVariante) => Number(item.id) === Number(selectedVariantId.value))
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

async function loadResumoProduto() {
  const id = Number(route.query.id)
  if (!id || Number.isNaN(id)) {
    resumoProduto.value = null
    return
  }

  try {
    loadingResumoProduto.value = true
    resumoProduto.value = await ProdutoRepository.resumo(id)
  } catch (error) {
    console.log(error)
    toast.error('Erro ao buscar o resumo do produto')
  } finally {
    loadingResumoProduto.value = false
  }
}

async function loadResumoVariante() {
  if (!selectedVariantId.value) {
    resumoVariante.value = null
    return
  }

  try {
    loadingResumoVariante.value = true
    resumoVariante.value = await ProdutoVarianteRepository.resumo(Number(selectedVariantId.value))
  } catch (error) {
    console.log(error)
    toast.error('Erro ao buscar o resumo da variante')
  } finally {
    loadingResumoVariante.value = false
  }
}

async function reloadDetalhes() {
  await loadProduto()
  await Promise.all([loadResumoProduto(), loadResumoVariante()])
}

function syncVariantQueryParam() {
  const currentVariantId = selectedVariantId.value || undefined
  router.replace({
    query: {
      ...route.query,
      varianteId: currentVariantId,
    },
  })
}

function openReposicao() {
  if (!selectedVariant.value?.id) return toast.error('Selecione uma variante')
  store.idMutation = selectedVariant.value.id
  store.openModalReposicao = true
}

function openRelatorio(defaultType: 'movimentacoes' | 'vendas' | 'lucro' = 'movimentacoes') {
  if (!selectedVariant.value?.id) return toast.error('Selecione uma variante')

  store.openReportModal({
    reportType: defaultType,
    scope: 'variante',
    targetId: selectedVariant.value.id,
    targetLabel: `${produto.value?.nome || selectedVariant.value.produtoBaseNome || 'Produto'} / ${selectedVariant.value.nomeVariante || 'Padrão'}`,
  })
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
    toast.success('Variante excluída com sucesso')
    await reloadDetalhes()
    store.updateTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir a variante')
  }
}

watch(selectedVariantId, () => {
  syncVariantQueryParam()
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
      reloadDetalhes()
    }
  },
)

onMounted(async () => {
  await loadProduto()
  await Promise.all([loadResumoProduto(), loadResumoVariante()])
})
</script>

<template>
  <div class="space-y-3">
    <div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0 space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <BadgeCell
              v-if="produto"
              :size="'sm'"
              :label="productStatusBadge.label"
              :color="productStatusBadge.color"
              :icon="productStatusBadge.icon"
              :capitalize="false"
            />
            <BadgeCell
              v-if="selectedVariant"
              :size="'sm'"
              :label="variantStatusBadge.label"
              :color="variantStatusBadge.color"
              :icon="variantStatusBadge.icon"
              :capitalize="false"
            />
            <BadgeCell
              v-if="selectedVariant"
              :size="'sm'"
              :label="variantStockBadge.label"
              :color="variantStockBadge.color"
              :icon="variantStockBadge.icon"
              :capitalize="false"
            />
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-2 text-lg font-semibold text-foreground md:text-2xl">
              <Box class="h-6 w-6 text-primary" />
              {{ pageTitle }}
            </div>
            <p class="text-sm text-muted-foreground">
              {{ pageSubtitle }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <BadgeCell
              v-for="highlight in overviewHighlights"
              :key="highlight.label"
              :label="`${highlight.label}: ${highlight.value}`"
              :color="highlight.color"
              :icon="highlight.icon"
              :capitalize="false"
              size="sm"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
          <Button variant="outline" @click="goBack">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button variant="outline" @click="reloadDetalhes" :disabled="loading || loadingResumoProduto || loadingResumoVariante">
            <RefreshCw :class="['mr-2 h-4 w-4', loading || loadingResumoProduto || loadingResumoVariante ? 'animate-spin' : '']" />
            Atualizar
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
    </div>

    <Tabs v-model="activeTab" default-value="variante" class="space-y-2">
      <TabsList class="w-full justify-start rounded-b-lg">
        <TabsTrigger value="variante" class="h-10 px-4">
          <span class="flex items-center gap-2">
            <Tag class="h-4 w-4" />
            <span>Detalhes</span>
          </span>
        </TabsTrigger>
        <TabsTrigger value="variantes" class="h-10 px-4">
          <span class="flex items-center gap-2">
            <Boxes class="h-4 w-4" />
            <span>Variantes</span>
          </span>
        </TabsTrigger>
        <TabsTrigger value="visao-geral" class="h-10 px-4">
          <span class="flex items-center gap-2">
            <FileText class="h-4 w-4" />
            <span>Visão geral</span>
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="variante" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card class="border-border">
            <CardContent class="space-y-4 mt-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-foreground">Produto selecionado</label>
                <Select v-model="selectedVariantId">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Selecione uma variante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="item in variants" :key="item.id" :value="String(item.id)">
                      {{ item.nomeVariante || 'Padrão' }} • {{ item.codigo || 'Sem código' }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div v-if="selectedVariant" class="space-y-4">
                <div class="flex flex-wrap gap-2">
                  <BadgeCell
                    :label="variantStatusBadge.label"
                    :color="variantStatusBadge.color"
                    :icon="variantStatusBadge.icon"
                    :capitalize="false"
                    size="sm"
                  />
                  <BadgeCell
                    :label="variantStockBadge.label"
                    :color="variantStockBadge.color"
                    :icon="variantStockBadge.icon"
                    :capitalize="false"
                    size="sm"
                  />
                  <BadgeCell
                    :label="selectedVariant.ehPadrao ? 'Variante padrão' : 'Variante auxiliar'"
                    :color="selectedVariant.ehPadrao ? 'purple' : 'gray'"
                    :icon="selectedVariant.ehPadrao ? BadgeCheck : Boxes"
                    :capitalize="false"
                    size="sm"
                  />
                </div>

                <div>
                  <div class="text-xl font-semibold text-foreground">
                    {{ selectedVariant.nomeVariante || 'Padrão' }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ produto?.nome || selectedVariant.produtoBaseNome || 'Produto base' }}
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Preço de venda</div>
                    <div class="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {{ formatCurrencyBR(Number(selectedVariant.preco || 0)) }}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Preço de compra</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ formatCurrencyBR(Number(selectedVariant.precoCompra || 0)) }}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Estoque atual</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ selectedVariant.estoque || 0 }} {{ selectedVariant.unidade || 'un' }}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Estoque mínimo</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ selectedVariant.minimo || 0 }} {{ selectedVariant.unidade || 'un' }}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Código</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">{{ selectedVariant.codigo || 'Sem código' }}</div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Unidade</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">{{ selectedVariant.unidade || 'un' }}</div>
                  </div>
                </div>

                <div>
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">Descrição da variante</div>
                  <div class="mt-1 text-sm whitespace-pre-wrap text-foreground">
                    {{ selectedVariant.descricao || 'Sem descrição adicional para esta variante.' }}
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">Regras da variante</div>
                  <div class="flex flex-wrap gap-2">
                    <BadgeCell
                      v-for="rule in variantRules"
                      :key="rule.label"
                      :label="rule.label"
                      :color="rule.color"
                      :icon="rule.icon"
                      :capitalize="false"
                      size="sm"
                    />
                  </div>
                </div>

                <Separator />

                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <Button variant="outline" @click="openReposicao">
                    <ArchiveRestore class="mr-2 h-4 w-4" />
                    Reposição
                  </Button>
                  <Button variant="outline" @click="openEtiquetas">
                    <Tag class="mr-2 h-4 w-4" />
                    Etiquetas
                  </Button>
                  <Button variant="outline" @click="openRelatorio('movimentacoes')">
                    <FileBarChart class="mr-2 h-4 w-4" />
                    Relatórios
                  </Button>
                  <Button variant="outline" @click="store.openUpdateVariante(selectedVariant.id!)">
                    <PencilLine class="mr-2 h-4 w-4" />
                    Editar variante
                  </Button>
                </div>
              </div>

              <div v-else class="text-sm text-muted-foreground">Nenhuma variante selecionada.</div>
            </CardContent>
          </Card>

          <Card class="border-border">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <ShieldCheck class="h-4 w-4" />
                Resumo da variante
              </CardTitle>
              <CardDescription>
                Indicadores rápidos da variante ativa para apoiar decisão de compra, venda e reposição.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="loadingResumoVariante" class="text-sm text-muted-foreground">Carregando resumo da variante...</div>
              <div v-else-if="resumoVariante" class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Valor em estoque</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(Number(resumoVariante.valorEstoque || 0)) }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Lucro líquido</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(Number(resumoVariante.lucroLiquido || 0)) }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Custo médio</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(Number(resumoVariante.custoMedio || 0)) }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Ticket médio</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(Number(resumoVariante.ticketMedio || 0)) }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Entradas / saídas</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ resumoVariante.totalEntradas }} / {{ resumoVariante.totalSaidas }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Margem</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">{{ resumoVariante.margemLucro }}</div>
                </div>
              </div>
              <div v-else class="text-sm text-muted-foreground">Resumo da variante indisponível.</div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="variantes">
        <Card class="border-border">
          <CardHeader class="flex flex-col gap-2 px-6 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <Boxes class="h-5 w-5" />
                Variantes do produto
              </CardTitle>
              <CardDescription>
                Selecione a variante que deseja analisar ou editar. O botão de foco abre a primeira aba já com ela destacada.
              </CardDescription>
            </div>
            <Button class="text-white" @click="store.openSaveVariante(produto?.id!)">
              <PackagePlus class="mr-2 h-4 w-4" />
              Nova variante
            </Button>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="text-sm text-muted-foreground">Carregando variantes...</div>
            <div v-else>
              <div v-if="!variants.length" class="py-6">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Boxes class="h-5 w-5" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhuma variante cadastrada</EmptyTitle>
                    <EmptyDescription>Cadastre uma nova variante para começar a segmentar estoque e preço.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
              <div v-else class="relative overflow-x-auto rounded-lg border border-border bg-background">
                <Table class="min-w-full">
                  <TableHeader>
                    <TableRow class="text-xs uppercase tracking-wide text-muted-foreground/80">
                      <TableHead>Variante</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead class="hidden xl:table-cell">Regras</TableHead>
                      <TableHead class="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="item in variants" :key="item.id">
                      <TableCell class="align-middle">
                        <div class="flex flex-col gap-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="text-sm font-semibold text-foreground">
                              {{ item.nomeVariante || 'Padrão' }}
                            </span>
                            <BadgeCell
                              size="sm"
                              :label="item.ehPadrao ? 'Padrão' : 'Variante'"
                              :color="item.ehPadrao ? 'purple' : 'gray'"
                              :icon="item.ehPadrao ? BadgeCheck : Boxes"
                              :capitalize="true"
                            />
                          </div>
                          <p class="text-[11px] text-muted-foreground">
                            {{ item.codigo || 'Sem código' }} • {{ item.unidade || 'un' }}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell class="align-middle">
                        <BadgeCell
                          size="sm"
                          :label="getStatusBadge(item.status).label"
                          :color="getStatusBadge(item.status).color"
                          :icon="getStatusBadge(item.status).icon"
                          :capitalize="false"
                        />
                      </TableCell>
                      <TableCell class="align-middle text-sm font-medium">
                        {{ formatCurrencyBR(Number(item.preco || 0)) }}
                      </TableCell>
                      <TableCell class="align-middle">
                        <div class="flex gap-2 items-center">
                          <span class="text-sm text-foreground">{{ item.estoque }} {{ item.unidade || 'un' }}</span>
                          <BadgeCell
                            size="sm"
                            :label="getStockBadge(item.estoque, item.minimo, item.controlaEstoque).label"
                            :color="getStockBadge(item.estoque, item.minimo, item.controlaEstoque).color"
                            :icon="getStockBadge(item.estoque, item.minimo, item.controlaEstoque).icon"
                            :capitalize="false"
                          />
                        </div>
                      </TableCell>
                      <TableCell class="hidden align-middle xl:table-cell">
                        <div class="flex flex-wrap gap-1.5">
                          <BadgeCell
                            v-for="rule in getRuleBadges(item)"
                            :key="`${item.id}-${rule.label}`"
                            :label="rule.label"
                            :color="rule.color"
                            :icon="rule.icon"
                            :capitalize="false"
                            size="sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell class="align-middle text-right">
                        <div class="inline-flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8"
                            :title="'Focar esta variante'"
                            @click="selectedVariantId = String(item.id); activeTab = 'variante'"
                          >
                            <Box class="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8"
                            :title="'Editar variante'"
                            @click="store.openUpdateVariante(item.id!)"
                          >
                            <PencilLine class="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8"
                            :title="'Reposição de estoque'"
                            @click="store.idMutation = item.id!; store.openModalReposicao = true"
                          >
                            <ArchiveRestore class="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8 text-red-600 hover:text-red-700"
                            :title="item.ehPadrao ? 'Variante padrão não pode ser excluída' : 'Excluir variante'"
                            :disabled="item.ehPadrao"
                            @click="deletarVariante(item.id)"
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="visao-geral" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-4">
            <Card class="border-border">
              <CardHeader>
                <CardTitle>Visão geral do produto base</CardTitle>
                <CardDescription>
                  Informações do cadastro principal que valem para todas as variantes sem poluir a leitura operacional.
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div>
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">Descrição</div>
                  <div class="mt-1 text-sm whitespace-pre-wrap text-foreground">
                    {{ produto?.descricao || 'Sem descrição cadastrada.' }}
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Categoria</div>
                    <div class="mt-1 text-sm font-medium text-foreground">{{ produto?.categoria || 'Sem categoria' }}</div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Produto base</div>
                    <div class="mt-1 text-sm font-medium text-foreground">{{ produto?.nome || 'Sem nome' }}</div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Total de variantes</div>
                    <div class="mt-1 text-sm font-medium text-foreground">{{ produto?.totalVariantes || 0 }}</div>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">Regras operacionais compartilhadas</div>
                  <div class="flex flex-wrap gap-2">
                    <BadgeCell
                      v-for="rule in productRules"
                      :key="rule.label"
                      :label="rule.label"
                      :color="rule.color"
                      :icon="rule.icon"
                      :capitalize="false"
                      size="sm"
                    />
                    <span v-if="!productRules.length" class="text-sm text-muted-foreground">
                      Nenhuma regra operacional ativa.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card v-if="fiscalFields.length" class="border-border">
              <CardHeader>
                <CardTitle>Dados fiscais</CardTitle>
                <CardDescription>Campos fiscais retornados no cadastro base do produto.</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div v-for="field in fiscalFields" :key="field.label" class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">{{ field.label }}</div>
                    <div class="mt-1 text-sm font-medium text-foreground">{{ field.value }}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card class="border-border">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <ReceiptText class="h-4 w-4" />
                Resumo consolidado do produto
              </CardTitle>
              <CardDescription>
                Indicadores agrupados considerando todas as variantes do produto base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="loadingResumoProduto" class="text-sm text-muted-foreground">Carregando resumo do produto...</div>
              <div v-else-if="resumoProduto" class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Valor em estoque</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(Number(resumoProduto.valorEstoque || 0)) }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Lucro líquido</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(Number(resumoProduto.lucroLiquido || 0)) }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Custo médio</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(Number(resumoProduto.custoMedio || 0)) }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Ticket médio</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(Number(resumoProduto.ticketMedio || 0)) }}
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Entradas</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">{{ resumoProduto.totalEntradas }}</div>
                </div>
                <div class="rounded-xl border border-border bg-background px-3 py-2">
                  <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Saídas</div>
                  <div class="mt-1 text-sm font-semibold text-foreground">{{ resumoProduto.totalSaidas }}</div>
                </div>
              </div>
              <div v-else class="text-sm text-muted-foreground">Resumo consolidado indisponível.</div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <div class="hidden gap-2 md:flex">
      <Button variant="outline" @click="store.openUpdate(produto?.id!)">
        <Edit class="mr-2 h-4 w-4" />
        Editar produto
      </Button>
      <Button variant="outline" @click="openRelatorio('vendas')">
        <FileBarChart class="mr-2 h-4 w-4" />
        Relatórios do item selecionado
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
        @click="openRelatorio('vendas')"
        class="flex flex-col items-center text-foreground transition hover:text-primary"
      >
        <FileBarChart />
        <span class="text-xs">Relatórios</span>
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
