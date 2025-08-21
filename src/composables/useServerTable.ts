import { ref, watchEffect } from 'vue'
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/vue-table'
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import http from '@/utils/axios'
export function useServerTable<T>(url: string, columns: ColumnDef<T>[]) {
  const data = ref<T[] | any>([])
  const pageIndex = ref(0)
  const pageSize = ref(10)
  const totalPages = ref(1)
  const search = ref('')
  const sorting = ref<SortingState>([])
  const columnVisibility = ref<VisibilityState>({})
  const rowSelection = ref({})

  async function fetchData() {
    const sort = sorting.value[0]
    const pageIdx = pageIndex.value + 1

    const res = await http.get(url, {
      params: {
        page: pageIdx,
        pageSize: pageSize.value,
        search: search.value,
        sortBy: sort?.id || 'id',
        order: sort?.desc ? 'desc' : 'asc',
      },
    })

    data.value = res.data.data
    totalPages.value = res.data.totalPages

    // se a página atual for maior que o total de páginas, volta para a última
    if (pageIndex.value >= totalPages.value) {
      pageIndex.value = Math.max(totalPages.value - 1, 0)
      return fetchData() // 🔄 recarrega na última página válida
    }

    pageIndex.value = res.data.page - 1
  }

  watchEffect(fetchData)

  const table = useVueTable({
    data, // ✅ precisa ser função reativa
    columns,
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
  }
}
