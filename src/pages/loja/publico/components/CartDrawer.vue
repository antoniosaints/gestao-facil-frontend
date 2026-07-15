<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import type { CheckoutPayload, PublicStore } from '@/repositories/loja-repository'
import type { StoreCartItem } from '@/composables/useStoreCart'
import { ArrowLeft, LoaderCircle, Minus, Package, Plus, ShoppingBag, Trash2, Truck, X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  store: PublicStore
  items: StoreCartItem[]
  subtotal: number
  checkout: CheckoutPayload
  checkingOut: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'set-quantity', payload: { productId: number; quantity: number }): void
  (e: 'finish'): void
}>()

const step = ref<'cart' | 'checkout'>('cart')

watch(
  () => props.open,
  (value) => { if (!value) step.value = 'cart' },
)
watch(
  () => props.items.length,
  (length) => { if (length === 0) step.value = 'cart' },
)

const freeAbove = computed(() => props.store.delivery.freeAbove)
const deliveryFee = computed(() => {
  if (props.checkout.deliveryType !== 'ENTREGA_LOCAL') return 0
  if (freeAbove.value !== null && props.subtotal >= freeAbove.value) return 0
  return props.store.delivery.fixedFee || 0
})
const total = computed(() => props.subtotal + deliveryFee.value)
const freeShippingRemaining = computed(() => {
  if (freeAbove.value === null || props.subtotal >= freeAbove.value) return 0
  return freeAbove.value - props.subtotal
})
const freeShippingProgress = computed(() => {
  if (freeAbove.value === null || freeAbove.value === 0) return 0
  return Math.min(100, (props.subtotal / freeAbove.value) * 100)
})

const canFinish = computed(() => !!props.checkout.customer.name.trim() && !!props.checkout.customer.phone.trim())

function close() { emit('update:open', false) }
</script>

