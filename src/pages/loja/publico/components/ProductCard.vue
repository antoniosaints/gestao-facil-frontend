<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import type { PublicStore } from '@/repositories/loja-repository'
import type { GroupedProduct } from '../types'
import { Package, Plus } from 'lucide-vue-next'

const props = defineProps<{
  group: GroupedProduct
  store: PublicStore
}>()

const emit = defineEmits<{
  (e: 'open', group: GroupedProduct): void
  (e: 'action', group: GroupedProduct): void
}>()

const isCommerce = computed(() => props.store.mode === 'LOJA')
const soldOut = computed(() => props.group.totalAvailable === 0)

const availableLabel = computed(() => {
  if (!props.store.capabilities.showAvailability || props.group.totalAvailable === null) return ''
  return props.group.totalAvailable > 0 ? `${props.group.totalAvailable} disponível(is)` : 'Esgotado'
})

// Percentual de desconto exibido no selo de promoção (baseado no menor preço em oferta).
const discountPercent = computed(() => {
  if (!props.group.hasPromo || !props.group.priceOriginalFrom) return 0
  const off = 1 - props.group.priceFrom / props.group.priceOriginalFrom
  return Math.round(off * 100)
})
</script>

<template>
  <article
    class="product-card group flex cursor-pointer flex-col overflow-hidden border border-black/10 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-xl"
    @click="emit('open', group)"
  >
    <div class="relative aspect-square overflow-hidden bg-slate-100">
      <img v-if="group.image" :src="resolveFileUrl(group.image)" :alt="group.name" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      <Package v-else class="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
      <span v-if="group.hasPromo && discountPercent > 0" class="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black text-white shadow-sm" :style="{ backgroundColor: 'var(--shop-promo)' }">-{{ discountPercent }}%</span>
      <span v-if="group.hasVariants" class="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">{{ group.variants.length }} opções</span>
      <span v-if="soldOut" class="absolute inset-0 grid place-items-center bg-slate-950/45"><span class="rounded-full bg-slate-950/85 px-4 py-1.5 text-xs font-bold text-white">Esgotado</span></span>
    </div>
    <div class="flex min-h-[9rem] flex-col p-3 sm:p-4">
      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ group.category || 'Produto' }}</p>
      <h3 class="mt-1 line-clamp-2 font-bold leading-tight text-slate-900">{{ group.name }}</h3>
      <p v-if="availableLabel" class="mt-1 text-xs" :class="soldOut ? 'text-red-600' : 'text-emerald-700'">{{ availableLabel }}</p>
      <div class="mt-auto pt-3">
        <div v-if="store.capabilities.showPrices" class="leading-tight">
          <span v-if="group.hasVariants && group.priceFrom !== group.priceTo" class="block text-[11px] text-slate-400">a partir de</span>
          <span v-if="group.hasPromo && group.priceOriginalFrom" class="mr-1.5 text-xs font-medium text-slate-400 line-through">{{ formatCurrencyBR(group.priceOriginalFrom) }}</span>
          <span class="text-lg font-black" :class="group.hasPromo ? '' : 'text-[var(--shop-primary)]'" :style="group.hasPromo ? { color: 'var(--shop-promo)' } : {}">{{ formatCurrencyBR(group.priceFrom) }}</span>
        </div>
        <Button
          v-if="isCommerce && store.capabilities.quickAdd"
          class="mt-2 w-full rounded-full text-white"
          size="sm"
          :disabled="soldOut"
          @click.stop="emit('action', group)"
        >
          <Plus class="mr-1 h-4 w-4" /> {{ group.hasVariants ? 'Ver opções' : 'Adicionar' }}
        </Button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card { border-radius: var(--shop-radius); }
</style>
