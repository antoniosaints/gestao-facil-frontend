import axios from 'axios'
import http from '@/utils/axios'
import { randomUUID } from '@/utils/uuid'

export type LojaHeaderEstilo = 'padrao' | 'centralizado' | 'banner'
export type LojaTemplate = 'ESSENCIAL' | 'EDITORIAL' | 'IMPACTO'
export type LojaGateway = 'MERCADOPAGO' | 'ABACATEPAY'

export interface LojaCompanyInfo {
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  cnpj?: string | null
  instagram?: string | null
  facebook?: string | null
  hours?: string | null
  about?: string | null
}

export interface LojaThemeConfig {
  font?: string
  radius?: string
  gridDensity?: string
  cardStyle?: string
  bannerHeight?: string
  bannerOverlay?: number
  bannerFocalPoint?: string
  bgColor?: string | null
  headerColor?: string | null
  footerColor?: string | null
  promoColor?: string | null
  sectionIconColor?: string | null
  headerTitle?: string | null
  headerSubtitle?: string | null
  logoUrl?: string | null
  banners?: string[]
  company?: LojaCompanyInfo | null
  // Liga/desliga as seções automáticas da loja (default: todas ativas).
  secoesAutomaticas?: { promocoes?: boolean; maisVendidos?: boolean; novidades?: boolean } | null
  [key: string]: unknown
}

/** Seção manual da loja no admin, com os produtos base escolhidos. */
export interface LojaSecaoAdmin {
  id: number
  nome: string
  ordem: number
  ativo: boolean
  produtos: { produtoBaseId: number; nome: string; imagem: string | null }[]
}

export interface LojaConfig {
  id?: number
  contaId?: number
  slug: string
  template: LojaTemplate
  themeVersion: number
  themeConfig: LojaThemeConfig | null
  corPrimaria: string
  corSecundaria: string
  headerEstilo: LojaHeaderEstilo
  bannerUrl: string | null
  bannerMobileUrl: string | null
  bannerTitulo: string | null
  bannerSubtitulo: string | null
  mensagemBoasVindas: string | null
  mostrarPrecos: boolean
  mostrarDisponibilidade: boolean
  ocultarEsgotados: boolean
  quickAdd: boolean
  pedidoWhatsapp: boolean
  pagamentoOnline: boolean
  gatewayPreferido: LojaGateway | null
  permitirLogin: boolean
  permitirCadastro: boolean
  permitirCheckoutVisitante: boolean
  retiradaAtiva: boolean
  entregaLocalAtiva: boolean
  taxaEntrega: number
  freteGratisAcima: number | null
  barraAvisoAtiva: boolean
  barraAvisoTexto: string | null
}

export type LojaConfigPayload = Partial<Omit<LojaConfig, 'id' | 'contaId' | 'bannerUrl' | 'bannerMobileUrl'>>

export interface PublicStore {
  identity: { name: string; logo: string | null }
  slug: string
  mode: 'CATALOGO' | 'LOJA'
  template: LojaTemplate
  themeVersion: number
  theme: LojaThemeConfig
  colors: { primary: string; secondary: string }
  headerStyle: LojaHeaderEstilo
  banner: { desktopUrl: string | null; mobileUrl: string | null; title: string | null; subtitle: string | null }
  welcomeMessage: string | null
  announcement: { enabled: boolean; text: string | null }
  capabilities: Record<'showPrices' | 'showAvailability' | 'hideSoldOut' | 'quickAdd' | 'whatsapp' | 'onlinePayment' | 'login' | 'register' | 'guestCheckout' | 'pickup' | 'localDelivery', boolean>
  delivery: { fixedFee: number; freeAbove: number | null }
  // Seções manuais ativas (com os ids dos produtos base) e flags das automáticas.
  sections: { id: number; nome: string; baseIds: number[] }[]
  automaticSections: { promocoes: boolean; maisVendidos: boolean; novidades: boolean }
}

export interface StoreProduct {
  id: number
  baseId: number | null
  name: string
  description: string | null
  variant: string
  category: string | null
  /** Preço efetivo (promocional quando há promoção ativa). */
  price: number
  /** Preço "de" (cheio) quando o produto está em promoção; `null` sem promoção. */
  priceOriginal: number | null
  image: string | null
  unit: string | null
  sku: string | null
  controlsStock: boolean
  available: number | null
  /** Total de unidades vendidas — alimenta a seção "Mais vendidos". */
  soldCount: number
}

export interface StoreCustomerAddress {
  id: number
  destinatario: string
  cep: string
  endereco: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  principal: boolean
}

export interface StoreCustomerAccount {
  id: number
  nome: string
  email: string
  telefone: string | null
  enderecos: StoreCustomerAddress[]
  pedidos?: unknown[]
}

export type CheckoutPayload = {
  items: Array<{ productId: number; quantity: number }>
  channel: 'WHATSAPP' | 'GATEWAY'
  deliveryType: 'RETIRADA' | 'ENTREGA_LOCAL'
  customer: { name: string; email?: string; phone: string; postalCode?: string; address?: string; number?: string; complement?: string; district?: string; city?: string; state?: string }
  notes?: string
}