<template>
  <Teleport to="body">
    <Transition name="cart-fade">
      <div v-if="open" class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm" @click="close" />
    </Transition>
    <Transition name="cart-slide">
      <aside
        v-if="open"
        class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        :style="{ '--shop-primary': store.colors.primary, fontFamily: 'var(--shop-font)' }"
      >
        <!-- Cabeçalho -->
        <header class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div class="flex items-center gap-2">
            <button v-if="step === 'checkout'" class="rounded-full p-1 hover:bg-slate-100" aria-label="Voltar" @click="step = 'cart'"><ArrowLeft class="h-5 w-5" /></button>
            <ShoppingBag v-else class="h-5 w-5 text-[var(--shop-primary)]" />
            <h2 class="text-lg font-black text-slate-900">{{ step === 'cart' ? 'Seu carrinho' : 'Finalizar pedido' }}</h2>
          </div>
          <button class="rounded-full p-1 text-slate-500 hover:bg-slate-100" aria-label="Fechar" @click="close"><X class="h-5 w-5" /></button>
        </header>

        <!-- Vazio -->
        <div v-if="!items.length" class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-slate-500">
          <div class="grid h-16 w-16 place-items-center rounded-full bg-slate-100"><ShoppingBag class="h-7 w-7 text-slate-400" /></div>
          <p class="font-semibold text-slate-700">Seu carrinho está vazio</p>
          <p class="text-sm">Adicione produtos para começar seu pedido.</p>
          <Button variant="outline" class="mt-2 rounded-full dark:bg-white dark:border-background/50" @click="close">Continuar comprando</Button>
        </div>

        <template v-else>
          <!-- Passo 1: itens -->
          <div v-show="step === 'cart'" class="flex-1 overflow-y-auto px-5 py-4">
            <div
              v-if="freeAbove !== null && store.capabilities.localDelivery"
              class="free-ship mb-4 rounded-xl border p-3 text-sm"
            >
              <p v-if="freeShippingRemaining > 0" class="flex items-center gap-2 font-medium text-slate-700">
                <Truck class="h-4 w-4 text-[var(--shop-primary)]" /> Faltam {{ formatCurrencyBR(freeShippingRemaining) }} para frete grátis
              </p>
              <p v-else class="flex items-center gap-2 font-semibold text-emerald-700"><Truck class="h-4 w-4" /> Você ganhou frete grátis!</p>
              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div class="h-full rounded-full bg-[var(--shop-primary)] transition-all" :style="{ width: `${freeShippingProgress}%` }" /></div>
            </div>

            <ul class="divide-y divide-slate-200">
              <li v-for="item in items" :key="item.product.id" class="flex gap-3 py-4">
                <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-slate-100">
                  <img v-if="item.product.image" :src="resolveFileUrl(item.product.image)" class="h-full w-full object-cover" />
                  <Package v-else class="mx-auto mt-6 h-7 w-7 text-slate-300" />
                </div>
                <div class="flex min-w-0 flex-1 flex-col">
                  <p class="truncate font-bold text-slate-900">{{ item.product.name }}</p>
                  <p v-if="item.product.variant && item.product.variant !== 'Padrão'" class="text-xs text-slate-500">{{ item.product.variant }}</p>
                  <div class="mt-auto flex items-center justify-between pt-2">
                    <div class="flex items-center rounded-full border border-slate-300">
                      <button class="grid h-8 w-8 place-items-center rounded-l-full text-slate-600 hover:bg-slate-100" @click="emit('set-quantity', { productId: item.product.id, quantity: item.quantity - 1 })"><Minus class="h-3.5 w-3.5" /></button>
                      <span class="w-8 text-center text-sm font-bold dark:text-black">{{ item.quantity }}</span>
                      <button class="grid h-8 w-8 place-items-center rounded-r-full text-slate-600 hover:bg-slate-100" @click="emit('set-quantity', { productId: item.product.id, quantity: item.quantity + 1 })"><Plus class="h-3.5 w-3.5" /></button>
                    </div>
                    <span class="font-black text-slate-900">{{ formatCurrencyBR(item.product.price * item.quantity) }}</span>
                  </div>
                </div>
                <button class="self-start rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remover" @click="emit('set-quantity', { productId: item.product.id, quantity: 0 })"><Trash2 class="h-4 w-4" /></button>
              </li>
            </ul>
          </div>

          <!-- Passo 2: dados do pedido -->
          <div v-show="step === 'checkout'" class="flex-1 overflow-y-auto px-5 py-4">
            <section class="space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">Seus dados</h3>
              <div class="grid gap-3 sm:grid-cols-2">
                <div><Label class="text-xs">Nome*</Label><Input v-model="checkout.customer.name" class="mt-1" /></div>
                <div><Label class="text-xs">Telefone*</Label><Input v-model="checkout.customer.phone" class="mt-1" /></div>
                <div class="sm:col-span-2"><Label class="text-xs">E-mail</Label><Input v-model="checkout.customer.email" type="email" class="mt-1" /></div>
              </div>
            </section>

            <section class="mt-5 space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">Entrega</h3>
              <div class="grid gap-2 sm:grid-cols-2">
                <label v-if="store.capabilities.pickup" class="choice" :class="{ active: checkout.deliveryType === 'RETIRADA' }"><input v-model="checkout.deliveryType" type="radio" value="RETIRADA" class="accent-[var(--shop-primary)]" /> Retirada no local</label>
                <label v-if="store.capabilities.localDelivery" class="choice" :class="{ active: checkout.deliveryType === 'ENTREGA_LOCAL' }"><input v-model="checkout.deliveryType" type="radio" value="ENTREGA_LOCAL" class="accent-[var(--shop-primary)]" /> Entrega local</label>
              </div>
              <div v-if="checkout.deliveryType === 'ENTREGA_LOCAL'" class="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
                <div><Label class="text-xs">CEP</Label><Input v-model="checkout.customer.postalCode" class="mt-1" /></div>
                <div class="sm:col-span-2"><Label class="text-xs">Endereço</Label><Input v-model="checkout.customer.address" class="mt-1" /></div>
                <div><Label class="text-xs">Número</Label><Input v-model="checkout.customer.number" class="mt-1" /></div>
                <div><Label class="text-xs">Bairro</Label><Input v-model="checkout.customer.district" class="mt-1" /></div>
                <div><Label class="text-xs">Cidade</Label><Input v-model="checkout.customer.city" class="mt-1" /></div>
                <div><Label class="text-xs">UF</Label><Input v-model="checkout.customer.state" maxlength="2" class="mt-1" /></div>
              </div>
            </section>

            <section v-if="store.capabilities.whatsapp || store.capabilities.onlinePayment" class="mt-5 space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">Pagamento</h3>
              <div class="grid gap-2 sm:grid-cols-2">
                <label v-if="store.capabilities.whatsapp" class="choice" :class="{ active: checkout.channel === 'WHATSAPP' }"><input v-model="checkout.channel" type="radio" value="WHATSAPP" class="accent-[var(--shop-primary)]" /> Finalizar no WhatsApp</label>
                <label v-if="store.capabilities.onlinePayment" class="choice" :class="{ active: checkout.channel === 'GATEWAY' }"><input v-model="checkout.channel" type="radio" value="GATEWAY" class="accent-[var(--shop-primary)]" /> Pagamento online</label>
              </div>
            </section>
          </div>

          <!-- Rodapé fixo -->
          <footer class="border-t border-slate-200 bg-white px-5 py-4">
            <div class="space-y-1 text-sm">
              <div class="flex justify-between text-slate-600"><span>Subtotal</span><span>{{ formatCurrencyBR(subtotal) }}</span></div>
              <div v-if="step === 'checkout' && checkout.deliveryType === 'ENTREGA_LOCAL'" class="flex justify-between text-slate-600">
                <span>Entrega</span><span>{{ deliveryFee === 0 ? 'Grátis' : formatCurrencyBR(deliveryFee) }}</span>
              </div>
              <div class="flex justify-between pt-1 text-lg font-black text-slate-900"><span>Total</span><span>{{ formatCurrencyBR(step === 'checkout' ? total : subtotal) }}</span></div>
            </div>
            <Button v-if="step === 'cart'" class="mt-4 h-12 w-full rounded-full text-base text-white" :style="{ backgroundColor: 'var(--shop-primary)' }" @click="step = 'checkout'">
              Continuar
            </Button>
            <Button v-else class="mt-4 h-12 w-full rounded-full text-base text-white" :style="{ backgroundColor: 'var(--shop-primary)' }" :disabled="checkingOut || !canFinish" @click="emit('finish')">
              <LoaderCircle v-if="checkingOut" class="mr-2 h-4 w-4 animate-spin" />
              {{ checkout.channel === 'WHATSAPP' ? 'Finalizar no WhatsApp' : 'Finalizar pedido' }}
            </Button>
            <p v-if="step === 'checkout' && !canFinish" class="mt-2 text-center text-xs text-slate-400">Informe nome e telefone para continuar.</p>
          </footer>
        </template>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.choice { display: flex; align-items: center; gap: .5rem; border: 1px solid rgb(0 0 0 / .14); border-radius: .75rem; background: white; padding: .75rem; font-size: .875rem; font-weight: 600; cursor: pointer; transition: border-color .15s, background .15s; }
.choice.active { border-color: var(--shop-primary); background: color-mix(in srgb, var(--shop-primary) 8%, white); }
.free-ship { background: color-mix(in srgb, var(--shop-primary) 6%, white); border-color: color-mix(in srgb, var(--shop-primary) 25%, white); }
.cart-fade-enter-active, .cart-fade-leave-active { transition: opacity .25s ease; }
.cart-fade-enter-from, .cart-fade-leave-to { opacity: 0; }
.cart-slide-enter-active, .cart-slide-leave-active { transition: transform .3s cubic-bezier(.32, .72, 0, 1); }
.cart-slide-enter-from, .cart-slide-leave-to { transform: translateX(100%); }
</style>
