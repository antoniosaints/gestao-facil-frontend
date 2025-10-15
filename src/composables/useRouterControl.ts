import { hasPermission } from '@/hooks/authorize'
import { ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import type { RouteLocationNormalizedGeneric } from 'vue-router'
import { useToast } from 'vue-toastification'

export const useControlRouter = async () => {
  try {
    const storeUi = useUiStore()
    await storeUi.getStatus()
    const { data } = await ContaRepository.status()
    return data.status === 'ATIVO'
  } catch (error) {
    return false
  }
}

type typed = RouteLocationNormalizedGeneric

export async function handleRouteGuard(to: typed, from: typed) {
  const storeUi = useUiStore()
  const toast = useToast()

  await storeUi.getDataUsuario()

  const home = { name: 'home' }
  const login = { name: 'login' }
  const assinatura = { name: 'assinatura-resumo' }
  const allowedRouteNames = ['login', 'assinatura-home', 'assinatura-resumo']
  const token = localStorage.getItem('gestao_facil:token')

  if (window.innerWidth < 768) {
    storeUi.openSidebar = false
  }

  if (to.meta?.isPublic) return true
  // Rota privada sem login
  if (!to.meta?.isPublic && !token) {
    toast.info('Necessário efetuar login para acessar essa rota!')
    return login
  }

  // Evita login autenticado
  if (to.path === '/login' && token) return home

  // Checa status da conta (exceto login/assinatura)
  if (!allowedRouteNames.includes(to.name as string)) {
    const ativo = await useControlRouter()
    if (!ativo) {
      toast.info('Sua conta está inativa, realize o pagamento para ativá-la.')
      return assinatura
    }
  }

  // Verificação de permissão
  if (to.meta?.permissao) {
    if (!hasPermission(storeUi.usuarioLogged, Number(to.meta?.permissao))) {
      toast.info('Você não tem permissão para acessar essa rota!')
      return from.name ? { name: from.name as string } : home
    }
  }

  // Libera navegação normalmente
  return true
}
