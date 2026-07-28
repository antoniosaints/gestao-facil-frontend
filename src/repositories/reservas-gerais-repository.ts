import axios from 'axios'
import http from '@/utils/axios'
import { randomUUID } from '@/utils/uuid'

export type ReservationStatus =
  | 'AGUARDANDO_PAGAMENTO'
  | 'CONFIRMADA'
  | 'CONCLUIDA'
  | 'CANCELADA'
  | 'EXPIRADA'

export type PaymentPolicy = 'NENHUM' | 'INTEGRAL' | 'SINAL_FIXO' | 'SINAL_PERCENTUAL'

export interface ReservationConfig {
  id: number
  contaId: number
  slug: string
  ativo: boolean
  timezone: string
  antecedenciaMinimaMinutos: number
  horizonteDias: number
  expiracaoPagamentoMinutos: number
  antecedenciaRemarcacaoHoras: number
  antecedenciaCancelamentoHoras: number
  titulo: string | null
  descricao: string | null
  bannerUrl: string | null
  corPrimaria: string
  corSecundaria: string
  termos: string | null
  termosVersao: number
  themeConfig: Record<string, unknown> | null
  secoes: string[] | null
  lancamentoAutomatico: boolean
  categoriaFinanceiraId: number | null
  contaFinanceiraId: number | null
  whatsappPendenteAtivo: boolean
  whatsappPendenteTemplate: string | null
  whatsappConfirmadaAtivo: boolean
  whatsappConfirmadaTemplate: string | null
  whatsappLembreteAtivo: boolean
  whatsappLembreteHoras: number
  whatsappLembreteTemplate: string | null
  whatsappPosVendaAtivo: boolean
  whatsappPosVendaHoras: number
  whatsappPosVendaTemplate: string | null
}

export interface ReservationResource {
  id: number
  nome: string
  descricao: string | null
  tipo: 'PROFISSIONAL' | 'SALA' | 'EQUIPAMENTO'
  ativo: boolean
  publico: boolean
  ordem: number
  Disponibilidades?: Array<{
    id: number
    diaSemana: number
    inicioMinuto: number
    fimMinuto: number
  }>
}

export interface ReservationService {
  id: number
  servicoId: number
  duracaoMinutos: number
  intervaloAntesMinutos: number
  intervaloDepoisMinutos: number
  politicaPagamento: PaymentPolicy
  valorSinal: number | null
  percentualSinal: number | null
  permitirQualquerRecurso: boolean
  ativo: boolean
  publico: boolean
  Servico: { id: number; nome: string; descricao: string | null; preco: number }
  Recursos: Array<{ recursoId: number; Recurso: ReservationResource }>
}

export interface ReservationBooking {
  id: number
  publicId: string
  recursoId: number
  nomeCliente: string
  telefoneCliente: string
  emailCliente: string | null
  servicoNome: string
  recursoNome: string
  inicio: string
  fim: string
  valorTotal: number
  valorPagamento: number
  valorPago: number
  status: ReservationStatus
  version: number
  observacoes: string | null
  Cliente?: { id: number; nome: string } | null
  Pagamentos?: Array<{
    id: number
    valor: number
    status: string
    linkPagamento: string | null
    pixCopiaCola: string | null
  }>
  Historico?: Array<{ id: number; evento: string; dados: Record<string, unknown> | null; createdAt: string }>
  Notificacoes?: Array<{ id: number; evento: string; status: string; agendadaPara: string; enviadaEm: string | null; erro: string | null }>
}

export interface AvailabilitySlot {
  startAt: string
  endAt: string
  resourceId: number
  resourceName: string
}

const publicHttp = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
})

export class ReservationsRepository {
  static async getConfig() {
    const { data } = await http.get('/reservas/config')
    return data.data as ReservationConfig
  }

  static async saveConfig(payload: Partial<ReservationConfig>) {
    const { data } = await http.put('/reservas/config', payload)
    return data.data as ReservationConfig
  }

  static async listResources() {
    const { data } = await http.get('/reservas/recursos')
    return data.data as ReservationResource[]
  }

  static async saveResource(payload: Partial<ReservationResource>) {
    const { data } = await http.request({
      method: payload.id ? 'PATCH' : 'POST',
      url: payload.id ? `/reservas/recursos/${payload.id}` : '/reservas/recursos',
      data: payload,
    })
    return data.data as ReservationResource
  }

  static async saveAvailability(
    resourceId: number,
    ranges: Array<{ weekday: number; startMinute: number; endMinute: number }>,
  ) {
    const { data } = await http.put(`/reservas/recursos/${resourceId}/disponibilidades`, {
      ranges,
    })
    return data.data
  }