const publicHttp = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })

export interface ResumoLoja {
  periodo: { inicio: string; fim: string }
  pedidos: number
  pedidosFaturados: number
  faturamento: number
  ticketMedio: number
  // Pedidos aguardando ação da operação — estado atual, não recorte do período.
  emAberto: number
  cancelados: number
}

export class LojaRepository {
  // Resumo da loja para a dashboard. Payload cru, sem envelope `data`.
  static async getResumo(inicio?: string, fim?: string) {
    const { data } = await http.get('/loja/resumo', {
      params: { ...(inicio ? { inicio } : {}), ...(fim ? { fim } : {}) },
    })
    return data as ResumoLoja
  }

  static async getConfig() { const { data } = await http.get('/loja/config'); return data.data as LojaConfig }
  static async saveConfig(payload: LojaConfigPayload) { const { data } = await http.put('/loja/config', payload); return data.data as LojaConfig }
  static async uploadBanner(file: File, type: 'desktop' | 'mobile' = 'desktop') {
    const form = new FormData(); form.append('file', file)
    const { data } = await http.post('/loja/config/banner', form, { params: { tipo: type }, headers: { 'Content-Type': 'multipart/form-data' } })
    return data.data as { bannerUrl: string; bannerPublicUrl: string }
  }
  static async removeBanner(type: 'desktop' | 'mobile' = 'desktop') { await http.delete('/loja/config/banner', { params: { tipo: type } }) }
  static async uploadImage(file: File, tipo: 'logo' | 'galeria') {
    const form = new FormData(); form.append('file', file)
    const { data } = await http.post('/loja/config/banner', form, { params: { tipo }, headers: { 'Content-Type': 'multipart/form-data' } })
    return data.data as { reference: string; url: string }
  }
  // Seções manuais da loja (admin)
  static async listSecoes() { const { data } = await http.get('/loja/secoes'); return data.data as LojaSecaoAdmin[] }
  static async createSecao(nome: string) { const { data } = await http.post('/loja/secoes', { nome }); return data.data as LojaSecaoAdmin }
  static async updateSecao(id: number, payload: { nome?: string; ativo?: boolean; ordem?: number }) { const { data } = await http.patch(`/loja/secoes/${id}`, payload); return data.data as LojaSecaoAdmin }
  static async deleteSecao(id: number) { await http.delete(`/loja/secoes/${id}`) }
  static async addProdutoSecao(id: number, produtoBaseId: number) { const { data } = await http.post(`/loja/secoes/${id}/produtos`, { produtoBaseId }); return data.data as LojaSecaoAdmin }
  static async removeProdutoSecao(id: number, produtoBaseId: number) { const { data } = await http.delete(`/loja/secoes/${id}/produtos/${produtoBaseId}`); return data.data as LojaSecaoAdmin }

  static async listOrders(params: Record<string, unknown>) { const { data } = await http.get('/loja/pedidos', { params }); return data }
  static async getOrder(id: number) { const { data } = await http.get(`/loja/pedidos/${id}`); return data.data }
  static async actOnOrder(id: number, action: 'confirmar' | 'preparar' | 'despachar' | 'cancelar' | 'concluir') { const { data } = await http.post(`/loja/pedidos/${id}/${action}`, undefined, { headers: { 'Idempotency-Key': randomUUID() } }); return data.data }
  static async deleteOrder(id: number) { const { data } = await http.delete(`/loja/pedidos/${id}`); return data.data }

  static async getPublicStore(slug: string) { const { data } = await publicHttp.get(`/loja/publica/${slug}`); return data.data as PublicStore }
  static async getPublicProducts(slug: string, params?: Record<string, unknown>) { const { data } = await publicHttp.get(`/loja/publica/${slug}/produtos`, { params }); return data.data as { data: StoreProduct[]; nextCursor: number | null } }
  static async preview(slug: string, payload: CheckoutPayload) { const { data } = await publicHttp.post(`/loja/publica/${slug}/checkout/preview`, payload); return data.data }
  static async placeOrder(slug: string, payload: CheckoutPayload, key: string, accessToken?: string) {
    const { data } = await publicHttp.post(`/loja/publica/${slug}/pedidos`, payload, { headers: { 'Idempotency-Key': key, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) } })
    return data.data
  }
  static async customerAuth(slug: string, action: string, payload?: unknown) { const { data } = await publicHttp.post(`/loja/publica/${slug}/auth/${action}`, payload); return data.data }
  static async customerMe(slug: string, token: string) { const { data } = await publicHttp.get(`/loja/publica/${slug}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }); return data.data as StoreCustomerAccount }
  static async saveCustomerAddress(slug: string, token: string, payload: unknown, id?: number) { const { data } = await publicHttp.request({ method: id ? 'PUT' : 'POST', url: `/loja/publica/${slug}/auth/addresses${id ? `/${id}` : ''}`, data: payload, headers: { Authorization: `Bearer ${token}` } }); return data.data }
  static async removeCustomerAddress(slug: string, token: string, id: number) { await publicHttp.delete(`/loja/publica/${slug}/auth/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } }) }
}
