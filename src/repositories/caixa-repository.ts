import type { CaixaRelatorioResponse, CaixaSessao, PdvPonto } from '@/types/schemas'
import http from '@/utils/axios'

export interface AbrirCaixaPayload {
  pdvId?: number | null
  valorInicial: number
  observacao?: string
}

export interface MovimentarCaixaPayload {
  caixaId: number
  tipoMovimento: 'SANGRIA' | 'REFORCO' | 'ENTRADA' | 'SAIDA'
  categoria?: 'AJUSTE' | 'DEVOLUCAO' | 'REFORCO' | 'SANGRIA' | 'OUTROS'
  descricao?: string
  valor: number
}

export interface FecharCaixaPayload {
  caixaId: number
  valorFechamento: number
  descricao?: string
}

export interface CaixaContextoResponse {
  caixaAtivo: CaixaSessao | null
  caixasAbertos: CaixaSessao[]
  pdvs: PdvPonto[]
}

export interface CaixaRelatorioParams {
  inicio?: string
  fim?: string
  caixaId?: number | string | null
  usuarioId?: number | string | null
  status?: 'ABERTO' | 'FECHADO' | 'CANCELADO' | null
}

function downloadBlob(data: BlobPart, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data])
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

function getFilenameFromDisposition(disposition?: string) {
  const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
  return filename || null
}

export class CaixaRepository {
  static async contexto() {
    const { data } = await http.get('/vendas/pdv/contexto')
    return data.data as CaixaContextoResponse
  }

  static async abrirCaixa(payload: AbrirCaixaPayload) {
    const { data } = await http.post('/vendas/pdv/abrirCaixa', payload)
    return data.data as CaixaSessao
  }

  static async entrarCaixa(payload: { caixaId: number }) {
    const { data } = await http.post('/vendas/pdv/entrarCaixa', payload)
    return data.data as CaixaSessao
  }

  static async movimentarCaixa(payload: MovimentarCaixaPayload) {
    const { data } = await http.post('/vendas/pdv/movimentarCaixa', payload)
    return data.data as CaixaSessao
  }

  static async fecharCaixa(payload: FecharCaixaPayload) {
    const { data } = await http.put('/vendas/pdv/fecharCaixa', payload)
    return data.data as CaixaSessao
  }

  static async criarPdv(payload: { nome: string; localizacao?: string; descricao?: string }) {
    const { data } = await http.post('/vendas/pdv/criarPdv', payload)
    return data.data as PdvPonto
  }

  static async buscarPdv(id?: number) {
    const { data } = await http.get('/vendas/pdv/buscarPdv', {
      params: id ? { id } : {},
    })
    return data.data as PdvPonto | PdvPonto[]
  }

  static async buscarCaixa(params?: { id?: number }) {
    const { data } = await http.get('/vendas/pdv/buscarCaixa', {
      params,
    })
    return data.data as CaixaSessao | CaixaSessao[]
  }

  static async resumoCaixa(id: number) {
    const { data } = await http.get('/vendas/pdv/resumoCaixa', {
      params: { id },
    })
    return data.data
  }

  static async relatorio(params: CaixaRelatorioParams = {}) {
    const { data } = await http.get('/vendas/pdv/relatorio', {
      params: {
        ...(params.inicio ? { inicio: params.inicio } : {}),
        ...(params.fim ? { fim: params.fim } : {}),
        ...(params.caixaId ? { caixaId: params.caixaId } : {}),
        ...(params.usuarioId ? { usuarioId: params.usuarioId } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
    })
    return data.data as CaixaRelatorioResponse
  }

  static async exportarPdf(caixaId: number) {
    const response = await http.get(`/vendas/pdv/caixa/${caixaId}/pdf`, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    const filename =
      getFilenameFromDisposition(response.headers['content-disposition']) ||
      `caixa-${caixaId}.pdf`

    downloadBlob(response.data, filename)
  }

  static async deletarCaixa(caixaId: number) {
    const { data } = await http.delete(`/vendas/pdv/caixa/${caixaId}`)
    return data.data as CaixaSessao
  }
}
