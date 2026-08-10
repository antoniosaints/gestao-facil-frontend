<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Bike, CheckCircle2, ChevronRight, Clock3, Compass, LogOut, MapPin, Navigation, PackageCheck, Phone, RefreshCw, ShieldCheck, XCircle } from 'lucide-vue-next'
import { RestauranteRepository, type RestauranteEntregadorContexto, type RestaurantePedido } from '@/repositories/restaurante-repository'
import { useAuthStore } from '@/stores/login/useAuthStore'

const toast = useToast()
const auth = useAuthStore()
const email = ref('')
const senha = ref('')
const loggingIn = ref(false)
const loading = ref(false)
const acting = ref(false)
const context = ref<RestauranteEntregadorContexto | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | undefined
let geoWatch: number | undefined
let lastLocation: { latitude: number; longitude: number; sentAt: number } | undefined
let originalManifest: string | null = null

const signedIn = computed(() => Boolean(auth.token && context.value))
const companyName = computed(() => context.value?.empresa?.nomeFantasia || context.value?.empresa?.nome || 'Delivery')
const activeDelivery = computed(() => context.value?.entregaAtiva || null)
const availability = computed(() => Boolean(context.value?.driver.disponivel))

function address(order: RestaurantePedido) {
  const address = order.enderecoSnapshotJson
  if (!address) return 'Endereço informado no pedido'
  return [address.logradouro, address.numero, address.bairro, address.cidade].filter(Boolean).join(', ')
}

function money(value: string | number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

function nextAction(order: RestaurantePedido) {
  return ({ ATRIBUIDA: ['Confirmar retirada', 'RETIRADA'], RETIRADA: ['Iniciar rota', 'EM_ROTA'], EM_ROTA: ['Confirmar entrega', 'ENTREGUE'] } as const)[order.entregaStatus]
}

async function loadContext(silent = false) {
  if (!auth.token) return
  if (!silent) loading.value = true
  try {
    context.value = await RestauranteRepository.entregadorContexto()
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearDriverSession()
      toast.error(error.response?.data?.error?.message || 'Este acesso não está habilitado para entregador.')
    } else if (!silent) {
      toast.error('Não foi possível atualizar suas entregas.')
    }
  } finally {
    loading.value = false
  }
}

async function login() {
  if (!email.value || !senha.value) return toast.info('Informe seu e-mail e senha.')
  loggingIn.value = true
  const result = await auth.login(email.value, senha.value, { redirect: false })
  loggingIn.value = false
  if (result.ok) await loadContext()
}

function clearDriverSession() {
  localStorage.removeItem('gestao_facil:token')
  localStorage.removeItem('gestao_facil:refreshToken')
  localStorage.removeItem('gestao_facil:usuario')
  auth.token = ''
  auth.refreshToken = ''
  auth.user = ''
  context.value = null
  stopLocationWatch()
}

async function toggleAvailability() {
  if (!context.value || activeDelivery.value) return
  acting.value = true
  try {
    const result = await RestauranteRepository.atualizarDisponibilidadeEntregador(!availability.value)
    context.value.driver.disponivel = result.disponivel
    toast.success(result.disponivel ? 'Você está disponível para entregas.' : 'Você ficou indisponível.')
  } catch { toast.error('Não foi possível alterar sua disponibilidade.') } finally { acting.value = false }
}

async function accept(order: RestaurantePedido) {
  acting.value = true
  try {
    await RestauranteRepository.aceitarEntrega(order.id)
    toast.success('Entrega aceita. Vá até o restaurante para retirar o pedido.')
    await loadContext(true)
  } catch (error: any) {
    toast.error(error.response?.data?.error?.message || 'Esta entrega não está mais disponível.')
    await loadContext(true)
  } finally { acting.value = false }
}

async function changeStatus(status: 'RETIRADA' | 'EM_ROTA' | 'ENTREGUE') {
  if (!activeDelivery.value) return
  acting.value = true
  try {
    await RestauranteRepository.atualizarStatusEntrega(activeDelivery.value.id, status)
    toast.success(status === 'ENTREGUE' ? 'Entrega concluída. Bom trabalho!' : status === 'EM_ROTA' ? 'Rota iniciada. Sua localização será compartilhada.' : 'Retirada confirmada.')
    await loadContext(true)
  } catch (error: any) { toast.error(error.response?.data?.error?.message || 'Não foi possível atualizar esta entrega.') } finally { acting.value = false }
}

