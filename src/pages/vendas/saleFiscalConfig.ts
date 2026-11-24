import { hasPermission } from '@/hooks/authorize'
import { NotasFiscaisRepository } from '@/repositories/notas-fiscais-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { isAppAvailable } from '@/utils/appAccess'

export async function loadSaleFiscalConfig() {
  if (!isAppAvailable('notas-fiscais')) return null

  const ui = useUiStore()
  if (!ui.hasActiveModule('notas-fiscais') || !hasPermission(ui.usuarioLogged, 4)) return null

  try {
    return await NotasFiscaisRepository.getConfig()
  } catch {
    return null
  }
}