  static async saveException(payload: {
    resourceId: number
    startAt: string
    endAt: string
    type: 'DISPONIVEL' | 'BLOQUEADO'
    reason?: string
  }) {
    const { data } = await http.post('/reservas/excecoes', payload)
    return data.data
  }

  static async listServices() {
    const { data } = await http.get('/reservas/servicos')
    return data.data as ReservationService[]
  }

  static async saveService(payload: {
    serviceId: number
    durationMinutes: number
    bufferBeforeMinutes?: number
    bufferAfterMinutes?: number
    paymentPolicy: PaymentPolicy
    fixedDeposit?: number | null
    percentageDeposit?: number | null
    active?: boolean
    public?: boolean
    allowAnyResource?: boolean
    resourceIds: number[]
  }) {
    const { data } = await http.put('/reservas/servicos', payload)
    return data.data as ReservationService
  }

  static async listBookings(params: Record<string, unknown> = {}) {
    const { data } = await http.get('/reservas', { params })
    return data as {
      items: ReservationBooking[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }
  }

  static async createBooking(payload: Record<string, unknown>) {
    const { data } = await http.post('/reservas', payload)
    return data.data as ReservationBooking
  }

  static async act(id: number, action: 'confirm' | 'complete' | 'cancel', reason?: string) {
    const { data } = await http.post(`/reservas/${id}/${action}`, { reason })
    return data.data as ReservationBooking
  }

  static async linkCustomer(id: number, clientId: number) {
    const { data } = await http.post(`/reservas/${id}/vincular-cliente`, { clientId })
    return data.data as ReservationBooking
  }

  static async recordPayment(id: number, amount: number, method: string) {
    const { data } = await http.post(
      `/reservas/${id}/pagamentos`,
      { amount, method },
      { headers: { 'Idempotency-Key': randomUUID() } },
    )
    return data.data
  }

  static async reschedule(id: number, startAt: string, resourceId: number | null, version: number) {
    const { data } = await http.post(`/reservas/${id}/remarcar`, { startAt, resourceId, version })
    return data.data as ReservationBooking
  }

  static async refund(id: number) {
    const { data } = await http.post(
      `/reservas/${id}/estorno`,
      {},
      { headers: { 'Idempotency-Key': randomUUID() } },
    )
    return data.data
  }

  static async availability(params: {
    serviceConfigId: number
    resourceId?: number | null
    dateFrom: string
    dateTo: string
  }) {
    const { data } = await http.get('/reservas/disponibilidade', { params })
    return data.data as AvailabilitySlot[]
  }

  static async getPublicStore(slug: string) {
    const { data } = await publicHttp.get(`/reservas/publica/${slug}`)
    return data.data
  }

  static async getPublicServices(slug: string) {
    const { data } = await publicHttp.get(`/reservas/publica/${slug}/servicos`)
    return data.data as ReservationService[]
  }

  static async publicAvailability(
    slug: string,
    params: {
      serviceConfigId: number
      resourceId?: number | null
      dateFrom: string
      dateTo: string
    },
  ) {
    const { data } = await publicHttp.get(`/reservas/publica/${slug}/disponibilidade`, {
      params,
    })
    return data.data as AvailabilitySlot[]
  }

  static async preview(slug: string, payload: Record<string, unknown>) {
    const { data } = await publicHttp.post(`/reservas/publica/${slug}/checkout/preview`, payload)
    return data.data
  }

  static async createPublic(slug: string, payload: Record<string, unknown>, key: string) {
    const { data } = await publicHttp.post(`/reservas/publica/${slug}/reservas`, payload, {
      headers: { 'Idempotency-Key': key },
    })
    return data.data
  }

  static async getPublicBooking(slug: string, publicId: string, token: string) {
    const { data } = await publicHttp.get(
      `/reservas/publica/${slug}/reservas/${publicId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return data.data
  }

  static async reschedulePublic(
    slug: string,
    publicId: string,
    token: string,
    payload: { startAt: string; resourceId?: number | null; version: number },
  ) {
    const { data } = await publicHttp.post(
      `/reservas/publica/${slug}/reservas/${publicId}/remarcar`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return data.data
  }

  static async cancelPublic(
    slug: string,
    publicId: string,
    token: string,
    version: number,
  ) {
    const { data } = await publicHttp.post(
      `/reservas/publica/${slug}/reservas/${publicId}/cancelar`,
      { version },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return data.data
  }

  static async retryPublicPayment(slug: string, publicId: string, token: string) {
    const { data } = await publicHttp.post(
      `/reservas/publica/${slug}/reservas/${publicId}/retry-payment`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': randomUUID(),
        },
      },
    )
    return data.data
  }
}
