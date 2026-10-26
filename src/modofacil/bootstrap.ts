import type { Router } from 'vue-router'
import { handleRouteGuard } from '@/composables/useRouterControl'
import { refreshExperience } from './application/experience'
import { experience } from './application/experience'
import { specializedModule } from './application/specialized'
import { experienceDestination } from './application/navigation'
export function registerModoFacilPolicy(router: Router) {
  router.beforeEach(async (to, from) => {
    const allowed = await handleRouteGuard(to, from)
    if (allowed !== true) return allowed
    if (
      to.meta.isPublic ||
      to.path.startsWith('/admin') ||
      to.path === '/assinatura' ||
      to.path.startsWith('/assinatura/') ||
      to.path === '/vendas/pdv' ||
      to.path === '/configuracoes'
    )
      return true
    await refreshExperience()
    // A failed read never becomes a synthetic NORMAL preference. The new shell exposes retry.
    if (experience.error && !experience.configuration) return true
    const specialized = specializedModule(to.path)
    if (specialized && to.query.mfCompleto === '1') experience.completeModule = specialized
    if (to.path.startsWith('/modofacil')) experience.completeModule = null
    return experienceDestination(to, experience.configuration, experience.completeModule)
  })
}
