import type {
  AssinaturaItemForm,
  GatewayAssinatura,
  ModoValorAssinatura,
  PeriodicidadeAssinatura,
  StatusAssinaturaCliente,
  StatusCicloAssinatura,
  StatusComodatoAssinatura,
  StatusPlanoAssinatura,
  TipoCobrancaAssinatura,
} from '@/repositories/assinatura-repository'

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

export const periodicidadeOptions: Array<{ value: PeriodicidadeAssinatura; label: string }> = [
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
]

export const modoValorOptions: Array<{ value: ModoValorAssinatura; label: string }> = [
  { value: 'DINAMICO', label: 'Dinâmico' },
  { value: 'MANUAL', label: 'Manual' },
]

export const gatewayOptions: Array<{ value: GatewayAssinatura; label: string; disabled?: boolean }> = [
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'asaas', label: 'Asaas', disabled: true },
  { value: 'pagseguro', label: 'PagSeguro', disabled: true },
]

export const tipoCobrancaOptions: Array<{ value: TipoCobrancaAssinatura; label: string }> = [
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'LINK', label: 'Link de pagamento' },
]

export const statusPlanoOptions: Array<{ value: StatusPlanoAssinatura | 'TODOS'; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'INATIVO', label: 'Inativo' },
]

export const statusAssinaturaOptions: Array<{ value: StatusAssinaturaCliente | 'TODOS'; label: string }> = [
  { value: 'TODOS', label: 'Todas' },
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'SUSPENSA', label: 'Suspensa' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'ENCERRADA', label: 'Encerrada' },
]

export const statusCicloOptions: Array<{ value: StatusCicloAssinatura | 'TODOS'; label: string }> = [
  { value: 'TODOS', label: 'Todas' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'COBRADO', label: 'Cobrado' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'ATRASADO', label: 'Atrasado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'FALHA', label: 'Falha' },
]

export const statusComodatoOptions: Array<{ value: StatusComodatoAssinatura | 'TODOS'; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'EM_USO', label: 'Em uso' },
  { value: 'DEVOLVIDO', label: 'Devolvido' },
  { value: 'PERDIDO', label: 'Perdido' },
  { value: 'AVARIADO', label: 'Avariado' },
]

export function getPeriodicidadeLabel(value?: string | null) {
  return periodicidadeOptions.find((item) => item.value === value)?.label || value || '-'
}

export function getStatusAssinaturaMeta(value?: string | null) {
  switch (value) {
    case 'ATIVA':
      return { label: 'Ativa', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' }
    case 'SUSPENSA':
      return { label: 'Suspensa', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' }
    case 'CANCELADA':
      return { label: 'Cancelada', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' }
    case 'ENCERRADA':
      return { label: 'Encerrada', className: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
    default:
      return { label: value || '-', className: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
  }
}

export function getStatusPlanoMeta(value?: string | null) {
  if (value === 'ATIVO') {
    return { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' }
  }

  return { label: 'Inativo', className: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
}

export function getStatusCicloMeta(value?: string | null) {
  switch (value) {
    case 'PAGO':
      return { label: 'Pago', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' }
    case 'ATRASADO':
      return { label: 'Atrasado', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' }
    case 'COBRADO':
      return { label: 'Cobrado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' }
    case 'CANCELADO':
      return { label: 'Cancelado', className: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
    case 'FALHA':
      return { label: 'Falha', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' }
    default:
      return { label: 'Pendente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' }
  }
}

export function getStatusComodatoMeta(value?: string | null) {
  switch (value) {
    case 'DEVOLVIDO':
      return { label: 'Devolvido', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' }
    case 'PERDIDO':
      return { label: 'Perdido', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' }
    case 'AVARIADO':
      return { label: 'Avariado', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' }
    default:
      return { label: 'Em uso', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' }
  }
}

export function createEmptyItem(): AssinaturaItemForm {
  return {
    tipoItem: 'SERVICO',
    servicoId: null,
    produtoId: null,
    descricaoSnapshot: '',
    quantidade: 1,
    valorUnitario: 0,
    cobrar: true,
    comodato: false,
    ativo: true,
    identificacao: '',
    dataPrevistaDevolucao: null,
    observacoes: '',
  }
}

export function parseDateOnlyFromApi(value?: string | Date | null): Date | null {
  if (!value) return null

  const parsed = value instanceof Date ? value : new Date(value)
  if (!isValidDate(parsed)) return null

  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
}

export function toDateOnlyIso(value?: string | Date | null): string | undefined {
  if (!value) return undefined

  const parsed = value instanceof Date ? value : new Date(value)
  if (!isValidDate(parsed)) return undefined

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).toISOString()
}
