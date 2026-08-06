<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type CSSProperties } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Bike, Check, CheckCircle2, ChevronRight, Clipboard, Clock3, History, LoaderCircle, LocateFixed, MapPin, Minus, Plus, Search, ShoppingBag, ShoppingCart, Store, Trash2, Truck, UtensilsCrossed } from 'lucide-vue-next'
import { RestauranteRepository, type RestauranteCheckoutPreview, type RestaurantePublicOrderTracking } from '@/repositories/restaurante-repository'
import { useStorefrontLightTheme } from '@/composables/useStorefrontLightTheme'
import { formatCurrencyBR } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'
import { getThemePalette, hexToHslValue, normalizeThemeCustomization } from '@/utils/themeCustomization'
import { calculateMenuItemUnitPrice, updateMenuGroupSelection } from './publicMenuCart'
import { parseTrackingTokens, prependTrackingToken } from './publicMenuHistory'

const route = useRoute()
const toast = useToast()
useStorefrontLightTheme()
const loading = ref(true)
const sending = ref(false)
const previewing = ref(false)
const checkoutOpen = ref(false)
const cartDrawerOpen = ref(false)
const itemDialogOpen = ref(false)
const cardapio = ref<any>(null)
const quantities = ref<Record<number, number>>({})
const selections = ref<Record<number, number[]>>({})
const quote = ref<RestauranteCheckoutPreview | null>(null)
const orderResult = ref<any>(null)
const tracking = ref<any>(null)
const historyOpen = ref(false)
const historyLoading = ref(false)
const orderHistory = ref<Array<RestaurantePublicOrderTracking & { trackingToken: string }>>([])
const searchTerm = ref('')
const activeCategory = ref('todos')
const activeItem = ref<any>(null)
const draftQuantity = ref(1)
const draftSelections = ref<number[]>([])
const origem = ref<'RETIRADA' | 'DELIVERY'>('RETIRADA')
const pagamento = ref<'NA_ENTREGA' | 'PIX' | 'CHECKOUT_PRO'>('NA_ENTREGA')
let previewTimer: ReturnType<typeof setTimeout> | null = null
let previewSequence = 0
const form = reactive({
  nome: '',
  telefone: '',
  email: '',
  observacao: '',
  cep: '',
  cidade: '',
  bairro: '',
  logradouro: '',
  numero: '',
  complemento: '',
  referencia: '',
  latitude: null as number | null,
  longitude: null as number | null,
})

function normalize(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function itemName(item: any) {
  return item.nomePublico || item.Produto.nome
}

function itemDescription(item: any) {
  return item.descricao || 'Feito com cuidado e ingredientes selecionados.'
}

function itemImage(item: any) {
  return resolveFileUrl(item.imagem || item.Produto.imagem)
}

function categoryInfo(item: any) {
  const category = item.Produto?.ProdutoBase?.Categoria
  return category ? { key: String(category.id), name: category.nome } : { key: 'destaques', name: 'Destaques' }
}

const categoryGroups = computed(() => {
  const groups = new Map<string, { key: string; name: string; items: any[] }>()
  for (const item of cardapio.value?.itens || []) {
    const category = categoryInfo(item)
    if (!groups.has(category.key)) groups.set(category.key, { ...category, items: [] })
    groups.get(category.key)!.items.push(item)
  }
  return [...groups.values()]
})

const categories = computed(() => [{ key: 'todos', name: 'Todos' }, ...categoryGroups.value.map(({ key, name }) => ({ key, name }))])

const visibleGroups = computed(() => {
  const term = normalize(searchTerm.value.trim())
  return categoryGroups.value
    .filter((group) => activeCategory.value === 'todos' || group.key === activeCategory.value)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !term || normalize(`${itemName(item)} ${itemDescription(item)} ${group.name}`).includes(term)),
    }))
    .filter((group) => group.items.length)
})

const selecionados = computed(() => (cardapio.value?.itens || []).filter((item: any) => quantities.value[item.id] > 0))
const cartUnits = computed(() => selecionados.value.reduce((total: number, item: any) => total + quantities.value[item.id], 0))
const logo = computed(() => resolveFileUrl(cardapio.value?.restaurante.logo))
const payloadItems = computed(() =>
  selecionados.value.map((item: any) => ({
    catalogoItemId: item.id,
    quantidade: quantities.value[item.id],
    selecaoIds: selections.value[item.id] || [],
  })),
)
const estimatedSubtotal = computed(() => selecionados.value.reduce((total: number, item: any) => total + calculateMenuItemUnitPrice(item, selections.value[item.id] || []) * quantities.value[item.id], 0))
const activeUnitPrice = computed(() => (activeItem.value ? calculateMenuItemUnitPrice(activeItem.value, draftSelections.value) : 0))
const menuThemeStyle = computed<CSSProperties>(() => {
  const theme = normalizeThemeCustomization(cardapio.value?.restaurante.temaPersonalizado)
  const palette = getThemePalette(theme, 'light')
  return {
    '--menu-bg': palette.body,
    '--menu-surface': palette.card,
    '--menu-ink': palette.foreground,
    '--menu-muted': palette.mutedForeground,
    '--menu-accent': palette.primary,
    '--menu-accent-foreground': palette.primaryForeground,
    '--menu-secondary': palette.sidebar,
    '--menu-secondary-foreground': palette.sidebarForeground,
    '--primary': hexToHslValue(palette.primary),
    '--primary-foreground': hexToHslValue(palette.primaryForeground),
    '--ring': hexToHslValue(palette.primary),
    '--app-font': theme.fonte,
  } as CSSProperties
})
const addressComplete = computed(() => origem.value === 'RETIRADA' || [form.cep.replace(/\D/g, ''), form.cidade, form.bairro, form.logradouro, form.numero].every((value) => value.trim().length > 0))
const checkoutValid = computed(() => form.nome.trim().length >= 2 && form.telefone.replace(/\D/g, '').length >= 8 && addressComplete.value && selecionados.value.length > 0)
const activeSelectionsValid = computed(
  () =>
    !activeItem.value ||
    activeItem.value.grupos.every((link: any) => {
      const selected = link.Grupo.opcoes.filter((option: any) => draftSelections.value.includes(option.id)).length
      return selected >= link.Grupo.minimo && selected <= link.Grupo.maximo
    }),
)

function invalidateCart() {
  quote.value = null
  orderResult.value = null
}

