export type Status = 'ATIVO' | 'INATIVO' | 'BLOQUEADO'

export enum StatusFatura {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  ATRASADO = 'ATRASADO',
  CANCELADO = 'CANCELADO',
}

export enum GatewayConta {
  mercadopago = 'mercadopago',
  asaass = 'asaass',
}

export type PermissaoUsuario = 'root' | 'admin' | 'gerente' | 'vendedor' | 'tecnico' | 'usuario'

export type TipoCliente = 'FORNECEDOR' | 'CLIENTE'

export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  DESCARTE = 'DESCARTE',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

export enum StatusMovimentacao {
  PENDENTE = 'PENDENTE',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

export enum StatusOrdemServico {
  ABERTA = 'ABERTA',
  ORCAMENTO = 'ORCAMENTO',
  APROVADA = 'APROVADA',
  ANDAMENTO = 'ANDAMENTO',
  FATURADA = 'FATURADA',
  CANCELADA = 'CANCELADA',
}

export enum TipoItemOrdemServico {
  SERVICO = 'SERVICO',
  PRODUTO = 'PRODUTO',
}

export enum AssinaturaInternaStatus {
  ATIVA = 'ATIVA',
  CANCELADA = 'CANCELADA',
  SUSPENSA = 'SUSPENSA',
}

export enum AssinaturaInternaRecorrencia {
  MENSAL = 'MENSAL',
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  ANUAL = 'ANUAL',
}

export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  EFETIVADO = 'EFETIVADO',
  ESTORNADO = 'ESTORNADO',
  CANCELADO = 'CANCELADO',
}

export enum MetodoPagamento {
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
  CARTAO = 'CARTAO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CHEQUE = 'CHEQUE',
  CREDITO = 'CREDITO',
  DEBITO = 'DEBITO',
  GATEWAY = 'GATEWAY',
  OUTRO = 'OUTRO',
}

export type MetodoPagamentoFinanceiro =
  | 'DINHEIRO'
  | 'DEBITO'
  | 'CREDITO'
  | 'BOLETO'
  | 'PIX'
  | 'TRANSFERENCIA'
  | 'CHEQUE'
  | 'GATEWAY'
  | 'OUTRO'

export enum TipoLancamentoFinanceiro {
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA',
}

export enum StatusPagamentoFinanceiro {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  ATRASADO = 'ATRASADO',
  PARCIAL = 'PARCIAL',
}

// Interfaces
export interface Subscription {
  id: number
  userId: number
  endpoint: string
  p256dh: string
  auth: string
}

export interface FaturasContas {
  id?: number
  Uid: string
  asaasPaymentId: string
  vencimento: Date
  valor: number
  urlPagamento: string
  status: StatusFatura
  criadoEm: Date
}

export interface Contas {
  id?: number
  nome: string
  valor: number
  data: Date
  profile?: string
  status: Status
  vencimento: Date
  tipo?: string
  documento?: string
  funcionarios: number
  endereco?: string
  nomeFantasia?: string
  cep?: string
  emailAvisos?: string
  categoria?: string
  gateway: GatewayConta
  email: string
  telefone?: string
  asaasCustomerId: string
  asaasSubscriptionId?: string
  dicasNovidades?: boolean
}

export interface Usuarios {
  id?: number
  nome: string
  email: string
  senha: string
  superAdmin: boolean
  gerencialMode: boolean
  permissao: PermissaoUsuario
  pushReceiver?: boolean
  emailReceiver?: boolean
  contaId?: number
  status: Status
  telefone?: string
  profile?: string
  biografia?: string
  endereco?: string
}

export interface ClientesFornecedores {
  id?: number
  Uid?: string
  status: Status
  documento?: string
  endereco?: string
  cep?: string
  cidade?: string
  estado?: string
  nome: string
  email?: string
  telefone?: string
  whastapp?: string
  observacaos?: string
  tipo: TipoCliente
}

export interface MovimentacoesEstoque {
  id?: number
  tipo: TipoMovimentacao
  vendaId?: number
  data: Date
  notaFiscal?: string
  frete?: number
  desconto?: number
  status: StatusMovimentacao
  clienteFornecedor?: number
  produtoId: number
  quantidade: number
  custo: number
}

export interface Produto {
  id?: number
  Uid?: string
  status: Status | string
  nome: string
  descricao?: string
  preco: number | string
  precoCompra?: number | string
  entradas?: boolean
  saidas?: boolean
  unidade?: string
  estoque: number
  minimo: number
  codigo?: string
}

