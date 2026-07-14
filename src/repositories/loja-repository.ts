import axios from 'axios'
import http from '@/utils/axios'

export type LojaHeaderEstilo = 'padrao' | 'centralizado' | 'banner'
export type LojaTemplate = 'ESSENCIAL' | 'EDITORIAL' | 'IMPACTO'
export type LojaGateway = 'MERCADOPAGO' | 'ABACATEPAY'

export interface LojaConfig {
  id?: number
  contaId?: number
  slug: string
  template: LojaTemplate
  themeVersion: number
  themeConfig: Record<string, string | number | boolean> | null
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
  theme: Record<string, string | number | boolean>
  colors: { primary: string; secondary: string }
  headerStyle: LojaHeaderEstilo
  banner: { desktopUrl: string | null; mobileUrl: string | null; title: string | null; subtitle: string | null }
  welcomeMessage: string | null
  announcement: { enabled: boolean; text: string | null }
  capabilities: Record<'showPrices' | 'showAvailability' | 'hideSoldOut' | 'quickAdd' | 'whatsapp' | 'onlinePayment' | 'login' | 'register' | 'guestCheckout' | 'pickup' | 'localDelivery', boolean>
  delivery: { fixedFee: number; freeAbove: number | null }
}

export interface StoreProduct {
  id: number
  baseId: number | null
  name: string
  description: string | null
  variant: string
  category: string | null
  price: number
  image: string | null
  unit: string | null
  sku: string | null
  controlsStock: boolean
  available: number | null
}

export type CheckoutPayload = {
  items: Array<{ productId: number; quantity: number }>
  channel: 'WHATSAPP' | 'GATEWAY'
  deliveryType: 'RETIRADA' | 'ENTREGA_LOCAL'
  customer: { name: string; email?: string; phone: string; postalCode?: string; address?: string; number?: string; complement?: string; district?: string; city?: string; state?: string }
  notes?: string
}

const publicHttp = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })

export class LojaRepository {
  static async getConfig() { const { data } = await http.get('/loja/config'); return data.data as LojaConfig }
  static async saveConfig(payload: LojaConfigPayload) { const { data } = await http.put('/loja/config', payload); return data.data as LojaConfig }
  static async uploadBanner(file: File, type: 'desktop' | 'mobile' = 'desktop') {
    const form = new FormData(); form.append('file', file)
    const { data } = await http.post('/loja/config/banner', form, { params: { tipo: type }, headers: { 'Content-Type': 'multipart/form-data' } })
    return data.data as { bannerUrl: string; bannerPublicUrl: string }
  }
  static async removeBanner(type: 'desktop' | 'mobile' = 'desktop') { await http.delete('/loja/config/banner', { params: { tipo: type } }) }
  static async listOrders(params: Record<string, unknown>) { const { data } = await http.get('/loja/pedidos', { params }); return data }
  static async getOrder(id: number) { const { data } = await http.get(`/loja/pedidos/${id}`); return data.data }
  static async actOnOrder(id: number, action: 'confirmar' | 'preparar' | 'despachar' | 'cancelar' | 'concluir') { const { data } = await http.post(`/loja/pedidos/${id}/${action}`, undefined, { headers: { 'Idempotency-Key': crypto.randomUUID() } }); return data.data }

  static async getPublicStore(slug: string) { const { data } = await publicHttp.get(`/loja/publica/${slug}`); return data.data as PublicStore }
  static async getPublicProducts(slug: string, params?: Record<string, unknown>) { const { data } = await publicHttp.get(`/loja/publica/${slug}/produtos`, { params }); return data.data as { data: StoreProduct[]; nextCursor: number | null } }
  static async preview(slug: string, payload: CheckoutPayload) { const { data } = await publicHttp.post(`/loja/publica/${slug}/checkout/preview`, payload); return data.data }
  static async placeOrder(slug: string, payload: CheckoutPayload, key: string, accessToken?: string) {
    const { data } = await publicHttp.post(`/loja/publica/${slug}/pedidos`, payload, { headers: { 'Idempotency-Key': key, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) } })
    return data.data
  }
  static async customerAuth(slug: string, action: string, payload?: unknown) { const { data } = await publicHttp.post(`/loja/publica/${slug}/auth/${action}`, payload); return data.data }
  static async customerMe(slug: string, token: string) { const { data } = await publicHttp.get(`/loja/publica/${slug}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }); return data.data }
  static async saveCustomerAddress(slug: string, token: string, payload: unknown, id?: number) { const { data } = await publicHttp.request({ method: id ? 'PUT' : 'POST', url: `/loja/publica/${slug}/auth/addresses${id ? `/${id}` : ''}`, data: payload, headers: { Authorization: `Bearer ${token}` } }); return data.data }
  static async removeCustomerAddress(slug: string, token: string, id: number) { await publicHttp.delete(`/loja/publica/${slug}/auth/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } }) }
}
