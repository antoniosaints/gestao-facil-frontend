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
  precoPromocional: number | string
  precoCompra: number | string
  entradas: boolean
  saidas: boolean
  unidade: string
  estoque: number
  minimo: number
  controlaEstoque: boolean
  producaoLocal: boolean
  mostrarNoPdv: boolean
  mostrarNoCatalogo: boolean
  materiaPrima: boolean
  custoMedioProducao?: number
  nomeVariante: string
  skuBloqueado?: boolean
  imagem?: string | null
  // Fiscais (NF-e) — opcionais, ficam na variante padrão.
  ncm?: string | null
  cest?: string | null
  cfop?: string | null
  origem?: number | null
  codigoProduto?: string | null
  aliquotaIcms?: number | string | null
  aliquotaIpi?: number | string | null
  aliquotaPis?: number | string | null
  aliquotaCofins?: number | string | null
  issAliquota?: number | string | null
}

type ProdutoVarianteForm = {
  id?: number
  produtoBaseId: number | null
  status: Status | string
  nome: string
  descricao: string
  codigo: string
  preco: number | string
  precoPromocional: number | string
  precoCompra: number | string
  entradas: boolean
  saidas: boolean
  unidade: string
  estoque: number
  minimo: number
  controlaEstoque: boolean
  producaoLocal: boolean
  mostrarNoPdv: boolean
  mostrarNoCatalogo: boolean
  materiaPrima: boolean
  custoMedioProducao?: number
  nomeVariante: string
  categoriaId: number | null
  skuBloqueado?: boolean
  imagem?: string | null
  // Fiscais (NF-e)
  ncm?: string | null
  cest?: string | null
  cfop?: string | null
  origem?: number | null
  codigoProduto?: string | null
  aliquotaIcms?: number | string | null
  aliquotaIpi?: number | string | null
  aliquotaPis?: number | string | null
  aliquotaCofins?: number | string | null
  issAliquota?: number | string | null
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

function getDefaultFiscalFields() {
  return {
    ncm: null,
    cest: null,
    cfop: null,
    origem: null,
    codigoProduto: null,
    aliquotaIcms: null,
    aliquotaIpi: null,
    aliquotaPis: null,
    aliquotaCofins: null,
    issAliquota: null,
  }
}

// Extrai os campos fiscais de um produto/variante retornado pelo backend (edição).
function extractFiscalFields(data: any) {
  return {
    ncm: data?.ncm ?? null,
    cest: data?.cest ?? null,
    cfop: data?.cfop ?? null,
    origem: data?.origem ?? null,
    codigoProduto: data?.codigoProduto ?? null,
    aliquotaIcms: data?.aliquotaIcms ?? null,
    aliquotaIpi: data?.aliquotaIpi ?? null,
    aliquotaPis: data?.aliquotaPis ?? null,
    aliquotaCofins: data?.aliquotaCofins ?? null,
    issAliquota: data?.issAliquota ?? null,
  }
}

function getDefaultProdutoForm(): ProdutoForm {
  return {
    id: undefined,
    ...getDefaultFiscalFields(),
    categoriaId: null,
    codigo: '',
    descricao: '',
    entradas: true,
    estoque: 0,
    minimo: 0,
    nome: '',
    nomeVariante: 'Padrão',
    preco: '',
    precoPromocional: '',
    precoCompra: '',
    saidas: true,
    unidade: 'un',
    status: 'ATIVO',
    controlaEstoque: true,
    producaoLocal: false,
    mostrarNoPdv: true,
    mostrarNoCatalogo: true,
    materiaPrima: false,
    custoMedioProducao: undefined,
    skuBloqueado: false,
    imagem: null,
  }
}

function getDefaultVarianteForm(produtoBaseId: number | null = null): ProdutoVarianteForm {
  return {
    id: undefined,
    ...getDefaultFiscalFields(),
    produtoBaseId,
    codigo: '',
    descricao: '',
    entradas: true,
    estoque: 0,
    minimo: 0,
    nome: '',
    nomeVariante: '',
    preco: '',
    precoPromocional: '',
    precoCompra: '',
    saidas: true,
    unidade: 'un',
    status: 'ATIVO',
    controlaEstoque: true,
    producaoLocal: false,
    mostrarNoPdv: true,
    mostrarNoCatalogo: true,
    materiaPrima: false,
    custoMedioProducao: undefined,
    categoriaId: null,
    skuBloqueado: false,
    imagem: null,
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
  const openModalDescarte = ref(false)
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

  const filters = ref<{
    status?: Status | string
    categoriaId?: number | null
    estoqueBaixo?: 'TODOS' | 'SIM' | 'NAO'
    maisVendas?: 'TODOS' | 'SIM'
    listingMode: 'base' | 'variante'
    update: boolean
  }>({
    status: '',
    categoriaId: null,
    estoqueBaixo: 'TODOS',
    maisVendas: 'TODOS',
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
        ...extractFiscalFields(data),
        status: data?.status,
        nome: data?.nome,
        categoriaId: data?.categoriaId ?? null,
        categoria: data?.categoria ?? null,
        codigo: data?.codigo ?? '',
        preco: data?.preco,
        precoPromocional: data?.precoPromocional ?? '',
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
        mostrarNoCatalogo: data?.mostrarNoCatalogo ?? true,
        materiaPrima: data?.materiaPrima ?? false,
        custoMedioProducao: data?.custoMedioProducao || undefined,
        nomeVariante: data?.nomeVariante || 'Padrão',
        skuBloqueado: data?.skuBloqueado ?? false,
        imagem: data?.imagem ?? null,
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
        ...extractFiscalFields(data),
        produtoBaseId: data.produtoBaseId ?? null,
        status: data.status,
        nome: data.nome,
        nomeVariante: data.nomeVariante,
        codigo: data.codigo ?? '',
        preco: data.preco,
        precoPromocional: data.precoPromocional ?? '',
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
        mostrarNoCatalogo: data.mostrarNoCatalogo ?? true,
        materiaPrima: data.materiaPrima ?? false,
        custoMedioProducao: data.custoMedioProducao || undefined,
        categoriaId: data.categoriaId ?? null,
        skuBloqueado: data.skuBloqueado ?? false,
        imagem: data.imagem ?? null,
      }
      idMutation.value = data.id ?? id
      openModalVariante.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao editar a variante')
    }
  }

  const gerarSkuProduto = async () => {
    if (!form.value.nome?.trim()) {
      toast.error('Informe o nome do produto antes de gerar o SKU')
      return
    }
    try {
      const sku = await ProdutoRepository.gerarSku({
        nome: form.value.nome,
        nomeVariante: form.value.nomeVariante,
      })
      if (sku) {
        form.value.codigo = sku
        toast.success('SKU gerado automaticamente')
      }
    } catch (error) {
      console.log(error)
      toast.error('Erro ao gerar o SKU')
    }
  }

  const gerarSkuVariante = async () => {
    if (!varianteForm.value.produtoBaseId && !varianteForm.value.nomeVariante?.trim()) {
      toast.error('Selecione o produto base e informe a variante antes de gerar o SKU')
      return
    }
    try {
      const sku = await ProdutoRepository.gerarSku({
        nome: varianteForm.value.nome,
        nomeVariante: varianteForm.value.nomeVariante,
        produtoBaseId: varianteForm.value.produtoBaseId,
      })
      if (sku) {
        varianteForm.value.codigo = sku
        toast.success('SKU gerado automaticamente')
      }
    } catch (error) {
      console.log(error)
      toast.error('Erro ao gerar o SKU')
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
    openModalDescarte,
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
    gerarSkuProduto,
    gerarSkuVariante,
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
