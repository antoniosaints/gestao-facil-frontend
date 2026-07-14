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
      totalAvailable: stocks.length ? stocks.reduce((total, value) => total + value, 0) : null,
      hasVariants: variants.length > 1,
    }
  })
}
