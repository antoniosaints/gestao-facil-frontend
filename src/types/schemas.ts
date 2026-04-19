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

export type StatusOrdemServico =
  | 'ABERTA'
  | 'ORCAMENTO'
  | 'APROVADA'
  | 'ANDAMENTO'
  | 'FATURADA'
  | 'CANCELADA'

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

export type StatusPagamentoType = 'PENDENTE' | 'EFETIVADO' | 'ESTORNADO' | 'CANCELADO'

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

export type CobrancaFinanceira = {
  id?: number
  contaId?: number
  idCobranca: string
  Uid?: string
  externalLink?: string | null
  valor: number
  gateway: string
  dataVencimento?: Date
  dataCadastro?: Date
  status: StatusPagamentoType
  observacao?: string | null
  lancamentoId?: number | null
  vendaId?: number | null
  ordemServicoId?: number | null
  LancamentoParcela?: ParcelaFinanceiro | null
  Venda?: Vendas | null
  Ordemservico?: OrdensServico | null
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
  ordemId?: number
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

export interface ProdutoCategoria {
  id?: number
  Uid?: string
  nome: string
  status?: Status | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface ProdutoVariante {
  id?: number
  Uid?: string
  contaId?: number
  produtoBaseId?: number | null
  status: Status | string
  nome: string
  nomeVariante?: string
  descricao?: string | null
  preco: number | string
  precoCompra?: number | string | null
  entradas?: boolean
  saidas?: boolean
  unidade?: string | null
  estoque: number
  minimo: number
  codigo?: string | null
  controlaEstoque?: boolean
  producaoLocal?: boolean
  mostrarNoPdv?: boolean
  materiaPrima?: boolean
  custoMedioProducao?: number | null
  ehPadrao?: boolean
  categoriaId?: number | null
  categoria?: string | null
  produtoBaseNome?: string
  label?: string
}

export interface ProdutoBase {
  id?: number
  Uid?: string
  contaId?: number
  status: Status | string
  nome: string
  descricao?: string | null
  categoriaId?: number | null
  categoria?: string | null
  Categoria?: ProdutoCategoria | null
  preco: number | string
  precoCompra?: number | string | null
  entradas?: boolean
  saidas?: boolean
  unidade?: string | null
  estoque: number
  estoqueTotal?: number
  minimo: number
  codigo?: string | null
  controlaEstoque?: boolean
  producaoLocal?: boolean
  mostrarNoPdv?: boolean
  materiaPrima?: boolean
  custoMedioProducao?: number | null
  nomeVariante?: string
  totalVariantes?: number
  variantePadraoId?: number | null
  ncm?: string | null
  cest?: string | null
  cfop?: string | null
  origem?: string | null
  aliquotaIcms?: number | string | null
  aliquotaIpi?: number | string | null
  aliquotaPis?: number | string | null
  aliquotaCofins?: number | string | null
  codigoProduto?: string | null
  issAliquota?: number | string | null
  variantes?: ProdutoVariante[]
}

export type Produto = ProdutoVariante

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
  clienteId: number | null
  operadorId: number | null
  Operador?: Usuarios
  Cliente?: ClientesFornecedores
  descricaoCliente?: string
  status: StatusOrdemServico
  garantia: string
  desconto: number
  data: Date
}

export interface MensagensInteracoesOrdemServico {
  id?: number
  ordemId: number
  mensagem: string
  tipo: 'ABERTURA' | 'MENSAGEM' | 'ENCERRAMENTO'
  autorId: number
  Autor?: Usuarios
  data: string
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
  comandaId?: number | null
  status: 'ORCAMENTO' | 'ANDAMENTO' | 'FINALIZADO' | 'PENDENTE' | 'CANCELADO' | 'FATURADO'
  vendedorId?: number
  garantia?: number
  faturado: boolean
  observacoes?: string
  desconto: number
  cliente?: ClientesFornecedores
  vendedor?: Usuarios
  CobrancasFinanceiras?: CobrancaFinanceira[]
  ItensVendas?: ItensVendas[]
  ComandaItens?: ComandaItem[]
  PagamentoVendas?: PagamentoVendas | null
}

export interface CarrinhoItem {
  id: number
  produto: string
  quantidade: number
  preco: number
  subtotal: number
  produtoBaseId?: number | null
  nomeVariante?: string | null
  categoria?: string | null
}
export interface ItemVenda {
  id: number
  quantidade: number
  preco: number
}
export interface ItemOrdemServico {
  id: number
  quantidade: number
  preco: number
  tipo: 'PRODUTO' | 'SERVICO'
}

export interface FormularioVenda {
  comandaId?: number
  clienteId: number | null
  data: Date | null
  vendedorId: number | null
  status: 'ORCAMENTO' | 'ANDAMENTO' | 'FINALIZADO' | 'PENDENTE' | 'CANCELADO' | 'FATURADO'
  garantia: number | null
  observacoes: string | null
  desconto: number | string | null
  id: number | null
}
export interface FormularioOrdemServico {
  clienteId: number | null
  data: Date | null
  operadorId: number | null
  status: 'ORCAMENTO' | 'ANDAMENTO' | 'FINALIZADO' | 'PENDENTE' | 'CANCELADO'
  garantia: number | null
  observacoes: string | undefined
  observacoesInternas: string | undefined
  desconto: number | string | undefined
  itens: ItemOrdemServico[]
  id: number | undefined | null
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
  periodoParcelamento?: 'MENSAL' | 'SEMANAL' | 'DIARIO' | 'QUINZENAL' | 'PERSONALIZADO'
  intervaloDiasPersonalizado?: number | string | null
  modoValorParcelamento?: 'TOTAL' | 'FIXO_PARCELA'
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
  chavePix?: string | null
}

export interface ItensVendas {
  id?: number
  vendaId: number
  itemName?: string | null
  produtoId?: number | null
  servicoId?: number | null
  quantidade: number
  valor: number
  produto?: ProdutoVariante | null
  servico?: Servicos | null
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
  Uid?: string
  nome: string
  saldoInicial: number | string
}

export type FiltroStatusFinanceiro = 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'
export type FiltroTipoFinanceiro = 'TODOS' | 'RECEITA' | 'DESPESA'

export interface ContaFinanceiraDetalheMovimentacao {
  id: number
  numero: number
  valor: number
  valorPago: number | null
  pago: boolean
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO'
  vencimento: Date | string
  dataPagamento: Date | string | null
  formaPagamento?: MetodoPagamento | string | null
  lancamento: {
    id: number
    Uid?: string
    descricao: string
    tipo: 'RECEITA' | 'DESPESA'
    categoria: { id?: number; nome: string }
    cliente?: { id?: number; nome: string } | null
  }
}

export interface ContaFinanceiraSaldoAtualResponse {
  conta: {
    id: number
    nome: string
    saldoInicial: number
  }
  resumo: {
    saldoAtual: number
    entradasRealizadas: number
    saidasRealizadas: number
  }
}

export interface ContaFinanceiraTransferPreviewResponse {
  contaOrigem: {
    id: number
    nome: string
  }
  preview: {
    parcelasAfetadas: number
    lancamentosAfetados: number
  }
}

export interface ContaFinanceiraDetalhesResponse {
  conta: {
    id: number
    Uid?: string
    nome: string
    saldoInicial: number
  }
  periodo: {
    inicio?: Date | string | null
    fim?: Date | string | null
  }
  resumo: {
    totalMovimentacoes: number
    pagos: number
    pendentes: number
    atrasados: number
    saldoInicial: number
    entradasPrevistas: number
    saidasPrevistas: number
    entradasRealizadas: number
    saidasRealizadas: number
    pendenteReceber: number
    pendentePagar: number
    atrasadoReceber: number
    atrasadoPagar: number
    saldoAtual: number
    saldoPrevisto: number
  }
  movimentacoes: ContaFinanceiraDetalheMovimentacao[]
}

export interface CategoriaFinanceiroParent {
  id?: number
  nome: string
}

export interface CategoriaFinanceiro {
  id?: number
  Uid?: string
  nome: string
  parentId?: number | null
  Parent?: CategoriaFinanceiroParent | null
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
  contaFinanceira?: number | null
  descricao?: string | null
  pago: boolean
  valorPago?: number
  formaPagamento?: MetodoPagamento
  dataPagamento?: Date
  lancamentoId: number
  CobrancasFinanceiras?: CobrancaFinanceira[]
}

export interface SaveOrdemServico {
  id?: number | null
  data: Date | string
  clienteId: number | null
  status?: 'ABERTA' | 'ORCAMENTO' | 'APROVADA' | 'ANDAMENTO' | 'FATURADA' | 'CANCELADA'
  descricao?: string
  descricaoCliente?: string
  vendedorId: number | null
  desconto?: number | null
  garantia?: number | null
  itens: {
    id: number
    tipo: 'PRODUTO' | 'SERVICO'
    nome: string
    valor: number
    quantidade: number
  }[]
}

export type IDetalheOrdemServico = OrdensServico & {
  ItensOrdensServico: ItensOrdensServico[]
  Cliente: ClientesFornecedores
  MensagensInteracoesOrdemServico: MensagensInteracoesOrdemServico[]
  Operador: Usuarios
}

export type ArenaAgendamentoStatus =
  | 'PENDENTE'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'BLOQUEADO'
  | 'FINALIZADA'

export interface ArenaQuadras {
  id?: number
  contaId?: number
  tempoMinimo?: number
  tempoReserva?: number
  name: string
  description?: string | null
  precoHora: number | undefined
  permitirReservaOnline?: boolean
  aprovarSemPagamento?: boolean
  active?: boolean
  schedules?: ArenaAgendamentos[]
}

export interface ArenaAgendamentos {
  id?: number
  quadraId?: number
  clienteId?: number | null
  startAt: Date | string
  endAt: Date | string
  status: ArenaAgendamentoStatus
  cobrancasOnAgendamentos?: {
    id?: number
    cobrancaId: number
    agendamentoId: number
    cobranca: CobrancaFinanceira
  }[]
  valor?: number | undefined
  enderecoCliente?: string
  nomeCliente?: string
  telefoneCliente?: string
  recorrente?: boolean
  observacoes?: string | null
  Quadra?: ArenaQuadras
  Cliente?: ClientesFornecedores | null
}

export type StatusComanda = 'ABERTA' | 'PENDENTE' | 'FECHADA' | 'CANCELADA'

export type TipoItemComanda = 'PRODUTO' | 'SERVICO'

export interface ComandaItem {
  id?: number
  comandaId: number
  itemName: string
  tipo: TipoItemComanda
  produtoId?: number | null
  servicoId?: number | null
  quantidade: number
  valor: number
  vendaId?: number | null
  produto?: ProdutoVariante | null
  servico?: Servicos | null
  venda?: Vendas | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface ComandaResumo {
  itensAbertos: number
  valorItensAbertos: number
  valorPendente: number
  valorPago: number
}

export interface ComandaVenda {
  id?: number
  contaId?: number
  status: StatusComanda
  abertura: Date
  fechamento?: Date | null
  clienteNome: string
  observacao?: string | null
  clienteId?: number | null
  Cliente?: ClientesFornecedores
  reservaId?: number | null
  ArenaReservas?: ArenaAgendamentos
  itens?: ComandaItem[]
  vendas?: Vendas[]
  comandaPagamentos?: ComandaPagamento[]
  resumo?: ComandaResumo
  itensAbertos?: number
  valorItensAbertos?: number
  valorPendente?: number
  valorPago?: number
}

export interface ComandaPagamento {
  id?: number
  comandaId: number
  formaPagamento: MetodoPagamento
  valor: number
  dataPagamento: Date
}
