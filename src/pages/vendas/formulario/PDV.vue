<template>
  <div class="pdv-page">
  <div v-if="loading" class="flex min-h-[60vh] items-center justify-center">
    <div class="flex items-center gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm">
      <LoaderCircle class="h-5 w-5 animate-spin text-primary" />
      <span class="text-sm text-muted-foreground">Preparando o ponto de venda...</span>
    </div>
  </div>

  <PDVBasic v-else-if="modeloPdv === 'BASICO'" />

  <Teleport v-else to="body">
  <section class="pdv-pro" aria-label="PDV PRO em tela cheia">
    <header class="pdv-pro__header">
      <div class="flex min-w-0 items-center gap-3">
        <div class="pdv-pro__mark"><Store class="h-6 w-6" /></div>
        <div class="min-w-0">
          <p class="truncate text-lg font-black tracking-tight"><span class="text-[var(--pdv-accent)]">PDV</span> GESTAO FACIL <small>PRO</small></p>
          <p class="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Terminal de vendas</p>
        </div>
      </div>

      <div class="hidden items-center gap-3 md:flex">
        <div class="pdv-pro__operator">
          <UserRound class="h-5 w-5 text-[var(--pdv-accent)]" />
          <div>
            <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Atendente</p>
            <p class="max-w-44 truncate text-sm font-bold">{{ uiStore.usuarioLogged.nome || 'Operador' }}</p>
          </div>
        </div>
        <div class="pdv-pro__operator">
          <ScanBarcode class="h-5 w-5 text-[var(--pdv-accent)]" />
          <div>
            <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Leitor</p>
            <p class="text-sm font-bold">Pronto <kbd>F2</kbd></p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="hidden text-right sm:block">
          <div class="flex items-center justify-end gap-2 text-xs font-semibold">
            <span class="h-2 w-2 rounded-full" :class="caixaAtivo ? 'bg-emerald-500' : 'bg-amber-500'" />
            {{ caixaAtivo ? 'Caixa aberto' : 'Caixa fechado' }}
          </div>
          <p class="mt-1 text-xs text-muted-foreground">{{ caixaAtivo?.codigo || 'Abra um caixa para vender' }}</p>
        </div>
        <button type="button" class="pdv-pro__lock" :class="{ 'pdv-pro__lock--active': caixaBloqueado }"
          :title="caixaBloqueado ? 'Terminal bloqueado — clique para desbloquear (pede senha)' : 'Bloquear terminal (modo quiosque)'"
          @click="alternarBloqueio">
          <component :is="caixaBloqueado ? Lock : LockOpen" class="h-5 w-5" />
          <span class="hidden lg:inline">{{ caixaBloqueado ? 'Bloqueado' : 'Bloquear' }}</span>
        </button>
        <div class="pdv-pro__clock">
          <p>{{ dataAtual }}</p>
          <strong>{{ horaAtual }}</strong>
        </div>
      </div>
    </header>

    <main class="pdv-pro__workspace">
      <div class="pdv-pro__status">
        <div class="pdv-pro__metric-header">
          <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Resumo do caixa</p>
          <strong>{{ caixaAtivo?.codigo || 'Caixa fechado' }}</strong>
          <span :class="caixaAtivo ? 'text-emerald-600' : 'text-amber-600'">
            {{ caixaAtivo ? 'Disponivel para venda' : 'Aguardando abertura' }}
          </span>
        </div>
        <div class="pdv-pro__metric-grid">
          <div>
            <span>Itens</span>
            <strong>{{ quantidadeItens }}</strong>
          </div>
          <div>
            <span>Subtotal</span>
            <strong>{{ formatCurrencyBR(subtotal) }}</strong>
          </div>
          <div>
            <span>Desconto</span>
            <strong>{{ formatCurrencyBR(desconto) }}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{{ formatCurrencyBR(total) }}</strong>
          </div>
        </div>
        <div class="pdv-pro__mini-status">
          <span><Wifi class="h-4 w-4 text-emerald-500" /> Sistema online</span>
          <span><CreditCard class="h-4 w-4" /> {{ metodoPagamentoLabel }}</span>
          <span><UserRound class="h-4 w-4" /> {{ uiStore.usuarioLogged.nome || 'Operador' }}</span>
        </div>
      </div>

      <div class="pdv-pro__core">
        <PDVBasic ref="pdvRef" pro-mode />
      </div>
    </main>

    <footer class="pdv-pro__shortcuts" aria-label="Atalhos rápidos do PDV">
      <button v-for="atalho in atalhos" :key="atalho.key" type="button"
        :class="{ 'pdv-pro__shortcut--primary': atalho.primary }"
        @click="executarAcao(atalho.action)">
        <kbd>{{ atalho.key }}</kbd>
        <component :is="atalho.icon" class="h-6 w-6" />
        <span>{{ atalho.label }}</span>
      </button>
    </footer>

    <div class="pdv-pro__bottomline">
      <span><i /> Sistema online</span>
      <span class="hidden sm:inline">
        PDV PRO · {{ caixaBloqueado ? 'Terminal bloqueado (modo quiosque)' : 'Atalhos rápidos ativos' }}
      </span>
      <span>{{ caixaAtivo?.pdv?.nome || caixaAtivo?.codigo || 'Terminal principal' }}</span>
    </div>

    <ModalView v-model:open="openModalSenha" :title="senhaTitulo" :description="senhaDescricao" :icon="ShieldCheck"
      size="sm">
      <form class="px-4 pb-2 flex flex-col gap-3" @submit.prevent="confirmarSenha">
        <div class="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3">
          <div class="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
            <UserRound class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Usuário logado</p>
            <p class="truncate text-sm font-bold">{{ uiStore.usuarioLogged.nome || 'Operador' }}</p>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Senha</label>
          <Input ref="senhaInputRef" v-model="senhaInput" type="password" autocomplete="current-password"
            placeholder="Digite a senha para continuar" :class="senhaErro ? 'border-red-500' : ''" />
          <p v-if="senhaErro" class="mt-1 text-xs text-red-500">{{ senhaErro }}</p>
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" @click="openModalSenha = false">Cancelar</Button>
          <Button type="submit" :disabled="verificandoSenha">
            {{ verificandoSenha ? 'Verificando...' : 'Confirmar' }}
          </Button>
        </div>
      </form>
    </ModalView>
  </section>
  </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  BadgePercent,
  BanknoteArrowDown,
  Box,
  CircleX,
  CreditCard,
  DoorOpen,
  LoaderCircle,
  Lock,
  LockOpen,
  Printer,
  ReceiptText,
  ScanBarcode,
  ShieldCheck,
  ShoppingCart,
  Store,
  UserRound,
  UsersRound,
  Wifi,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useAuthStore } from '@/stores/login/useAuthStore'
