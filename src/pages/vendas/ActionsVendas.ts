import { VendaRepository } from '@/repositories/venda-repository'
import { useVendasStore } from '@/stores/vendas/useVenda'
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

export async function openModalDeleteVenda(number: number) {
  store.idMutation = number
  store.openModalDelete = true
}
export async function deletarVenda(id: number) {
  if (!id) return toast.error('ID nao informado!')
  try {
    await VendaRepository.remove(id)
    toast.success('Registro deletado com sucesso')
    store.openModalDelete = false
    store.idMutation = null
    store.updateTable()
  } catch (error) {
    console.log(error)
    toast.error('Erro ao deletar o registro')
    store.openModalDelete = false
    store.idMutation = null
  }
}
