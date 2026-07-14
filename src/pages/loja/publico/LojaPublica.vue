<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { LojaRepository, type CheckoutPayload, type PublicStore, type StoreProduct } from '@/repositories/loja-repository'
import { useStoreCart } from '@/composables/useStoreCart'
import { useStoreToast } from '@/composables/useStoreToast'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProductDetailModal from './components/ProductDetailModal.vue'
import CartDrawer from './components/CartDrawer.vue'
import StoreToaster from './components/StoreToaster.vue'
import { groupStoreProducts, type GroupedProduct } from './types'
import { CreditCard, LoaderCircle, MessageCircle, Package, Plus, Search, ShieldCheck, ShieldX, ShoppingBag, ShoppingCart, Truck, UserRound } from 'lucide-vue-next'

const route = useRoute()
const toast = useStoreToast()
const slug = String(route.params.slug)
const store = ref<PublicStore | null>(null)
const products = ref<StoreProduct[]>([])
const loading = ref(true)
const invalid = ref(false)
const search = ref('')
const category = ref<string | null>(null)
const cartOpen = ref(false)
const checkingOut = ref(false)
const cart = useStoreCart(slug)
const checkout = reactive<CheckoutPayload>({
  items: [], channel: 'WHATSAPP', deliveryType: 'RETIRADA',
  customer: { name: '', email: '', phone: '', postalCode: '', address: '', number: '', complement: '', district: '', city: '', state: '' },
})

const isCommerce = computed(() => store.value?.mode === 'LOJA')
const categories = computed(() => [...new Set(products.value.map((p) => p.category).filter(Boolean))] as string[])
const visibleProducts = computed(() => products.value.filter((product) => {
  if (store.value?.capabilities.hideSoldOut && product.available === 0) return false
  const term = search.value.trim().toLowerCase()
  return (!category.value || product.category === category.value) && (!term || `${product.name} ${product.variant} ${product.category || ''}`.toLowerCase().includes(term))
}))
const groupedProducts = computed<GroupedProduct[]>(() => groupStoreProducts(visibleProducts.value))
const detailGroup = ref<GroupedProduct | null>(null)

const benefits = computed(() => {
  const caps = store.value?.capabilities
  const list: { icon: any; title: string; text: string }[] = []
  if (!caps) return list
  if (caps.localDelivery) list.push({ icon: Truck, title: 'Entrega local', text: store.value?.delivery.freeAbove ? `Frete grátis acima de ${formatCurrencyBR(store.value.delivery.freeAbove)}` : 'Receba onde estiver' })
  if (caps.pickup) list.push({ icon: ShoppingBag, title: 'Retire na loja', text: 'Retirada rápida no balcão' })
  if (caps.onlinePayment) list.push({ icon: ShieldCheck, title: 'Compra segura', text: 'Pagamento online protegido' })
  if (caps.whatsapp) list.push({ icon: MessageCircle, title: 'Atendimento próximo', text: 'Finalize pelo WhatsApp' })
  return list
})
const brandStyle = computed(() => {
  const theme = store.value?.theme || {}
  const fonts: Record<string, string> = { Inter: 'Inter, sans-serif', system: 'system-ui, sans-serif', Georgia: 'Georgia, serif' }
  const radii: Record<string, string> = { none: '0', small: '.35rem', medio: '.75rem', grande: '1.25rem' }
  return { '--shop-primary': store.value?.colors.primary || '#4f46e5', '--shop-secondary': store.value?.colors.secondary || '#0ea5e9', '--shop-radius': radii[String(theme.radius)] || '.75rem', '--shop-font': fonts[String(theme.font)] || 'Inter, sans-serif', '--hero-position': String(theme.bannerFocalPoint || 'center'), '--shop-bg': '#fafaf9' }
})
const layoutClass = computed(() => `layout-${(store.value?.template || 'ESSENCIAL').toLowerCase()}`)
const gridDensityClass = computed(() => `grid-${String(store.value?.theme.gridDensity || 'confortavel')}`)
const cardStyleClass = computed(() => `card-${String(store.value?.theme.cardStyle || 'elevado')}`)
const heroHeightClass = computed(() => `hero-${String(store.value?.theme.bannerHeight || 'medio')}`)
const banner = computed(() => store.value?.banner.desktopUrl ? resolveFileUrl(store.value.banner.desktopUrl) : '')
const customerToken = () => localStorage.getItem(`gestao-facil:loja:${slug}:access-token`) || undefined

async function load() {
  try {
    store.value = await LojaRepository.getPublicStore(slug)
    products.value = (await LojaRepository.getPublicProducts(slug, { limit: 48 })).data
    checkout.channel = store.value.capabilities.whatsapp ? 'WHATSAPP' : 'GATEWAY'
    checkout.deliveryType = store.value.capabilities.pickup ? 'RETIRADA' : 'ENTREGA_LOCAL'
    document.title = `${store.value.identity.name} · ${isCommerce.value ? 'Loja online' : 'Catálogo online'}`
  } catch { invalid.value = true } finally { loading.value = false }
}

