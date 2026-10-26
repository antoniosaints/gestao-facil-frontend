import type { BasicProduct } from '../adapters/domain'
/** Only edited fields cross the write boundary. Stock can never enter an edit. */
export function changedProductFields(
  current: BasicProduct,
  original: BasicProduct,
): Partial<Omit<BasicProduct, 'estoque'>> {
  const allowed = [
    'nome',
    'categoriaId',
    'unidade',
    'preco',
    'precoCompra',
    'minimo',
    'descricao',
  ] as const
  return Object.fromEntries(
    allowed.filter((key) => current[key] !== original[key]).map((key) => [key, current[key]]),
  )
}
