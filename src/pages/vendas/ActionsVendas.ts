import { useConfirm } from '@/composables/useConfirm'
import { VendaRepository } from '@/repositories/venda-repository'
import { useVendasStore } from '@/stores/vendas/useVenda'
import type { Vendas } from '@/types/schemas'
import { useToast } from 'vue-toastification'

const toast = useToast()
const store = useVendasStore()

export async function gerarCupomVenda(id: number) {
  try {
    VendaRepository.getCupomPDF(id)
    toast.success('Cupom gerado com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao gerar o cupom')
  }
}

export async function editarVenda(id: number) {
  try {
    await store.openUpdate(id)
  } catch (error) {
    console.log(error)
    toast.error('Erro ao buscar os dados da venda!')
  }
}

export async function estornarVenda(id: number) {
  try {
    await VendaRepository.estornar(id)
    toast.success('Venda estornada com sucesso')
    store.updateTable()
  } catch (error) {
    console.log(error)
    toast.error('Erro ao estornar a venda')
  }
}

export function openModalFaturarVenda(id: number) {
  if (!id) return toast.error('ID nao informado!')
  store.idMutation = id
  store.openModalFaturar = true
}

export function enviarComprovanteVenda(venda: Vendas) {
  store.openComprovante(venda)
}

export async function deletarVenda(id: number) {
  if (!id) return toast.error('ID nao informado!')
  const confirm = await useConfirm().confirm({
    title: 'Excluir venda',
    message: 'Tem certeza que deseja excluir esta venda?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    const response = await VendaRepository.remove(id)
    toast.success(response.message || 'Registro deletado com sucesso')
    store.idMutation = null
    store.updateTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao deletar o registro')
    store.idMutation = null
  }
}

/* ==========================================================================
 * Ações em massa (várias vendas selecionadas via checkbox na tabela)
 * ========================================================================== */

const isFaturada = (v: Vendas) => v.status === 'FATURADO'

/** Executa uma ação sequencialmente para cada venda, contando sucessos/falhas. */
async function executarSequencial(
  vendas: Vendas[],
  fn: (venda: Vendas) => Promise<unknown>,
): Promise<{ sucesso: number; falhas: number }> {
  let sucesso = 0
  let falhas = 0
  for (const venda of vendas) {
    try {
      await fn(venda)
      sucesso++
    } catch (error) {
      console.log(error)
      falhas++
    }
  }
  return { sucesso, falhas }
}

function notificarResultado(acao: string, sucesso: number, falhas: number, ignoradas: number) {
  if (sucesso > 0) toast.success(`${sucesso} venda(s) ${acao} com sucesso.`)
  if (falhas > 0) toast.error(`${falhas} venda(s) falharam ao processar.`)
  if (ignoradas > 0) toast.info(`${ignoradas} venda(s) ignorada(s) por não estarem no status válido.`)
}

/**
 * Fatura em massa: ignora as vendas que já estão FATURADAS e abre o modal de
 * faturamento para aplicar os mesmos dados de pagamento às elegíveis.
 * Retorna true quando o modal foi aberto (seleção pode ser limpa).
 */
export function faturarVendasEmMassa(vendas: Vendas[]): boolean {
  const elegiveis = vendas.filter((v) => !isFaturada(v))
  const ignoradas = vendas.length - elegiveis.length

  if (!elegiveis.length) {
    toast.info('Nenhuma venda pendente para faturar (todas já estão faturadas).')
    return false
  }
  if (ignoradas > 0) {
    toast.info(`${ignoradas} venda(s) já faturada(s) serão ignoradas.`)
  }

  store.idsFaturarMassa = elegiveis.map((v) => v.id!).filter((id): id is number => Boolean(id))
  store.idMutation = null
  store.openModalFaturar = true
  return true
}

/** Estorna em massa: estorna apenas as vendas FATURADAS, ignora as demais. */
export async function estornarVendasEmMassa(vendas: Vendas[]): Promise<boolean> {
  const elegiveis = vendas.filter(isFaturada)
  const ignoradas = vendas.length - elegiveis.length

  if (!elegiveis.length) {
    toast.info('Nenhuma venda faturada para estornar.')
    return false
  }

  const confirm = await useConfirm().confirm({
    title: 'Estornar vendas',
    message: `Deseja estornar ${elegiveis.length} venda(s) faturada(s)?${
      ignoradas ? ` ${ignoradas} venda(s) não faturada(s) serão ignoradas.` : ''
    }`,
    confirmText: 'Sim, estornar!',
  })
  if (!confirm) return false

  const { sucesso, falhas } = await executarSequencial(elegiveis, (v) =>
    VendaRepository.estornar(v.id!),
  )
  notificarResultado('estornada(s)', sucesso, falhas, ignoradas)
  store.updateTable()
  return true
}

/** Exclui em massa: ignora vendas FATURADAS (não podem ser excluídas). */
export async function excluirVendasEmMassa(vendas: Vendas[]): Promise<boolean> {
  const elegiveis = vendas.filter((v) => !isFaturada(v))
  const ignoradas = vendas.length - elegiveis.length

  if (!elegiveis.length) {
    toast.info('Nenhuma venda elegível para exclusão (vendas faturadas não podem ser excluídas).')
    return false
  }

  const confirm = await useConfirm().confirm({
    title: 'Excluir vendas',
    message: `Deseja excluir ${elegiveis.length} venda(s)?${
      ignoradas ? ` ${ignoradas} venda(s) faturada(s) serão ignoradas.` : ''
    }`,
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return false

  const { sucesso, falhas } = await executarSequencial(elegiveis, (v) => VendaRepository.remove(v.id!))
  notificarResultado('excluída(s)', sucesso, falhas, ignoradas)
  store.idMutation = null
  store.updateTable()
  return true
}

/** Imprime o cupom (térmico) de todas as vendas selecionadas, qualquer status. */
export async function imprimirVendasEmMassa(vendas: Vendas[]): Promise<boolean> {
  if (!vendas.length) return false
  const { sucesso, falhas } = await executarSequencial(vendas, (v) => VendaRepository.printCupom(v.id!))
  notificarResultado('enviada(s) para impressão', sucesso, falhas, 0)
  return true
}

/** Gera o cupom em PDF de todas as vendas selecionadas, qualquer status. */
export async function gerarCupomPdfVendasEmMassa(vendas: Vendas[]): Promise<boolean> {
  if (!vendas.length) return false
  const { sucesso, falhas } = await executarSequencial(vendas, (v) => VendaRepository.getCupomPDF(v.id!))
  notificarResultado('gerada(s) em PDF', sucesso, falhas, 0)
  return true
}