import { formatCurrencyBR } from '@/utils/formatters'
import router from '@/router'
import PDVBasic from './PDVBasic.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type AcaoAtalho = 'produtos' | 'leitor' | 'adicionar' | 'cancelar-item' | 'cliente' | 'sair' | 'caixa' | 'imprimir' | 'pagamento' | 'desconto' | 'fechar-caixa' | 'finalizar'

const uiStore = useUiStore()
const authStore = useAuthStore()
const toast = useToast()
const pdvRef = ref<any>(null)
const loading = ref(true)
const modeloPdv = ref<'BASICO' | 'PRO'>('BASICO')
const agora = ref(new Date())
let relogio: ReturnType<typeof setInterval> | null = null
let previousBodyOverflow = ''
const isLeavingPdv = ref(false)

// Bloqueio do caixa (modo quiosque): exige a senha do usuário logado para sair
const caixaBloqueado = ref(localStorage.getItem('gestao_facil:pdvBloqueado') === 'true')
const openModalSenha = ref(false)
const senhaInput = ref('')
const senhaErro = ref('')
const verificandoSenha = ref(false)
const senhaTitulo = ref('Confirme sua senha')
const senhaDescricao = ref('')
const senhaInputRef = ref<{ $el?: HTMLElement } | null>(null)
let acaoAposSenha: (() => void | Promise<void>) | null = null

