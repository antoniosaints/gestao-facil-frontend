<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { LojaRepository, type CheckoutPayload, type PublicStore, type StoreProduct } from '@/repositories/loja-repository'
import { useStoreCart } from '@/composables/useStoreCart'
import { useStoreToast } from '@/composables/useStoreToast'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import { randomUUID } from '@/utils/uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProductDetailModal from './components/ProductDetailModal.vue'
import CartDrawer from './components/CartDrawer.vue'
import StoreToaster from './components/StoreToaster.vue'
import BannerCarousel from './components/BannerCarousel.vue'
import { groupStoreProducts, type GroupedProduct } from './types'
import { ChevronDown, Clock, CreditCard, Instagram, LoaderCircle, Mail, MapPin, MessageCircle, Package, Phone, Plus, Search, ShieldCheck, ShieldX, ShoppingBag, ShoppingCart, Truck, UserRound, X } from 'lucide-vue-next'

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
const shopBg = computed(() => {
  const custom = store.value?.theme.bgColor
  if (custom) return String(custom)
  return store.value?.template === 'IMPACTO' ? '#fff7ed' : '#fafaf9'
})
const brandStyle = computed(() => {
  const theme = store.value?.theme || {}
  const fonts: Record<string, string> = { Inter: 'Inter, sans-serif', system: 'system-ui, sans-serif', Georgia: 'Georgia, serif' }
  const radii: Record<string, string> = { none: '0', small: '.35rem', medio: '.75rem', grande: '1.25rem' }
  return { '--shop-primary': store.value?.colors.primary || '#4f46e5', '--shop-secondary': store.value?.colors.secondary || '#0ea5e9', '--shop-radius': radii[String(theme.radius)] || '.75rem', '--shop-font': fonts[String(theme.font)] || 'Inter, sans-serif', '--hero-position': String(theme.bannerFocalPoint || 'center'), '--shop-bg': shopBg.value }
})
const layoutClass = computed(() => `layout-${(store.value?.template || 'ESSENCIAL').toLowerCase()}`)
const gridDensityClass = computed(() => `grid-${String(store.value?.theme.gridDensity || 'confortavel')}`)
const cardStyleClass = computed(() => `card-${String(store.value?.theme.cardStyle || 'elevado')}`)

// Identidade do cabeçalho (com sobrescrita pelo themeConfig)
const logoUrl = computed(() => {
  const custom = store.value?.theme.logoUrl
  return custom ? resolveFileUrl(String(custom)) : (store.value?.identity.logo ? resolveFileUrl(store.value.identity.logo) : '')
})
const headerTitle = computed(() => String(store.value?.theme.headerTitle || store.value?.identity.name || ''))
const headerSubtitle = computed(() => String(store.value?.theme.headerSubtitle || (isCommerce.value ? 'Loja online' : 'Catálogo online')))
const company = computed(() => store.value?.theme.company || null)
const hasCompanyInfo = computed(() => {
  const c = company.value
  return !!(c && (c.phone || c.whatsapp || c.email || c.address || c.instagram || c.facebook || c.hours || c.about || c.cnpj))
})

// Banners do carrossel: usa a lista do themeConfig; se vazia, cai no banner único.
const bannerImages = computed(() => {
  const list = (store.value?.theme.banners || []).filter(Boolean).map((ref) => resolveFileUrl(String(ref)))
  if (list.length) return list
  return store.value?.banner.desktopUrl ? [resolveFileUrl(store.value.banner.desktopUrl)] : []
})

const categoryOpen = ref(false)
const customerToken = () => localStorage.getItem(`gestao-facil:loja:${slug}:access-token`) || undefined

function selectCategory(value: string | null) {
  category.value = value
  categoryOpen.value = false
}

function socialUrl(kind: 'instagram' | 'facebook', value?: string | null) {
  if (!value) return '#'
  if (value.startsWith('http')) return value
  const handle = value.replace(/^@/, '')
  return kind === 'instagram' ? `https://instagram.com/${handle}` : `https://facebook.com/${handle}`
}
function whatsappUrl(value?: string | null) {
  if (!value) return '#'
  return `https://wa.me/${value.replace(/\D/g, '')}`
}

// Aplica as variáveis da marca no <html> para que componentes teleportados
// (modal, carrinho, toast) herdem cores e fonte da loja.
function applyRootTheme() {
  const el = document.documentElement
  Object.entries(brandStyle.value).forEach(([key, value]) => el.style.setProperty(key, String(value)))
}
onUnmounted(() => {
  const el = document.documentElement
  ;['--shop-primary', '--shop-secondary', '--shop-radius', '--shop-font', '--hero-position', '--shop-bg'].forEach((key) => el.style.removeProperty(key))
})

