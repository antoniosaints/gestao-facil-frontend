import type { StoreProduct } from '@/repositories/loja-repository'

/**
 * Um produto "base" agrupado: reúne todas as variantes que compartilham o mesmo
 * `baseId`. Produtos sem base (baseId nulo) viram um grupo de uma variante só.
 */
export interface GroupedProduct {
  key: string
  baseId: number | null
  name: string
  category: string | null
  description: string | null
  image: string | null
  variants: StoreProduct[]
  priceFrom: number
  priceTo: number
  /** Menor preço "de" (cheio) entre as variantes em promoção; `null` sem promoção no grupo. */
  priceOriginalFrom: number | null
  /** Verdadeiro quando ao menos uma variante do grupo está em promoção. */
  hasPromo: boolean
  /** Total vendido somando as variantes; alimenta o ranking de "Mais vendidos". */
  soldCount: number
  /** Maior id entre as variantes — usado como proxy de "mais recente" para "Novidades". */
  recencyKey: number
  /** Soma do estoque das variantes; `null` quando nenhuma controla estoque. */
  totalAvailable: number | null
  hasVariants: boolean
}

export function groupStoreProducts(products: StoreProduct[]): GroupedProduct[] {
  const groups = new Map<string, StoreProduct[]>()
  for (const product of products) {
    const key = product.baseId != null ? `base-${product.baseId}` : `single-${product.id}`
    const bucket = groups.get(key)
    if (bucket) bucket.push(product)
    else groups.set(key, [product])
  }
  return [...groups.entries()].map(([key, variants]) => {
    const prices = variants.map((v) => v.price)
    const stocks = variants.filter((v) => v.available !== null).map((v) => v.available as number)
    const cover = variants.find((v) => v.image) ?? variants[0]
    // Variante "vitrine": a de menor preço efetivo — é a que define o preço exibido no card.
    // A promoção do grupo acompanha essa variante para que selo, preço "de" e a seção
    // "Promoções" fiquem coerentes (evita mostrar "-40%" quando o preço mais barato não é o promo).
    const headline = variants.reduce((min, v) => (v.price < min.price ? v : min), variants[0])
    const headlineOnPromo = headline.priceOriginal != null
    return {
      key,
      baseId: variants[0].baseId,
      name: variants[0].name,
      category: variants[0].category,
      description: variants[0].description,
      image: cover.image,
      variants,
      priceFrom: Math.min(...prices),
      priceTo: Math.max(...prices),
      priceOriginalFrom: headlineOnPromo ? (headline.priceOriginal as number) : null,
      hasPromo: headlineOnPromo,
      soldCount: variants.reduce((total, v) => total + (v.soldCount || 0), 0),
      recencyKey: Math.max(...variants.map((v) => v.id)),
      totalAvailable: stocks.length ? stocks.reduce((total, value) => total + value, 0) : null,
      hasVariants: variants.length > 1,
    }
  })
}
