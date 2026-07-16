import { useLocalStorage } from '@vueuse/core'

// Preferência do usuário (persistida no navegador) para exibir o botão flutuante do Core IA.
// Singleton em nível de módulo: o mesmo ref é compartilhado por todos os componentes.
const habilitado = useLocalStorage('core-ia-widget-habilitado', true)

export function useCoreIaWidget() {
  return { habilitado }
}