export interface Servicos {
  id?: number
  Uid?: string
  nome: string
  preco: number | string
  status: boolean
  descricao?: string
}

export interface OrdensServico {
  id?: number
  Uid?: string
  descricao?: string
  descricaoCliente?: string
  status: StatusOrdemServico
  garantia: string
  desconto: number
  data: Date
}

export interface ItensOrdensServico {
  id?: number
  itemName: string
  tipo: TipoItemOrdemServico
  ordemId: number
  produtoId?: number
  servicoId?: number
  quantidade: number
  valor: number
}

export interface Assinatura {
  id?: number
  Uid?: string
  clienteId: number
  servicoId: number
  inicio: Date
  fim?: Date
  status: AssinaturaInternaStatus
  recorrencia: AssinaturaInternaRecorrencia
  proximaCobranca: Date
}

export interface Cobranca {
  id?: number
  assinaturaId: number
  vencimento: Date
  pago: boolean
  valor: number
  dataPagamento?: Date
}

export interface Vendas {
  id?: number
  Uid?: string
  data: Date
  valor: number
  clienteId?: number
  status: 'ORCAMENTO' | 'ANDAMENTO' | 'FINALIZADO' | 'PENDENTE' | 'CANCELADO' | 'FATURADO'
  vendedorId?: number
  garantia?: number
  faturado: boolean
  observacoes?: string
  desconto: number
  cliente?: ClientesFornecedores
  vendedor?: Usuarios
}

export interface CarrinhoItem {
  id: number
  produto: string
  quantidade: number
  preco: number
  subtotal: number
}
export interface ItemVenda {
  id: number
  quantidade: number
  preco: number
}

export interface FormularioVenda {
  clienteId: number | null
  data: Date | null
  vendedorId: number | null
  status: 'ORCAMENTO' | 'ANDAMENTO' | 'FINALIZADO' | 'PENDENTE' | 'CANCELADO' | 'FATURADO'
  garantia: number | null
  observacoes: string | null
  desconto: number | string | null
  id: number | null
}
export interface FormularioLancamento {
  id: number | null
  clienteId: number | null
  categoriaId: number | null
  contasFinanceiroId: number | null
  dataLancamento: Date | string | null
  tipo: 'RECEITA' | 'DESPESA'
  formaPagamento:
    | 'DINHEIRO'
    | 'DEBITO'
    | 'CREDITO'
    | 'BOLETO'
    | 'DEPOSITO'
    | 'TRANSFERENCIA'
    | 'CHEQUE'
    | 'PIX'
  dataEntrada: Date | string | null
  valorTotal: number | string
  valorEntrada: number | string
  desconto: number | string
  parcelas: number | undefined
  descricao: string
}
export interface UpdateParametrosConta {
  AsaasApiKey?: string | null
  AsaasApiSecret?: string | null
  AsaasEnv?: string | null
  eventoEstoqueBaixo?: boolean | null
  emailAvisos?: string | null
  eventoSangria?: boolean | null
  eventoVendaConcluida?: boolean | null
  MercadoPagoApiKey?: string | null
  MercadoPagoEnv?: string | null
}

export interface ItensVendas {
  id?: number
  vendaId: number
  produtoId: number
  quantidade: number
  valor: number
  produto: Produto
}

export interface PagamentoVendas {
  id?: number
  vendaId: number
  metodo: MetodoPagamento
  valor: number
  data?: Date
  status: StatusPagamento
}

export interface ContasFinanceiro {
  id?: number
  nome: string
  saldoInicial: number
}

export interface CategoriaFinanceiro {
  id?: number
  nome: string
  parentId?: number
}

export interface LancamentoFinanceiro {
  id?: number
  Uid?: string
  descricao: string
  valorTotal: number
  valorBruto: number
  valorEntrada: number
  desconto: number
  tipo: TipoLancamentoFinanceiro
  formaPagamento: MetodoPagamento
  status: StatusPagamentoFinanceiro
  recorrente: boolean
  dataLancamento: Date
  dataEntrada?: Date
  clienteId?: number
  categoriaId: number
  vendaId?: number
  contasFinanceiroId?: number
}

export interface ParcelaFinanceiro {
  id?: number
  numero: number
  valor: number
  vencimento: Date
  pago: boolean
  valorPago?: number
  formaPagamento?: MetodoPagamento
  dataPagamento?: Date
  lancamentoId: number
}
