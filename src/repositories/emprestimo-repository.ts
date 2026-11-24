import axios, { isAxiosError } from 'axios'
import http from '@/utils/axios'
import type { MetodoPagamentoFinanceiro } from '@/types/schemas'

export interface EmprestimoCriacao {
  chaveOperacao: string
  clienteId: number
  principalCentavos: number
  dataSaida: string
  primeiroVencimento: string
  jurosBps: number
  jurosMoraBps: number
  multaBps: number
  descontoFixoCentavos: number
  descontoJurosBps: number | null
  numeroParcelas: number
  formaSaida: MetodoPagamentoFinanceiro
  contaSaidaId: number | null
  contaEntradaId: number | null
  categoriaId: number | null
  lancamentoAutomatico: boolean
}

export interface EmprestimoConfig {
  pixManual: boolean
  mercadoPago: boolean
  descontoJurosBps: number
  pixDisponivel: boolean
  gatewayDisponivel: boolean
}

export type EmprestimoSituacao = 'EM_ANDAMENTO' | 'EM_ATRASO' | 'QUITADO' | 'COMPROVANTE_EM_ANALISE'

export interface EmprestimoResumo {
  id: number
  cliente: { id: number; nome: string }
  dataSaida: string
  principalCentavos: number
  totalCentavos: number
  recebidoCentavos: number
  parcelas: number
  pagas: number
  proximoVencimento: string | null
  comprovanteEmAnalise: boolean
  situacao?: EmprestimoSituacao
}

interface ParcelaRecebida {
  id: number
  numero: number
  vencimento: string
  recebidoEm: string | null
  recebidoCentavos: number | null
}

export interface ParcelaEmprestimo extends ParcelaRecebida {
  principalCentavos: number
  jurosCentavos: number
  descontoFixoCentavos: number
  cotacao: ItemPagamento | null
}

export interface ItemPagamento {
  id: number
  numero: number
  nominalCentavos: number
  descontoCentavos: number
  totalCentavos: number
  diasAtraso?: number
  descontoFixoCentavos?: number
  descontoAntecipacaoCentavos?: number
  multaCentavos?: number
  jurosMoraCentavos?: number
}

export interface CotacaoEmprestimo {
  itens: ItemPagamento[]
  totalCentavos: number
}

export interface PagamentoEmprestimo {
  id: string
  metodo: 'PIX_MANUAL' | 'MERCADO_PAGO' | 'INTERNO'
  status: 'PENDENTE' | 'EM_ANALISE' | 'PAGO' | 'CANCELADO'
  itens: ItemPagamento[]
  totalCentavos: number
  recebidoEm: string | null
  criadoEm: string
  comprovante: { enviadoEm: string } | null
  emprestimoAtivoId: number | null
  gatewaySituacao: string | null
  lancamentoId: number | null
}

export interface EmprestimoDetalhe {
  id: number
  cliente: { id: number; nome: string }
  dataSaida: string
  principalCentavos: number
  jurosBps: number
  jurosMoraBps: number
  multaBps: number
  descontoFixoCentavos: number
  descontoJurosBps: number
  formaSaida: MetodoPagamentoFinanceiro
  contaEntradaId: number | null
  contaSaidaId?: number | null
  categoriaId: number | null
  lancamentoAutomatico: boolean
  lancamentoSaidaId: number | null
  linkPublico: string
  dataCotacao?: string
  parcelas: ParcelaEmprestimo[]
  pagamentos: PagamentoEmprestimo[]
  situacao?: EmprestimoSituacao
}

export interface Baixa {
  recebidoEm: string
  lancarNoFinanceiro: boolean
  contaEntradaId: number | null
  categoriaId: number | null
}

type MetodoPublico = 'PIX_MANUAL' | 'MERCADO_PAGO'
export interface EmprestimoPublico {
  estabelecimento: string
  logoEmpresa?: string | null
  cliente?: {
    nome: string
    documento: { tipo: 'CPF' | 'CNPJ'; mascarado: string } | null
    emailMascarado: string | null
    telefoneMascarado: string | null
  } | null
  referencia?: string
  dataContratacao?: string
  principalCentavos: number
  jurosBps: number
  jurosMoraBps: number
  multaBps: number
  descontoFixoCentavos: number
  descontoJurosBps: number
  pixManual: boolean
  mercadoPago: boolean
  parcelas: (ParcelaRecebida & ItemPagamento)[]
  pagamento: {
    id: string
    metodo: MetodoPublico
    status: 'PENDENTE' | 'EM_ANALISE'
    itens: ItemPagamento[]
    totalCentavos: number
    pixCopiaCola: string | null
    pixQr: string | null
    expiraEm: string | null
    expirada: boolean
    comprovante: boolean
    podeConsultar: boolean
  } | null
}

