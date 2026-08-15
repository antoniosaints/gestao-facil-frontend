import { ref, watchEffect } from 'vue'
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/vue-table'
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import http from '@/utils/axios'
export function useServerTable<T>(
  url: string,
  columns: ColumnDef<T>[],
  externalFilters: Record<string, any> = {}, // 🔑 filtros vindos do componente pai
) {
  const data = ref<T[] | any>([])
  const pageIndex = ref(0)
  const pageSize = ref(10)
  const totalPages = ref(1)
  const search = ref('')
  const sorting = ref<SortingState>([])
  const columnVisibility = ref<VisibilityState>({})
  const rowSelection = ref({})
  const loading = ref(false)

  async function fetchData() {
    loading.value = true
    try {
      const sort = sorting.value[0]
      const pageIdx = pageIndex.value + 1
      const res = await http.get(url, {
        params: {
          page: pageIdx,
          pageSize: pageSize.value,
          search: search.value,
          sortBy: sort?.id || 'id',
          order: sort?.desc ? 'desc' : 'asc',
          ...externalFilters,
        },
      })

      // Alguns módulos legados ainda respondem no contrato paginado
      // `{ data: { items, page, size, total } }`. Aceitamos os dois formatos
      // para que o DataTable não aparente vazio durante uma atualização de API.
      const payload = res.data?.data
      data.value = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : []
      const returnedPage = Number(res.data?.page ?? payload?.page ?? pageIdx)
      const returnedSize = Number(res.data?.pageSize ?? payload?.size ?? pageSize.value)
      const returnedTotal = Number(res.data?.total ?? payload?.total ?? 0)
      totalPages.value = Math.max(1, Number(res.data?.totalPages) || Math.ceil(returnedTotal / returnedSize) || 1)

      // Ajusta pageIndex se estiver fora do total de páginas
      if (pageIndex.value >= totalPages.value) {
        pageIndex.value = Math.max(totalPages.value - 1, 0)
        // Não chamamos fetchData recursivamente
      } else {
        pageIndex.value = Math.max(0, returnedPage - 1)
      }
    } finally {
      loading.value = false
    }
  }

  watchEffect(fetchData)

  const table = useVueTable({
    data,
    columns,
    // Usa o id do registro como chave da linha para que a seleção sobreviva a
    // reordenacoes/refetch da tabela (fallback para o indice quando nao houver id).
    getRowId: (row: any, index) => (row?.id != null ? String(row.id) : String(index)),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages.value,
    onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
    onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
    onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
    onPaginationChange: (updaterOrValue) => valueUpdater(updaterOrValue, pageIndex),
    state: {
      get sorting() {
        return sorting.value
      },
      get columnVisibility() {
        return columnVisibility.value
      },
      get rowSelection() {
        return rowSelection.value
      },
      get pagination() {
        return { pageIndex: pageIndex.value, pageSize: pageSize.value }
      },
    },
  })

  return {
    data,
    pageIndex,
    pageSize,
    totalPages,
    search,
    sorting,
    columnVisibility,
    rowSelection,
    fetchData,
    table,
    loading,
  }
}
