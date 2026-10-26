import { computed, inject, shallowReactive, shallowRef, type InjectionKey, type Ref } from 'vue'
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router'
import { forms, type FormTarget } from './formDialogs'

interface CloseGuard {
  canLeave: () => boolean | Promise<boolean>
  busy?: Ref<boolean>
}
export interface FormEntry {
  id: number
  target: FormTarget
  origin: string
  guards: Set<CloseGuard>
}
export function createModalWorkspace(canOpen: (level: number) => boolean) {
  const entries = shallowRef<FormEntry[]>([])
  const error = shallowRef('')
  let version = 0,
    leaving = false
  const current = computed(() => entries.value[entries.value.length - 1])
  const busy = computed(() => [...(current.value?.guards || [])].some((guard) => guard.busy?.value))
  async function canLeave(all = false) {
    if (leaving) return false
    leaving = true
    try {
      const pending = all ? [...entries.value].reverse() : current.value ? [current.value] : []
      // Check every busy form before asking to discard any draft.
      if (pending.some((entry) => [...entry.guards].some((guard) => guard.busy?.value)))
        return false
      for (const entry of pending)
        for (const guard of entry.guards) if (!(await guard.canLeave())) return false
      return true
    } finally {
      leaving = false
    }
  }
  return {
    entries,
    current,
    busy,
    error,
    canLeave,
    open(target: FormTarget, origin: string) {
      error.value = ''
      if (!canOpen(forms[target.form].level)) {
        error.value = 'Você não tem permissão para esta operação.'
        return false
      }
      if (busy.value || leaving) return false
      entries.value = [
        ...entries.value,
        {
          id: ++version,
          target: { ...target, params: { ...target.params }, query: { ...target.query } },
          origin: entries.value[0]?.origin || origin,
          guards: shallowReactive(new Set()),
        },
      ]
      return true
    },
    async close() {
      const entry = current.value
      if (!entry || !(await canLeave()) || current.value !== entry) return false
      entries.value = entries.value.slice(0, -1)
      return true
    },
    reset() {
      entries.value = []
      error.value = ''
    },
  }
}
export type ModalWorkspace = ReturnType<typeof createModalWorkspace>
export const modalWorkspaceKey: InjectionKey<ModalWorkspace> = Symbol('modo-facil-modals')
export const modalFormKey: InjectionKey<FormEntry> = Symbol('modo-facil-form')
export function useFormContext(): Pick<RouteLocationNormalizedLoaded, 'params' | 'query' | 'meta'> {
  const entry = inject(modalFormKey, undefined)
  // Standalone component tests may supply a router instead of a workspace.
  if (!entry) return useRoute()
  return {
    params: Object.fromEntries(
      Object.entries(entry.target.params || {}).map(([key, value]) => [key, String(value)]),
    ),
    query: Object.fromEntries(
      Object.entries(entry.target.query || {}).flatMap(([key, value]) =>
        value === undefined ? [] : [[key, String(value)]],
      ),
    ),
    meta: forms[entry.target.form].meta || {},
  }
}