function trackingStorageKey() {
  return `restaurante:trackingTokens:${String(route.params.slug)}`
}

function storedTrackingTokens() {
  return parseTrackingTokens(localStorage.getItem(trackingStorageKey()))
}

function saveTrackingToken(token: string) {
  const tokens = prependTrackingToken(storedTrackingTokens(), token)
  localStorage.setItem(trackingStorageKey(), JSON.stringify(tokens))
  localStorage.setItem('restaurante:trackingToken', token)
  return tokens
}

async function loadOrderHistory(tokens = storedTrackingTokens()) {
  if (!tokens.length) {
    orderHistory.value = []
    tracking.value = null
    return
  }
  historyLoading.value = true
  const results = await Promise.allSettled(
    tokens.map(async (trackingToken) => ({
      ...(await RestauranteRepository.acompanharPedido(trackingToken)),
      trackingToken,
    })),
  )
  orderHistory.value = results
    .filter((result): result is PromiseFulfilledResult<RestaurantePublicOrderTracking & { trackingToken: string }> => result.status === 'fulfilled')
    .map((result) => result.value)
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
  localStorage.setItem(trackingStorageKey(), JSON.stringify(orderHistory.value.map((order) => order.trackingToken)))
  tracking.value = orderHistory.value[0] || null
  historyLoading.value = false
}

function change(id: number, delta: number) {
  quantities.value[id] = Math.max(0, (quantities.value[id] || 0) + delta)
  if (!quantities.value[id]) delete quantities.value[id]
  invalidateCart()
}

function removeItem(id: number) {
  delete quantities.value[id]
  delete selections.value[id]
  invalidateCart()
}

function openItem(item: any) {
  activeItem.value = item
  draftQuantity.value = quantities.value[item.id] || 1
  draftSelections.value = [...(selections.value[item.id] || [])]
  itemDialogOpen.value = true
}

function quickAdd(item: any) {
  if (item.grupos.length) return openItem(item)
  change(item.id, 1)
}

function toggleDraft(group: any, optionId: number) {
  const groupIds = group.opcoes.map((option: any) => option.id)
  draftSelections.value = updateMenuGroupSelection(draftSelections.value, groupIds, optionId, Number(group.maximo))
}

function saveActiveItem() {
  if (!activeItem.value) return
  if (!activeSelectionsValid.value) {
    return toast.info('Complete as escolhas obrigatórias antes de adicionar.')
  }
  quantities.value[activeItem.value.id] = draftQuantity.value
  selections.value[activeItem.value.id] = [...draftSelections.value]
  invalidateCart()
  itemDialogOpen.value = false
}

function selectedOptionNames(item: any) {
  const selectedIds = selections.value[item.id] || []
  return item.grupos.flatMap((link: any) => link.Grupo.opcoes.filter((option: any) => selectedIds.includes(option.id)).map((option: any) => option.nome))
}

function selectedCount(group: any) {
  return group.opcoes.filter((option: any) => draftSelections.value.includes(option.id)).length
}

function lineTotal(item: any) {
  return calculateMenuItemUnitPrice(item, selections.value[item.id] || []) * quantities.value[item.id]
}

function checkoutPayload() {
  return {
    origem: origem.value,
    itens: payloadItems.value,
    ...(origem.value === 'DELIVERY'
      ? {
          endereco: {
            cep: form.cep,
            cidade: form.cidade,
            bairro: form.bairro,
            logradouro: form.logradouro,
            numero: form.numero,
            complemento: form.complemento || null,
            referencia: form.referencia || null,
            latitude: form.latitude,
            longitude: form.longitude,
          },
        }
      : {}),
  }
}

async function carregar() {
  try {
    cardapio.value = await RestauranteRepository.cardapioPublico(String(route.params.slug))
    origem.value = cardapio.value.restaurante.retiradaAtiva ? 'RETIRADA' : 'DELIVERY'
    pagamento.value = cardapio.value.restaurante.pagamentoNaEntregaAtivo ? 'NA_ENTREGA' : 'PIX'
    const routeToken = String(route.query.pedido || '')
    const legacyToken = String(localStorage.getItem('restaurante:trackingToken') || '')
    let tokens = storedTrackingTokens()
    if (legacyToken) tokens = prependTrackingToken(tokens, legacyToken)
    if (routeToken) tokens = prependTrackingToken(tokens, routeToken)
    await loadOrderHistory(tokens)
  } catch {
    toast.error('Cardápio indisponível.')
  } finally {
    loading.value = false
  }
}

async function previewCheckout(showFeedback = true) {
  if (!addressComplete.value) {
    if (showFeedback) toast.info('Preencha o endereço para calcular a entrega.')
    return null
  }
  const sequence = ++previewSequence
  try {
    previewing.value = true
    const nextQuote = await RestauranteRepository.previaCheckoutPublico(String(route.params.slug), checkoutPayload())
    if (sequence !== previewSequence) return null
    quote.value = nextQuote
    return nextQuote
  } catch (error: any) {
    if (sequence !== previewSequence) return null
    quote.value = null
    if (showFeedback) toast.error(error?.response?.data?.error?.message || 'Não foi possível calcular o pedido.')
    return null
  } finally {
    if (sequence === previewSequence) previewing.value = false
  }
}

function scheduleCheckoutPreview() {
  if (previewTimer) clearTimeout(previewTimer)
  previewSequence += 1
  quote.value = null
  previewing.value = false
  if (!checkoutOpen.value || !addressComplete.value || !selecionados.value.length) return
  previewTimer = setTimeout(() => void previewCheckout(false), 350)
}

async function openCheckout() {
  cartDrawerOpen.value = false
  checkoutOpen.value = true
  if (addressComplete.value && !quote.value) await previewCheckout(false)
}

async function pedir() {
  if (!checkoutValid.value) return toast.info('Preencha os dados necessários para finalizar.')
  const currentQuote = quote.value || (await previewCheckout())
  if (!currentQuote) return
  if (!currentQuote.minimumReached) {
    return toast.info(`O pedido mínimo é ${formatCurrencyBR(Number(currentQuote.minimumOrder))}.`)
  }
  try {
    sending.value = true
    const result = await RestauranteRepository.criarPedidoPublico(
      String(route.params.slug),
      {
        ...checkoutPayload(),
        cliente: { nome: form.nome, telefone: form.telefone, email: form.email || null },
        observacao: form.observacao || undefined,
        pagamento: pagamento.value,
      },
      crypto.randomUUID(),
    )
    orderResult.value = result
    const tokens = saveTrackingToken(result.trackingToken)
    await loadOrderHistory(tokens)
    quantities.value = {}
    selections.value = {}
    if (result.paymentAction?.type === 'REDIRECT' && result.paymentAction.url) {
      window.location.assign(result.paymentAction.url)
      return
    }
    toast.success(`Pedido ${result.pedido.codigo} criado!`)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível enviar o pedido.')
  } finally {
    sending.value = false
  }
}