function solicitarSenha(config: { title: string; description: string }, callback: () => void | Promise<void>) {
  senhaTitulo.value = config.title
  senhaDescricao.value = config.description
  senhaInput.value = ''
  senhaErro.value = ''
  acaoAposSenha = callback
  openModalSenha.value = true
  setTimeout(() => (senhaInputRef.value?.$el as HTMLInputElement | undefined)?.focus(), 80)
}

async function confirmarSenha() {
  if (!senhaInput.value) {
    senhaErro.value = 'Informe a senha para continuar'
    return
  }
  verificandoSenha.value = true
  senhaErro.value = ''
  const valido = await authStore.verificarSenha(senhaInput.value)
  verificandoSenha.value = false
  if (!valido) {
    senhaErro.value = 'Senha incorreta. Tente novamente.'
    senhaInput.value = ''
    setTimeout(() => (senhaInputRef.value?.$el as HTMLInputElement | undefined)?.focus(), 40)
    return
  }
  openModalSenha.value = false
  const callback = acaoAposSenha
  acaoAposSenha = null
  await callback?.()
}

function alternarBloqueio() {
  if (caixaBloqueado.value) {
    solicitarSenha(
      { title: 'Desbloquear caixa', description: 'Digite a senha do usuário logado para desbloquear o terminal.' },
      () => {
        caixaBloqueado.value = false
        toast.success('Caixa desbloqueado')
      },
    )
  } else {
    caixaBloqueado.value = true
    toast.info('Caixa bloqueado. É necessária a senha para sair.')
  }
}

watch(caixaBloqueado, (value) => {
  localStorage.setItem('gestao_facil:pdvBloqueado', String(value))
})

watch(openModalSenha, (open) => {
  if (!open) {
    acaoAposSenha = null
    senhaInput.value = ''
    senhaErro.value = ''
  }
})

const caixaAtivo = computed(() => pdvRef.value?.caixaAtivo || null)
const quantidadeItens = computed(() => Number(pdvRef.value?.quantidadeItens || 0))
const subtotal = computed(() => Number(pdvRef.value?.subtotal || 0))
const desconto = computed(() => Number(pdvRef.value?.discount || 0))
const total = computed(() => Number(pdvRef.value?.total || 0))
const metodoPagamento = computed(() => String(pdvRef.value?.paymentMethod || 'PIX'))
const metodoPagamentoLabel = computed(() => {
  switch (metodoPagamento.value) {
    case 'DINHEIRO':
      return 'Dinheiro'
    case 'CARTAO':
      return 'Cartao'
    case 'CREDIARIO':
      return 'Crediario'
    case 'BOLETO':
      return 'Boleto'
    default:
      return 'PIX'
  }
})
const dataAtual = computed(() => agora.value.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }))
const horaAtual = computed(() => agora.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))

const atalhos = computed(() => [
  { key: 'F1', label: 'Produtos', icon: Box, action: 'produtos' as const },
  { key: 'F2', label: 'Leitor', icon: ScanBarcode, action: 'leitor' as const },
  { key: 'F3', label: 'Adicionar', icon: ShoppingCart, action: 'adicionar' as const },
  { key: 'F4', label: 'Cancelar item', icon: CircleX, action: 'cancelar-item' as const },
  { key: 'F5', label: 'Cliente', icon: UsersRound, action: 'cliente' as const },
  { key: 'F6', label: 'Sair', icon: DoorOpen, action: 'sair' as const },
  { key: 'F7', label: 'Caixa', icon: BanknoteArrowDown, action: 'caixa' as const },
  { key: 'F8', label: 'Imprimir', icon: Printer, action: 'imprimir' as const },
  { key: 'F9', label: 'Pagamento', icon: CreditCard, action: 'pagamento' as const },
  { key: 'F10', label: 'Desconto', icon: BadgePercent, action: 'desconto' as const },
  {
    key: 'F11',
    label: caixaAtivo.value ? 'Fechar caixa' : 'Abrir caixa',
    icon: caixaAtivo.value ? Store : BanknoteArrowDown,
    action: 'fechar-caixa' as const,
  },
  { key: 'F12', label: 'Fechar venda', icon: ReceiptText, action: 'finalizar' as const, primary: true },
])

