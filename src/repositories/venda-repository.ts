import type { MetodoPagamento, Vendas } from '@/types/schemas'
import http from '@/utils/axios'
import qzTray from '@/utils/qzTray'
import {
  CaixaRepository,
  type AbrirCaixaPayload,
  type FecharCaixaPayload,
  type MovimentarCaixaPayload,
} from './caixa-repository'

export interface VendaEfetivar {
  pagamento: MetodoPagamento
  dataPagamento: Date | string
  categoria: number | null
  conta: number | null
  lancamentoManual: boolean
  cancelarCobrancaExterna?: boolean
}

export interface FinalizarVendaPdvPayload {
  caixaId: number
  clienteId?: number | null
  data: string
  desconto: number
  pagamento: MetodoPagamento | string
  valorRecebido?: number | string | null
  crediarioParcelas?: number | null
  crediarioPrimeiroVencimento?: string | null
  itens: Array<{
    id: number
    nome?: string
    quantidade: number
    preco: number
    tipo: 'PRODUTO' | 'SERVICO'
  }>
}

export class VendaRepository {
  static async gerarRelatorioPDF(inicio: string, fim: string) {
    const data = await http.get(`/vendas/relatorios/resumo-pdf`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
      params: {
        inicio,
        fim,
      },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.download = `relatorio-vendas_${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  static async get(id: number) {
    const data = await http.get(`/vendas/${id}`)
    return data.data
  }

  static async remove(id: number) {
    const { data } = await http.delete(`/vendas/${id}`)
    return data
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

  static async painel(inicio?: string, fim?: string) {
    const { data } = await http.get(`/vendas/resumo/painel`, {
      params: {
        ...(inicio ? { inicio } : {}),
        ...(fim ? { fim } : {}),
      },
    })
    return data
  }

  static async save(data: Omit<Vendas, 'id'>) {
    await http.post(`/vendas`, data)
  }

  static async getResumoMensal(inicio?: string, fim?: string) {
    const { data } = await http.get(`/vendas/resumo/mensal`, {
      params: {
        ...(inicio ? { inicio } : {}),
        ...(fim ? { fim } : {}),
      },
    })
    return data
  }
  static async getFaturamentoMensal(ano?: number) {
    const { data } = await http.get(`/vendas/graficos/faturamento-mensal`, {
      params: {
        ano: ano,
      },
    })
    return data
  }
  static async getFaturamentoDiario(inicio?: string, fim?: string) {
    const { data } = await http.get(`/vendas/graficos/faturamento-diario`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data
  }
  static async getMetodoPagamento(inicio?: string, fim?: string) {
    const { data } = await http.get(`/vendas/graficos/metodo-pagamento`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data
  }
  static async getStatusVenda(inicio?: string, fim?: string) {
    const { data } = await http.get(`/vendas/graficos/status-venda`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
    return data
  }
  static async getTopProdutos(inicio?: string, fim?: string) {
    const { data } = await http.get(`/vendas/graficos/top-produtos`, {
      params: {
        inicio: inicio,
        fim: fim,
      },
    })
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
  static async printCupomPDF(id: number) {
    const data = await http.get(`/vendas/cupom-pdf/${id}`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
    })
    await qzTray.printPDF(data.data)
  }
  static async printCupom(id: number) {
    const data = await http.get(`/vendas/cupom/${id}`, {
      headers: { 'Content-Type': 'application/text' },
      params: { cols: qzTray.getCupomCols() },
    })
    await qzTray.printTermal(data.data)
  }

  static async finalizarVendaPdv(data: FinalizarVendaPdvPayload) {
    const resp = await http.post(`/vendas/pdv/finalizarVenda`, data)
    return resp.data.data
  }

  static async abrirCaixa(data: AbrirCaixaPayload) {
    return CaixaRepository.abrirCaixa(data)
  }
  static async movimentarCaixa(data: MovimentarCaixaPayload) {
    return CaixaRepository.movimentarCaixa(data)
  }
  static async fecharCaixa(data: FecharCaixaPayload) {
    return CaixaRepository.fecharCaixa(data)
  }
  static async criarPdv(data: { nome: string; localizacao: string; descricao: string }) {
    return CaixaRepository.criarPdv(data)
  }
  static async buscarPdv(id?: number) {
    return CaixaRepository.buscarPdv(id)
  }
  static async buscarCaixa(id?: number) {
    return CaixaRepository.buscarCaixa(id ? { id } : undefined)
  }
  static async resumoCaixa(id: number) {
    return CaixaRepository.resumoCaixa(id)
  }
}
