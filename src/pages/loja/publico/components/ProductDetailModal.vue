<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import type { PublicStore, StoreProduct } from '@/repositories/loja-repository'
import type { GroupedProduct } from '../types'
import { Check, Minus, Package, Plus, ShoppingBag } from 'lucide-vue-next'

const props = defineProps<{
  group: GroupedProduct | null
  store: PublicStore
  cartQuantity: (product: StoreProduct) => number
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'add', payload: { variant: StoreProduct; quantity: number }): void
}>()

const open = computed(() => props.group !== null)
const isCommerce = computed(() => props.store.mode === 'LOJA')

const selectedId = ref<number | null>(null)
const quantity = ref(1)

const selected = computed<StoreProduct | null>(() => {
  if (!props.group) return null
  return props.group.variants.find((v) => v.id === selectedId.value) ?? props.group.variants[0]
})

const gallery = computed(() => {
  if (!props.group) return ''
  return selected.value?.image || props.group.image || ''
})

const soldOut = computed(() => selected.value?.available === 0)
const maxQuantity = computed(() => {
  const v = selected.value
  if (!v || !v.controlsStock || v.available === null) return 99
  return Math.max(0, v.available - props.cartQuantity(v))
})
const stockLabel = computed(() => {
  const v = selected.value
  if (!v || !props.store.capabilities.showAvailability || v.available === null) return ''
  return v.available > 0 ? `${v.available} em estoque` : 'Esgotado'
})

watch(
  () => props.group,
  (group) => {
    if (!group) return
    const firstAvailable = group.variants.find((v) => v.available !== 0) ?? group.variants[0]
    selectedId.value = firstAvailable.id
    quantity.value = 1
  },
  { immediate: true },
)

function pickVariant(variant: StoreProduct) {
  selectedId.value = variant.id
  quantity.value = 1
}

function step(delta: number) {
  quantity.value = Math.min(Math.max(1, quantity.value + delta), Math.max(1, maxQuantity.value))
}

function addToCart() {
  if (!selected.value || soldOut.value) return
  emit('add', { variant: selected.value, quantity: quantity.value })
  emit('update:open', false)
}

function variantLabel(variant: StoreProduct) {
  return variant.variant && variant.variant !== 'Padrão' ? variant.variant : props.group?.name || 'Padrão'
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent v-if="group" class="max-h-[94vh] max-w-3xl overflow-y-auto bg-white dark:text-black p-0" :style="{ '--shop-primary': store.colors.primary, fontFamily: 'var(--shop-font)' }">
      <div class="grid gap-0 md:grid-cols-2">
        <!-- Galeria -->
        <div class="bg-slate-100">
          <div class="relative aspect-square w-full overflow-hidden">
            <img v-if="gallery" :src="resolveFileUrl(gallery)" :alt="group.name" class="h-full w-full object-cover" />
            <Package v-else class="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
            <span v-if="soldOut" class="absolute left-3 top-3 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-bold text-white">Esgotado</span>
          </div>
          <div v-if="group.hasVariants" class="flex gap-2 overflow-x-auto p-3">
            <button
              v-for="variant in group.variants"
              :key="variant.id"
              type="button"
              class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition"
              :class="selectedId === variant.id ? 'border-[var(--shop-primary)]' : 'border-transparent opacity-70 hover:opacity-100'"
              @click="pickVariant(variant)"
            >
              <img v-if="variant.image" :src="resolveFileUrl(variant.image)" class="h-full w-full object-cover" />
              <Package v-else class="mx-auto h-6 w-6 text-slate-300" />
            </button>
          </div>
        </div>

        <!-- Detalhes -->
        <div class="flex flex-col p-5 sm:p-6">
          <p v-if="group.category" class="text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ group.category }}</p>
          <h2 class="mt-1 text-2xl font-black leading-tight text-slate-900">{{ group.name }}</h2>

          <div class="mt-3 flex items-baseline gap-2">
            <template v-if="store.capabilities.showPrices">
              <span v-if="selected?.priceOriginal" class="text-lg font-semibold text-slate-400 line-through">{{ formatCurrencyBR(selected.priceOriginal) }}</span>
              <span class="text-3xl font-black" :class="selected?.priceOriginal ? '' : 'text-[var(--shop-primary)]'" :style="selected?.priceOriginal ? { color: 'var(--shop-promo)' } : {}">{{ formatCurrencyBR(selected?.price ?? group.priceFrom) }}</span>
            </template>
            <span v-if="selected?.unit" class="text-sm text-slate-400">/ {{ selected.unit }}</span>
          </div>
          <p v-if="stockLabel" class="mt-1 text-sm font-medium" :class="soldOut ? 'text-red-600' : 'text-emerald-700'">{{ stockLabel }}</p>

          <p v-if="group.description" class="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{{ group.description }}</p>

          <!-- Seletor de variantes -->
          <div v-if="group.hasVariants" class="mt-5">
            <p class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Escolha uma opção</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="variant in group.variants"
                :key="variant.id"
                type="button"
                :disabled="variant.available === 0"
                class="inline-flex items-center gap-1 rounded-full border-2 px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40"
                :class="selectedId === variant.id ? 'text-white shadow-md' : 'border-slate-300 bg-white text-slate-700 hover:border-[var(--shop-primary)] hover:text-[var(--shop-primary)]'"
                :style="selectedId === variant.id ? { backgroundColor: 'var(--shop-primary)', borderColor: 'var(--shop-primary)' } : {}"
                @click="pickVariant(variant)"
              >
                <Check v-if="selectedId === variant.id" class="h-3.5 w-3.5" />
                {{ variantLabel(variant) }}
              </button>
            </div>
          </div>

          <!-- Quantidade + adicionar -->
          <div v-if="isCommerce && store.capabilities.quickAdd" class="mt-auto pt-6">
            <div class="flex items-center gap-3">
              <div class="flex items-center rounded-full border border-slate-300">
                <button type="button" class="grid h-11 w-11 place-items-center rounded-l-full text-slate-600 hover:bg-slate-100 disabled:opacity-40" :disabled="quantity <= 1" @click="step(-1)"><Minus class="h-4 w-4" /></button>
                <span class="w-10 text-center text-base dark:text-black font-bold">{{ quantity }}</span>
                <button type="button" class="grid h-11 w-11 place-items-center rounded-r-full text-slate-600 hover:bg-slate-100 disabled:opacity-40" :disabled="quantity >= maxQuantity" @click="step(1)"><Plus class="h-4 w-4" /></button>
              </div>
              <Button class="h-11 flex-1 rounded-full text-white" :style="{ backgroundColor: 'var(--shop-primary)' }" :disabled="soldOut || maxQuantity < 1" @click="addToCart">
                <ShoppingBag class="mr-2 h-4 w-4" />
                {{ soldOut ? 'Esgotado' : 'Adicionar ao carrinho' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
