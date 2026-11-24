<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onBeforeUnmount, provide, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Home,
  Moon,
  Sun,
  ShoppingCart,
  Package,
  Wallet,
  Wrench,
  Users,
  Grid2X2,
  Settings,
  Menu,
  X,
  Search,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  Boxes,
  Check,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { experience, refreshExperience } from '../application/experience'
import { useExperienceEntry } from '../application/useExperienceEntry'
import { darkPaletteClasses, surfaceClasses } from '../application/ui'
import { formThemeClassesKey } from '@/components/formulario/form-theme'
import { colorTheme } from '@/utils/theme'
import { usePreferredDark } from '@vueuse/core'
import ModalWorkspace from '../components/ModalWorkspace.vue'
import ModalAction from '../components/ModalAction.vue'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
import { Input } from '@/components/ui/input'
import NavigationViewport from '../components/NavigationViewport.vue'
import { useMenuLoading } from '../application/useMenuLoading'
import ListLoading from '../components/ListLoading.vue'
import Feedback from '../components/Feedback.vue'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'
import { confirmationKey, type ConfirmationOptions } from '../application/confirmation'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { entrarNaConta, sairDaConta } from '@/pluguins/socket'
import { isRouteLoading } from '@/router'

provide(formThemeClassesKey, darkPaletteClasses)

const { pendingPath, onNavigate } = useMenuLoading()
const ui = useUiStore(),
  route = useRoute()
const showAnimatedLoading = computed(
  () => isRouteLoading.value || (ui.usaCarregamentoAnimado && !!pendingPath.value),
)
const showClassicLoading = computed(() => !!pendingPath.value && !showAnimatedLoading.value)
const workspace =
  inject(modalWorkspaceKey, undefined) ||
  createModalWorkspace((level) => hasPermission(ui.usuarioLogged, level))
provide(modalWorkspaceKey, workspace)
watch(
  () => experience.sessionVersion,
  () => workspace.reset(),
  { flush: 'sync' },
)
const preferredDark = usePreferredDark()
const isDark = computed(() =>
  colorTheme.value === 'auto' ? preferredDark.value : colorTheme.value === 'dark',
)
function toggleTheme() {
  colorTheme.value = isDark.value ? 'light' : 'dark'
}
const confirmation = ref<ConfirmationOptions | null>(null)
const confirmationVersion = ref(0)
let resolvePending: ((confirmed: boolean) => void) | undefined
function resolveConfirmation(confirmed: boolean) {
  confirmation.value = null
  resolvePending?.(confirmed)
  resolvePending = undefined
}
provide(confirmationKey, (options) => {
  resolveConfirmation(false)
  confirmationVersion.value++
  confirmation.value = options
  return new Promise<boolean>((resolve) => {
    resolvePending = resolve
  })
})
onBeforeUnmount(() => resolveConfirmation(false))
const entered = useExperienceEntry()
const collapsed = ref(false),
  mobileOpen = ref(false),
  search = ref(''),
  searchOpen = ref(false)
