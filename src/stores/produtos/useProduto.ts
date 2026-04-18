import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ProdutoCategoria, Status } from '@/types/schemas'
import { useToast } from 'vue-toastification'
import {
  ProdutoCategoriaRepository,
  ProdutoRepository,
  ProdutoVarianteRepository,
} from '@/repositories/produto-repository'

const toast = useToast()

type ProdutoForm = {
  id?: number
  status: Status | string
  nome: string
  descricao: string
  categoriaId: number | null
  categoria?: string | null
  codigo: string
  preco: number | string
  precoCompra: number | string
  entradas: boolean
  saidas: boolean
  unidade: string
  estoque: number
  minimo: number
  controlaEstoque: boolean
  producaoLocal: boolean
  mostrarNoPdv: boolean
  materiaPrima: boolean
  custoMedioProducao?: number
  nomeVariante: string
}

type ProdutoVarianteForm = {
  id?: number
  produtoBaseId: number | null
  status: Status | string
  nome: string
  descricao: string
  codigo: string
  preco: number | string
  precoCompra: number | string
  entradas: boolean
  saidas: boolean
  unidade: string
  estoque: number
  minimo: number
  controlaEstoque: boolean
  producaoLocal: boolean
  mostrarNoPdv: boolean
  materiaPrima: boolean
  custoMedioProducao?: number
  nomeVariante: string
  categoriaId: number | null
}

type ProdutoCategoriaForm = {
  id?: number
  nome: string
  status: Status | string
}

type ProductReportType = 'catalogo' | 'movimentacoes' | 'vendas' | 'lucro'
type ProductReportScope = 'produto-base' | 'variante'

type ProductReportForm = {
  reportType: ProductReportType
  scope: ProductReportScope
  targetId: number | null
  targetLabel: string
  orderBy: 'asc' | 'desc'
}

function getDefaultProdutoForm(): ProdutoForm {
  return {
    id: undefined,
    categoriaId: null,
    codigo: '',
    descricao: '',
    entradas: true,
    estoque: 0,
    minimo: 0,
    nome: '',
    nomeVariante: 'Padrão',
    preco: '',
    precoCompra: '',
    saidas: true,
    unidade: 'un',
    status: 'ATIVO',
    controlaEstoque: true,
    producaoLocal: false,
    mostrarNoPdv: true,
    materiaPrima: false,
    custoMedioProducao: undefined,
  }
}

function getDefaultVarianteForm(produtoBaseId: number | null = null): ProdutoVarianteForm {
  return {
    id: undefined,
    produtoBaseId,
    codigo: '',
    descricao: '',
    entradas: true,
    estoque: 0,
    minimo: 0,
    nome: '',
    nomeVariante: '',
    preco: '',
    precoCompra: '',
    saidas: true,
    unidade: 'un',
    status: 'ATIVO',
    controlaEstoque: true,
    producaoLocal: false,
    mostrarNoPdv: true,
    materiaPrima: false,
    custoMedioProducao: undefined,
    categoriaId: null,
  }
}

function getDefaultCategoriaForm(): ProdutoCategoriaForm {
  return {
    id: undefined,
    nome: '',
    status: 'ATIVO',
  }
}

function getDefaultReportForm(): ProductReportForm {
  return {
    reportType: 'catalogo',
    scope: 'produto-base',
    targetId: null,
    targetLabel: '',
    orderBy: 'desc',
  }
}