async function reportIssue() {
  if (!activeDelivery.value || !confirm('Marcar esta entrega como não concluída?')) return
  acting.value = true
  try { await RestauranteRepository.atualizarStatusEntrega(activeDelivery.value.id, 'FALHOU'); await loadContext(true) } catch { toast.error('Não foi possível registrar o problema.') } finally { acting.value = false }
}

function navigate(order: RestaurantePedido) {
  const target = order.enderecoSnapshotJson?.latitude != null && order.enderecoSnapshotJson?.longitude != null
    ? `${order.enderecoSnapshotJson.latitude},${order.enderecoSnapshotJson.longitude}` : encodeURIComponent(address(order))
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${target}`, '_blank', 'noopener,noreferrer')
}

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const lat = (b.latitude - a.latitude) * 111_320
  const lng = (b.longitude - a.longitude) * 111_320 * Math.cos((a.latitude * Math.PI) / 180)
  return Math.hypot(lat, lng)
}

async function publishPosition(position: GeolocationPosition) {
  const active = activeDelivery.value
  if (!active || active.entregaStatus !== 'EM_ROTA') return
  const current = { latitude: position.coords.latitude, longitude: position.coords.longitude }
  const now = Date.now()
  if (lastLocation && now - lastLocation.sentAt < 10_000 && distanceMeters(lastLocation, current) < 20) return
  try {
    await RestauranteRepository.enviarLocalizacaoEntrega(active.id, { ...current, precisaoMetros: position.coords.accuracy })
    lastLocation = { ...current, sentAt: now }
  } catch { /* O refresh periódico reconcilia a tela quando a rede voltar. */ }
}

function stopLocationWatch() {
  if (geoWatch !== undefined && navigator.geolocation) navigator.geolocation.clearWatch(geoWatch)
  geoWatch = undefined
  lastLocation = undefined
}

function syncLocationWatch() {
  stopLocationWatch()
  if (activeDelivery.value?.entregaStatus !== 'EM_ROTA') return
  if (!navigator.geolocation) return toast.warning('Seu dispositivo não oferece localização para esta rota.')
  geoWatch = navigator.geolocation.watchPosition(publishPosition, () => toast.warning('Permita a localização para aparecer no acompanhamento da central.'), { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 })
}

watch(() => activeDelivery.value?.entregaStatus, syncLocationWatch)
onMounted(async () => {
  const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (manifest) {
    originalManifest = manifest.href
    manifest.href = '/manifest-entregador.webmanifest'
  }
  await loadContext(true)
  refreshTimer = setInterval(() => loadContext(true), 10_000)
})
onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  stopLocationWatch()
  const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (manifest && originalManifest) manifest.href = originalManifest
})
</script>

<template>
  <main class="driver-app">
    <section v-if="!signedIn" class="driver-login">
      <div class="driver-brand"><span><Bike :size="22" /></span><p>GESTÃO FÁCIL</p><h1>Delivery</h1><small>Acesso exclusivo para entregadores</small></div>
      <form class="login-card" @submit.prevent="login">
        <h2>Vamos trabalhar?</h2><p>Entre com as credenciais enviadas pela gestão.</p>
        <label>E-mail<input v-model.trim="email" autocomplete="email" type="email" placeholder="voce@empresa.com" /></label>
        <label>Senha<input v-model="senha" autocomplete="current-password" type="password" placeholder="Sua senha" /></label>
        <button class="primary" :disabled="loggingIn"><RefreshCw v-if="loggingIn" class="animate-spin" :size="18" />{{ loggingIn ? 'Entrando...' : 'Entrar para entregas' }}<ChevronRight v-if="!loggingIn" :size="18" /></button>
      </form>
      <p class="security"><ShieldCheck :size="15" />Seu acesso é protegido e vinculado ao restaurante.</p>
    </section>

    <template v-else>
      <header class="driver-header">
        <div class="company"><img v-if="context?.empresa?.profile" :src="context.empresa.profile" alt="" /><span v-else><Bike :size="20" /></span><div><small>ENTREGAS</small><strong>{{ companyName }}</strong></div></div>
        <button class="logout" aria-label="Sair" @click="clearDriverSession"><LogOut :size="19" /></button>
      </header>
      <section class="driver-content">
        <div class="availability" :class="{ on: availability }"><div><span class="pulse" /><p>{{ availability ? 'Você está disponível' : 'Você está indisponível' }}</p><small>{{ activeDelivery ? 'Você possui uma entrega em andamento.' : availability ? 'Novas ofertas aparecerão aqui.' : 'Ative para receber novas ofertas.' }}</small></div><button :disabled="acting || !!activeDelivery" @click="toggleAvailability">{{ availability ? 'Pausar' : 'Ficar online' }}</button></div>

        <template v-if="loading && !context"><div class="loading"><RefreshCw class="animate-spin" />Carregando suas entregas...</div></template>
        <template v-else-if="activeDelivery">
          <p class="eyebrow">SUA ENTREGA ATUAL</p>
          <article class="active-card"><div class="active-top"><span class="order-code">{{ activeDelivery.codigo }}</span><span class="status">{{ activeDelivery.entregaStatus.replace('_', ' ') }}</span></div><h1>{{ activeDelivery.clienteNomeSnapshot || 'Cliente' }}</h1><p class="address"><MapPin :size="18" />{{ address(activeDelivery) }}</p><a v-if="activeDelivery.clienteTelefone" :href="`tel:${activeDelivery.clienteTelefone}`"><Phone :size="17" />{{ activeDelivery.clienteTelefone }}</a><div class="summary"><span>{{ activeDelivery.itens.length }} item(ns)</span><strong>{{ money(activeDelivery.total) }}</strong></div><button class="map-button" @click="navigate(activeDelivery)"><Navigation :size="19" />Abrir navegação</button><button v-if="nextAction(activeDelivery)" class="primary action" :disabled="acting" @click="changeStatus(nextAction(activeDelivery)![1])"><PackageCheck :size="19" />{{ nextAction(activeDelivery)![0] }}</button><button class="issue" :disabled="acting" @click="reportIssue"><XCircle :size="16" />Reportar problema</button></article>
        </template>
        <template v-else>
          <div class="section-title"><div><p class="eyebrow">OFERTAS DISPONÍVEIS</p><h1>Próximas entregas</h1></div><button class="refresh" :disabled="loading" @click="loadContext()"><RefreshCw :class="{ 'animate-spin': loading }" :size="18" /></button></div>
          <div v-if="!context?.ofertas.length" class="empty"><Clock3 :size="34" /><h2>Nenhuma oferta agora</h2><p>Deixe seu status online. Assim que a expedição liberar um pedido, ele aparecerá aqui.</p></div>
          <article v-for="order in context?.ofertas" :key="order.id" class="offer"><div class="offer-head"><span>{{ order.codigo }}</span><small>{{ money(order.total) }}</small></div><h2>{{ order.clienteNomeSnapshot || 'Cliente' }}</h2><p><MapPin :size="17" />{{ address(order) }}</p><div class="offer-footer"><span><Clock3 :size="16" />Pedido aguardando despacho</span><button class="primary compact" :disabled="acting || !availability" @click="accept(order)">Aceitar</button></div></article>
        </template>
      </section>
      <footer class="driver-footer"><Compass :size="16" /><span>{{ activeDelivery?.entregaStatus === 'EM_ROTA' ? 'Localização compartilhada com a central' : 'Atualização automática a cada 10 segundos' }}</span></footer>
    </template>
  </main>
</template>

<style scoped>
.driver-app{min-height:100dvh;background:#f4f6f8;color:#142033;font-family:inherit}.driver-login{min-height:100dvh;display:grid;place-items:center;align-content:center;gap:24px;padding:28px;background:radial-gradient(circle at 85% 10%,#26706a 0,#092c32 44%,#061d24 100%);color:#fff}.driver-brand{text-align:center}.driver-brand>span{display:inline-grid;place-items:center;width:54px;height:54px;border-radius:17px;background:#f9bc2f;color:#082a31;box-shadow:0 12px 30px #0004}.driver-brand p{margin:18px 0 3px;font-size:11px;font-weight:800;letter-spacing:.15em}.driver-brand h1{margin:0;font-size:36px;line-height:1}.driver-brand small{display:block;margin-top:9px;color:#d8e7e5}.login-card{width:min(100%,370px);display:grid;gap:14px;padding:24px;border:1px solid #ffffff22;border-radius:22px;background:#fff;color:#142033;box-shadow:0 20px 55px #0005}.login-card h2{margin:0;font-size:23px}.login-card>p{margin:-7px 0 5px;font-size:13px;color:#64748b}.login-card label{display:grid;gap:7px;font-size:13px;font-weight:700}.login-card input{height:48px;border:1px solid #d4dbe5;border-radius:11px;padding:0 13px;font:inherit;outline:none}.login-card input:focus{border-color:#0d7773;box-shadow:0 0 0 3px #0d777322}.primary{min-height:49px;border:0;border-radius:12px;background:#096965;color:#fff;font:inherit;font-weight:800;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;box-shadow:0 8px 18px #09696535}.primary:disabled{cursor:not-allowed;opacity:.55}.security{display:flex;align-items:center;gap:6px;margin:0;color:#d9e9e7;font-size:12px}.driver-header{height:78px;padding:0 max(18px,calc((100vw - 630px)/2));background:#08343a;color:#fff;display:flex;align-items:center;justify-content:space-between}.company{min-width:0;display:flex;align-items:center;gap:10px}.company>img,.company>span{width:43px;height:43px;border-radius:13px;object-fit:cover;background:#fff;display:grid;place-items:center;color:#0a5557}.company small{display:block;font-size:9px;font-weight:800;letter-spacing:.1em;color:#a9c6c4}.company strong{display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}.logout,.refresh{border:0;background:transparent;color:inherit;cursor:pointer;padding:9px}.driver-content{width:min(100%,630px);margin:auto;padding:22px 18px 84px}.availability{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:17px;border:1px solid #dce4e9;border-radius:16px;background:#fff;box-shadow:0 5px 20px #1d293909}.availability>div{min-width:0}.availability p{display:flex;align-items:center;gap:8px;margin:0;font-size:15px;font-weight:800}.availability small{display:block;margin:4px 0 0;color:#73808f;font-size:12px}.availability button{border:0;border-radius:10px;padding:10px 13px;background:#eef2f4;color:#334155;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.availability.on{border-color:#9ee1d4;background:#f3fffc}.availability.on button{background:#e5f8f3;color:#087260}.pulse{width:9px;height:9px;border-radius:50%;background:#94a3b8}.on .pulse{background:#10a776;box-shadow:0 0 0 4px #10a77620}.eyebrow{margin:27px 0 5px;color:#0c746d;font-size:10px;font-weight:900;letter-spacing:.1em}.section-title{display:flex;justify-content:space-between;align-items:end}.section-title h1{margin:0;font-size:24px}.empty{margin-top:18px;padding:42px 25px;border:1px dashed #cad5dd;border-radius:17px;text-align:center;color:#718091}.empty svg{color:#0b756e}.empty h2{margin:12px 0 5px;color:#263346;font-size:17px}.empty p{margin:0;font-size:13px;line-height:1.5}.offer,.active-card{margin-top:17px;padding:19px;border:1px solid #dbe3e8;border-radius:17px;background:#fff;box-shadow:0 5px 20px #1d293909}.offer-head,.active-top,.summary,.offer-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.offer-head span,.order-code{font-size:11px;font-weight:900;letter-spacing:.06em;color:#0b746e}.offer-head small{font-weight:900}.offer h2{margin:11px 0 7px;font-size:18px}.offer p,.address{display:flex;gap:7px;margin:0;color:#637384;font-size:13px;line-height:1.4}.offer-footer{margin-top:18px;padding-top:14px;border-top:1px solid #e8edf0}.offer-footer>span{display:flex;align-items:center;gap:5px;color:#68798b;font-size:11px}.compact{min-height:38px;padding:0 16px;border-radius:9px;font-size:13px}.active-card{border-color:#8cd9c6;background:linear-gradient(145deg,#fff,#f3fffb)}.status{padding:5px 9px;border-radius:20px;background:#d5f5eb;color:#087460;font-size:10px;font-weight:900}.active-card h1{margin:15px 0 8px;font-size:25px}.active-card a{display:flex;align-items:center;gap:7px;width:max-content;margin-top:12px;color:#0b706c;font-size:13px;font-weight:700;text-decoration:none}.summary{margin:20px 0 14px;padding-top:14px;border-top:1px solid #cde8df;font-size:13px}.summary strong{font-size:18px}.map-button{min-height:47px;width:100%;border:1px solid #0a7069;border-radius:11px;background:#fff;color:#08716b;font:inherit;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.action{width:100%;margin-top:10px}.issue{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:13px;border:0;background:transparent;color:#b64747;font:inherit;font-size:12px;font-weight:700;cursor:pointer}.loading{display:flex;align-items:center;justify-content:center;gap:10px;min-height:220px;color:#627284;font-size:14px}.driver-footer{position:fixed;z-index:2;bottom:0;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:7px;padding:14px 18px;background:#fff;border-top:1px solid #e4eaee;color:#6f7d8a;font-size:11px}@media(min-width:700px){.driver-header{padding-left:calc((100vw - 630px)/2);padding-right:calc((100vw - 630px)/2)}.driver-content{padding-top:32px}.offer,.active-card{padding:22px}}
</style>