function groupSoldOut(group: GroupedProduct) {
  return group.totalAvailable === 0
}
function groupAvailableLabel(group: GroupedProduct) {
  if (!store.value?.capabilities.showAvailability || group.totalAvailable === null) return ''
  return group.totalAvailable > 0 ? `${group.totalAvailable} disponível(is)` : 'Esgotado'
}
function groupPriceLabel(group: GroupedProduct) {
  return group.priceFrom === group.priceTo
    ? formatCurrencyBR(group.priceFrom)
    : `A partir de ${formatCurrencyBR(group.priceFrom)}`
}
function cartQuantityOf(product: StoreProduct) {
  return cart.items.value.find((item) => item.product.id === product.id)?.quantity ?? 0
}
function addVariant(variant: StoreProduct, quantity: number) {
  cart.set(variant, cartQuantityOf(variant) + quantity)
  toast.success('Produto adicionado ao carrinho.')
}
/** Botão do card: variantes abrem o detalhe; produto único vai direto ao carrinho. */
function onCardAction(group: GroupedProduct) {
  if (!isCommerce.value || !store.value?.capabilities.quickAdd || group.hasVariants) {
    detailGroup.value = group
    return
  }
  addVariant(group.variants[0], 1)
}
function onDrawerSetQuantity({ productId, quantity }: { productId: number; quantity: number }) {
  const item = cart.items.value.find((entry) => entry.product.id === productId)
  if (item) cart.set(item.product, quantity)
}

async function finishOrder() {
  if (!cart.items.value.length) return
  checkout.items = cart.items.value.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
  try {
    checkingOut.value = true
    const result = await LojaRepository.placeOrder(slug, checkout, crypto.randomUUID(), customerToken())
    if (result.accessToken) localStorage.setItem(`gestao-facil:loja:${slug}:pedido:${result.order.publicId}`, result.accessToken)
    cart.clear(); cartOpen.value = false
    toast.success(`Pedido ${result.order.Uid} criado e estoque reservado.`)
    if (result.nextAction?.url) window.location.assign(result.nextAction.url)
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível concluir o pedido.')
  } finally { checkingOut.value = false }
}

onMounted(load)
</script>

