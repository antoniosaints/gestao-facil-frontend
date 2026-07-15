<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import type { PublicStore, StoreProduct } from '@/repositories/loja-repository'
import { ArrowLeft, Check, Package, ShoppingCart, X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  product: StoreProduct | null
  quantity: number
  store: PublicStore
}>()

const emit = defineEmits<{
  (e: 'keep-shopping'): void
  (e: 'go-to-cart'): void
}>()

const showPrices = computed(() => props.store.capabilities.showPrices)
// Overlay simples (sem o Dialog do reka) para não conflitar com o lock de pointer-events do
// carrinho — força `pointer-events:auto` para não herdar um eventual `none` preso no body.
</script>

<template>
  <Teleport to="body">
    <!-- Sem <Transition>: Teleport + Transition deixa o nó preso no DOM ao sair (bug do Vue). -->
    <div
      v-if="open && product"
      class="added-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      :style="{ fontFamily: 'var(--shop-font)', pointerEvents: 'auto' }"
      @click.self="emit('keep-shopping')"
    >
        <div class="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6" :style="{ '--shop-primary': store.colors.primary }">
          <button type="button" class="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Fechar" @click="emit('keep-shopping')">
            <X class="h-4 w-4" />
          </button>

          <div class="mb-4 flex items-center gap-2 text-emerald-600">
            <span class="grid h-8 w-8 place-items-center rounded-full bg-emerald-100"><Check class="h-5 w-5" /></span>
            <p class="text-sm font-bold">Adicionado ao carrinho</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border bg-slate-100">
              <img v-if="product.image" :src="resolveFileUrl(product.image)" :alt="product.name" class="h-full w-full object-cover" />
              <Package v-else class="h-8 w-8 text-slate-300" />
            </div>
            <div class="min-w-0">
              <p class="truncate font-bold text-slate-900">{{ product.name }}</p>
              <p v-if="product.variant && product.variant !== 'Padrão'" class="truncate text-xs text-slate-500">{{ product.variant }}</p>
              <p class="mt-0.5 text-sm text-slate-600">
                {{ quantity }} un<template v-if="showPrices"> · {{ formatCurrencyBR(product.price * quantity) }}</template>
              </p>
            </div>
          </div>

          <div class="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" class="flex-1" @click="emit('keep-shopping')">
              <ArrowLeft class="mr-1 h-4 w-4" /> Continuar comprando
            </Button>
            <Button class="flex-1 text-white" :style="{ backgroundColor: 'var(--shop-primary)' }" @click="emit('go-to-cart')">
              <ShoppingCart class="mr-1 h-4 w-4" /> Ir ao carrinho
            </Button>
          </div>
        </div>
      </div>
  </Teleport>
</template>

<style scoped>
.added-overlay { animation: added-fade .15s ease; }
@keyframes added-fade { from { opacity: 0; } to { opacity: 1; } }
</style>
