import { ref } from 'vue'
import { api, type Row } from './domain'
import type { SelectAjaxLoader, SelectAjaxResult } from '@/components/formulario/select-ajax'
export type LookupKind = 'finance-accounts' | 'finance-categories' | 'product-categories'
const paths: Record<LookupKind, string> = {
  'finance-accounts': '/modofacil/financeiro/contas/opcoes',
  'finance-categories': '/modofacil/financeiro/categorias/opcoes',
  'product-categories': '/modofacil/produtos/categorias/opcoes',
}
// State belongs to the open form. Only requested pages/selected IDs are retained
// for review labels; no complete catalog or cross-session cache is loaded.
export function useLookupOptions(
  kind: LookupKind,
  filters: () => Record<string, unknown> = () => ({}),
) {
  const rows = ref<Row[]>([])
  const load: SelectAjaxLoader = async ({ search, page, id }) => {
    const currentFilters = filters()
    const result: SelectAjaxResult = await api.read(paths[kind], {
      ...currentFilters,
      search,
      page,
      ...(id != null ? { id } : {}),
    })
    if (!Array.isArray(result?.results)) throw new Error('Não foi possível carregar as opções.')
    // Older SelectAjax routes do not accept excludeId. Keep the edited category
    // out of the parent selector without fetching the complete catalog.
    const results = result.results.filter(
      (option) => String(option.id) !== String(currentFilters.excludeId),
    )
    const records = new Map(rows.value.map((row) => [row.id, row]))
    for (const option of results)
      records.set(Number(option.id), { id: Number(option.id), nome: option.label })
    rows.value = [...records.values()]
    return { ...result, results }
  }
  return { rows, load }
}
