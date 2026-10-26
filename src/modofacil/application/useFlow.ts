import { inject, onBeforeUnmount, watch, type Ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { experience } from './experience'
import { useConfirmation } from './confirmation'
import { modalFormKey } from './modalWorkspace'
const drafts = new Map<symbol, boolean>()
const updateDirty = () => {
  experience.dirty = [...drafts.values()].some(Boolean)
}
export function useFlow(dirty: Ref<boolean>, busy?: Ref<boolean>) {
  const confirm = useConfirmation()
  const entry = inject(modalFormKey, undefined)
  const token = Symbol('draft')
  watch(
    dirty,
    (value) => {
      drafts.set(token, value)
      updateDirty()
    },
    { immediate: true },
  )
  const canLeave = () =>
    !busy?.value &&
    (!dirty.value ||
      confirm({
        title: 'Descartar alterações?',
        description: 'Você tem alterações não salvas. Deseja sair e descartá-las?',
        confirmLabel: 'Descartar e sair',
        danger: true,
      }))
  const guard = { canLeave, busy }
  if (entry) entry.guards.add(guard)
  else {
    onBeforeRouteLeave(canLeave)
    onBeforeRouteUpdate((to, from) => to.path === from.path || canLeave())
  }
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (dirty.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', beforeUnload)
  onBeforeUnmount(() => {
    entry?.guards.delete(guard)
    drafts.delete(token)
    updateDirty()
    window.removeEventListener('beforeunload', beforeUnload)
  })
}