function useLocation() {
  if (!navigator.geolocation) return toast.info('Geolocalização não disponível neste navegador.')
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      form.latitude = coords.latitude
      form.longitude = coords.longitude
      toast.success('Localização adicionada ao endereço')
    },
    () => toast.error('Não foi possível obter sua localização.'),
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

async function copyPix() {
  const code = orderResult.value?.paymentAction?.pixCopiaCola
  if (!code) return
  await navigator.clipboard.writeText(code)
  toast.success('Código Pix copiado')
}

function humanize(value: string) {
  return value.split('_').join(' ').toLocaleLowerCase('pt-BR')
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function clearSearch() {
  searchTerm.value = ''
  activeCategory.value = 'todos'
}

watch(searchTerm, () => {
  activeCategory.value = 'todos'
})
watch(() => [origem.value, form.cep, form.cidade, form.bairro, form.logradouro, form.numero, form.complemento, form.referencia, JSON.stringify(payloadItems.value)], scheduleCheckoutPreview)

onMounted(carregar)
onBeforeUnmount(() => {
  if (previewTimer) clearTimeout(previewTimer)
})
</script>

<template>
  <main class="restaurant-menu min-h-screen pb-28 lg:pb-12" :style="menuThemeStyle">
    <div v-if="loading" class="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
      <Skeleton class="h-56 rounded-[28px]" />
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="grid gap-4 md:grid-cols-2">
          <Skeleton v-for="n in 6" :key="n" class="h-44 rounded-2xl" />
        </div>
        <Skeleton class="hidden h-[420px] rounded-3xl lg:block" />
      </div>
    </div>

    <div v-else-if="!cardapio" class="mx-auto flex min-h-screen max-w-xl items-center px-6 py-20 text-center">
      <div class="w-full rounded-[28px] bg-white p-10 shadow-[0_0_0_1px_rgba(43,37,32,.06),0_18px_50px_rgba(43,37,32,.08)] dark:bg-zinc-900">
        <Store class="mx-auto mb-4 h-10 w-10 text-stone-400" />
        <h1 class="text-balance text-2xl font-semibold">Cardápio indisponível</h1>
        <p class="mt-2 text-pretty text-sm text-stone-500">Este restaurante ainda não publicou o cardápio ou está temporariamente indisponível.</p>
      </div>
    </div>

    <template v-else>
      <section class="menu-hero">
        <div class="menu-hero-pattern" />
        <div class="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-7 pt-16 sm:px-6 sm:pb-9">
          <div class="flex w-full flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div class="flex min-w-0 items-center gap-4 sm:gap-5">
              <div class="logo-shell shrink-0">
                <img :src="logo" :alt="`Logo de ${cardapio.restaurante.nome}`" class="h-full w-full rounded-[18px] object-contain" />
              </div>
              <div class="min-w-0 text-white">
                <div class="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-white/80"><span>Cardápio online</span><span class="h-1 w-1 rounded-full bg-white/70" /><span>Pedido seguro</span></div>
                <h1 class="menu-title truncate text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  {{ cardapio.restaurante.nome }}
                </h1>
                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-200">
                  <span v-if="cardapio.restaurante.deliveryAtivo" class="flex items-center gap-1.5"><Bike class="h-4 w-4 text-white/80" />Delivery</span>
                  <span v-if="cardapio.restaurante.retiradaAtiva" class="flex items-center gap-1.5"><Store class="h-4 w-4 text-white/80" />Retirada</span>
                  <span class="flex items-center gap-1.5"><Clock3 class="h-4 w-4 text-white/80" />Pedido online</span>
                </div>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-2">
              <button type="button" class="hero-action" @click="historyOpen = true">
                <History class="h-4 w-4" />
                <span>Meus pedidos</span>
                <span v-if="orderHistory.length" class="hero-action-count">{{ orderHistory.length }}</span>
              </button>
              <div class="hero-action cursor-default">
                <span class="relative flex h-2.5 w-2.5"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" /><span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
                <span>Recebendo pedidos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="menu-toolbar sticky top-0 z-30">
        <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="relative lg:w-80">
              <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input v-model="searchTerm" class="h-11 rounded-xl border-0 bg-stone-100 pl-10 shadow-none focus-visible:ring-primary/30" placeholder="Buscar no cardápio" />
            </div>
            <div class="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
              <button v-for="category in categories" :key="category.key" type="button" class="category-chip" :class="{ active: activeCategory === category.key }" @click="activeCategory = category.key">
                {{ category.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div v-if="tracking" class="mb-6 flex flex-col gap-3 rounded-2xl bg-emerald-50 p-4 shadow-[0_0_0_1px_rgba(5,150,105,.14)] sm:flex-row sm:items-center sm:justify-between dark:bg-emerald-950/30">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white"><CheckCircle2 class="h-5 w-5" /></span>
            <div>
              <p class="font-semibold">Pedido {{ tracking.codigo }}</p>
              <p class="text-sm text-emerald-800/70 dark:text-emerald-200/70">{{ humanize(tracking.status) }} · pagamento {{ humanize(tracking.pagamentoStatus) }}</p>
            </div>
          </div>
          <Badge class="w-fit bg-emerald-600 text-white hover:bg-emerald-600">Acompanhamento ativo</Badge>
        </div>

        <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section class="min-w-0 space-y-9">
            <div v-if="!visibleGroups.length" class="rounded-[24px] bg-white px-6 py-16 text-center shadow-[0_0_0_1px_rgba(43,37,32,.06)] dark:bg-zinc-900">
              <Search class="mx-auto mb-3 h-8 w-8 text-stone-300" />
              <h2 class="font-semibold">Nenhum item encontrado</h2>
              <p class="mt-1 text-sm text-stone-500">Tente outro termo ou volte para todas as categorias.</p>
              <Button class="mt-5 tap-button" variant="outline" @click="clearSearch">Limpar busca</Button>
            </div>

            <section v-for="group in visibleGroups" :key="group.key" :id="`categoria-${group.key}`" class="menu-section">
              <div class="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p class="brand-text mb-1 text-xs font-semibold uppercase tracking-[0.16em]">Explore</p>
                  <h2 class="menu-heading text-balance text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                    {{ group.name }}
                  </h2>
                </div>
                <span class="text-sm text-stone-500">{{ group.items.length }} {{ group.items.length === 1 ? 'opção' : 'opções' }}</span>
              </div>

              <div class="grid gap-3 md:grid-cols-2">
                <article v-for="item in group.items" :key="item.id" class="product-card group" @click="openItem(item)">
                  <div class="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <div v-if="quantities[item.id]" class="brand-soft mb-2 w-fit rounded-full px-2.5 py-1 text-xs font-semibold">{{ quantities[item.id] }} no carrinho</div>
                    <h3 class="text-balance text-base font-semibold leading-snug sm:text-lg">
                      {{ itemName(item) }}
                    </h3>
                    <p class="mt-1.5 line-clamp-2 text-pretty text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                      {{ itemDescription(item) }}
                    </p>
                    <div class="mt-auto flex items-end justify-between gap-3 pt-4">
                      <div>
                        <p v-if="item.grupos.length" class="text-[11px] font-medium uppercase tracking-wide text-stone-400">A partir de</p>
                        <p class="price text-base font-bold text-stone-950 dark:text-white">
                          {{ formatCurrencyBR(Number(item.Produto.preco)) }}
                        </p>
                      </div>
                      <button type="button" class="add-button" :aria-label="`Adicionar ${itemName(item)}`" @click.stop="quickAdd(item)">
                        <Plus class="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div v-if="itemImage(item)" class="product-image-wrap">
                    <img :src="itemImage(item)" :alt="itemName(item)" class="product-image" />
                  </div>
                  <div v-else class="product-placeholder"><UtensilsCrossed class="h-8 w-8" /><span>Feito na casa</span></div>
                </article>
              </div>
            </section>
          </section>

          <aside class="sticky top-[92px] hidden lg:block">
            <div class="cart-card">
              <div class="flex items-center justify-between px-5 pb-4 pt-5">
                <div>
                  <p class="brand-text text-xs font-semibold uppercase tracking-[0.14em]">Seu pedido</p>
                  <h2 class="menu-heading mt-0.5 text-xl font-semibold">Carrinho</h2>
                </div>
                <span class="flex h-9 min-w-9 items-center justify-center rounded-full bg-stone-100 px-2 text-sm font-semibold tabular-nums dark:bg-zinc-800">{{ cartUnits }}</span>
              </div>
              <Separator />
              <div v-if="!selecionados.length" class="px-6 py-12 text-center">
                <span class="brand-soft mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"><ShoppingBag class="h-6 w-6" /></span>
                <p class="mt-4 font-semibold">Seu carrinho está vazio</p>
                <p class="mt-1 text-pretty text-sm text-stone-500">Escolha seus favoritos para começar o pedido.</p>
              </div>
              <div v-else>
                <div class="max-h-[46vh] space-y-1 overflow-y-auto px-3 py-3">
                  <div v-for="item in selecionados" :key="item.id" class="cart-line">
                    <div class="min-w-0 flex-1">
                      <button type="button" class="brand-hover block max-w-full truncate text-left text-sm font-semibold" @click="openItem(item)">
                        {{ itemName(item) }}
                      </button>
                      <p v-if="selectedOptionNames(item).length" class="mt-0.5 line-clamp-2 text-xs text-stone-500">
                        {{ selectedOptionNames(item).join(', ') }}
                      </p>
                      <p class="price mt-1.5 text-sm font-semibold">
                        {{ formatCurrencyBR(lineTotal(item)) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1">
                      <button type="button" class="quantity-button" :aria-label="`Diminuir ${itemName(item)}`" @click="change(item.id, -1)">
                        <Minus class="h-3.5 w-3.5" />
                      </button>
                      <span class="w-7 text-center text-sm font-semibold tabular-nums">{{ quantities[item.id] }}</span>
                      <button type="button" class="quantity-button" :aria-label="`Aumentar ${itemName(item)}`" @click="change(item.id, 1)">
                        <Plus class="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button type="button" class="delete-button" :aria-label="`Remover ${itemName(item)}`" @click="removeItem(item.id)">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Separator />
                <div class="space-y-4 p-5">
                  <div class="flex items-end justify-between">
                    <div>
                      <p class="text-xs text-stone-500">Subtotal estimado</p>
                      <p class="price text-xl font-bold">
                        {{ formatCurrencyBR(estimatedSubtotal) }}
                      </p>
                    </div>
                    <span class="text-xs text-stone-400">sem frete</span>
                  </div>
                  <Button class="brand-button tap-button h-12 w-full rounded-xl text-base" @click="openCheckout">Continuar pedido<ChevronRight class="ml-auto h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div v-if="selecionados.length" class="fixed inset-x-0 bottom-0 z-40 p-3 lg:hidden">
        <button type="button" class="mobile-cart-bar" @click="cartDrawerOpen = true">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><ShoppingCart class="h-5 w-5" /></span>
          <span class="min-w-0 flex-1 text-left"
            ><span class="block text-xs opacity-80">{{ cartUnits }} {{ cartUnits === 1 ? 'item' : 'itens' }}</span
            ><strong class="price block truncate text-base">Ver carrinho · {{ formatCurrencyBR(estimatedSubtotal) }}</strong></span
          >
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>
    </template>

    <Dialog v-model:open="itemDialogOpen">
      <DialogContent class="menu-overlay max-h-[92vh] max-w-2xl overflow-y-auto border-0 p-0 sm:rounded-[24px]" :style="menuThemeStyle">
        <template v-if="activeItem">
          <div v-if="itemImage(activeItem)" class="h-52 overflow-hidden sm:h-64 sm:rounded-t-[24px]">
            <img :src="itemImage(activeItem)" :alt="itemName(activeItem)" class="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10" />
          </div>
          <div class="p-5 sm:p-7">
            <DialogHeader class="text-left">
              <DialogTitle class="menu-heading text-balance text-2xl tracking-[-0.025em]">{{ itemName(activeItem) }}</DialogTitle>
              <DialogDescription class="text-pretty leading-relaxed">{{ itemDescription(activeItem) }}</DialogDescription>
            </DialogHeader>

            <div class="mt-6 space-y-6">
              <section v-for="link in activeItem.grupos" :key="link.grupoId">
                <div class="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 class="font-semibold">{{ link.Grupo.nome }}</h3>
                    <p class="text-xs text-stone-500">Escolha de {{ link.Grupo.minimo }} até {{ link.Grupo.maximo }} · {{ selectedCount(link.Grupo) }} selecionado(s)</p>
                  </div>
                  <Badge :variant="selectedCount(link.Grupo) >= link.Grupo.minimo ? 'secondary' : 'destructive'">{{ link.Grupo.minimo > 0 ? 'Obrigatório' : 'Opcional' }}</Badge>
                </div>
                <div class="space-y-2">
                  <button v-for="option in link.Grupo.opcoes" :key="option.id" type="button" class="option-row" :class="{ selected: draftSelections.includes(option.id) }" @click="toggleDraft(link.Grupo, option.id)">
                    <span class="option-check"><Check class="h-3.5 w-3.5" /></span>
                    <span class="min-w-0 flex-1 text-left text-sm font-medium">{{ option.nome }}</span>
                    <span v-if="Number(option.precoAdicional) > 0" class="price text-sm font-semibold text-stone-600 dark:text-stone-300">+ {{ formatCurrencyBR(Number(option.precoAdicional)) }}</span>
                  </button>
                </div>
              </section>
            </div>

            <div class="mt-7 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
              <div class="flex h-12 items-center justify-between rounded-xl bg-stone-100 p-1 dark:bg-zinc-800 sm:w-36">
                <button type="button" class="quantity-button h-10 w-10 bg-white dark:bg-zinc-900" :disabled="draftQuantity <= 1" @click="draftQuantity--">
                  <Minus class="h-4 w-4" />
                </button>
                <strong class="tabular-nums">{{ draftQuantity }}</strong>
                <button type="button" class="quantity-button h-10 w-10 bg-white dark:bg-zinc-900" @click="draftQuantity++">
                  <Plus class="h-4 w-4" />
                </button>
              </div>
              <Button class="brand-button tap-button h-12 flex-1 rounded-xl text-base" :disabled="!activeSelectionsValid" @click="saveActiveItem">
                {{ quantities[activeItem.id] ? 'Atualizar carrinho' : 'Adicionar ao carrinho' }}
                <span class="price ml-auto">{{ formatCurrencyBR(activeUnitPrice * draftQuantity) }}</span>
              </Button>
            </div>
          </div>
        </template>
      </DialogContent>
    </Dialog>

    <Drawer v-model:open="cartDrawerOpen">
      <DrawerContent class="menu-overlay max-h-[88vh] rounded-t-[24px] border-0" :style="menuThemeStyle">
        <DrawerHeader class="text-left"
          ><DrawerTitle class="menu-heading text-xl">Seu carrinho</DrawerTitle><DrawerDescription>{{ cartUnits }} {{ cartUnits === 1 ? 'item selecionado' : 'itens selecionados' }}</DrawerDescription></DrawerHeader
        >
        <div class="overflow-y-auto px-4">
          <div v-for="item in selecionados" :key="item.id" class="cart-line border-b py-4 last:border-0">
            <div class="min-w-0 flex-1">
              <button type="button" class="truncate text-left text-sm font-semibold" @click="openItem(item)">
                {{ itemName(item) }}
              </button>
              <p v-if="selectedOptionNames(item).length" class="mt-0.5 line-clamp-2 text-xs text-stone-500">
                {{ selectedOptionNames(item).join(', ') }}
              </p>
              <p class="price mt-1.5 text-sm font-bold">{{ formatCurrencyBR(lineTotal(item)) }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" class="quantity-button" @click="change(item.id, -1)">
                <Minus class="h-3.5 w-3.5" /></button
              ><span class="w-7 text-center text-sm font-semibold tabular-nums">{{ quantities[item.id] }}</span
              ><button type="button" class="quantity-button" @click="change(item.id, 1)">
                <Plus class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        <DrawerFooter class="border-t bg-white dark:bg-zinc-950">
          <div class="mb-1 flex items-end justify-between">
            <span class="text-sm text-stone-500">Subtotal</span><strong class="price text-xl">{{ formatCurrencyBR(estimatedSubtotal) }}</strong>
          </div>
          <Button class="brand-button tap-button h-12 rounded-xl text-base" @click="openCheckout">Continuar pedido<ChevronRight class="ml-auto" /></Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <Dialog v-model:open="checkoutOpen">
      <DialogContent class="menu-overlay max-h-[94vh] max-w-4xl overflow-y-auto border-0 p-0 sm:rounded-[24px]" :style="menuThemeStyle">
        <template v-if="orderResult">
          <div class="p-6 sm:p-9">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-emerald-100 text-emerald-700">
              <CheckCircle2 class="h-8 w-8" />
            </div>
            <DialogHeader class="mt-5 text-center"
              ><DialogTitle class="menu-heading text-3xl">Pedido {{ orderResult.pedido.codigo }} recebido!</DialogTitle><DialogDescription>Agora é só acompanhar o pagamento e o preparo por este navegador.</DialogDescription></DialogHeader
            >
            <div class="mx-auto mt-7 max-w-lg space-y-4">
              <div class="flex justify-between rounded-2xl bg-stone-100 p-4 dark:bg-zinc-800">
                <span>Total do pedido</span><strong class="price text-lg">{{ formatCurrencyBR(Number(orderResult.pedido.total)) }}</strong>
              </div>
              <div v-if="orderResult.paymentAction?.type === 'PIX'" class="brand-soft space-y-3 rounded-2xl p-5">
                <p class="font-semibold">Pague com Pix</p>
                <p class="break-all text-sm text-stone-600 dark:text-stone-300">
                  {{ orderResult.paymentAction.pixCopiaCola }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <Button class="tap-button" @click="copyPix"><Clipboard class="mr-2 h-4 w-4" />Copiar Pix</Button><Button v-if="orderResult.paymentAction.url" as-child variant="outline"><a :href="orderResult.paymentAction.url" target="_blank" rel="noopener noreferrer">Abrir pagamento</a></Button>
                </div>
              </div>
              <p v-else class="rounded-2xl bg-stone-100 p-4 text-sm text-stone-600 dark:bg-zinc-800 dark:text-stone-300">O pagamento será realizado na {{ origem === 'DELIVERY' ? 'entrega' : 'retirada' }}.</p>
            </div>
            <DialogFooter class="mt-7 sm:justify-center"><Button class="tap-button h-11 rounded-xl px-7" @click="checkoutOpen = false">Voltar ao cardápio</Button></DialogFooter>
          </div>
        </template>

        <template v-else>
          <div class="border-b px-6 py-5 sm:px-8">
            <DialogHeader class="text-left"><DialogTitle class="menu-heading text-2xl">Finalizar pedido</DialogTitle><DialogDescription>Confirme como deseja receber e seus dados de contato.</DialogDescription></DialogHeader>
          </div>
          <div class="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="space-y-6 p-6 sm:p-8">
              <section class="space-y-3">
                <div>
                  <h3 class="font-semibold">Como deseja receber?</h3>
                  <p class="text-sm text-stone-500">Escolha a opção mais conveniente.</p>
                </div>
                <RadioGroup v-model="origem" class="grid gap-3 sm:grid-cols-2"
                  ><label v-if="cardapio?.restaurante.retiradaAtiva" class="choice-card" :class="{ selected: origem === 'RETIRADA' }"
                    ><RadioGroupItem value="RETIRADA" /><span class="choice-icon"><Store class="h-5 w-5" /></span><span><strong class="block text-sm">Retirar no local</strong><small class="text-stone-500">Sem taxa de entrega</small></span></label
                  ><label v-if="cardapio?.restaurante.deliveryAtivo" class="choice-card" :class="{ selected: origem === 'DELIVERY' }"
                    ><RadioGroupItem value="DELIVERY" /><span class="choice-icon"><Truck class="h-5 w-5" /></span><span><strong class="block text-sm">Receber por delivery</strong><small class="text-stone-500">Entregamos no endereço</small></span></label
                  ></RadioGroup
                >
              </section>

              <section class="space-y-3">
                <div>
                  <h3 class="font-semibold">Seus dados</h3>
                  <p class="text-sm text-stone-500">Usaremos o telefone para atualizações do pedido.</p>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2"><Label for="customer-name">Nome</Label><Input id="customer-name" v-model="form.nome" placeholder="Como podemos chamar você?" /></div>
                  <div class="space-y-2"><Label for="customer-phone">Telefone</Label><Input id="customer-phone" v-model="form.telefone" inputmode="tel" placeholder="(00) 00000-0000" /></div>
                  <div class="space-y-2 sm:col-span-2"><Label for="customer-email">E-mail</Label><Input id="customer-email" v-model="form.email" type="email" placeholder="Necessário para pagamentos online" /></div>
                </div>
              </section>

              <section v-if="origem === 'DELIVERY'" class="space-y-4 rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 class="flex items-center gap-2 font-semibold"><MapPin class="brand-text h-4 w-4" />Endereço de entrega</h3>
                    <p class="text-xs text-stone-500">Preencha para calcular a taxa.</p>
                  </div>
                  <Button size="sm" variant="outline" class="tap-button" @click="useLocation"><LocateFixed class="mr-2 h-4 w-4" />Usar localização</Button>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="space-y-1"><Label>CEP</Label><Input v-model="form.cep" placeholder="00000-000" /></div>
                  <div class="space-y-1"><Label>Cidade</Label><Input v-model="form.cidade" /></div>
                  <div class="space-y-1"><Label>Bairro</Label><Input v-model="form.bairro" /></div>
                  <div class="space-y-1"><Label>Logradouro</Label><Input v-model="form.logradouro" /></div>
                  <div class="space-y-1"><Label>Número</Label><Input v-model="form.numero" /></div>
                  <div class="space-y-1"><Label>Complemento</Label><Input v-model="form.complemento" /></div>
                  <div class="space-y-1 sm:col-span-2"><Label>Referência</Label><Input v-model="form.referencia" /></div>
                </div>
              </section>

              <section class="space-y-3">
                <div>
                  <h3 class="font-semibold">Pagamento</h3>
                  <p class="text-sm text-stone-500">Selecione como prefere pagar.</p>
                </div>
                <RadioGroup v-model="pagamento" class="grid gap-3 sm:grid-cols-3"
                  ><label v-if="cardapio?.restaurante.pagamentoNaEntregaAtivo" class="choice-card compact" :class="{ selected: pagamento === 'NA_ENTREGA' }"><RadioGroupItem value="NA_ENTREGA" /><span class="text-sm font-medium">Na entrega</span></label
                  ><label v-if="cardapio?.restaurante.pagamentoOnlineAtivo" class="choice-card compact" :class="{ selected: pagamento === 'PIX' }"><RadioGroupItem value="PIX" /><span class="text-sm font-medium">Pix</span></label
                  ><label v-if="cardapio?.restaurante.pagamentoOnlineAtivo" class="choice-card compact" :class="{ selected: pagamento === 'CHECKOUT_PRO' }"><RadioGroupItem value="CHECKOUT_PRO" /><span class="text-sm font-medium">Cartão online</span></label></RadioGroup
                >
              </section>
              <div class="space-y-2"><Label for="order-note">Observação do pedido</Label><Textarea id="order-note" v-model="form.observacao" rows="3" placeholder="Ex.: tirar cebola, chamar no portão..." /></div>
            </div>

            <aside class="border-t bg-stone-50 p-6 dark:bg-zinc-900 lg:border-l lg:border-t-0 sm:p-7">
              <h3 class="menu-heading text-lg font-semibold">Resumo do pedido</h3>
              <div class="mt-4 space-y-4">
                <div v-for="item in selecionados" :key="item.id" class="flex gap-3 text-sm">
                  <span class="brand-soft flex h-6 min-w-6 items-center justify-center rounded-md text-xs font-bold">{{ quantities[item.id] }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium">{{ itemName(item) }}</p>
                    <p v-if="selectedOptionNames(item).length" class="mt-0.5 text-xs text-stone-500">
                      {{ selectedOptionNames(item).join(', ') }}
                    </p>
                  </div>
                  <span class="price font-medium">{{ formatCurrencyBR(lineTotal(item)) }}</span>
                </div>
              </div>
              <Separator class="my-5" />
              <div v-if="quote" class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-stone-500">Subtotal</span><span class="price">{{ formatCurrencyBR(Number(quote.subtotal)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-stone-500"
                    >Frete <small v-if="quote.zone">({{ quote.zone.nome }})</small></span
                  ><span class="price">{{ formatCurrencyBR(Number(quote.frete)) }}</span>
                </div>
                <div class="flex justify-between pt-2 text-lg">
                  <strong>Total</strong><strong class="price">{{ formatCurrencyBR(Number(quote.total)) }}</strong>
                </div>
                <p v-if="!quote.minimumReached" class="rounded-lg bg-red-50 p-2 text-xs text-red-700">Pedido mínimo: {{ formatCurrencyBR(Number(quote.minimumOrder)) }}</p>
              </div>
              <div v-else class="space-y-2">
                <div class="flex justify-between text-lg">
                  <strong>{{ previewing ? 'Calculando total' : 'Subtotal' }}</strong
                  ><strong class="price flex items-center gap-2"><LoaderCircle v-if="previewing" class="h-4 w-4 animate-spin" />{{ formatCurrencyBR(estimatedSubtotal) }}</strong>
                </div>
                <p v-if="origem === 'DELIVERY' && !addressComplete" class="text-xs text-stone-500">Preencha o endereço para calcular automaticamente o frete e o total.</p>
              </div>
              <Button class="brand-button tap-button mt-5 h-12 w-full rounded-xl text-base" :disabled="sending || previewing || !checkoutValid || !quote?.minimumReached" @click="pedir"><LoaderCircle v-if="sending" class="mr-2 h-4 w-4 animate-spin" />Confirmar pedido</Button>
              <p class="mt-3 text-center text-[11px] leading-relaxed text-stone-400">Valores e disponibilidade são confirmados pelo restaurante antes da criação do pedido.</p>
            </aside>
          </div>
        </template>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="historyOpen">
      <DialogContent class="menu-overlay max-h-[90vh] max-w-2xl overflow-y-auto border-0 p-0 sm:rounded-[24px]" :style="menuThemeStyle">
        <div class="border-b px-6 py-5 sm:px-8">
          <DialogHeader class="text-left">
            <DialogTitle class="menu-heading flex items-center gap-2 text-2xl"><History class="h-5 w-5 brand-text" />Meus pedidos</DialogTitle>
            <DialogDescription>Pedidos feitos neste restaurante por este navegador.</DialogDescription>
          </DialogHeader>
        </div>
        <div class="space-y-3 p-5 sm:p-7">
          <div v-if="historyLoading" class="flex items-center justify-center gap-2 py-12 text-sm text-stone-500"><LoaderCircle class="h-5 w-5 animate-spin" />Carregando pedidos...</div>
          <div v-else-if="!orderHistory.length" class="py-12 text-center">
            <ShoppingBag class="mx-auto mb-3 h-9 w-9 text-stone-300" />
            <p class="font-semibold">Nenhum pedido neste navegador</p>
            <p class="mt-1 text-sm text-stone-500">Quando você finalizar um pedido, ele aparecerá aqui.</p>
          </div>
          <template v-else>
            <article v-for="order in orderHistory" :key="order.trackingToken" class="history-order">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="font-semibold">Pedido {{ order.codigo }}</p>
                  <p class="mt-0.5 text-xs text-stone-500">
                    {{ formatOrderDate(order.createdAt) }} ·
                    {{ order.origem === 'DELIVERY' ? 'Delivery' : 'Retirada' }}
                  </p>
                </div>
                <Badge variant="secondary">{{ humanize(order.status) }}</Badge>
              </div>
              <div class="mt-3 space-y-1.5 text-sm text-stone-600">
                <p v-for="item in order.itens" :key="`${order.codigo}-${item.nomeSnapshot}`" class="flex justify-between gap-3">
                  <span>{{ Number(item.quantidade) }}× {{ item.nomeSnapshot }}</span
                  ><span class="price shrink-0">{{ formatCurrencyBR(Number(item.subtotalSnapshot)) }}</span>
                </p>
              </div>
              <div class="mt-3 flex items-center justify-between border-t pt-3">
                <span class="text-xs text-stone-500">Pagamento {{ humanize(order.pagamentoStatus) }}</span
                ><strong class="price">{{ formatCurrencyBR(Number(order.total)) }}</strong>
              </div>
            </article>
          </template>
        </div>
      </DialogContent>
    </Dialog>
  </main>
</template>

<style scoped>
.restaurant-menu {
  --menu-bg: #f6f3ef;
  --menu-surface: #fffdfa;
  --menu-ink: #29231f;
  --menu-muted: #786f68;
  --menu-accent: #c2410c;
  --menu-accent-foreground: #ffffff;
  --menu-secondary: #7c2d12;
  --menu-secondary-foreground: #ffffff;
  background: var(--menu-bg);
  color: var(--menu-ink);
  font-family: var(--app-font, 'Inter'), sans-serif;
  -webkit-font-smoothing: antialiased;
}

.menu-title,
.menu-heading {
  font-family: 'Sora', var(--app-font, sans-serif);
}

.menu-hero {
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--menu-accent-foreground) 20%, transparent), transparent 28%), linear-gradient(120deg, var(--menu-secondary) 0%, color-mix(in srgb, var(--menu-secondary) 62%, var(--menu-accent)) 54%, var(--menu-accent) 100%);
}

.hero-action {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  border-radius: 14px;
  padding: 0 14px;
  color: white;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  transition:
    background-color 150ms ease-out,
    scale 150ms ease-out;
}
button.hero-action:hover {
  background: rgba(255, 255, 255, 0.2);
}
button.hero-action:active {
  scale: 0.97;
}
.hero-action-count {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0 6px;
  color: var(--menu-accent);
  background: white;
  font-size: 11px;
  font-weight: 700;
}

.menu-hero-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.22;
  background-image: radial-gradient(rgba(255, 255, 255, 0.18) 0.8px, transparent 0.8px);
  background-size: 18px 18px;
  mask-image: linear-gradient(to right, black, transparent 85%);
}

.logo-shell {
  width: 84px;
  height: 84px;
  border-radius: 24px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.18),
    0 16px 32px rgba(0, 0, 0, 0.22);
}

.menu-toolbar {
  border-bottom: 1px solid rgba(43, 37, 32, 0.07);
  background: color-mix(in srgb, var(--menu-surface) 92%, transparent);
  backdrop-filter: blur(16px);
}

.category-chip {
  min-height: 40px;
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 0 16px;
  color: var(--menu-muted);
  font-size: 0.875rem;
  font-weight: 600;
  transition-property: color, background-color, box-shadow, scale;
  transition-duration: 160ms;
  transition-timing-function: ease-out;
}

.category-chip:hover {
  color: var(--menu-ink);
  background: rgba(120, 113, 108, 0.09);
}
.category-chip:active {
  scale: 0.96;
}
.category-chip.active {
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--menu-accent) 25%, transparent);
}

.product-card {
  min-height: 172px;
  display: flex;
  cursor: pointer;
  overflow: hidden;
  border-radius: 20px;
  background: var(--menu-surface);
  box-shadow:
    0 0 0 1px rgba(43, 37, 32, 0.06),
    0 2px 5px rgba(43, 37, 32, 0.035);
  transition-property: transform, box-shadow;
  transition-duration: 180ms;
  transition-timing-function: ease-out;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1px rgba(43, 37, 32, 0.09),
    0 14px 32px rgba(43, 37, 32, 0.09);
}
.product-card:active {
  transform: translateY(0) scale(0.99);
}

.product-image-wrap,
.product-placeholder {
  width: 144px;
  min-height: 172px;
  flex: 0 0 144px;
}
.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  outline: 1px solid rgba(0, 0, 0, 0.08);
  outline-offset: -1px;
  transition: transform 280ms ease-out;
}
.product-card:hover .product-image {
  transform: scale(1.035);
}
.product-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--menu-accent);
  background: linear-gradient(145deg, color-mix(in srgb, var(--menu-accent) 5%, white), color-mix(in srgb, var(--menu-accent) 13%, white));
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.add-button {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: 0 7px 16px color-mix(in srgb, var(--menu-accent) 24%, transparent);
  transition-property: background-color, scale;
  transition-duration: 150ms;
}
.add-button:hover {
  background: color-mix(in srgb, var(--menu-accent) 88%, black);
}
.add-button:active {
  scale: 0.96;
}

