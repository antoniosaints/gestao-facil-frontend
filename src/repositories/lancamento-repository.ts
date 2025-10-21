import type {
  CategoriaFinanceiro,
  ContasFinanceiro,
  FormularioLancamento,
  MetodoPagamento,
  MetodoPagamentoFinanceiro,
} from '@/types/schemas'
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
  static async pagarParcela(
    idParcela: number,
    data: {
      dataPagamento: string
      metodoPagamento: MetodoPagamentoFinanceiro
    },
  ) {
    await http.post(`/lancamentos/parcelas/${idParcela}/pagar`, data)
  }
  static async pagarMultiplasParcelas(parcelas: number[]) {
    await http.post(`/lancamentos/parcelas/pagar-multiplas`, { parcelas })
  }
  static async estornarParcela(id: number) {
    await http.post(`/lancamentos/parcelas/${id}/estornar`)
  }
  static async resumoTotal() {
    const data = await http.get(`/lancamentos/relatorios/totais`)
    return data.data
  }
  static async resumoStatusTotal() {
    const data = await http.get(`/lancamentos/relatorios/valor-status`)
    return data.data
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
  static async gerarDRE(inicio: string, fim: string) {
    await http.get(`/lancamentos/relatorios/dre`, {
      responseType: 'blob',
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
  }
  static async getLancamentosMensais(month: string) {
    const data = await http.get(`/lancamentos/lancamentosMes`, {
      params: {
        mes: month,
      },
    })
    return data.data
  }
  static async gerarDREPDF(inicio: string, fim: string) {
    const data = await http.get(`/lancamentos/relatorios/dre-pdf`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
      params: {
        inicio: inicio,
        fim: fim,
      },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.download = `lancamentos_dre_${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  static async gerarDREPDF2(inicio: string, fim: string) {
    const data = await http.get(`/lancamentos/relatorios/dre-pdf-2`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
      params: {
        inicio: inicio,
        fim: fim,
      },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.download = `lancamentos_dre_${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  static async graficoCategorias(inicio: Date | string, fim: Date | string) {
    const data = await http.get(`/lancamentos/graficos/categorias`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data.data
  }
  static async graficoContas(inicio: Date | string, fim: Date | string) {
    const data = await http.get(`/lancamentos/graficos/contas`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data.data
  }
  static async graficoStatus(inicio: Date | string, fim: Date | string) {
    const data = await http.get(`/lancamentos/graficos/status`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data.data
  }
  static async graficoBalanco() {
    const data = await http.get(`/lancamentos/graficos/receita-despesa-mensal`)
    return data.data
  }
  static async cancelarCobranca(id: number | string) {
    const data = await http.post(`/lancamentos/cobrancas/cancelar`, {
      cobrancaId: id,
    })
    return data.data
  }
  static async deletarCobranca(id: number) {
    const data = await http.delete(`/lancamentos/cobrancas/deletar/${id}`)
    return data.data
  }
  static async gerarCobranca(
    type: 'BOLETO' | 'LINK' | 'PIX',
    value: number,
    gateway: 'mercadopago' | 'pagseguro' | 'asaas',
    clienteId?: number | null,
  ) {
    const data = await http.post(`/lancamentos/cobrancas/cobrar`, {
      type,
      value,
      gateway,
      clienteId,
    })
    return data.data
  }
}
