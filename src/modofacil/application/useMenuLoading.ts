import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

export function useMenuLoading() {
  const router = useRouter()
  const pendingPath = ref('')
  const start = (path: string) => {
    if (
      (path === '/modofacil' || path.startsWith('/modofacil/')) &&
      path !== router.currentRoute.value.path
    )
      pendingPath.value = path
  }
  // Capture clicks before asynchronous global guards and lazy imports run.
  function onNavigate(event: MouseEvent) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const anchor =
      event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
    const url = new URL(anchor.href, window.location.href)
    if (url.origin === window.location.origin) start(url.pathname)
  }
  const removeBefore = router.beforeEach((to) => start(to.path))
  const removeAfter = router.afterEach((to, _from, failure) => {
    if (!failure || to.path === pendingPath.value) pendingPath.value = ''
  })
  const removeError = router.onError(() => {
    pendingPath.value = ''
  })
  onBeforeUnmount(() => {
    removeBefore()
    removeAfter()
    removeError()
  })
  return { pendingPath, onNavigate }
}