<template>
  <div class="shop min-h-screen bg-stone-50 text-slate-950" :class="layoutClass" :style="brandStyle">
    <div v-if="loading" class="flex min-h-screen items-center justify-center gap-3 text-slate-500"><LoaderCircle class="h-5 w-5 animate-spin" /> Carregando loja...</div>
    <div v-else-if="invalid" class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"><ShieldX class="h-14 w-14 text-red-600" /><h1 class="text-2xl font-bold">Loja indisponível</h1><p class="text-slate-500">Confira o endereço ou fale com a empresa.</p></div>
    <template v-else-if="store">
      <div v-if="store.announcement.enabled && store.announcement.text" class="announcement px-4 py-2 text-center text-sm font-semibold text-white">{{ store.announcement.text }}</div>
      <header class="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur-md" :class="`header-${store.headerStyle}`">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div class="flex min-w-0 items-center gap-3">
            <img v-if="store.identity.logo" :src="resolveFileUrl(store.identity.logo)" :alt="store.identity.name" class="h-11 w-11 rounded-full border object-cover" />
            <div v-else class="grid h-11 w-11 place-items-center rounded-full text-white" :style="{ backgroundColor: 'var(--shop-primary)' }"><ShoppingBag class="h-6 w-6" /></div>
            <div><h1 class="truncate text-lg font-black leading-tight">{{ store.identity.name }}</h1><p class="text-xs text-slate-500">{{ isCommerce ? 'Loja online' : 'Catálogo online' }}</p></div>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2">
            <RouterLink v-if="store.capabilities.login" :to="`/lojas/${slug}/login`" class="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" aria-label="Minha conta">
              <UserRound class="h-5 w-5" /><span class="hidden sm:inline">Minha conta</span>
            </RouterLink>
            <button v-if="isCommerce" class="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white transition hover:brightness-110 sm:px-4" :style="{ backgroundColor: 'var(--shop-primary)' }" @click="cartOpen = true">
              <ShoppingCart class="h-5 w-5" /><span class="hidden sm:inline">Carrinho</span>
              <span v-if="cart.count.value" class="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-black text-slate-900">{{ cart.count.value }}</span>
            </button>
          </div>
        </div>
      </header>

      <section v-if="banner || store.banner.title" class="hero relative mx-auto max-w-[1600px] overflow-hidden" :class="heroHeightClass" :style="banner ? { backgroundImage: `url(${banner})` } : {}">
        <div class="absolute inset-0 bg-black" :style="{ opacity: Number(store.theme.bannerOverlay || 25) / 100 }"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
        <div class="relative mx-auto flex min-h-[280px] max-w-7xl flex-col justify-end px-5 py-10 text-white lg:min-h-[420px] lg:px-8">
          <p class="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[.2em] backdrop-blur">{{ isCommerce ? 'Compre online' : 'Conheça nossos produtos' }}</p>
          <h2 class="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight drop-shadow-sm sm:text-6xl">{{ store.banner.title || store.identity.name }}</h2>
          <p v-if="store.banner.subtitle" class="mt-3 max-w-2xl text-base text-white/90 sm:text-xl">{{ store.banner.subtitle }}</p>
          <div class="mt-6">
            <a href="#produtos" class="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:scale-[1.03]">
              {{ isCommerce ? 'Ver produtos' : 'Ver catálogo' }} <ShoppingCart class="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <!-- Faixa de vantagens -->
      <section v-if="benefits.length" class="border-b border-black/5 bg-white">
        <div class="mx-auto grid max-w-7xl gap-px px-4 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div v-for="item in benefits" :key="item.title" class="flex items-center gap-3 px-2 py-2">
            <div class="shop-tint grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--shop-primary)]"><component :is="item.icon" class="h-5 w-5" /></div>
            <div class="min-w-0"><p class="text-sm font-bold text-slate-900">{{ item.title }}</p><p class="truncate text-xs text-slate-500">{{ item.text }}</p></div>
          </div>
        </div>
      </section>

      <main id="produtos" class="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 lg:px-8">
        <p v-if="store.welcomeMessage" class="mb-6 max-w-3xl border-l-4 border-[var(--shop-primary)] pl-4 text-lg text-slate-600">{{ store.welcomeMessage }}</p>

        <!-- Barra de busca e categorias (fixa ao rolar) -->
        <div class="sticky top-[68px] z-20 -mx-4 mb-6 bg-[var(--shop-bg)] px-4 py-3 lg:top-[72px]">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="relative flex-1"><Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input v-model="search" class="h-11 rounded-full bg-white pl-9" placeholder="Buscar produtos" /></div>
            <div class="flex gap-2 overflow-x-auto pb-1">
              <button class="category-chip" :class="{ active: !category }" @click="category = null">Todos</button>
              <button v-for="item in categories" :key="item" class="category-chip" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
            </div>
          </div>
        </div>

        <div class="mb-4 flex items-baseline justify-between">
          <h2 class="text-xl font-black text-slate-900">{{ category || (isCommerce ? 'Nossos produtos' : 'Catálogo') }}</h2>
          <span v-if="groupedProducts.length" class="text-sm text-slate-500">{{ groupedProducts.length }} {{ groupedProducts.length === 1 ? 'item' : 'itens' }}</span>
        </div>

        <div v-if="groupedProducts.length" class="product-grid grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" :class="gridDensityClass">
          <article
            v-for="group in groupedProducts"
            :key="group.key"
            class="product-card group flex cursor-pointer flex-col overflow-hidden border border-black/10 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            :class="cardStyleClass"
            @click="detailGroup = group"
          >
            <div class="relative aspect-square overflow-hidden bg-slate-100">
              <img v-if="group.image" :src="resolveFileUrl(group.image)" :alt="group.name" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <Package v-else class="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
              <span v-if="group.hasVariants" class="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">{{ group.variants.length }} opções</span>
              <span v-if="groupSoldOut(group)" class="absolute inset-0 grid place-items-center bg-slate-950/45"><span class="rounded-full bg-slate-950/85 px-4 py-1.5 text-xs font-bold text-white">Esgotado</span></span>
            </div>
            <div class="flex min-h-[9rem] flex-col p-3 sm:p-4">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ group.category || 'Produto' }}</p>
              <h3 class="mt-1 line-clamp-2 font-bold leading-tight text-slate-900">{{ group.name }}</h3>
              <p v-if="groupAvailableLabel(group)" class="mt-1 text-xs" :class="groupSoldOut(group) ? 'text-red-600' : 'text-emerald-700'">{{ groupAvailableLabel(group) }}</p>
              <div class="mt-auto pt-3">
                <div v-if="store.capabilities.showPrices" class="leading-tight">
                  <span v-if="group.hasVariants && group.priceFrom !== group.priceTo" class="block text-[11px] text-slate-400">a partir de</span>
                  <span class="text-lg font-black text-[var(--shop-primary)]">{{ formatCurrencyBR(group.priceFrom) }}</span>
                </div>
                <Button
                  v-if="isCommerce && store.capabilities.quickAdd"
                  class="mt-2 w-full rounded-full text-white"
                  size="sm"
                  :disabled="groupSoldOut(group)"
                  @click.stop="onCardAction(group)"
                >
                  <Plus class="mr-1 h-4 w-4" /> {{ group.hasVariants ? 'Ver opções' : 'Adicionar' }}
                </Button>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="rounded-2xl border border-dashed py-24 text-center text-slate-500">
          <Package class="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p class="font-semibold text-slate-600">Nenhum produto encontrado</p>
          <p class="text-sm">Tente ajustar a busca ou o filtro de categoria.</p>
        </div>
      </main>

      <!-- Rodapé -->
      <footer class="mt-8 border-t border-black/5 bg-white">
        <div class="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center lg:flex-row lg:justify-between lg:text-left lg:px-8">
          <div class="flex items-center gap-3">
            <img v-if="store.identity.logo" :src="resolveFileUrl(store.identity.logo)" class="h-9 w-9 rounded-full border object-cover" />
            <div v-else class="grid h-9 w-9 place-items-center rounded-full text-white" :style="{ backgroundColor: 'var(--shop-primary)' }"><ShoppingBag class="h-5 w-5" /></div>
            <div><p class="font-black text-slate-900">{{ store.identity.name }}</p><p class="text-xs text-slate-500">{{ isCommerce ? 'Loja online' : 'Catálogo online' }}</p></div>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <span v-if="store.capabilities.onlinePayment" class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5"><CreditCard class="h-3.5 w-3.5" /> Pagamento seguro</span>
            <span v-if="store.capabilities.localDelivery" class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5"><Truck class="h-3.5 w-3.5" /> Entrega local</span>
            <span v-if="store.capabilities.whatsapp" class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5"><MessageCircle class="h-3.5 w-3.5" /> WhatsApp</span>
          </div>
          <p class="text-xs text-slate-400">© {{ new Date().getFullYear() }} {{ store.identity.name }}</p>
        </div>
      </footer>

      <ProductDetailModal
        :group="detailGroup"
        :store="store"
        :cart-quantity="cartQuantityOf"
        @update:open="detailGroup = null"
        @add="({ variant, quantity }) => addVariant(variant, quantity)"
      />

      <CartDrawer
        :open="cartOpen"
        :store="store"
        :items="cart.items.value"
        :subtotal="cart.subtotal.value"
        :checkout="checkout"
        :checking-out="checkingOut"
        @update:open="cartOpen = $event"
        @set-quantity="onDrawerSetQuantity"
        @finish="finishOrder"
      />
    </template>

    <StoreToaster :accent="store?.colors.primary" />
  </div>