const desktop = ref(window.innerWidth >= 1024)
watch(
  () => workspace.entries.value.length,
  (count, previous) => {
    if (count > previous) {
      mobileOpen.value = false
      searchOpen.value = false
    }
  },
)
watch(pendingPath, (path) => {
  if (path) {
    mobileOpen.value = false
    searchOpen.value = false
  }
})
const navigation = ref<HTMLElement | null>(null)
const mobileToggle = ref<HTMLButtonElement | null>(null)
const onResize = () => {
  desktop.value = window.innerWidth >= 1024
}
watch(desktop, (value) => {
  if (value) mobileOpen.value = false
})
watch(mobileOpen, async (open) => {
  await nextTick()
  if (open) navigation.value?.querySelector<HTMLElement>('a')?.focus()
  else if (!desktop.value) mobileToggle.value?.focus()
})
function trapNavigation(event: KeyboardEvent) {
  if (!mobileOpen.value || desktop.value) return
  const controls = Array.from(
    navigation.value?.querySelectorAll<HTMLElement>('a[href], button') || [],
  ).filter((control) => control.getClientRects().length && !control.hasAttribute('disabled'))
  if (!controls?.length) return
  const first = controls[0],
    last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
const userName = computed(() => ui.usuarioLogged.nome || 'Administrador')
const initials = computed(() =>
  userName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase(),
)
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
    searchOpen.value = false
  },
)
useSocketEvent('sessao:updated', async () => {
  await Promise.all([refreshExperience(), ui.loadFinanceiroFlags()])
})
function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    mobileOpen.value = false
    searchOpen.value = false
  }
}
onMounted(() => {
  if (ui.contaInfo.id) entrarNaConta(ui.contaInfo.id)
  window.addEventListener('focus', refreshExperience)
  window.addEventListener('keydown', onEscape)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  if (ui.contaInfo.id) sairDaConta(ui.contaInfo.id)
  window.removeEventListener('focus', refreshExperience)
  window.removeEventListener('keydown', onEscape)
  window.removeEventListener('resize', onResize)
})
const links = computed(() =>
  [
    { path: '/modofacil', label: 'Dashboard', icon: Home, level: 1 },
    { path: '/modofacil/pessoas', label: 'Pessoas', icon: Users, level: 2 },
    { path: '/modofacil/produtos', label: 'Produtos', icon: Package, level: 4 },
    { path: '/modofacil/vendas', label: 'Vendas', icon: ShoppingCart, level: 2 },
    {
      path: '/modofacil/estoque/movimentacoes',
      label: 'Estoque',
      icon: Boxes,
      level: 4,
      form: 'estoque' as const,
    },
    { path: '/modofacil/financeiro', label: 'Financeiro', icon: Wallet, level: 3 },
    { path: '/modofacil/servicos', label: 'Serviços', icon: Wrench, level: 2 },
    { path: '/modofacil/relatorios', label: 'Relatórios', icon: BarChart3, level: 1 },
    { path: '/modofacil/recursos', label: 'Mais recursos', icon: Grid2X2, level: 1 },
    { path: '/modofacil/configuracoes', label: 'Configurações', icon: Settings, level: 4 },
  ].filter((link) => hasPermission(ui.usuarioLogged, link.level)),
)
const active = (path: string) =>
  path === '/modofacil/vendas' && route.path === '/modofacil/caixa'
    ? true
    : path === '/modofacil'
      ? route.path === path
      : path.includes('/estoque/')
        ? route.path.startsWith('/modofacil/estoque')
        : route.path.startsWith(path)
