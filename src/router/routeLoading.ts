import { computed, shallowRef } from 'vue'
import type { RouteLocation, RouteLocationNormalized, Router } from 'vue-router'

function isAccountPage(route: RouteLocationNormalized) {
  return route.matched.length > 0 && !route.meta.isPublic && route.meta.layout !== 'admin'
}

export function registerRouteLoading(router: Router, usesAnimatedLoading: () => boolean) {
  const pending = shallowRef<RouteLocation | RouteLocationNormalized>()

  // Register before the account guards so the indicator can paint while they are waiting.
  router.beforeEach((to, from) => {
    if (
      isAccountPage(from) &&
      isAccountPage(to) &&
      to.path !== from.path &&
      usesAnimatedLoading()
    ) {
      pending.value = to.redirectedFrom ?? to
    } else {
      pending.value = undefined
    }
  })

  function finish(to: RouteLocationNormalized) {
    // A cancelled navigation can finish after a newer one has started.
    if (pending.value === (to.redirectedFrom ?? to)) pending.value = undefined
  }

  router.afterEach(finish)
  router.onError((error, to) => {
    finish(to)
    console.error(error)
  })

  return computed(() => pending.value !== undefined)
}
