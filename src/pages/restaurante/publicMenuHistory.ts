import type { RestaurantePedidoStatus } from '@/repositories/restaurante-repository'

const MAX_TRACKED_ORDERS = 30
const terminalOrderStatuses = new Set(['CONCLUIDO', 'CANCELADO'])
const orderStatusBadgeClasses: Record<RestaurantePedidoStatus, string> = {
  RECEBIDO: 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100',
  CONFIRMADO: 'border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-100',
  EM_PREPARO: 'border-violet-200 bg-violet-100 text-violet-800 hover:bg-violet-100',
  PRONTO: 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  CONCLUIDO: 'border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-600',
  CANCELADO: 'border-red-200 bg-red-100 text-red-800 hover:bg-red-100',
}

export function isActiveRestaurantOrder(status: string) {
  return !terminalOrderStatuses.has(status)
}

export function restaurantOrderStatusLabel(status: string) {
  return {
    RECEBIDO: 'Pedido recebido',
    CONFIRMADO: 'Pedido confirmado',
    EM_PREPARO: 'Em preparo',
    PRONTO: 'Pronto',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
  }[status] || status
}

export function restaurantOrderStatusBadgeClass(status: RestaurantePedidoStatus) {
  return orderStatusBadgeClasses[status]
}

export function parseTrackingTokens(raw: string | null | undefined) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(
        parsed.filter(
          (token): token is string => typeof token === 'string' && token.trim().length >= 8,
        ),
      ),
    ].slice(0, MAX_TRACKED_ORDERS)
  } catch {
    return []
  }
}

export function prependTrackingToken(tokens: string[], token: string) {
  return [token, ...tokens.filter((current) => current !== token)].slice(0, MAX_TRACKED_ORDERS)
}