type EscolhaPagamento =
  | { metodo: 'PIX_MANUAL'; parcelas: number[]; totalCentavos: number }
  | {
      metodo: 'MERCADO_PAGO'
      parcelas: number[]
      totalCentavos: number
      email: string
      documento: string
    }

const base = '/emprestimos'
const publicHttp = axios.create({ baseURL: import.meta.env.VITE_API_URL })
type Result<T> = { data: T }

export const emprestimos = {
  async criar(input: EmprestimoCriacao) {
    const { data } = await http.post<Result<{ id: number }>>(base, input)
    return data.data
  },
  async detalhe(id: number, signal?: AbortSignal) {
    const { data } = await http.get<Result<EmprestimoDetalhe>>(`${base}/${id}`, { signal })
    return data.data
  },
  async excluir(id: number) {
    await http.delete(`${base}/${id}`)
  },
  async config(input?: Pick<EmprestimoConfig, 'pixManual' | 'mercadoPago' | 'descontoJurosBps'>) {
    const url = `${base}/config`
    const { data } = input
      ? await http.put<Result<EmprestimoConfig>>(url, input)
      : await http.get<Result<EmprestimoConfig>>(url)
    return data.data
  },
  async baixar(
    id: number,
    input: Baixa & {
      chaveOperacao: string
      parcelas: number[]
      totalCentavos: number
      formaRecebimento: MetodoPagamentoFinanceiro
    },
  ) {
    await http.post(`${base}/${id}/baixas`, input)
  },
  async cotar(id: number, input: { recebidoEm: string; parcelas: number[] }) {
    const { data } = await http.post<Result<CotacaoEmprestimo>>(`${base}/${id}/cotacao`, input)
    return data.data
  },
  async aprovar(id: number, pagamento: string, input: Baixa) {
    await http.post(`${base}/${id}/pagamentos/${pagamento}/aprovar`, input)
  },
  async cancelarPix(id: number, pagamento: string) {
    await http.post(`${base}/${id}/pagamentos/${pagamento}/cancelar-pix`)
  },
  async consultarGateway(id: number, pagamento: string) {
    await http.post(`${base}/${id}/pagamentos/${pagamento}/consultar-gateway`)
  },
  async comprovante(id: number, pagamento: string) {
    const { data } = await http.get<Blob>(`${base}/${id}/pagamentos/${pagamento}/comprovante`, {
      responseType: 'blob',
    })
    return data
  },
}

export function emprestimoPublico(token: string) {
  const url = `${base}/publico/${token}`
  return {
    async carregar() {
      const { data } = await publicHttp.get<Result<EmprestimoPublico>>(url)
      return data.data
    },
    async pagar(input: EscolhaPagamento) {
      const { data } = await publicHttp.post<Result<EmprestimoPublico>>(`${url}/pagamento`, input)
      return data.data
    },
    async consultar(id: string, cancelar = false) {
      const action = cancelar ? 'cancelar-gateway' : 'consultar'
      const { data } = await publicHttp.post<Result<EmprestimoPublico>>(
        `${url}/pagamentos/${id}/${action}`,
      )
      return data.data
    },
    async enviarComprovante(id: string, arquivo: File) {
      const form = new FormData()
      form.append('comprovante', arquivo)
      const { data } = await publicHttp.post<Result<EmprestimoPublico>>(
        `${url}/pagamentos/${id}/comprovante`,
        form,
      )
      return data.data
    },
  }
}

export function mensagemEmprestimo(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? (error.response?.data?.message ?? fallback)
    : fallback
}

export function mensagemCotacaoEmprestimo(error: unknown) {
  const mensagem = mensagemEmprestimo(error, '')
  if (mensagem) return mensagem
  if (isAxiosError(error)) {
    if (!error.response) return 'Não foi possível conectar à API de empréstimos. Tente recalcular.'
    if (error.response.status === 404 || error.response.status === 405) {
      return 'A API em uso não tem a rota de cotação para esta data.'
    }
  }
  return 'Não foi possível calcular o valor. Tente recalcular.'
}

export function mensagemLinkPublico(error: unknown) {
  const mensagem = mensagemEmprestimo(error, '')
  if (mensagem) return mensagem
  if (isAxiosError(error) && error.response?.status === 404) {
    return 'O acompanhamento de empréstimos está indisponível neste endereço.'
  }
  return 'Não foi possível carregar o empréstimo. Tente atualizar a página.'
}
