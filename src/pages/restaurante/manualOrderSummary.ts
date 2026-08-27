type ManualOrderSummaryItem = {
  grupos: Array<{
    Grupo: {
      nome: string
      opcoes: Array<{ id?: number; nome: string }>
    }
  }>
}

export function selectedMenuItemSummary(item: ManualOrderSummaryItem, selectionIds: number[]) {
  if (!selectionIds.length) return ''
  return item.grupos
    .map((link) => {
      const optionNames = link.Grupo.opcoes
        .filter((option) => option.id && selectionIds.includes(option.id))
        .map((option) => option.nome)
      return optionNames.length ? `${link.Grupo.nome}: ${optionNames.join(', ')}` : null
    })
    .filter((selection): selection is string => Boolean(selection))
    .join(' · ')
}
