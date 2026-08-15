import http from '@/utils/axios'

export type OuriveCapability =
  | 'VISUALIZAR'
  | 'RECEBER'
  | 'ORCAMENTO'
  | 'PRODUCAO'
  | 'REVISAO'
  | 'ENTREGAR'
  | 'EQUIPE'
  | 'RELATORIOS'
  | 'CONFIGURAR'
  | 'FINANCEIRO'
export type OurivePapel = 'GESTOR' | 'ATENDIMENTO' | 'OURIVE' | 'REVISAO'
export interface OuriveAccess {
  papeis: OurivePapel[]
  capabilities: OuriveCapability[]
  usuarioId: number
}

export class OuriveRepository {
  static async acesso() {
    const { data } = await http.get('/v1/ourive/acesso')
    return data.data as OuriveAccess
  }
  static async painel(inicio?: string, fim?: string) {
    const { data } = await http.get('/v1/ourive/painel', {
      params: { inicio, fim },
      timeout: 15_000,
    })
    return data.data
  }
  static async ordens(page = 1) {
    const { data } = await http.get('/v1/ourive/ordens', { params: { page } })
    return data.data
  }
  static async ordem(id: number) {
    const { data } = await http.get(`/v1/ourive/ordens/${id}`)
    return data.data
  }
  static async criarOrdem(payload: unknown) {
    const { data } = await http.post('/v1/ourive/ordens', payload)
    return data.data
  }
  static async excluirOrdem(id: number) {
    const { data } = await http.delete(`/v1/ourive/ordens/${id}`)
    return data.data
  }
  static async salvarOrcamento(id: number, payload: unknown) {
    const { data } = await http.put(`/v1/ourive/ordens/${id}/orcamento`, payload)
    return data.data
  }
  static async enviarOrcamento(id: number) {
    const { data } = await http.post(`/v1/ourive/ordens/${id}/orcamento/enviar`)
    return data.data
  }
  static async iniciarProducao(id: number) {
    const { data } = await http.post(`/v1/ourive/ordens/${id}/producao/iniciar`)
    return data.data
  }
  static async entregar(id: number) {
    const { data } = await http.post(`/v1/ourive/ordens/${id}/entregar`)
    return data.data
  }
  static async cancelar(id: number, motivo: string) {
    const { data } = await http.post(`/v1/ourive/ordens/${id}/cancelar`, { motivo })
    return data.data
  }
  static async criarEtapa(id: number, payload: unknown) {
    const { data } = await http.post(`/v1/ourive/ordens/${id}/etapas`, payload)
    return data.data
  }
  static async atualizarEtapa(id: number, payload: unknown) {
    const { data } = await http.patch(`/v1/ourive/etapas/${id}`, payload)
    return data.data
  }
  static async devolverMaterial(id: number, quantidade: number) {
    const { data } = await http.post(`/v1/ourive/materiais/${id}/devolver`, { quantidade })
    return data.data
  }
  static async adicionarFoto(pecaId: number, payload: { url: string; descricao?: string }) {
    const { data } = await http.post(`/v1/ourive/pecas/${pecaId}/fotos`, payload)
    return data.data
  }
  static async excluirFoto(fotoId: number) {
    const { data } = await http.delete(`/v1/ourive/pecas/fotos/${fotoId}`)
    return data.data
  }
  static async adicionarCustoExtra(id: number, payload: { valor: number; descricao: string }) {
    const { data } = await http.post(`/v1/ourive/ordens/${id}/custos-extras`, payload)
    return data.data
  }
  static async quitarComissao(id: number) {
    const { data } = await http.post(`/v1/ourive/comissoes/${id}/quitar`)
    return data.data
  }
  static async equipe() {
    const { data } = await http.get('/v1/ourive/equipe')
    return data.data
  }
  static async salvarEquipe(usuarioId: number, payload: unknown) {
    const { data } = await http.put(`/v1/ourive/equipe/${usuarioId}`, payload)
    return data.data
  }
  static async especialidades() {
    const { data } = await http.get('/v1/ourive/especialidades')
    return data.data
  }
  static async salvarEspecialidade(payload: unknown) {
    const { data } = await http.post('/v1/ourive/especialidades', payload)
    return data.data
  }
  static async configuracao() {
    const { data } = await http.get('/v1/ourive/configuracao')
    return data.data
  }
  static async salvarConfiguracao(payload: unknown) {
    const { data } = await http.put('/v1/ourive/configuracao', payload)
    return data.data
  }
  static async comissoes() {
    const { data } = await http.get('/v1/ourive/comissoes')
    return data.data
  }
  static async relatorios(inicio?: string, fim?: string) {
    const { data } = await http.get('/v1/ourive/relatorios', { params: { inicio, fim } })
    return data.data
  }
}
