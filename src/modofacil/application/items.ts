export function validateItems(items: Array<{ quantidade: number; preco: number }>) {
  if (!items.length) throw new Error('Escolha pelo menos um item.')
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantidade) || item.quantidade < 1)
      throw new Error(
        'Vendas e OS aceitam quantidades inteiras. Quantidades fracionadas ainda precisam de evolução no contrato.',
      )
    if (
      !Number.isFinite(item.preco) ||
      item.preco < 0 ||
      Math.abs(item.preco * 100 - Math.round(item.preco * 100)) > 0.00001
    )
      throw new Error('Informe preço válido com até duas casas decimais.')
  }
}
