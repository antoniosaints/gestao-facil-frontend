import { ref, watch } from 'vue'
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/vue-table'
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import http from '@/utils/axios'
import {
  loadServerTableState,
  restoreServerTableFilters,
  saveServerTableState,
} from './serverTableState'
export function useServerTable<T>(
  url: string,
  columns: ColumnDef<T>[],
  externalFilters: Record<string, any> = {}, // 🔑 filtros vindos do componente pai
  stateKey?: string,
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
  let correctingPage = false
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  let latestRequestId = 0

  const savedState = loadServerTableState(stateKey)
  if (savedState) {
    pageIndex.value = savedState.pageIndex
    pageSize.value = savedState.pageSize
    search.value = savedState.search
    sorting.value = savedState.sorting
    columnVisibility.value = savedState.columnVisibility
    restoreServerTableFilters(externalFilters, savedState.filters)
  }

  const requestPage = (requestedPageIndex: number) => {
    const sort = sorting.value[0]
    return http.get(url, {
      params: {
        ...externalFilters,
        page: requestedPageIndex + 1,
        pageSize: pageSize.value,
        search: search.value,
        sortBy: sort?.id || 'id',
        order: sort?.desc ? 'desc' : 'asc',
      },
    })
  }

  async function fetchData() {
    const requestId = ++latestRequestId
    loading.value = true
    try {
      const requestedPageIndex = pageIndex.value
      let res = await requestPage(requestedPageIndex)
      if (requestId !== latestRequestId) return

      // Alguns módulos legados ainda respondem no contrato paginado
      // `{ data: { items, page, size, total } }`. Aceitamos os dois formatos
      // para que o DataTable não aparente vazio durante uma atualização de API.
      let payload = res.data?.data
      let rows = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : []
      let returnedPage = Number(res.data?.page ?? payload?.page ?? requestedPageIndex + 1)
      let returnedSize = Number(res.data?.pageSize ?? payload?.size ?? pageSize.value)
      let returnedTotal = Number(res.data?.total ?? payload?.total ?? 0)
      let availablePages = Math.max(
        1,
        Number(res.data?.totalPages) || Math.ceil(returnedTotal / returnedSize) || 1,
      )

      // Após uma exclusão, a página atual pode deixar de existir. Recarregamos a
      // última página válida imediatamente, evitando uma tabela vazia temporária.
      const lastAvailablePageIndex = Math.max(availablePages - 1, 0)
      if (requestedPageIndex > lastAvailablePageIndex && returnedTotal > 0) {
        correctingPage = true
        pageIndex.value = lastAvailablePageIndex
        res = await requestPage(lastAvailablePageIndex)
        if (requestId !== latestRequestId) return

        payload = res.data?.data
        rows = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : []
        returnedPage = Number(res.data?.page ?? payload?.page ?? lastAvailablePageIndex + 1)
        returnedSize = Number(res.data?.pageSize ?? payload?.size ?? pageSize.value)
        returnedTotal = Number(res.data?.total ?? payload?.total ?? 0)
        availablePages = Math.max(
          1,
          Number(res.data?.totalPages) || Math.ceil(returnedTotal / returnedSize) || 1,
        )
      }

      if (requestId !== latestRequestId) return
      data.value = rows
      totalPages.value = availablePages
      pageIndex.value = Math.min(Math.max(0, returnedPage - 1), availablePages - 1)
    } finally {
      if (requestId === latestRequestId) {
        correctingPage = false
        loading.value = false
      }
    }
  }

  function scheduleFetch(delay = 0) {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = delay
      ? setTimeout(() => {
          searchTimer = null
          void fetchData()
        }, delay)
      : null

    if (!delay) void fetchData()
  }

  // A busca é atualizada pelo campo da DataTable com debounce, evitando várias
  // requisições enquanto o usuário ainda está digitando.
  function setSearch(value: string | number) {
    const nextSearch = String(value ?? '')
    if (search.value === nextSearch) return

    search.value = nextSearch
    scheduleFetch(300)
  }

  watch(
    [pageIndex, pageSize, sorting, () => externalFilters],
    () => {
      if (!correctingPage) scheduleFetch()
    },
    { deep: true, immediate: true },
  )

  watch(
    [pageIndex, pageSize, search, sorting, columnVisibility, () => externalFilters],
    () => {
      saveServerTableState(stateKey, {
        pageIndex: pageIndex.value,
        pageSize: pageSize.value,
        search: search.value,
        sorting: sorting.value,
        columnVisibility: columnVisibility.value,
        filters: externalFilters,
      })
    },
    { deep: true },
  )

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
    setSearch,
    sorting,
    columnVisibility,
    rowSelection,
    fetchData,
    table,
    loading,
  }
}
