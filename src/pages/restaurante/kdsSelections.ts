export type KdsSelectionSnapshot = {
  nome?: string | null
  tipo?: 'SABOR' | 'COMPLEMENTO' | string | null
  grupoId?: number | null
  grupoNome?: string | null
}

export function formatKdsSelections(value: unknown) {
  if (!Array.isArray(value)) return []

  const flavorGroups = new Map<string, string[]>()
  const complements: string[] = []

  for (const selection of value as KdsSelectionSnapshot[]) {
    const name = selection?.nome?.trim()
    if (!name) continue
    if (selection.tipo === 'SABOR') {
      const groupName = selection.grupoNome?.trim() || 'Sabores'
      flavorGroups.set(groupName, [...(flavorGroups.get(groupName) || []), name])
    } else {
      // Pedidos anteriores ao snapshot de grupos não possuem tipo; tratamos
      // essas opções como complemento para não ocultá-las da produção.
      complements.push(name)
    }
  }

  return [
    ...[...flavorGroups.entries()].map(([groupName, names]) => `${groupName}: ${names.join(', ')}`),
    ...(complements.length ? [`+ ${complements.join(', ')}`] : []),
  ]
}