.cart-card {
  overflow: hidden;
  border-radius: 24px;
  background: var(--menu-surface);
  box-shadow:
    0 0 0 1px rgba(43, 37, 32, 0.06),
    0 18px 46px rgba(43, 37, 32, 0.09);
}
.cart-line {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  padding: 11px 10px;
}
.cart-line:hover {
  background: rgba(120, 113, 108, 0.055);
}

.quantity-button,
.delete-button {
  display: flex;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition-property: color, background-color, scale;
  transition-duration: 150ms;
}
.quantity-button {
  color: var(--menu-ink);
  background: rgba(120, 113, 108, 0.09);
}
.delete-button {
  color: #a8a29e;
}
.quantity-button:hover {
  background: rgba(120, 113, 108, 0.16);
}
.delete-button:hover {
  color: #dc2626;
  background: #fef2f2;
}
.quantity-button:active,
.delete-button:active {
  scale: 0.96;
}

.mobile-cart-bar {
  display: flex;
  width: 100%;
  min-height: 64px;
  align-items: center;
  gap: 12px;
  border-radius: 18px;
  padding: 9px 14px 9px 10px;
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: 0 16px 42px color-mix(in srgb, var(--menu-accent) 30%, transparent);
  transition-property: scale, background-color;
  transition-duration: 150ms;
}
.mobile-cart-bar:active {
  scale: 0.96;
}

