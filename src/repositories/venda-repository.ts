import type { MetodoPagamento, Vendas } from '@/types/schemas'
import http from '@/utils/axios'

export interface VendaEfetivar {
  pagamento: MetodoPagamento
  dataPagamento: Date | string
  categoria: number
  conta: number | null
  lancamentoManual: boolean
}
export class VendaRepository {
  static async get(id: number) {
    const data = await http.get(`/vendas/${id}`)
    return data.data
  }

  static async remove(id: number) {
    await http.delete(`/vendas/${id}`)
  }

  static async update(data: Partial<Vendas>, id: number) {
    data.id = id
    await http.post(`/vendas`, data)
  }

  static async efetivar(id: number, data: VendaEfetivar) {
    const res = await http.post(`/vendas/efetivar/${id}`, data)
    return res.data
  }
  static async estornar(id: number) {
    await http.get(`/vendas/estornar/${id}`)
  }
  static async resumo(inicio?: string, fim?: string) {
    const query = inicio && fim ? `?inicio=${inicio}&fim=${fim}` : ''
    return await http.get(`/vendas/resumo/dashboard${query}`)
  }

  static async save(data: Omit<Vendas, 'id'>) {
    await http.post(`/vendas`, data)
  }

  static async getResumoMensal() {
    const { data } = await http.get(`/vendas/resumo/mensal`)
    return data
  }

  static async getCupomPDF(id: number) {
    const data = await http.get(`/vendas/cupom-pdf/${id}`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.download = `cupom_nf_${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}
