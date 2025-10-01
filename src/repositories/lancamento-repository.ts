import type { CategoriaFinanceiro, ContasFinanceiro, FormularioLancamento } from '@/types/schemas'
import http from '@/utils/axios'
export class LancamentosRepository {
  static async get(id: number) {
    const data = await http.get(`/lancamentos/${id}`)
    return data.data
  }
  static async remove(id: number) {
    await http.delete(`/lancamentos/${id}`)
  }
  static async save(data: Omit<FormularioLancamento, 'id'>) {
    await http.post(`/lancamentos`, data)
  }
  static async reciboParcela(idParcela: number) {
    const recibo = await http.post(`/lancamentos/parcelas/${idParcela}/recibo`)
    return recibo
  }
  static async pagarParcela(idParcela: number) {
    await http.post(`/lancamentos/parcelas/${idParcela}/pagar`)
  }
  static async pagarMultiplasParcelas(parcelas: number[]) {
    await http.post(`/lancamentos/parcelas/pagar-multiplas`, { parcelas })
  }
  static async estornarParcela(id: number) {
    await http.post(`/lancamentos/parcelas/${id}/estornar`)
  }
  static async criarConta(data: Omit<ContasFinanceiro, 'id'>) {
    await http.post(`/lancamentos/contas`, data)
  }
  static async deletarConta(id: number) {
    await http.delete(`/lancamentos/contas/${id}`)
  }
  static async criarCategoria(data: Omit<CategoriaFinanceiro, 'id'>) {
    await http.post(`/lancamentos/categorias`, data)
  }
  static async deletarCategoria(id: number) {
    await http.delete(`/lancamentos/contas/${id}`)
  }
  static async getSaldoMensal() {
    const data = await http.get(`/lancamentos/graficos/saldo-mensal`)
    return data.data
  }
  static async gerarDRE(inicio: Date, fim: Date) {
    await http.get(`/lancamentos/relatorios/dre`, {
      params: {
        inicio: inicio.toDateString,
        fim: fim.toDateString,
      },
    })
  }
  static async gerarDREPDF(inicio: Date, fim: Date) {
    await http.get(`/lancamentos/relatorios/dre-pdf`, {
      params: {
        inicio: inicio.toDateString,
        fim: fim.toDateString,
      },
    })
  }
  static async gerarDREPDF2(inicio: Date, fim: Date) {
    await http.get(`/lancamentos/relatorios/dre-pdf-2`, {
      params: {
        inicio: inicio.toDateString,
        fim: fim.toDateString,
      },
    })
  }
}
