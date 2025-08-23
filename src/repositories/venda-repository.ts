import type { Vendas } from "@/types/schemas"
import http from "@/utils/axios"

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
