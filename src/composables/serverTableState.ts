import type { SortingState, VisibilityState } from '@tanstack/vue-table'

const STORAGE_PREFIX = 'gestaofacil:datatable:'
const STATE_VERSION = 1

export type ServerTableState = {
  version: number
  pageIndex: number
  pageSize: number
  search: string
  sorting: SortingState
  columnVisibility: VisibilityState
  filters: Record<string, unknown>
}

function getStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isValidPageIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isValidPageSize(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 100
}

function getSerializableFilters(filters: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => key !== 'update' && value !== undefined),
  )
}

export function getServerTableStorageKey(stateKey: string) {
  return `${STORAGE_PREFIX}${stateKey}`
}

export function loadServerTableState(stateKey?: string): ServerTableState | null {
  if (!stateKey) return null

  try {
    const rawState = getStorage()?.getItem(getServerTableStorageKey(stateKey))
    if (!rawState) return null

    const state = JSON.parse(rawState) as Partial<ServerTableState>
    if (
      state.version !== STATE_VERSION ||
      !isValidPageIndex(state.pageIndex) ||
      !isValidPageSize(state.pageSize) ||
      typeof state.search !== 'string' ||
      !Array.isArray(state.sorting) ||
      !state.columnVisibility ||
      typeof state.columnVisibility !== 'object' ||
      !state.filters ||
      typeof state.filters !== 'object'
    ) {
      return null
    }

    return state as ServerTableState
  } catch {
    return null
  }
}

export function saveServerTableState(
  stateKey: string | undefined,
  state: Omit<ServerTableState, 'version'>,
) {
  if (!stateKey) return

  try {
    getStorage()?.setItem(
      getServerTableStorageKey(stateKey),
      JSON.stringify({
        version: STATE_VERSION,
        ...state,
        filters: getSerializableFilters(state.filters),
      }),
    )
  } catch {
    // A tabela continua funcional quando o navegador bloqueia ou esgota o storage.
  }
}

export function restoreServerTableFilters(
  target: Record<string, any>,
  savedFilters: Record<string, unknown>,
) {
  for (const [key, value] of Object.entries(savedFilters)) {
    if (key in target && key !== 'update') {
      target[key] = value
    }
  }
}