</template>

<style scoped>
.announcement,.shop :deep(.bg-primary),.shop :deep(button.bg-primary){background:var(--shop-primary)}
.shop{font-family:var(--shop-font)}.hero{background-color:var(--shop-primary);background-position:var(--hero-position);background-size:cover}.hero-pequeno>div:last-child{min-height:240px}.hero-medio>div:last-child{min-height:360px}.hero-grande>div:last-child{min-height:520px}
.category-chip{white-space:nowrap;border:1px solid rgb(0 0 0/.12);border-radius:999px;background:white;padding:.55rem 1rem;font-size:.875rem;font-weight:500;transition:border-color .15s,background .15s,color .15s}.category-chip:hover{border-color:var(--shop-primary)}.category-chip.active{border-color:var(--shop-primary);background:var(--shop-primary);color:white}
.shop-tint{background:color-mix(in srgb,var(--shop-primary) 12%,white)}
.product-card{border-radius:var(--shop-radius)}.card-plano{box-shadow:none;border-color:transparent}.card-elevado{box-shadow:0 10px 25px rgb(15 23 42/.08)}.card-contorno{border-width:2px;box-shadow:none}.choice{display:flex;align-items:center;gap:.5rem;border:1px solid rgb(0 0 0/.12);border-radius:var(--shop-radius);background:white;padding:.75rem;font-size:.875rem;font-weight:600}.grid-compacta{gap:.5rem}.grid-arejada{gap:2rem}
.layout-editorial .hero{margin-top:1.5rem;border-radius:1.5rem}.layout-editorial .product-grid{gap:1.5rem}.layout-editorial .product-card{border-radius:0;box-shadow:none}.layout-editorial h2{font-family:Georgia,serif;font-weight:500}
.layout-impacto{background:#fff7ed}.layout-impacto .announcement{background:#111827}.layout-impacto .product-card{border:2px solid #111827;border-radius:1rem;box-shadow:5px 5px 0 #111827}.layout-impacto .category-chip{border:2px solid #111827;font-weight:800}.layout-impacto .category-chip.active{box-shadow:3px 3px 0 #111827}
@media(min-width:1024px){.layout-essencial .product-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
.header-centralizado>div{justify-content:center}.header-centralizado>div>div:last-child{position:absolute;right:1rem}.header-banner{border-bottom-width:2px;border-color:var(--shop-primary)}
</style>
