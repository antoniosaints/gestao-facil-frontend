import http from '@/utils/axios'

export type ComboComponentType = 'PRODUTO' | 'SERVICO'

export interface ComboComponent {
  id: number
  tipo: ComboComponentType
  quantidade: number
  produtoId?: number | null
  servicoId?: number | null
  Produto?: { id: number; nome: string; nomeVariante?: string | null; estoque: number; controlaEstoque?: boolean | null } | null
  Servico?: { id: number; nome: string; status: boolean } | null
}

export interface Combo {
  id: number
  Uid: string
  nome: string
  imagem?: string | null
  descricao?: string | null
  preco: number | string
  ativo: boolean
  mostrarNoPdv: boolean
  mostrarOnline: boolean
  componentes: ComboComponent[]
  createdAt: string
  updatedAt: string
}

export interface ComboPayload {
  nome: string
  descricao?: string | null
  imagem?: string | null
  preco: number | string
  ativo: boolean
  mostrarNoPdv: boolean
  mostrarOnline: boolean
  componentes: Array<{ tipo: ComboComponentType; id: number; quantidade: number }>
}

export interface ComboOption {
  id: number
  label: string
  nome: string
  imagem?: string | null
  preco: number
  tipo: 'COMBO'
  disponivel: boolean
  quantidadeDisponivel: number | null
  motivoIndisponivel: string | null
  componentes: Array<{ tipo: ComboComponentType; id: number; nome: string; quantidade: number }>
}

export class ComboRepository {
  static async list(params: { search?: string; page?: number; limit?: number; ativo?: boolean } = {}) {
    const { data } = await http.get('/combos', { params })
    return data.data as { items: Combo[]; total: number; page: number; limit: number; totalPages: number }
  }

  static async get(id: number) {
    const { data } = await http.get(`/combos/${id}`)
    return data.data as Combo
  }

  static async save(payload: ComboPayload, id?: number) {
    const { data } = id
      ? await http.patch(`/combos/${id}`, payload)
      : await http.post('/combos', payload)
    return data.data as Combo
  }

  static async remove(id: number) {
    await http.delete(`/combos/${id}`)
  }

  static async uploadImagem(id: number, file: File) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await http.post(`/combos/${id}/imagem`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data?.data as { id: number; imagem: string; imagemUrl: string }
  }

  static async removeImagem(id: number) {
    await http.delete(`/combos/${id}/imagem`)
  }

  static async persistImagem(id: number, change: { file?: File | null; remove?: boolean }) {
    if (change.file) return this.uploadImagem(id, change.file)
    if (change.remove) await this.removeImagem(id)
    return null
  }

  static async options(canal: 'PDV' | 'VENDA' | 'OS' | 'COMANDA', search?: string) {
    const { data } = await http.get('/combos/opcoes', { params: { canal, search } })
    return data.results as ComboOption[]
  }
}
