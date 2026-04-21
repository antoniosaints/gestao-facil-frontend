import { isBefore } from 'date-fns'
import type { RouteLocationNormalizedGeneric } from 'vue-router'
import { useToast } from 'vue-toastification'
import { hasPermission } from '@/hooks/authorize'
import { ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'

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
  storeUi.loading = true
  await storeUi.getDataUsuario()
  storeUi.loading = false
  const home = { name: 'home' }
  const login = { name: 'login' }
  const assinatura = { name: 'assinatura-resumo' }
  const allowedRouteNames = ['login', 'assinatura-home', 'assinatura-resumo']
  const token = localStorage.getItem('gestao_facil:token')

  if (window.innerWidth < 768) {
    storeUi.openSidebar = false
  }

  if (to.meta?.isPublic) return true

  if (!to.meta?.isPublic && !token) {
    toast.info('Necessário efetuar login para acessar essa rota!')
    return login
  }

  if (to.path === '/login' && token) return home

  if (!allowedRouteNames.includes(to.name as string)) {
    if (isBefore(new Date(storeUi.contaInfo.vencimento), new Date())) {
      toast.info('Sua conta está inativa, realize o pagamento para ativá-la.')
      return assinatura
    }
  }

  if (to.meta?.permissao) {
    if (!hasPermission(storeUi.usuarioLogged, Number(to.meta?.permissao))) {
      toast.info('Você não tem permissão para acessar essa rota!')
      return from.name ? { name: from.name as string } : home
    }
  }

  if (to.meta?.modulo) {
    try {
      await storeUi.loadAppModules()

      if (!storeUi.hasActiveModule(String(to.meta.modulo))) {
        toast.info('Este app não está ativo na sua mensalidade.')
        return { name: 'loja-home' }
      }
    } catch (error) {
      toast.error('Não foi possível validar o acesso ao app adicional.')
      return { name: 'loja-home' }
    }
  }

  return true
}