.option-row {
  display: flex;
  width: 100%;
  min-height: 50px;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(120, 113, 108, 0.06);
  box-shadow: inset 0 0 0 1px transparent;
  transition-property: background-color, box-shadow, scale;
  transition-duration: 150ms;
}
.option-row:hover {
  background: rgba(120, 113, 108, 0.1);
}
.option-row:active {
  scale: 0.99;
}
.option-row.selected {
  background: color-mix(in srgb, var(--menu-accent) 9%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--menu-accent) 42%, transparent);
}
.option-check {
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  color: transparent;
  background: white;
  box-shadow: inset 0 0 0 1px rgba(120, 113, 108, 0.22);
  transition-property: color, background-color, scale;
  transition-duration: 150ms;
}
.option-row.selected .option-check {
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: none;
}

.choice-card {
  display: flex;
  min-height: 76px;
  cursor: pointer;
  align-items: center;
  gap: 12px;
  border-radius: 16px;
  padding: 13px;
  background: rgba(120, 113, 108, 0.055);
  box-shadow: inset 0 0 0 1px rgba(120, 113, 108, 0.12);
  transition-property: background-color, box-shadow, scale;
  transition-duration: 150ms;
}
.choice-card:hover {
  background: rgba(120, 113, 108, 0.09);
}
.choice-card:active {
  scale: 0.98;
}
.choice-card.selected {
  background: color-mix(in srgb, var(--menu-accent) 9%, white);
  box-shadow: inset 0 0 0 1.5px var(--menu-accent);
}
.choice-card.compact {
  min-height: 52px;
}
.choice-icon {
  display: flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  color: var(--menu-accent);
  background: white;
  box-shadow: 0 0 0 1px rgba(43, 37, 32, 0.06);
}

