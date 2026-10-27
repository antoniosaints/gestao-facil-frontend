import type { Row } from '../adapters/domain'
export function saleItems(sale: Partial<Row>): Row[] {
  return operationItems(sale.ItensVendas || [], sale.ComboSaidas || [])
}
export function orderAmounts(order: Partial<Row>) {
  const items = operationItems(order.ItensOrdensServico || [], order.ComboSaidas || [])
  const subtotalCents = items.reduce(
    (sum, item) => sum + Math.round(Number(item.quantidade) * Number(item.valor) * 100),
    0,
  )
  return {
    subtotal: subtotalCents / 100,
    total: (subtotalCents - Math.round(Number(order.desconto || 0) * 100)) / 100,
  }
}
export function operationItems(items: Row[], combos: Row[] = []): Row[] {
  const matched = new Set<number>()
  return [
    ...items,
    ...combos
      .filter((combo: Row) => {
        // An operation may already contain an item with the combo snapshot.
        const index = items.findIndex(
          (item, index) =>
            !matched.has(index) &&
            !item.produtoId &&
            !item.servicoId &&
            item.itemName === combo.nomeSnapshot &&
            Number(item.quantidade) === Number(combo.quantidade) &&
            Number(item.valor) === Number(combo.precoUnitarioSnapshot),
        )
        if (index < 0) return true
        matched.add(index)
        return false
      })
      .map((combo: Row) => ({
        ...combo,
        id: -combo.id,
        itemName: combo.nomeSnapshot,
        valor: combo.precoUnitarioSnapshot,
      })),
  ]
}
export function promotionalPrice(variant: Row) {
  const price = Number(variant.preco)
  const promotion = Number(variant.precoPromocional)
  return variant.precoPromocional != null && promotion > 0 && promotion < price ? promotion : null
}
export function stockStatus(variant: Row) {
  if (!variant.controlaEstoque) return 'SEM_CONTROLE'
  return Number(variant.estoque) <= Number(variant.minimo ?? 0) ? 'BAIXO' : 'REGULAR'
}
export function stockByUnit(variants: Row[]) {
  const totals = new Map<string, number>()
  for (const variant of variants.filter((row) => row.controlaEstoque)) {
    const unit = variant.unidade || 'un'
    totals.set(unit, (totals.get(unit) || 0) + Number(variant.estoque ?? 0))
  }
  return Array.from(totals, ([unit, value]) => ({ unit, value }))
}
export const detailSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
