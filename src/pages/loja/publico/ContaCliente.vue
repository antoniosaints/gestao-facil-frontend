<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useStoreToast } from '@/composables/useStoreToast'
import { LojaRepository, type PublicStore } from '@/repositories/loja-repository'
import { resolveFileUrl } from '@/utils/fileUrl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import StoreToaster from './components/StoreToaster.vue'
import { ArrowLeft, CheckCircle2, Clock, LoaderCircle, LogOut, MapPin, Package, ShoppingBag, Truck, UserRound } from 'lucide-vue-next'

const route = useRoute(); const router = useRouter(); const toast = useStoreToast()
const slug = String(route.params.slug); const mode = computed(() => String(route.meta.customerMode || 'login'))
const loading = ref(false); const message = ref(''); const account = ref<any>(null)
const store = ref<PublicStore | null>(null)
const form = reactive({ name: '', email: '', phone: '', password: '', confirm: '' })
const address = reactive({ recipient: '', postalCode: '', address: '', number: '', complement: '', district: '', city: '', state: '', primary: true })
const tokenKey = `gestao-facil:loja:${slug}:access-token`

const labels: Record<string, string> = { login: 'Entrar na sua conta', register: 'Criar uma conta', forgot: 'Recuperar acesso', reset: 'Criar nova senha', verify: 'Verificar e-mail', account: 'Minha conta' }
const subtitles: Record<string, string> = {
  login: 'Acesse para acompanhar seus pedidos.',
  register: 'Leva menos de um minuto — sem confirmação de e-mail.',
  forgot: 'Enviaremos um link para redefinir sua senha.',
  reset: 'Escolha uma nova senha para sua conta.',
}

const brandStyle = computed(() => ({ '--shop-primary': store.value?.colors.primary || '#4f46e5', '--shop-secondary': store.value?.colors.secondary || '#0ea5e9' }))
const storeName = computed(() => store.value?.identity.name || 'Loja')

async function submit() {
  loading.value = true; message.value = ''
  try {
    if (mode.value === 'login') {
      const data = await LojaRepository.customerAuth(slug, 'login', { email: form.email, password: form.password })
      localStorage.setItem(tokenKey, data.accessToken); await router.push(`/lojas/${slug}/conta`)
    } else if (mode.value === 'register') {
      if (form.password !== form.confirm) throw new Error('As senhas não coincidem.')
      const data = await LojaRepository.customerAuth(slug, 'register', { name: form.name, email: form.email, phone: form.phone, password: form.password })
      localStorage.setItem(tokenKey, data.accessToken); toast.success('Conta criada! Você já está conectado.'); await router.push(`/lojas/${slug}/conta`)
    } else if (mode.value === 'forgot') {
      await LojaRepository.customerAuth(slug, 'forgot-password', { email: form.email }); message.value = 'Se o e-mail estiver cadastrado, as instruções foram enviadas.'
    } else if (mode.value === 'reset') {
      await LojaRepository.customerAuth(slug, 'reset-password', { token: String(route.query.token || ''), password: form.password }); message.value = 'Senha redefinida. Você já pode entrar.'
    }
  } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || 'Não foi possível continuar.') } finally { loading.value = false }
}

async function saveAddress() {
  const token = localStorage.getItem(tokenKey); if (!token) return
  try { await LojaRepository.saveCustomerAddress(slug, token, address); account.value = await LojaRepository.customerMe(slug, token); Object.assign(address, { recipient: '', postalCode: '', address: '', number: '', complement: '', district: '', city: '', state: '', primary: false }); toast.success('Endereço salvo.') }
  catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível salvar o endereço.') }
}

async function removeAddress(id: number) {
  const token = localStorage.getItem(tokenKey); if (!token) return
  await LojaRepository.removeCustomerAddress(slug, token, id); account.value = await LojaRepository.customerMe(slug, token)
}

function logout() {
  localStorage.removeItem(tokenKey); router.push(`/lojas/${slug}/login`)
}

onMounted(async () => {
  try { store.value = await LojaRepository.getPublicStore(slug) } catch { /* segue sem branding */ }
  if (mode.value === 'verify') {
    loading.value = true
    try { await LojaRepository.customerAuth(slug, 'verify', { token: String(route.query.token || '') }); message.value = 'E-mail verificado. Sua conta está pronta.' } catch (error: any) { message.value = error?.response?.data?.message || 'Este link não é válido.' } finally { loading.value = false }
  }
  if (mode.value === 'account') {
    const token = localStorage.getItem(tokenKey)
    if (!token) return router.push(`/lojas/${slug}/login`)
    try { account.value = await LojaRepository.customerMe(slug, token) } catch { localStorage.removeItem(tokenKey); return router.push(`/lojas/${slug}/login`) }
  }
})
</script>