const currentPage = computed(() =>
  route.path === '/modofacil/caixa'
    ? 'Caixa'
    : links.value.find((link) => active(link.path))?.label || 'Modo Fácil',
)
const expandedGroups = ref<Record<string, boolean>>({
  cadastros: true,
  operacao: true,
  sistema: true,
})
const navigationGroups = computed(() =>
  [
    { id: 'inicio', label: '', icon: Home, paths: ['/modofacil'] },
    {
      id: 'cadastros',
      label: 'Cadastros',
      icon: Users,
      paths: ['/modofacil/pessoas', '/modofacil/produtos', '/modofacil/servicos'],
    },
    {
      id: 'operacao',
      label: 'Operação',
      icon: Boxes,
      paths: [
        '/modofacil/vendas',
        '/modofacil/estoque/movimentacoes',
        '/modofacil/financeiro',
        '/modofacil/relatorios',
      ],
    },
    {
      id: 'sistema',
      label: 'Sistema',
      icon: Settings,
      paths: ['/modofacil/recursos', '/modofacil/configuracoes'],
    },
  ]
    .map((group) => ({
      ...group,
      links: group.paths.flatMap((path) => links.value.filter((link) => link.path === path)),
    }))
    .filter((group) => group.links.length),
)
watch(
  () => route.path,
  () => {
    const group = navigationGroups.value.find((group) =>
      group.links.some((link) => active(link.path)),
    )
    if (group?.label) expandedGroups.value[group.id] = true
  },
)
const searchLinks = computed(() =>
  links.value.filter((link) =>
    link.label.toLocaleLowerCase('pt-BR').includes(search.value.toLocaleLowerCase('pt-BR')),
  ),
)
const searchDomains = computed(() =>
  links.value.filter((link) =>
    ['/modofacil/produtos', '/modofacil/pessoas', '/modofacil/vendas'].includes(link.path),
  ),
)
function closeSearch(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null))
    searchOpen.value = false
}
</script>
<template>
  <div class="modo-facil min-h-dvh lg:flex" :class="surfaceClasses" @click.capture="onNavigate">
    <ConfirmationDialog
      v-if="confirmation"
      :key="confirmationVersion"
      :options="confirmation"
      @resolve="resolveConfirmation"
    />
    <a
      href="#mf-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[6px] focus:bg-card focus:p-3"
      >Ir para o conteúdo</a
    >
    <button
      v-if="mobileOpen"
      type="button"
      class="fixed inset-0 z-40 !rounded-none !border-0 !bg-slate-950/40 lg:hidden"
      aria-label="Fechar navegação"
      @click="mobileOpen = false"
    />
    <aside
      id="mf-navigation"
      ref="navigation"
      :inert="!desktop && !mobileOpen"
      @keydown.tab="trapNavigation"
      class="mf-sidebar fixed inset-y-0 left-0 z-50 flex flex-col px-4 py-5 transition-[width,transform] duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:h-dvh lg:shrink-0 lg:translate-x-0"
      :class="[
        collapsed ? 'lg:w-[80px]' : 'lg:w-[288px]',
        mobileOpen
          ? 'w-[min(288px,calc(100vw-2rem))] translate-x-0'
          : 'w-[min(288px,calc(100vw-2rem))] -translate-x-full',
      ]"
      aria-label="Menu principal"
      @keydown.esc="mobileOpen = false"
    >
      <div
        class="mb-7 flex h-12 shrink-0 items-center gap-2 px-2"
        :class="collapsed ? 'lg:px-0' : ''"
      >
        <RouterLink
          to="/modofacil"
          class="flex min-w-0 items-center gap-3 !text-foreground"
          aria-label="Gestão Fácil ERP, início"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-primary text-lg font-bold tracking-tight text-primary-foreground shadow-sm"
            >GF</span
          >
          <span
            class="min-w-0 text-sm font-semibold leading-tight"
            :class="collapsed && !mobileOpen ? 'lg:hidden' : ''"
            >Gestão Fácil ERP<small class="mt-1 whitespace-nowrap !text-[11px]"
              >Sua rotina mais simples</small
            ></span
          >
        </RouterLink>
        <button
          type="button"
          class="ml-auto !min-h-9 !border-0 !bg-transparent !p-1 lg:!hidden"
          aria-label="Fechar menu"
          @click.prevent="mobileOpen = false"
        >
          <X :size="20" />
        </button>
      </div>
      <nav class="min-h-0 flex-1 space-y-2 overflow-y-auto pb-5" aria-label="Navegação principal">
        <div v-for="group in navigationGroups" :key="group.id">
          <button
            v-if="group.label"
            type="button"
            class="mf-nav-group mb-1 flex w-full !justify-start gap-3 !border-0 !px-3 !py-2.5 text-left"
            :class="collapsed && !mobileOpen ? 'lg:!hidden' : ''"
            :aria-expanded="expandedGroups[group.id]"
            :aria-controls="`mf-group-${group.id}`"
            :data-active="group.links.some((link) => active(link.path))"
            @click="expandedGroups[group.id] = !expandedGroups[group.id]"
          >
            <component :is="group.icon" :size="17" :stroke-width="1.7" aria-hidden="true" />
            {{ group.label }}
            <ChevronDown
              :size="14"
              class="ml-auto transition-transform"
              :class="expandedGroups[group.id] ? 'rotate-180' : ''"
              aria-hidden="true"
            />
          </button>
          <div
            :id="`mf-group-${group.id}`"
            v-show="!group.label || expandedGroups[group.id] || (collapsed && desktop)"
            class="grid gap-1"
          >
            <component
              v-for="link in group.links"
              :is="link.form ? ModalAction : RouterLink"
              :key="link.path"
              v-bind="
                link.form
                  ? { form: link.form, params: { operacao: 'reposicao' } }
                  : { to: link.path }
              "
              class="mf-nav-link group flex min-h-11 items-center !justify-start gap-3 !border-0 px-3 py-2 text-left text-sm transition-colors lg:min-h-10"
              :class="[
                group.label && !(collapsed && desktop) ? 'ml-4 border-l border-border !pl-5' : '',
                collapsed && !mobileOpen ? 'lg:!justify-center lg:!px-0' : '',
              ]"
              :aria-current="active(link.path) ? 'page' : undefined"
              :title="collapsed ? link.label : undefined"
            >
              <component
                :is="link.icon"
                :size="18"
                :stroke-width="1.7"
                class="shrink-0"
                aria-hidden="true"
              />
              <span :class="collapsed && !mobileOpen ? 'lg:sr-only' : ''">{{ link.label }}</span>
            </component>
          </div>
        </div>
      </nav>
      <div
        class="mt-auto shrink-0 border-t border-border pt-4"
        :class="collapsed ? 'lg:text-center' : ''"
      >
        <div
          class="mb-3 flex min-w-0 items-center gap-3 px-2"
          :class="collapsed ? 'lg:justify-center lg:px-0' : ''"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-foreground"
            >{{ initials }}</span
          >
          <div class="min-w-0" :class="collapsed && !mobileOpen ? 'lg:hidden' : ''">
            <p class="!mb-0 truncate !text-xs font-medium text-foreground">{{ userName }}</p>
            <small class="mt-1 truncate !text-[11px]">{{
              ui.contaInfo.nomeFantasia || ui.contaInfo.nome || 'Sua empresa'
            }}</small>
          </div>
        </div>
        <div
          class="flex items-center gap-2 px-2 text-xs text-muted-foreground"
          :class="collapsed ? 'lg:justify-center lg:px-0' : ''"
        >
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span :class="collapsed && !mobileOpen ? 'lg:sr-only' : ''">Modo Fácil</span>
        </div>
      </div>
    </aside>
    <div class="min-w-0 flex-1" :inert="mobileOpen && !desktop">
      <header
        class="mf-topbar sticky top-0 z-30 flex h-[65px] items-center gap-2 border-b border-border px-4 sm:gap-3 sm:px-6 lg:px-8"
      >
        <button
          type="button"
          class="!h-10 !w-10 shrink-0 !border-0 !p-2 lg:!hidden"
          ref="mobileToggle"
          aria-label="Abrir menu"
          aria-controls="mf-navigation"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = true"
        >
          <Menu :size="20" />
        </button>
        <button
          type="button"
          class="!hidden !h-10 !w-10 shrink-0 !border-0 !p-2 lg:!inline-flex"
          :aria-label="collapsed ? 'Expandir menu' : 'Recolher menu'"
          aria-controls="mf-navigation"
          :aria-expanded="!collapsed"
          @click="collapsed = !collapsed"
        >
          <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" :size="19" />
        </button>
        <div class="min-w-0 mr-auto">
          <p
            class="!mb-0 whitespace-nowrap !text-[10px] font-semibold uppercase leading-4 tracking-[0.18em] text-muted-foreground"
          >
            Modo Fácil
          </p>
          <p class="!mb-0 truncate !text-base font-semibold leading-tight sm:!text-lg">
            {{ currentPage }}
          </p>
        </div>
        <button
          type="button"
          class="!h-10 !w-10 !border-0 !bg-transparent !p-2 md:!hidden"
          aria-label="Abrir busca"
          :aria-expanded="searchOpen"
          @click="searchOpen = !searchOpen"
        >
          <Search :size="18" />
        </button>
        <div
          class="relative hidden min-w-0 flex-1 rounded-md bg-background md:block md:max-w-sm md:bg-transparent"
          :class="
            searchOpen
              ? '!absolute inset-x-4 top-[73px] !block md:!relative md:inset-auto md:top-auto'
              : ''
          "
          @focusout="closeSearch"
        >
          <label for="mf-global-search" class="sr-only">Buscar páginas ou registros</label>
          <Search
            :size="16"
            class="pointer-events-none absolute left-3 top-3 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="mf-global-search"
            v-model="search"
            type="search"
            placeholder="Buscar páginas ou registros..."
            class="!pl-9 placeholder:text-muted-foreground"
            autocomplete="off"
            :aria-expanded="searchOpen"
            aria-controls="mf-search-results"
            @focus="searchOpen = true"
            @keydown.esc="searchOpen = false"
          />
          <div
            v-if="searchOpen"
            id="mf-search-results"
            class="absolute left-0 right-0 top-12 max-h-96 overflow-y-auto rounded-[8px] border border-border bg-card p-2 shadow-lg"
          >
            <p class="px-2 py-1 text-xs font-medium text-muted-foreground">Páginas</p>
            <component
              v-for="link in searchLinks"
              :is="link.form ? ModalAction : RouterLink"
              :key="link.path"
              v-bind="
                link.form
                  ? { form: link.form, params: { operacao: 'reposicao' } }
                  : { to: link.path }
              "
              class="flex items-center gap-3 rounded-[6px] px-3 py-2 !text-foreground/90 hover:bg-muted/50"
              ><component :is="link.icon" :size="16" />{{ link.label }}</component
            >
            <p v-if="!searchLinks.length" class="px-3 py-2 text-muted-foreground">
              Nenhuma página encontrada.
            </p>
            <template v-if="search.trim()">
              <p
                class="mt-2 border-t border-border px-2 pt-3 text-xs font-medium text-muted-foreground"
              >
                Buscar registros
              </p>
              <RouterLink
                v-for="link in searchDomains"
                :key="link.path"
                :to="{
                  path: link.path,
                  query: {
                    ...(route.path === link.path ? route.query : {}),
                    page: '1',
                    search: search.trim(),
                  },
                }"
                class="flex items-center gap-2 rounded-[6px] px-3 py-2 hover:bg-blue-500/10"
                ><Search :size="14" />{{ link.label }}: “{{ search.trim() }}”</RouterLink
              >
            </template>
          </div>
        </div>
        <button
          type="button"
          class="!h-10 !w-10 shrink-0 !border-0 !bg-transparent !p-2"
          :aria-label="isDark ? 'Ativar tema claro' : 'Ativar tema escuro'"
          :title="isDark ? 'Tema claro' : 'Tema escuro'"
          @click="toggleTheme"
        >
          <component :is="isDark ? Sun : Moon" :size="18" />
        </button>
        <details class="relative ml-auto shrink-0 sm:ml-0">
          <summary
            class="flex cursor-pointer list-none items-center gap-2 rounded-[6px] p-1 [&::-webkit-details-marker]:hidden"
            aria-label="Menu da conta"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground"
              >{{ initials }}</span
            >
            <ChevronDown
              :size="14"
              class="hidden text-muted-foreground sm:block"
              aria-hidden="true"
            />
          </summary>
          <div
            class="absolute right-0 top-12 w-60 rounded-[8px] border border-border bg-card p-4 shadow-lg"
          >
            <p class="truncate font-semibold">{{ userName }}</p>
            <p class="truncate text-xs text-muted-foreground">
              {{ ui.contaInfo.nomeFantasia || ui.contaInfo.nome }}
            </p>
            <span
              class="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300"
              ><Check :size="14" />Modo Fácil ativo</span
            >
            <RouterLink
              v-if="hasPermission(ui.usuarioLogged, 4)"
              to="/modofacil/configuracoes"
              class="mt-3 block border-t border-border pt-3 text-xs"
              >Configurações da experiência</RouterLink
            >
          </div>
        </details>
      </header>
      <main
        :aria-busy="showClassicLoading"
        id="mf-content"
        tabindex="-1"
        class="mx-auto w-full max-w-8xl px-4 py-6 outline-none sm:px-6 lg:px-8"
      >
        <NavigationViewport
          :loading="showClassicLoading"
          :animated-loading="showAnimatedLoading"
          :collapsed="collapsed"
          :label="`Carregando ${links.find((link) => link.path === pendingPath)?.label || 'página'}…`"
        >
          <p
            v-if="experience.changed"
            class="mb-4 rounded-[6px] border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300"
            role="status"
          >
            A experiência da conta mudou. Termine ou cancele a operação atual; a preferência será
            aplicada na próxima navegação.
          </p>
          <Feedback
            v-if="route.path !== '/modofacil/configuracoes'"
            :error="experience.error"
            @retry="refreshExperience"
          />
          <ModalWorkspace
            v-if="route.path === '/modofacil/configuracoes' || entered"
            :key="experience.sessionVersion"
          />
          <section
            v-else-if="!experience.configuration"
            class="rounded-lg border border-border bg-card p-4 sm:p-5"
          >
            <template v-if="experience.loading || !experience.error">
              <h1 class="sr-only">Carregando sua área de trabalho</h1>
              <ListLoading label="Preparando sua área de trabalho…" />
            </template>
            <div v-else class="py-6 text-center">
              <h1 class="!text-lg">Não foi possível abrir sua área de trabalho</h1>
              <p class="text-muted-foreground">
                Tente carregar novamente para continuar de onde parou.
              </p>
              <button
                type="button"
                class="!border-blue-600 !bg-blue-600 !text-white"
                @click="refreshExperience"
              >
                Tentar novamente
              </button>
            </div>
          </section>
          <section v-else class="rounded-lg border border-border bg-card p-6">
            <h1 class="!text-lg">A experiência da conta foi atualizada</h1>
            <RouterLink to="/" class="mf-button">Continuar para o início</RouterLink>
          </section>
        </NavigationViewport>
      </main>
    </div>
  </div>
</template>
