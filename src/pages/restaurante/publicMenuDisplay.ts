export type PublicMenuDisplayItem = {
  id: number
  maisPedido?: boolean
}

/**
 * A resposta do cardápio deve ter um item por id. A proteção aqui evita que
 * uma repetição acidental da API gere dois cards para o mesmo item.
 */
export function uniquePublicMenuItems<T extends PublicMenuDisplayItem>(items: T[]) {
  const byId = new Map<number, T>()
  for (const item of items) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return [...byId.values()]
}

/**
 * Na visão inicial os destaques já aparecem na seção "Mais pedidos". Eles
 * voltam à categoria ao pesquisar ou filtrar, que é onde o cliente espera
 * encontrá-los nesses contextos.
 */
export function menuCategoryItems<T extends PublicMenuDisplayItem>(items: T[], hideHighlights: boolean) {
  return hideHighlights ? items.filter((item) => !item.maisPedido) : items
}