async function executarAcao(acao: AcaoAtalho) {
  const pdv = pdvRef.value
  if (!pdv) return
  if (acao === 'sair') {
    const sair = async () => {
      // Sair desbloqueia o terminal. Escrevemos no localStorage de forma síncrona
      // (antes do router.push) para o guard global não bloquear esta navegação.
      caixaBloqueado.value = false
      localStorage.setItem('gestao_facil:pdvBloqueado', 'false')
      isLeavingPdv.value = true
      await router.push('/vendas')
    }
    if (caixaBloqueado.value) {
      solicitarSenha(
        { title: 'Sair do caixa', description: 'O terminal está bloqueado. Digite a senha do usuário logado para sair.' },
        sair,
      )
      return
    }
    const confirmed = await pdv.confirmarSaidaCaixa()
    if (!confirmed) return
    await sair()
    return
  }
  const actions: Record<Exclude<AcaoAtalho, 'sair'>, () => void> = {
    produtos: pdv.focusSearch,
    leitor: pdv.focusSearch,
    adicionar: pdv.quickAddCard,
    'cancelar-item': pdv.removerUltimoItem,
    cliente: pdv.abrirSelecaoCliente,
    caixa: pdv.abrirAcoesCaixa,
    imprimir: pdv.imprimirUltimoComprovante,
    pagamento: pdv.alternarPagamento,
    desconto: pdv.abrirDesconto,
    'fechar-caixa': pdv.abrirOuFecharCaixa,
    finalizar: pdv.finalizarVendaPDV,
  }
  actions[acao]?.()
}

function handleShortcut(event: KeyboardEvent) {
  const atalho = atalhos.value.find((item) => item.key === event.key)
  if (!atalho || modeloPdv.value !== 'PRO') return
  // Enquanto o terminal pede a senha, os atalhos ficam bloqueados
  if (openModalSenha.value) return
  event.preventDefault()
  event.stopPropagation()
  void executarAcao(atalho.action)
}

function keepPdvOpen() {
  if (!isLeavingPdv.value) {
    window.history.pushState({ pdvPro: true }, '', window.location.href)
  }
}

function activateFullscreenPdv() {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.history.pushState({ pdvPro: true }, '', window.location.href)
  window.addEventListener('popstate', keepPdvOpen)
}

function restaurarInteracaoBody() {
  document.body.style.overflow = previousBodyOverflow
  document.body.style.pointerEvents = ''
  document.body.style.paddingRight = ''
  document.body.style.marginRight = ''
  document.documentElement.style.removeProperty('--scrollbar-width')
}

function deactivateFullscreenPdv() {
  window.removeEventListener('popstate', keepPdvOpen)
  // Sair do PDV PRO coincide com o fechamento de um Dialog (confirmação de saída / senha).
  // O reka-ui gerencia `pointer-events`/`overflow` do <body>, mas a limpeza dele
  // (DismissableLayer + scroll-lock) só roda quando o overlay desmonta, ao fim da
  // animação de saída (~200ms DEPOIS do fechamento). Como a navegação acontece nesse
  // instante, essa limpeza tardia reaplica `pointer-events: none` no <body> e trava o
  // scroll/cliques até um reload. Por isso reforçamos a restauração numa janela que
  // ultrapassa a animação de saída, garantindo o estado interativo por último.
  restaurarInteracaoBody()
  const inicio = performance.now()
  const reforcar = () => {
    restaurarInteracaoBody()
    if (performance.now() - inicio < 800) requestAnimationFrame(reforcar)
  }
  requestAnimationFrame(reforcar)
}

onBeforeRouteLeave(() => {
  if (modeloPdv.value === 'PRO' && !isLeavingPdv.value) return false
  return true
})

