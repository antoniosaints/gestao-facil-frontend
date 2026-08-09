type MenuOption = { id: number; precoAdicional: string | number }
type MenuGroup = { Grupo: { tipo: 'COMPLEMENTO' | 'SABOR'; opcoes: MenuOption[] } }
type MenuItemPrice = {
  Produto: { preco: string | number }
  regraPrecoSabores: 'MAIOR_PRECO' | 'MEDIA_PROPORCIONAL' | 'SOMA'
  grupos: MenuGroup[]
}

export function calculateMenuItemUnitPrice(item: MenuItemPrice, selectedIds: number[]) {
  const selected = item.grupos.flatMap((link) => (
    link.Grupo.opcoes
      .filter((option) => selectedIds.includes(option.id))
      .map((option) => ({ ...option, tipo: link.Grupo.tipo }))
  ))
  const complements = selected
    .filter((option) => option.tipo === 'COMPLEMENTO')
    .reduce((total, option) => total + Number(option.precoAdicional), 0)
  const flavors = selected
    .filter((option) => option.tipo === 'SABOR')
    .map((option) => Number(option.precoAdicional))
  const flavorsTotal = flavors.reduce((total, price) => total + price, 0)
  const flavorPrice = item.regraPrecoSabores === 'SOMA'
    ? flavorsTotal
    : item.regraPrecoSabores === 'MEDIA_PROPORCIONAL' && flavors.length
      ? flavorsTotal / flavors.length
      : flavors.length ? Math.max(...flavors) : 0
  return Number((Number(item.Produto.preco) + complements + flavorPrice).toFixed(2))
}

export function updateMenuGroupSelection(
  currentIds: number[],
  groupIds: number[],
  optionId: number,
  maximum: number,
) {
  const outside = currentIds.filter((id) => !groupIds.includes(id))
  const inside = currentIds.filter((id) => groupIds.includes(id))
  if (inside.includes(optionId)) return [...outside, ...inside.filter((id) => id !== optionId)]
  const availableBeforeNew = Math.max(maximum - 1, 0)
  const kept = availableBeforeNew ? inside.slice(-availableBeforeNew) : []
  return [...outside, ...kept, optionId]
}

export function hasSameMenuSelections(first: number[], second: number[]) {
  if (first.length !== second.length) return false
  const firstSorted = [...first].sort((a, b) => a - b)
  const secondSorted = [...second].sort((a, b) => a - b)
  return firstSorted.every((id, index) => id === secondSorted[index])
}