<template>
  <!-- Conta do cliente -->
  <div v-if="mode === 'account'" class="min-h-screen bg-slate-50" :style="brandStyle">
    <header class="border-b bg-white">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <RouterLink :to="`/lojas/${slug}`" class="flex items-center gap-2 font-black text-[var(--shop-primary)]">
          <img v-if="store?.identity.logo" :src="resolveFileUrl(store.identity.logo)" class="h-8 w-8 rounded-full border object-cover" />
          <ShoppingBag v-else class="h-6 w-6" /> {{ storeName }}
        </RouterLink>
        <Button variant="outline" size="sm" class="rounded-full" @click="logout"><LogOut class="mr-1 h-4 w-4" /> Sair</Button>
      </div>
    </header>

    <main v-if="loading" class="flex justify-center py-24"><LoaderCircle class="h-6 w-6 animate-spin text-[var(--shop-primary)]" /></main>
    <main v-else-if="account" class="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div class="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
        <div class="grid h-14 w-14 shrink-0 place-items-center rounded-full text-white" :style="{ backgroundColor: 'var(--shop-primary)' }"><UserRound class="h-7 w-7" /></div>
        <div><p class="text-xl font-black text-slate-900">Olá, {{ account.nome }}</p><p class="text-sm text-slate-500">{{ account.email }}</p></div>
      </div>

      <section class="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 class="mb-3 flex items-center gap-2 font-bold text-slate-900"><Package class="h-5 w-5 text-[var(--shop-primary)]" /> Meus pedidos</h2>
        <div v-if="!account.pedidos?.length" class="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
          <ShoppingBag class="mx-auto mb-2 h-8 w-8 text-slate-300" /> Você ainda não fez pedidos.
        </div>
        <div v-for="order in account.pedidos" :key="order.id" class="mb-2 flex items-center justify-between rounded-xl border p-4">
          <div>
            <p class="font-bold text-slate-900">{{ order.Uid }}</p>
            <p class="text-sm text-slate-500">{{ order.itens.length }} item(ns) · R$ {{ Number(order.total).toFixed(2) }}</p>
          </div>
          <span class="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"><Clock class="h-3.5 w-3.5" /> {{ order.status }}</span>
        </div>
      </section>

      <section class="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 class="mb-3 flex items-center gap-2 font-bold text-slate-900"><MapPin class="h-5 w-5 text-[var(--shop-primary)]" /> Meus endereços</h2>
        <div v-for="item in account.enderecos" :key="item.id" class="mb-2 flex items-start justify-between rounded-xl border p-4 text-sm">
          <span class="text-slate-700"><b>{{ item.destinatario }}</b><br />{{ item.endereco }}, {{ item.numero }} — {{ item.cidade }}/{{ item.estado }}</span>
          <button class="text-red-600 hover:underline" @click="removeAddress(item.id)">Remover</button>
        </div>
        <form class="mt-3 grid gap-2 sm:grid-cols-2" @submit.prevent="saveAddress">
          <Input v-model="address.recipient" placeholder="Destinatário" required />
          <Input v-model="address.postalCode" placeholder="CEP" required />
          <Input v-model="address.address" class="sm:col-span-2" placeholder="Endereço" required />
          <Input v-model="address.number" placeholder="Número" required />
          <Input v-model="address.district" placeholder="Bairro" required />
          <Input v-model="address.city" placeholder="Cidade" required />
          <Input v-model="address.state" maxlength="2" placeholder="UF" required />
          <Button class="rounded-full text-white sm:col-span-2" :style="{ backgroundColor: 'var(--shop-primary)' }">Adicionar endereço</Button>
        </form>
      </section>
    </main>
  </div>

  <!-- Autenticação (login / cadastro / recuperação) -->
  <div v-else class="grid min-h-screen lg:grid-cols-2" :style="brandStyle">
    <!-- Painel da marca -->
    <aside class="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex" :style="{ background: `linear-gradient(135deg, var(--shop-primary), var(--shop-secondary))` }">
      <div class="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>
      <div class="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-black/10"></div>
      <RouterLink :to="`/lojas/${slug}`" class="relative flex items-center gap-3 text-xl font-black">
        <img v-if="store?.identity.logo" :src="resolveFileUrl(store.identity.logo)" class="h-11 w-11 rounded-full border-2 border-white/70 object-cover" />
        <ShoppingBag v-else class="h-8 w-8" /> {{ storeName }}
      </RouterLink>
      <div class="relative">
        <h2 class="text-4xl font-black leading-tight">Sua conta, seus pedidos, tudo em um só lugar.</h2>
        <ul class="mt-8 space-y-3 text-white/90">
          <li class="flex items-center gap-3"><CheckCircle2 class="h-5 w-5 shrink-0" /> Acompanhe o status dos seus pedidos</li>
          <li class="flex items-center gap-3"><Truck class="h-5 w-5 shrink-0" /> Salve endereços para entregas rápidas</li>
          <li class="flex items-center gap-3"><Clock class="h-5 w-5 shrink-0" /> Checkout mais rápido nas próximas compras</li>
        </ul>
      </div>
      <p class="relative text-sm text-white/70">© {{ new Date().getFullYear() }} {{ storeName }}</p>
    </aside>

    <!-- Painel do formulário -->
    <main class="flex items-center justify-center bg-white px-6 py-10">
      <div class="w-full max-w-md">
        <RouterLink :to="`/lojas/${slug}`" class="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft class="h-4 w-4" /> Voltar à loja
        </RouterLink>

        <div class="mb-6">
          <h1 class="text-3xl font-black text-slate-900">{{ labels[mode] }}</h1>
          <p v-if="subtitles[mode]" class="mt-1 text-slate-500">{{ subtitles[mode] }}</p>
        </div>

        <div v-if="loading && mode === 'verify'" class="flex justify-center py-12"><LoaderCircle class="h-6 w-6 animate-spin text-[var(--shop-primary)]" /></div>

        <div v-else-if="message" class="space-y-4 rounded-2xl bg-emerald-50 p-6 text-center text-emerald-900">
          <CheckCircle2 class="mx-auto h-8 w-8" />
          <p>{{ message }}</p>
          <RouterLink :to="`/lojas/${slug}/login`" class="inline-block font-bold underline">Ir para o login</RouterLink>
        </div>

        <form v-else class="space-y-4" @submit.prevent="submit">
          <div v-if="mode === 'register'"><Label class="text-xs font-medium">Nome completo</Label><Input v-model="form.name" class="mt-1 h-11 rounded-xl" required /></div>
          <div v-if="mode === 'register'"><Label class="text-xs font-medium">Telefone</Label><Input v-model="form.phone" class="mt-1 h-11 rounded-xl" placeholder="(00) 00000-0000" /></div>
          <div v-if="['login','register','forgot'].includes(mode)"><Label class="text-xs font-medium">E-mail</Label><Input v-model="form.email" type="email" class="mt-1 h-11 rounded-xl" required /></div>
          <div v-if="['login','register','reset'].includes(mode)"><Label class="text-xs font-medium">Senha</Label><Input v-model="form.password" type="password" minlength="8" class="mt-1 h-11 rounded-xl" required /></div>
          <div v-if="mode === 'register'"><Label class="text-xs font-medium">Confirmar senha</Label><Input v-model="form.confirm" type="password" class="mt-1 h-11 rounded-xl" required /></div>

          <RouterLink v-if="mode === 'login'" :to="`/lojas/${slug}/esqueci-senha`" class="block text-right text-sm font-semibold text-[var(--shop-primary)] hover:underline">Esqueci a senha</RouterLink>

          <Button class="h-12 w-full rounded-xl text-base text-white" :style="{ backgroundColor: 'var(--shop-primary)' }" :disabled="loading">
            <LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : mode === 'forgot' ? 'Enviar instruções' : 'Redefinir senha' }}
          </Button>
        </form>

        <p v-if="mode === 'login'" class="mt-6 text-center text-sm text-slate-500">
          Não tem conta?
          <RouterLink :to="`/lojas/${slug}/cadastro`" class="font-bold text-[var(--shop-primary)] hover:underline">Criar conta</RouterLink>
        </p>
        <p v-else-if="mode === 'register'" class="mt-6 text-center text-sm text-slate-500">
          Já tem conta?
          <RouterLink :to="`/lojas/${slug}/login`" class="font-bold text-[var(--shop-primary)] hover:underline">Entrar</RouterLink>
        </p>
      </div>
    </main>
  </div>

  <StoreToaster :accent="store?.colors.primary" />
</template>
