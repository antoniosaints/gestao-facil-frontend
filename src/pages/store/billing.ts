import type { StoreModule } from '@/repositories/store-repository'

export function isStoreModuleFree(modulo: Pick<StoreModule, 'preco'>) {
  return Number(modulo.preco || 0) <= 0
}

export function shouldShowImmediateBillingOptions(
  modulo: Pick<StoreModule, 'preco' | 'ativo' | 'pendenteAtivacao' | 'ativacaoImediataDisponivel'>,
) {
  return modulo.ativacaoImediataDisponivel && !modulo.ativo && !modulo.pendenteAtivacao && !isStoreModuleFree(modulo)
}
