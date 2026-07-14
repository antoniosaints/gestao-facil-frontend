<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { LojaRepository, type CheckoutPayload, type PublicStore, type StoreProduct } from '@/repositories/loja-repository'
import { useStoreCart } from '@/composables/useStoreCart'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { LoaderCircle, Minus, Package, Plus, Search, ShieldX, ShoppingBag, Trash2, UserRound, X } from 'lucide-vue-next'

const route = useRoute()
const toast = useToast()
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
const brandStyle = computed(() => {
  const theme = store.value?.theme || {}
  const fonts: Record<string, string> = { Inter: 'Inter, sans-serif', system: 'system-ui, sans-serif', Georgia: 'Georgia, serif' }
  const radii: Record<string, string> = { none: '0', small: '.35rem', medio: '.75rem', grande: '1.25rem' }
  return { '--shop-primary': store.value?.colors.primary || '#4f46e5', '--shop-secondary': store.value?.colors.secondary || '#0ea5e9', '--shop-radius': radii[String(theme.radius)] || '.75rem', '--shop-font': fonts[String(theme.font)] || 'Inter, sans-serif', '--hero-position': String(theme.bannerFocalPoint || 'center') }
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

function availableLabel(product: StoreProduct) {
  if (!store.value?.capabilities.showAvailability || product.available === null) return ''
  return product.available > 0 ? `${product.available} disponível(is)` : 'Esgotado'
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
      <header class="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur" :class="`header-${store.headerStyle}`">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div class="flex min-w-0 items-center gap-3">
            <img v-if="store.identity.logo" :src="resolveFileUrl(store.identity.logo)" :alt="store.identity.name" class="h-11 w-11 rounded-full border object-cover" />
            <ShoppingBag v-else class="h-8 w-8 text-[var(--shop-primary)]" />
            <div><h1 class="truncate text-lg font-black">{{ store.identity.name }}</h1><p class="text-xs text-slate-500">{{ isCommerce ? 'Loja online' : 'Catálogo online' }}</p></div>
          </div>
          <div class="flex items-center gap-2">
            <RouterLink v-if="store.capabilities.login" :to="`/lojas/${slug}/login`" class="rounded-full p-2 hover:bg-slate-100" aria-label="Minha conta"><UserRound class="h-5 w-5" /></RouterLink>
            <Button v-if="isCommerce" class="relative rounded-full text-white" @click="cartOpen = true"><ShoppingBag class="mr-2 h-4 w-4" /> Carrinho <Badge v-if="cart.count.value" class="ml-2 bg-white text-slate-950">{{ cart.count.value }}</Badge></Button>
          </div>
        </div>
      </header>

      <section v-if="banner || store.banner.title" class="hero relative mx-auto max-w-[1600px] overflow-hidden" :class="heroHeightClass" :style="banner ? { backgroundImage: `url(${banner})` } : {}">
        <div class="absolute inset-0 bg-black" :style="{ opacity: Number(store.theme.bannerOverlay || 25) / 100 }"></div>
        <div class="relative mx-auto flex min-h-[280px] max-w-7xl flex-col justify-end px-5 py-10 text-white lg:min-h-[420px] lg:px-8">
          <p class="mb-2 text-sm font-bold uppercase tracking-[.2em]">{{ isCommerce ? 'Compre online' : 'Conheça nossos produtos' }}</p>
          <h2 class="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{{ store.banner.title || store.identity.name }}</h2>
          <p v-if="store.banner.subtitle" class="mt-3 max-w-2xl text-base text-white/90 sm:text-xl">{{ store.banner.subtitle }}</p>
        </div>
      </section>

      <main class="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <p v-if="store.welcomeMessage" class="mb-7 max-w-3xl text-lg text-slate-600">{{ store.welcomeMessage }}</p>
        <div class="mb-6 flex flex-col gap-3 sm:flex-row">
          <div class="relative flex-1"><Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input v-model="search" class="h-11 bg-white pl-9" placeholder="Buscar produtos" /></div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button class="category-chip" :class="{ active: !category }" @click="category = null">Todos</button>
            <button v-for="item in categories" :key="item" class="category-chip" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
          </div>
        </div>

        <div v-if="visibleProducts.length" class="product-grid grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" :class="gridDensityClass">
          <article v-for="product in visibleProducts" :key="product.id" class="product-card group overflow-hidden border border-black/10 bg-white" :class="cardStyleClass">
            <div class="relative aspect-square overflow-hidden bg-slate-100">
              <img v-if="product.image" :src="resolveFileUrl(product.image)" :alt="product.name" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <Package v-else class="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
              <span v-if="product.available === 0" class="absolute inset-x-3 bottom-3 rounded bg-slate-950/85 py-1 text-center text-xs font-bold text-white">Esgotado</span>
            </div>
            <div class="flex min-h-36 flex-col p-3 sm:p-4">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ product.category || 'Produto' }}</p>
              <h3 class="mt-1 font-bold leading-tight">{{ product.name }}</h3><p v-if="product.variant !== 'Padrão'" class="text-xs text-slate-500">{{ product.variant }}</p>
              <p v-if="availableLabel(product)" class="mt-1 text-xs" :class="product.available === 0 ? 'text-red-600' : 'text-emerald-700'">{{ availableLabel(product) }}</p>
              <div class="mt-auto flex items-end justify-between gap-2 pt-3">
                <span v-if="store.capabilities.showPrices" class="text-lg font-black text-[var(--shop-primary)]">{{ formatCurrencyBR(product.price) }}</span>
                <Button v-if="isCommerce && store.capabilities.quickAdd" size="icon" class="shrink-0 rounded-full text-white" :disabled="product.available === 0" :aria-label="`Adicionar ${product.name}`" @click="cart.add(product)"><Plus class="h-4 w-4" /></Button>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="py-24 text-center text-slate-500"><Package class="mx-auto mb-3 h-10 w-10" />Nenhum produto encontrado.</div>
      </main>

      <Dialog :open="cartOpen" @update:open="cartOpen = $event">
        <DialogContent class="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>Seu carrinho</DialogTitle></DialogHeader>
          <div v-if="!cart.items.value.length" class="py-12 text-center text-slate-500">Seu carrinho está vazio.</div>
          <template v-else>
            <div class="divide-y">
              <div v-for="item in cart.items.value" :key="item.product.id" class="flex gap-3 py-3">
                <img v-if="item.product.image" :src="resolveFileUrl(item.product.image)" class="h-16 w-16 rounded-lg object-cover" />
                <div class="min-w-0 flex-1"><p class="font-semibold">{{ item.product.name }}</p><p class="text-sm text-slate-500">{{ item.product.variant }}</p><p class="font-bold">{{ formatCurrencyBR(item.product.price * item.quantity) }}</p></div>
                <div class="flex items-center gap-1"><button class="rounded p-1 hover:bg-slate-100" @click="cart.set(item.product, item.quantity - 1)"><Minus class="h-4 w-4" /></button><span class="w-7 text-center">{{ item.quantity }}</span><button class="rounded p-1 hover:bg-slate-100" @click="cart.set(item.product, item.quantity + 1)"><Plus class="h-4 w-4" /></button><button class="ml-2 rounded p-1 text-red-600 hover:bg-red-50" @click="cart.set(item.product, 0)"><Trash2 class="h-4 w-4" /></button></div>
              </div>
            </div>
            <div class="rounded-xl bg-slate-50 p-4">
              <div class="mb-4 flex justify-between text-lg font-black"><span>Subtotal</span><span>{{ formatCurrencyBR(cart.subtotal.value) }}</span></div>
              <div class="grid gap-3 sm:grid-cols-2"><div><Label>Nome</Label><Input v-model="checkout.customer.name" /></div><div><Label>Telefone</Label><Input v-model="checkout.customer.phone" /></div><div class="sm:col-span-2"><Label>E-mail</Label><Input v-model="checkout.customer.email" type="email" /></div></div>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <label v-if="store.capabilities.pickup" class="choice"><input v-model="checkout.deliveryType" type="radio" value="RETIRADA" /> Retirada</label>
                <label v-if="store.capabilities.localDelivery" class="choice"><input v-model="checkout.deliveryType" type="radio" value="ENTREGA_LOCAL" /> Entrega local</label>
              </div>
              <div v-if="checkout.deliveryType === 'ENTREGA_LOCAL'" class="mt-3 grid gap-3 sm:grid-cols-3"><div><Label>CEP</Label><Input v-model="checkout.customer.postalCode" /></div><div class="sm:col-span-2"><Label>Endereço</Label><Input v-model="checkout.customer.address" /></div><div><Label>Número</Label><Input v-model="checkout.customer.number" /></div><div><Label>Bairro</Label><Input v-model="checkout.customer.district" /></div><div><Label>Cidade</Label><Input v-model="checkout.customer.city" /></div><div><Label>UF</Label><Input v-model="checkout.customer.state" maxlength="2" /></div></div>
              <div class="mt-4 grid gap-3 sm:grid-cols-2"><label v-if="store.capabilities.whatsapp" class="choice"><input v-model="checkout.channel" type="radio" value="WHATSAPP" /> Finalizar no WhatsApp</label><label v-if="store.capabilities.onlinePayment" class="choice"><input v-model="checkout.channel" type="radio" value="GATEWAY" /> Pagamento online</label></div>
              <Button class="mt-5 w-full text-white" :disabled="checkingOut || !checkout.customer.name || !checkout.customer.phone" @click="finishOrder"><LoaderCircle v-if="checkingOut" class="mr-2 h-4 w-4 animate-spin" /> Finalizar pedido</Button>
            </div>
          </template>
        </DialogContent>
      </Dialog>
    </template>
  </div>
</template>

<style scoped>
.announcement,.shop :deep(.bg-primary),.shop :deep(button.bg-primary){background:var(--shop-primary)}
.shop{font-family:var(--shop-font)}.hero{background-color:var(--shop-primary);background-position:var(--hero-position);background-size:cover}.hero-pequeno>div:last-child{min-height:240px}.hero-medio>div:last-child{min-height:360px}.hero-grande>div:last-child{min-height:520px}
.category-chip{white-space:nowrap;border:1px solid rgb(0 0 0/.12);border-radius:999px;background:white;padding:.55rem 1rem;font-size:.875rem}.category-chip.active{border-color:var(--shop-primary);background:var(--shop-primary);color:white}
.product-card{border-radius:var(--shop-radius)}.card-plano{box-shadow:none;border-color:transparent}.card-elevado{box-shadow:0 10px 25px rgb(15 23 42/.08)}.card-contorno{border-width:2px;box-shadow:none}.choice{display:flex;align-items:center;gap:.5rem;border:1px solid rgb(0 0 0/.12);border-radius:var(--shop-radius);background:white;padding:.75rem;font-size:.875rem;font-weight:600}.grid-compacta{gap:.5rem}.grid-arejada{gap:2rem}
.layout-editorial .hero{margin-top:1.5rem;border-radius:1.5rem}.layout-editorial .product-grid{gap:1.5rem}.layout-editorial .product-card{border-radius:0;box-shadow:none}.layout-editorial h2{font-family:Georgia,serif;font-weight:500}
.layout-impacto{background:#fff7ed}.layout-impacto .announcement{background:#111827}.layout-impacto .product-card{border:2px solid #111827;border-radius:1rem;box-shadow:5px 5px 0 #111827}.layout-impacto .category-chip{border:2px solid #111827;font-weight:800}.layout-impacto .category-chip.active{box-shadow:3px 3px 0 #111827}
@media(min-width:1024px){.layout-essencial .product-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
.header-centralizado>div{justify-content:center}.header-centralizado>div>div:last-child{position:absolute;right:1rem}.header-banner{border-bottom-width:2px;border-color:var(--shop-primary)}
</style>