onMounted(async () => {
  try {
    const response = await ContaRepository.getParametros()
    modeloPdv.value = response.data?.modeloPdv === 'PRO' ? 'PRO' : 'BASICO'
    if (modeloPdv.value === 'PRO') {
      activateFullscreenPdv()
    } else {
      // O bloqueio de quiosque só existe no modo PRO. Limpa qualquer flag legada
      // para não prender o operador no PDV BÁSICO (que não tem botão de desbloqueio).
      caixaBloqueado.value = false
      localStorage.setItem('gestao_facil:pdvBloqueado', 'false')
    }
  } catch {
    modeloPdv.value = 'BASICO'
    caixaBloqueado.value = false
    localStorage.setItem('gestao_facil:pdvBloqueado', 'false')
  } finally {
    loading.value = false
  }
  relogio = setInterval(() => { agora.value = new Date() }, 1000)
  window.addEventListener('keydown', handleShortcut, true)
})

onUnmounted(() => {
  if (relogio) clearInterval(relogio)
  window.removeEventListener('keydown', handleShortcut, true)
  deactivateFullscreenPdv()
})
</script>

<style scoped>
.pdv-pro {
  --pdv-accent: hsl(var(--primary));
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  height: 100dvh;
  min-height: 100dvh;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background:
    radial-gradient(circle at 9% 24%, color-mix(in srgb, var(--pdv-accent) 8%, transparent), transparent 22rem),
    hsl(var(--background));
  box-shadow: 0 24px 70px rgb(15 23 42 / 0.09);
}
.pdv-pro__header { display: flex; min-height: 5rem; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid hsl(var(--border)); padding: .7rem 1rem; background: color-mix(in srgb, hsl(var(--background)) 94%, transparent); }
.pdv-pro__mark { display: grid; height: 2.8rem; width: 2.8rem; place-items: center; border-radius: 999px; color: hsl(var(--primary-foreground)); background: var(--pdv-accent); box-shadow: 0 8px 22px color-mix(in srgb, var(--pdv-accent) 30%, transparent); }
.pdv-pro__header small { margin-left: .35rem; border-radius: 999px; background: var(--pdv-accent); padding: .15rem .45rem; color: hsl(var(--primary-foreground)); font-size: .58rem; letter-spacing: .12em; vertical-align: middle; }
.pdv-pro__operator { display: flex; min-width: 10rem; align-items: center; gap: .65rem; border: 1px solid hsl(var(--border)); border-radius: .85rem; background: hsl(var(--card)); padding: .55rem .75rem; }
.pdv-pro__operator kbd { color: var(--pdv-accent); font-size: .65rem; }
.pdv-pro__lock { display: inline-flex; align-items: center; gap: .4rem; border: 1px solid hsl(var(--border)); border-radius: .85rem; background: hsl(var(--card)); padding: .55rem .75rem; font-size: .72rem; font-weight: 700; color: hsl(var(--muted-foreground)); transition: border-color .15s ease, color .15s ease, background .15s ease; }
.pdv-pro__lock:hover { border-color: var(--pdv-accent); color: var(--pdv-accent); }
.pdv-pro__lock--active { border-color: #ef4444; color: #ef4444; background: color-mix(in srgb, #ef4444 12%, hsl(var(--card))); }
.pdv-pro__clock { min-width: 7.7rem; border-radius: 1rem; padding: .55rem .85rem; color: hsl(var(--primary-foreground)); text-align: right; background: linear-gradient(135deg, color-mix(in srgb, var(--pdv-accent) 78%, black), var(--pdv-accent) 72%, color-mix(in srgb, var(--pdv-accent) 78%, white)); box-shadow: 0 10px 28px color-mix(in srgb, var(--pdv-accent) 24%, transparent); }
.pdv-pro__clock p { text-transform: capitalize; font-size: .65rem; opacity: .82; }
.pdv-pro__clock strong { font-variant-numeric: tabular-nums; font-size: 1.25rem; letter-spacing: .04em; }
.pdv-pro__workspace { display: grid; min-height: 0; grid-template-columns: 12rem minmax(0, 1fr); gap: .8rem; overflow: hidden; padding: .8rem; }
.pdv-pro__status { display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; border: 1px solid hsl(var(--border)); border-radius: 1rem; padding: .9rem; background: color-mix(in srgb, hsl(var(--card)) 92%, var(--pdv-accent) 8%); }
.pdv-pro__metric-header { display: grid; gap: .18rem; border: 1px solid color-mix(in srgb, var(--pdv-accent) 32%, hsl(var(--border))); border-radius: .85rem; padding: .7rem; background: hsl(var(--background)); }
.pdv-pro__metric-header strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .95rem; }
.pdv-pro__metric-header span { font-size: .68rem; font-weight: 800; }
.pdv-pro__metric-grid { display: grid; gap: .45rem; }
.pdv-pro__metric-grid div { border: 1px solid hsl(var(--border)); border-radius: .8rem; background: hsl(var(--background)); padding: .65rem; }
.pdv-pro__metric-grid span { display: block; color: hsl(var(--muted-foreground)); font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
.pdv-pro__metric-grid strong { display: block; margin-top: .15rem; font-size: .92rem; line-height: 1.1; }
.pdv-pro__mini-status { display: grid; gap: .35rem; border: 1px solid color-mix(in srgb, var(--pdv-accent) 32%, hsl(var(--border))); border-radius: .8rem; padding: .65rem; background: hsl(var(--background)); font-size: .68rem; }
.pdv-pro__mini-status span { display: flex; align-items: center; gap: .4rem; }
.pdv-pro__core { min-width: 0; min-height: 0; overflow: hidden; padding-left: 2px; }
.pdv-pro__shortcuts { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: .35rem; border-top: 1px solid hsl(var(--border)); padding: .55rem; background: hsl(var(--card)); }
.pdv-pro__shortcuts button { display: flex; min-height: 4.3rem; flex-direction: column; align-items: center; justify-content: center; gap: .2rem; border: 1px solid hsl(var(--border)); border-radius: .7rem; background: hsl(var(--background)); color: hsl(var(--foreground)); transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease; }
.pdv-pro__shortcuts button:hover { transform: translateY(-2px); border-color: var(--pdv-accent); box-shadow: 0 8px 20px rgb(15 23 42 / .08); }
.pdv-pro__shortcuts kbd { align-self: flex-start; margin-left: .45rem; color: var(--pdv-accent); font-size: .62rem; font-weight: 800; }
.pdv-pro__shortcuts span { font-size: .62rem; font-weight: 700; line-height: 1.1; text-align: center; }
.pdv-pro__shortcuts .pdv-pro__shortcut--primary { border-color: var(--pdv-accent); color: hsl(var(--primary-foreground)); background: linear-gradient(135deg, color-mix(in srgb, var(--pdv-accent) 82%, black), var(--pdv-accent)); }
.pdv-pro__shortcuts .pdv-pro__shortcut--primary kbd { color: hsl(var(--primary-foreground)); }
.pdv-pro__bottomline { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid hsl(var(--border)); padding: .45rem .8rem; color: hsl(var(--muted-foreground)); font-size: .67rem; }
.pdv-pro__bottomline span:first-child { display: flex; align-items: center; gap: .4rem; color: #16a34a; }
.pdv-pro__bottomline i { height: .5rem; width: .5rem; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 .2rem rgb(34 197 94 / .12); }
.pdv-pro :deep(.pdv-basic-pro) { height: 100%; }
.pdv-pro :deep(.pdv-basic-pro > div:first-child) { height: 100%; gap: .7rem; max-height: calc(100dvh - 11.25rem); }
.pdv-pro :deep(.pdv-basic-pro > div:first-child > div:first-child > div:first-child) { margin-bottom: .65rem; }
.pdv-pro :deep(.pdv-basic-pro .product-card) { box-shadow: none; border-radius: .75rem; }
.pdv-pro :deep(.pdv-basic-pro nav.fixed) { display: none; }

@media (max-width: 1100px) {
  .pdv-pro__workspace { grid-template-columns: 1fr; }
  .pdv-pro__status { display: none; }
  .pdv-pro__shortcuts { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .pdv-pro__header { min-height: 4.3rem; }
  .pdv-pro__shortcuts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pdv-pro :deep(.pdv-basic-pro > div:first-child) { max-height: none; }
}
</style>