export const useProdutoStore = defineStore('produtoStore', () => {
  const openModal = ref(false)
  const openModalCadastroTipo = ref(false)
  const openModalLote = ref(false)
  const openModalReposicao = ref(false)
  const openModalEtiquetas = ref(false)
  const openModalRelatorio = ref(false)
  const openModalRelatorioGeral = ref(false)
  const openModalVariante = ref(false)
  const openModalCategoria = ref(false)
  const idMutation = ref<number | null>(null)
  const baseMutationId = ref<number | null>(null)
  const selectedIds = ref<number[]>([])

  const form = ref<ProdutoForm>(getDefaultProdutoForm())
  const varianteForm = ref<ProdutoVarianteForm>(getDefaultVarianteForm())
  const categoriaForm = ref<ProdutoCategoriaForm>(getDefaultCategoriaForm())
  const reportForm = ref<ProductReportForm>(getDefaultReportForm())

  function resetSelectedIds() {
    selectedIds.value = []
  }

  function addSelectedId(id: number) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  }

  function removeSelectedId(id: number) {
    const index = selectedIds.value.indexOf(id)
    if (index !== -1) {
      selectedIds.value.splice(index, 1)
    }
  }

  const reset = () => {
    form.value = getDefaultProdutoForm()
    baseMutationId.value = null
  }

  const resetVariante = (produtoBaseId: number | null = null) => {
    varianteForm.value = getDefaultVarianteForm(produtoBaseId)
    idMutation.value = null
  }

  const resetCategoria = () => {
    categoriaForm.value = getDefaultCategoriaForm()
  }

  const resetReportForm = () => {
    reportForm.value = getDefaultReportForm()
  }

  const openSave = () => {
    reset()
    resetVariante(null)
    openModalCadastroTipo.value = true
  }

  const openSaveProduto = () => {
    reset()
    openModalCadastroTipo.value = false
    openModal.value = true
  }

  const openSaveVariante = (produtoBaseId: number | null = null) => {
    resetVariante(produtoBaseId)
    openModalCadastroTipo.value = false
    openModalVariante.value = true
  }

  const openSaveCategoria = () => {
    resetCategoria()
    openModalCategoria.value = true
  }

  const openReportModal = (options?: Partial<ProductReportForm>) => {
    reportForm.value = {
      ...getDefaultReportForm(),
      ...options,
    }

    if (reportForm.value.reportType === 'catalogo') {
      reportForm.value.targetId = null
      reportForm.value.targetLabel = ''
      reportForm.value.scope = 'produto-base'
    }

    if (reportForm.value.reportType === 'movimentacoes') {
      reportForm.value.scope = 'variante'
    }

    openModalRelatorio.value = true
  }

  const filters = ref<{ status?: Status | string; listingMode: 'base' | 'variante'; update: boolean }>({
    listingMode: 'base',
    update: false,
  })

  const updateListingMode = (mode: 'base' | 'variante') => {
    filters.value.listingMode = mode
    updateTable()
  }

  const updateTable = () => {
    filters.value.update = !filters.value.update
    resetSelectedIds()
  }

  const openUpdate = async (id: number) => {
    try {
      const { data } = await ProdutoRepository.get(id)
      form.value = {
        id,
        status: data?.status,
        nome: data?.nome,
        categoriaId: data?.categoriaId ?? null,
        categoria: data?.categoria ?? null,
        codigo: data?.codigo ?? '',
        preco: data?.preco,
        precoCompra: data?.precoCompra ?? '',
        estoque: data?.estoque,
        minimo: data?.minimo,
        descricao: data?.descricao ?? '',
        entradas: data?.entradas ?? true,
        saidas: data?.saidas ?? true,
        unidade: data?.unidade ?? 'un',
        controlaEstoque: data?.controlaEstoque ?? true,
        producaoLocal: data?.producaoLocal ?? false,
        mostrarNoPdv: data?.mostrarNoPdv ?? true,
        materiaPrima: data?.materiaPrima ?? false,
        custoMedioProducao: data?.custoMedioProducao || undefined,
        nomeVariante: data?.nomeVariante || 'Padrão',
      }
      baseMutationId.value = data?.id ?? id
      if (data?.variantePadraoId) {
        idMutation.value = data.variantePadraoId
      }
      openModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao editar o produto')
    }
  }

  const openUpdateVariante = async (id: number) => {
    try {
      const { data } = await ProdutoVarianteRepository.get(id)
      varianteForm.value = {
        id: data.id,
        produtoBaseId: data.produtoBaseId ?? null,
        status: data.status,
        nome: data.nome,
        nomeVariante: data.nomeVariante,
        codigo: data.codigo ?? '',
        preco: data.preco,
        precoCompra: data.precoCompra ?? '',
        estoque: data.estoque,
        minimo: data.minimo,
        descricao: data.descricao ?? '',
        entradas: data.entradas ?? true,
        saidas: data.saidas ?? true,
        unidade: data.unidade ?? 'un',
        controlaEstoque: data.controlaEstoque ?? true,
        producaoLocal: data.producaoLocal ?? false,
        mostrarNoPdv: data.mostrarNoPdv ?? true,
        materiaPrima: data.materiaPrima ?? false,
        custoMedioProducao: data.custoMedioProducao || undefined,
        categoriaId: data.categoriaId ?? null,
      }
      idMutation.value = data.id ?? id
      openModalVariante.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao editar a variante')
    }
  }

  const openUpdateCategoria = async (id: number) => {
    try {
      const response = await ProdutoCategoriaRepository.list()
      const categoria = (response.data ?? []).find((item: ProdutoCategoria) => Number(item.id) === Number(id))
      if (!categoria) {
        toast.error('Categoria não encontrada')
        return
      }
      categoriaForm.value = {
        id: categoria.id,
        nome: categoria.nome,
        status: categoria.status,
      }
      openModalCategoria.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao editar a categoria')
    }
  }

  return {
    openModal,
    openModalCadastroTipo,
    openModalReposicao,
    openModalEtiquetas,
    openModalRelatorio,
    openModalRelatorioGeral,
    openModalLote,
    openModalVariante,
    openModalCategoria,
    openSave,
    openSaveProduto,
    openSaveVariante,
    openSaveCategoria,
    openReportModal,
    openUpdate,
    openUpdateVariante,
    openUpdateCategoria,
    updateTable,
    updateListingMode,
    filters,
    reset,
    resetVariante,
    resetCategoria,
    resetReportForm,
    form,
    varianteForm,
    categoriaForm,
    reportForm,
    idMutation,
    baseMutationId,
    selectedIds,
    addSelectedId,
    resetSelectedIds,
    removeSelectedId,
  }
})