async function load() {
  try {
    store.value = await LojaRepository.getPublicStore(slug)
    products.value = (await LojaRepository.getPublicProducts(slug, { limit: 48 })).data
    checkout.channel = store.value.capabilities.whatsapp ? 'WHATSAPP' : 'GATEWAY'
    checkout.deliveryType = store.value.capabilities.pickup ? 'RETIRADA' : 'ENTREGA_LOCAL'
    document.title = `${store.value.identity.name} · ${isCommerce.value ? 'Loja online' : 'Catálogo online'}`
    applyRootTheme()
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
  const c = checkout.customer
  // Campos opcionais vazios precisam ir como `undefined` — string vazia reprova
  // as validações de e-mail/UF no backend e derruba o pedido.
  const payload: CheckoutPayload = {
    channel: checkout.channel,
    deliveryType: checkout.deliveryType,
    items: cart.items.value.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    customer: {
      name: c.name.trim(),
      phone: c.phone.trim(),
      email: c.email?.trim() || undefined,
      postalCode: c.postalCode?.trim() || undefined,
      address: c.address?.trim() || undefined,
      number: c.number?.trim() || undefined,
      complement: c.complement?.trim() || undefined,
      district: c.district?.trim() || undefined,
      city: c.city?.trim() || undefined,
      state: c.state?.trim() || undefined,
    },
  }
  try {
    checkingOut.value = true
    const result = await LojaRepository.placeOrder(slug, payload, randomUUID(), customerToken())
    if (result.accessToken) localStorage.setItem(`gestao-facil:loja:${slug}:pedido:${result.order.publicId}`, result.accessToken)
    cart.clear(); cartOpen.value = false
    toast.success(`Pedido ${result.order.Uid} criado.`)
    // A API já monta o link do pedido (WhatsApp) ou do pagamento; encaminha o cliente.
    if (result.nextAction?.url) window.location.assign(result.nextAction.url)
  } catch (error: any) {
    console.error('[loja] finishOrder falhou:', error)
    toast.error(error?.response?.data?.message || error?.message || 'Não foi possível concluir o pedido.')
  } finally { checkingOut.value = false }
}

onMounted(load)
</script>

<template>
  <div class="shop min-h-screen text-slate-950" :class="layoutClass" :style="[brandStyle, { backgroundColor: 'var(--shop-bg)' }]">
    <div v-if="loading" class="flex min-h-screen items-center justify-center gap-3 text-slate-500"><LoaderCircle class="h-5 w-5 animate-spin" /> Carregando loja...</div>
    <div v-else-if="invalid" class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"><ShieldX class="h-14 w-14 text-red-600" /><h1 class="text-2xl font-bold">Loja indisponível</h1><p class="text-slate-500">Confira o endereço ou fale com a empresa.</p></div>
    <template v-else-if="store">
      <div v-if="store.announcement.enabled && store.announcement.text" class="announcement px-4 py-2 text-center text-sm font-semibold text-white">{{ store.announcement.text }}</div>
      <header class="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur-md" :class="`header-${store.headerStyle}`">
        <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-8">
          <div class="flex min-w-0 items-center gap-3">
            <img v-if="logoUrl" :src="logoUrl" :alt="headerTitle" class="h-11 w-11 rounded-full border object-cover" />
            <div v-else class="grid h-11 w-11 place-items-center rounded-full text-white" :style="{ backgroundColor: 'var(--shop-primary)' }"><ShoppingBag class="h-6 w-6" /></div>
            <div class="min-w-0"><h1 class="truncate text-lg font-black leading-tight">{{ headerTitle }}</h1><p class="truncate text-xs text-slate-500">{{ headerSubtitle }}</p></div>
          </div>

          <!-- Busca no header (desktop) -->
          <div class="relative mx-auto hidden w-full max-w-xl md:block">
            <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input v-model="search" class="h-11 rounded-full border-slate-200 bg-slate-50 pl-10" placeholder="Buscar produtos" />
          </div>

          <div class="ml-auto flex items-center gap-1.5 sm:gap-2 md:ml-0">
            <RouterLink v-if="store.capabilities.login" :to="`/lojas/${slug}/login`" class="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" aria-label="Minha conta">
              <UserRound class="h-5 w-5" /><span class="hidden lg:inline">Minha conta</span>
            </RouterLink>
            <button v-if="isCommerce" class="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white transition hover:brightness-110 sm:px-4" :style="{ backgroundColor: 'var(--shop-primary)' }" @click="cartOpen = true">
              <ShoppingCart class="h-5 w-5" /><span class="hidden sm:inline">Carrinho</span>
              <span v-if="cart.count.value" class="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-black text-slate-900">{{ cart.count.value }}</span>
            </button>
          </div>
        </div>

        <!-- Nav de categorias -->
        <nav v-if="categories.length" class="border-t border-black/5">
          <div class="mx-auto flex max-w-7xl items-center gap-1 px-4 lg:px-8">
            <div class="relative">
              <button type="button" class="flex items-center gap-2 py-2.5 pr-4 text-sm font-bold text-slate-800" @click="categoryOpen = !categoryOpen">
                <span class="grid h-5 w-5 place-items-center"><span class="flex flex-col gap-[3px]"><span class="h-0.5 w-4 rounded bg-current" /><span class="h-0.5 w-4 rounded bg-current" /><span class="h-0.5 w-4 rounded bg-current" /></span></span>
                Todas categorias <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': categoryOpen }" />
              </button>
              <div v-if="categoryOpen" class="fixed inset-0 z-10" @click="categoryOpen = false" />
              <div v-if="categoryOpen" class="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border bg-white py-1 shadow-xl">
                <button class="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-slate-50" :class="!category ? 'font-bold text-[var(--shop-primary)]' : 'text-slate-700'" @click="selectCategory(null)">Todos os produtos</button>
                <button v-for="item in categories" :key="item" class="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-slate-50" :class="category === item ? 'font-bold text-[var(--shop-primary)]' : 'text-slate-700'" @click="selectCategory(item)">{{ item }}</button>
              </div>
            </div>
            <div class="hidden gap-1 overflow-x-auto md:flex">
              <button
                v-for="item in categories"
                :key="item"
                type="button"
                class="whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition"
                :class="category === item ? 'border-[var(--shop-primary)] text-[var(--shop-primary)]' : 'border-transparent text-slate-600 hover:text-slate-900'"
                @click="selectCategory(category === item ? null : item)"
              >{{ item }}</button>
            </div>
          </div>
        </nav>
      </header>

      <!-- Busca mobile -->
      <div class="border-b bg-white px-4 py-3 md:hidden">
        <div class="relative"><Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input v-model="search" class="h-11 rounded-full border-slate-200 bg-slate-50 pl-10" placeholder="Buscar produtos" /></div>
      </div>

      <BannerCarousel
        v-if="bannerImages.length || store.banner.title"
        :images="bannerImages"
        :overlay="Number(store.theme.bannerOverlay || 25)"
        :position="String(store.theme.bannerFocalPoint || 'center')"
        :height="String(store.theme.bannerHeight || 'medio')"
        class="mx-auto max-w-[1600px] text-white"
      >
        <p class="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[.2em] backdrop-blur">{{ isCommerce ? 'Compre online' : 'Conheça nossos produtos' }}</p>
        <h2 class="hero-title max-w-3xl text-4xl font-black leading-[1.05] tracking-tight drop-shadow-sm sm:text-6xl">{{ store.banner.title || headerTitle }}</h2>
        <p v-if="store.banner.subtitle" class="mt-3 max-w-2xl text-base text-white/90 sm:text-xl">{{ store.banner.subtitle }}</p>
      </BannerCarousel>

      <!-- Faixa de vantagens -->
      <section v-if="benefits.length" class="border-b border-black/5 bg-white">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-5 lg:px-8">
          <div v-for="item in benefits" :key="item.title" class="flex items-center gap-3">
            <div class="shop-tint grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--shop-primary)]"><component :is="item.icon" class="h-5 w-5" /></div>
            <div class="min-w-0"><p class="text-sm font-bold text-slate-900">{{ item.title }}</p><p class="text-xs text-slate-500">{{ item.text }}</p></div>
          </div>
        </div>
      </section>

      <main id="produtos" class="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 lg:px-8">
        <p v-if="store.welcomeMessage" class="mb-6 max-w-3xl border-l-4 border-[var(--shop-primary)] pl-4 text-lg text-slate-600">{{ store.welcomeMessage }}</p>

        <div class="mb-4 flex items-baseline justify-between gap-3">
          <h2 class="text-xl font-black text-slate-900">{{ category || (search ? 'Resultados da busca' : (isCommerce ? 'Nossos produtos' : 'Catálogo')) }}</h2>
          <div class="flex items-center gap-3">
            <button v-if="category || search" class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800" @click="category = null; search = ''"><X class="h-3.5 w-3.5" /> Limpar filtro</button>
            <span v-if="groupedProducts.length" class="text-sm text-slate-500">{{ groupedProducts.length }} {{ groupedProducts.length === 1 ? 'item' : 'itens' }}</span>
          </div>
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
        <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <!-- Marca -->
          <div class="lg:col-span-2">
            <div class="flex items-center gap-3">
              <img v-if="logoUrl" :src="logoUrl" class="h-10 w-10 rounded-full border object-cover" />
              <div v-else class="grid h-10 w-10 place-items-center rounded-full text-white" :style="{ backgroundColor: 'var(--shop-primary)' }"><ShoppingBag class="h-5 w-5" /></div>
              <p class="text-lg font-black text-slate-900">{{ headerTitle }}</p>
            </div>
            <p class="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">{{ company?.about || store.welcomeMessage || headerSubtitle }}</p>
            <div v-if="company?.instagram || company?.facebook || company?.whatsapp" class="mt-4 flex gap-2">
              <a v-if="company?.instagram" :href="socialUrl('instagram', company.instagram)" target="_blank" rel="noopener" class="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200" aria-label="Instagram"><Instagram class="h-4 w-4" /></a>
              <a v-if="company?.whatsapp" :href="whatsappUrl(company.whatsapp)" target="_blank" rel="noopener" class="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200" aria-label="WhatsApp"><MessageCircle class="h-4 w-4" /></a>
              <a v-if="company?.facebook" :href="socialUrl('facebook', company.facebook)" target="_blank" rel="noopener" class="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200" aria-label="Facebook"><span class="text-sm font-black">f</span></a>
            </div>
          </div>

          <!-- Contato -->
          <div v-if="hasCompanyInfo">
            <h3 class="mb-3 text-sm font-black uppercase tracking-wide text-slate-900">Contato</h3>
            <ul class="space-y-2 text-sm text-slate-600">
              <li v-if="company?.phone" class="flex items-center gap-2"><Phone class="h-4 w-4 text-[var(--shop-primary)]" /> {{ company.phone }}</li>
              <li v-if="company?.email" class="flex items-center gap-2"><Mail class="h-4 w-4 text-[var(--shop-primary)]" /> {{ company.email }}</li>
              <li v-if="company?.address" class="flex items-start gap-2"><MapPin class="mt-0.5 h-4 w-4 shrink-0 text-[var(--shop-primary)]" /> {{ company.address }}</li>
              <li v-if="company?.hours" class="flex items-start gap-2"><Clock class="mt-0.5 h-4 w-4 shrink-0 text-[var(--shop-primary)]" /> {{ company.hours }}</li>
            </ul>
          </div>

          <!-- Vantagens -->
          <div>
            <h3 class="mb-3 text-sm font-black uppercase tracking-wide text-slate-900">A loja</h3>
            <ul class="space-y-2 text-sm text-slate-600">
              <li v-if="store.capabilities.onlinePayment" class="flex items-center gap-2"><CreditCard class="h-4 w-4 text-[var(--shop-primary)]" /> Pagamento seguro</li>
              <li v-if="store.capabilities.localDelivery" class="flex items-center gap-2"><Truck class="h-4 w-4 text-[var(--shop-primary)]" /> Entrega local</li>
              <li v-if="store.capabilities.pickup" class="flex items-center gap-2"><ShoppingBag class="h-4 w-4 text-[var(--shop-primary)]" /> Retirada na loja</li>
              <li v-if="store.capabilities.whatsapp" class="flex items-center gap-2"><MessageCircle class="h-4 w-4 text-[var(--shop-primary)]" /> Pedidos por WhatsApp</li>
            </ul>
          </div>
        </div>
        <div class="border-t border-black/5">
          <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row lg:px-8">
            <span>© {{ new Date().getFullYear() }} {{ headerTitle }}. Todos os direitos reservados.</span>
            <span v-if="company?.cnpj">CNPJ {{ company.cnpj }}</span>
          </div>
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
.shop{font-family:var(--shop-font)}
.shop-tint{background:color-mix(in srgb,var(--shop-primary) 12%,white)}
.product-card{border-radius:var(--shop-radius)}.card-plano{box-shadow:none;border-color:transparent}.card-elevado{box-shadow:0 10px 25px rgb(15 23 42/.08)}.card-contorno{border-width:2px;box-shadow:none}.grid-compacta{gap:.5rem}.grid-arejada{gap:2rem}
.layout-editorial .product-grid{gap:1.5rem}.layout-editorial .product-card{border-radius:0;box-shadow:none}
.layout-impacto .announcement{background:#111827}.layout-impacto .product-card{border:2px solid #111827;border-radius:1rem;box-shadow:5px 5px 0 #111827}
@media(min-width:1024px){.layout-essencial .product-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
.header-banner{border-bottom-width:2px;border-color:var(--shop-primary)}
</style>
