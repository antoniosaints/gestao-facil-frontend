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

export async function handleRouteGuard(
  to: RouteLocationNormalizedGeneric,
  from: RouteLocationNormalizedGeneric,
) {
  const storeUi = useUiStore()
  const toast = useToast()

  if (window.innerWidth < 768) {
    storeUi.openSidebar = false
  }

  const token = localStorage.getItem('gestao_facil:token')
  // Rota privada sem login
  if (!to.meta?.isPublic && !token) {
    toast.info('Necessário efetuar login para acessar essa rota!')
    return { name: 'login' }
  }

  // Evita login autenticado
  if (to.path === '/login' && token) {
    return { name: 'home' }
  }

  // Checa status da conta (exceto login/assinatura)
  if (!['/login', '/assinatura/resumo', '/assinatura'].includes(to.path)) {
    const ativo = await useControlRouter()
    if (!ativo) {
      toast.info('Sua conta está inativa, realize o pagamento para ativá-la.')
      return { name: 'assinatura-resumo' }
    }
  }

  // Verificação de permissão
  if (to.meta?.permissao) {
    const level = Number(to.meta?.permissao)
    if (level > 6) {
      toast.info('Você não tem permissão para acessar essa rota!')
      return from.name ? { name: from.name as string } : { name: 'home' }
    }
  }

  // Libera navegação normalmente
  return true
}
