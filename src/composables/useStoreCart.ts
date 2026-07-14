import { computed, ref, watch } from 'vue'
import type { StoreProduct } from '@/repositories/loja-repository'

export type StoreCartItem = { product: StoreProduct; quantity: number }

export function normalizeCartQuantity(product: StoreProduct, quantity: number) {
  const requested = Math.max(0, Math.floor(quantity || 0))
  return product.controlsStock && product.available !== null ? Math.min(requested, product.available) : requested
}

export function useStoreCart(slug: string) {
  const key = `gestao-facil:loja:${slug}:cart:v1`
  const items = ref<StoreCartItem[]>([])
  try { items.value = JSON.parse(localStorage.getItem(key) || '[]') } catch { items.value = [] }
  watch(items, (value) => localStorage.setItem(key, JSON.stringify(value)), { deep: true })

  function set(product: StoreProduct, quantity: number) {
    const normalized = normalizeCartQuantity(product, quantity)
    const index = items.value.findIndex((item) => item.product.id === product.id)
    if (normalized <= 0) { if (index >= 0) items.value.splice(index, 1); return }
    if (index >= 0) items.value[index] = { product, quantity: normalized }
    else items.value.push({ product, quantity: normalized })
  }
  function add(product: StoreProduct) { const current = items.value.find((item) => item.product.id === product.id)?.quantity ?? 0; set(product, current + 1) }
  function clear() { items.value = [] }
  return {
    items,
    set,
    add,
    clear,
    count: computed(() => items.value.reduce((total, item) => total + item.quantity, 0)),
    subtotal: computed(() => items.value.reduce((total, item) => total + item.quantity * item.product.price, 0)),
  }
}
