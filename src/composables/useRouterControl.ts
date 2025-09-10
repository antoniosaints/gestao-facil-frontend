import { ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import type { NavigationGuardNext, RouteLocationNormalizedGeneric } from 'vue-router'
import { useToast } from 'vue-toastification'

export const useControlRouter = async () => {
  try {
    const status = await ContaRepository.status()
    return status.status === 'ATIVO'
  } catch (error) {
    return false
  }
}

export async function handleRouteGuard(
  to: RouteLocationNormalizedGeneric,
  from: RouteLocationNormalizedGeneric,
  next: NavigationGuardNext,
) {
  const toast = useToast()
  const storeUi = useUiStore()

  // Fecha sidebar em telas menores
  if (window.innerWidth < 768) {
    storeUi.openSidebar = false
  }

  const token = localStorage.getItem('gestao_facil:token')

  // Bloqueio de rotas privadas
  if (!to.meta?.isPublic && !token) {
    toast.info('Necessário efetuar login para acessar essa rota!')
    return { name: 'login' }
  }

  // Evita acessar login já autenticado
  if (to.path === '/login' && token) {
    return { name: 'home' }
  }

  // Evita loop infinito: só checa status se não estiver em login/assinatura
  if (!['/login', '/assinatura'].includes(to.path)) {
    const ativo = await useControlRouter()
    if (!ativo) {
      toast.info('Sua conta está inativa, realize o pagamento para ativá-la.')
      return { name: 'assinatura' }
    }
  }

  // Verificação de permissão
  if (to.meta?.permissao) {
    const level = Number(to.meta?.permissao)
    if (level > 6) {
      toast.info('Você não tem permissão para acessar essa rota!')
      return { name: from.name }
    }
  }

  return null
}