.menu-overlay {
  color: var(--menu-ink);
  background: var(--menu-surface);
  font-family: var(--app-font, 'Inter'), sans-serif;
}
.brand-button {
  color: var(--menu-accent-foreground) !important;
  background-color: var(--menu-accent) !important;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--menu-accent) 24%, transparent);
}
.brand-button:hover {
  background: color-mix(in srgb, var(--menu-accent) 88%, black);
}
.brand-text {
  color: var(--menu-accent);
}
.brand-hover:hover {
  color: var(--menu-accent);
}
.brand-soft {
  color: var(--menu-accent);
  background: color-mix(in srgb, var(--menu-accent) 10%, white);
}
.history-order {
  border-radius: 18px;
  padding: 16px;
  background: color-mix(in srgb, var(--menu-accent) 3%, white);
  box-shadow: inset 0 0 0 1px rgba(43, 37, 32, 0.08);
}

.tap-button {
  transition-property: transform, background-color, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.tap-button:active:not(:disabled) {
  transform: scale(0.96);
}
.price {
  font-variant-numeric: tabular-nums;
}
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

@media (max-width: 639px) {
  .logo-shell {
    width: 70px;
    height: 70px;
    border-radius: 20px;
  }
  .product-card {
    min-height: 154px;
  }
  .product-image-wrap,
  .product-placeholder {
    width: 118px;
    min-height: 154px;
    flex-basis: 118px;
  }
}
</style>
