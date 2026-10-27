import { inject, provide, onBeforeUnmount, ref, watch } from 'vue'
import { deletionScopeKey } from './deletionScope'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { api, type Row } from '../adapters/domain'
import { errorMessage } from './format'
import { dataRevision } from './dataChanges'
import { modalWorkspaceKey } from './modalWorkspace'
function querySignature(query: LocationQueryRaw) {
  return JSON.stringify(
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)),
  )
}
export function usePage(
  path: () => string,
  filters: () => Record<string, unknown> = () => ({}),
  onInvalidate?: () => void | Promise<void>,
) {
  provide(deletionScopeKey, new Map())
  const workspace = inject(modalWorkspaceKey, undefined)
  const route = useRoute(),
    router = useRouter(),
    rows = ref<Row[]>([]),
    total = ref(0),
    pages = ref(1),
    page = ref(Math.max(1, Number(route.query.page) || 1)),
    search = ref(String(route.query.search || '')),
    loading = ref(false),
    error = ref('')
  let generation = 0,
    loadedRevision = dataRevision(path())
  const ownerPath = route.path
  const active = () =>
    !workspace?.entries.value.length && router.currentRoute.value.path === ownerPath
  async function load(reset = false) {
    if (reset) page.value = 1
    const current = ++generation
    const endpoint = path(),
      currentFilters = filters()
    const params = { ...currentFilters, page: page.value, search: search.value }
    loadedRevision = dataRevision(endpoint)
    loading.value = true
    error.value = ''
    try {
      const query: LocationQueryRaw = {
        ...route.query,
        page: String(page.value),
        search: search.value || undefined,
      }
      for (const [key, value] of Object.entries(currentFilters))
        query[key] = value == null || value === '' ? undefined : String(value)
      // Keep filters untouched while an overlaid form is open.
      if (active() && querySignature(query) !== querySignature(route.query))
        await router.replace({ path: route.path, query })
      const result = await api.page(endpoint, params)
      if (current !== generation) return
      rows.value = result.rows
      total.value = result.total
      pages.value = result.pages
    } catch (e) {
      if (current === generation) error.value = errorMessage(e)
    } finally {
      if (current === generation) loading.value = false
    }
  }
  watch(
    () => route.query.search,
    (value) => {
      const nextSearch = String(value || '')
      if (nextSearch !== search.value && active()) {
        search.value = nextSearch
        void load(true)
      }
    },
  )
  // Refresh once after a successful save, when the original page is visible again.
  watch(active, (visible) => {
    if (visible && dataRevision(path()) !== loadedRevision) {
      void load()
      void onInvalidate?.()
    }
  })
  onBeforeUnmount(() => {
    generation++
  })
  async function reloadAfterDelete() {
    await load()
    if (!error.value && page.value > pages.value) {
      page.value = pages.value
      await load()
    }
  }
  return { rows, total, pages, page, search, loading, error, load, reloadAfterDelete }
}
