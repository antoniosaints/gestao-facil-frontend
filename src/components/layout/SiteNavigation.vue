<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, LayoutGrid, PanelRightClose, X } from 'lucide-vue-next'
import type { SidebarMenuType } from '@/types/sidebar'
import { useUiStore } from '@/stores/ui/uiStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ColorToggle from './colorToggle.vue'
import InformativosStatusButton from './InformativosStatusButton.vue'
import InstallAppButton from './InstallAppButton.vue'
import NavUserSidebar from './navUserSidebar.vue'
import ReportBugButton from './ReportBugButton.vue'
import RestaurantPrintStatusButton from './RestaurantPrintStatusButton.vue'
import SupportBadge from './SupportBadge.vue'
import TourHelpButton from './TourHelpButton.vue'
import { isSupportActive } from '@/utils/supportSession'

const props = defineProps<{ menu: SidebarMenuType[] }>()
const uiStore = useUiStore()
const route = useRoute()
const mobileOpen = ref(false)
const mobileSections = ref<string[]>([])
const desktopNavigation = ref<HTMLElement | null>(null)
const dragging = ref({ active: false, startX: 0, startScroll: 0, moved: false })

const items = computed(() => props.menu.filter((item) => !item.divisor && item.show !== false))
const homeLink = computed(() => items.value.find((item) => item.key === 'dashboard')?.link || '/')

function normalizedMenuName(name: string) {
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

// A configuração de visibilidade pode, em contas antigas, manter uma entrada
// simples e outra agrupada para o mesmo módulo. No mobile exibimos somente a
// versão mais completa, sem esconder os filhos de nenhum dos dois registros.
const mobileItems = computed(() => {
  const uniqueItems = new Map<string, SidebarMenuType>()

  for (const item of items.value) {
    if (item.key === 'dashboard' || item.link === homeLink.value) continue

    const identity = normalizedMenuName(item.nome)
    const existing = uniqueItems.get(identity)
    if (!existing) {
      uniqueItems.set(identity, item)
      continue
    }

    const mergedChildren = [...(existing.children ?? []), ...(item.children ?? [])]
    const childrenByKey = new Map<string, Omit<SidebarMenuType, 'children'>>()
    for (const child of mergedChildren) {
      childrenByKey.set(child.key || `${child.nome}:${child.link || ''}`, child)
    }

    uniqueItems.set(identity, {
      ...(existing.children?.length ? existing : item),
      children: [...childrenByKey.values()],
    })
  }

  return [...uniqueItems.values()]
})

function isActive(item: SidebarMenuType | Omit<SidebarMenuType, 'children'>) {
  // Um submenu não pode ativar outro somente por compartilhar o mesmo prefixo.
  // Ex.: `/atendimento` (Chat) não deve ficar marcado em `/atendimento/painel`.
  const currentPath = route.path === '/' ? '/' : route.path.replace(/\/+$/, '')
  const itemPath = item.link === '/' ? '/' : item.link?.replace(/\/+$/, '')
  return Boolean(itemPath && currentPath === itemPath)
}

function sectionActive(item: SidebarMenuType) {
  return isActive(item) || Boolean(item.children?.some((child) => isActive(child)))
}

function toggleMobileSection(name: string) {
  mobileSections.value = mobileSections.value.includes(name)
    ? mobileSections.value.filter((section) => section !== name)
    : [...mobileSections.value, name]
}

function toggleMobileMenu() {
  if (mobileOpen.value) return closeMobileMenu()
  const activeSection = mobileItems.value.find((item) => item.children?.some((child) => isActive(child)))
  if (activeSection && !mobileSections.value.includes(activeSection.nome)) {
    mobileSections.value = [...mobileSections.value, activeSection.nome]
  }
  mobileOpen.value = true
}

function closeMobileMenu() {
  mobileOpen.value = false
}

function closeMobileMenuAfterAction() {
  // Aguarda o clique alcançar o componente de ação antes de desmontar a gaveta.
  window.setTimeout(closeMobileMenu, 0)
}

function iniciarArrastoDesktop(event: PointerEvent) {
  if (event.button !== 0 || !desktopNavigation.value) return
  dragging.value = {
    active: true,
    startX: event.clientX,
    startScroll: desktopNavigation.value.scrollLeft,
    moved: false,
  }
}

function arrastarDesktop(event: PointerEvent) {
  if (!dragging.value.active || !desktopNavigation.value) return
  const distance = event.clientX - dragging.value.startX
  if (Math.abs(distance) <= 4) return
  if (!dragging.value.moved) {
    dragging.value.moved = true
    desktopNavigation.value.setPointerCapture(event.pointerId)
  }
  event.preventDefault()
  desktopNavigation.value.scrollLeft = dragging.value.startScroll - distance
}

function finalizarArrastoDesktop(event: PointerEvent) {
  if (!dragging.value.active || !desktopNavigation.value) return
  if (desktopNavigation.value.hasPointerCapture(event.pointerId)) {
    desktopNavigation.value.releasePointerCapture(event.pointerId)
  }
  dragging.value.active = false
  window.setTimeout(() => {
    dragging.value.moved = false
  }, 0)
}

function bloquearCliqueAposArrasto(event: MouseEvent) {
  if (!dragging.value.moved) return
  event.preventDefault()
  event.stopPropagation()
}
</script>

<template>
  <header class="sticky top-0 z-40 py-2 border-b border-border bg-card text-foreground shadow-sm backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-[100rem] items-center gap-3 px-4 lg:px-6">
      <nav
        ref="desktopNavigation"
        class="hidden min-w-0 flex-1 cursor-grab items-center justify-start gap-1 overflow-x-auto px-1 select-none [scrollbar-width:none] active:cursor-grabbing lg:flex [&::-webkit-scrollbar]:hidden"
        :class="dragging.active && 'cursor-grabbing'"
        aria-label="Navegação principal. Arraste para ver mais menus."
        @pointerdown="iniciarArrastoDesktop"
        @pointermove="arrastarDesktop"
        @pointerup="finalizarArrastoDesktop"
        @pointercancel="finalizarArrastoDesktop"
        @dragstart.prevent
        @click.capture="bloquearCliqueAposArrasto"
      >
        <template v-for="item in items" :key="item.key || item.nome">
          <DropdownMenu v-if="item.children?.length">
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition hover:bg-primary/80 hover:text-gray-50"
                :class="sectionActive(item) && 'bg-primary text-white'"
              >
                <component v-if="(item.icone && typeof item.icone !== 'string')" :is="item.icone" class="h-4 w-4" />
                <i v-else-if="item.icone" :class="item.icone" />
                <span class="max-w-24 truncate lg:max-w-32">{{ item.nome }}</span>
                <ChevronDown class="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-60 p-1.5">
              <DropdownMenuLabel class="px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                {{ item.nome }}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <RouterLink
                v-for="child in item.children.filter((entry) => entry.show !== false)"
                :key="child.key || child.nome"
                :to="child.link || '/'"
              >
                <DropdownMenuItem :class="isActive(child) && 'bg-primary text-white focus:bg-primary/70 focus:text-white'">
                  <component v-if="(child.icone && typeof child.icone !== 'string')" :is="child.icone" class="h-4 w-4" />
                  <i v-else-if="child.icone" :class="child.icone" />
                  <span>{{ child.nome }}</span>
                </DropdownMenuItem>
              </RouterLink>
            </DropdownMenuContent>
          </DropdownMenu>

          <RouterLink
            v-else
            :to="item.link || '/'"
            class="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition hover:bg-primary/80 hover:text-gray-50"
            :class="isActive(item) && 'bg-primary text-white'"
          >
            <component v-if="(item.icone && typeof item.icone !== 'string')" :is="item.icone" class="h-4 w-4" />
            <i v-else-if="item.icone" :class="item.icone" />
            <span class="max-w-24 truncate lg:max-w-32">{{ item.nome }}</span>
          </RouterLink>
        </template>
      </nav>

      <div class="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
        <SupportBadge v-if="isSupportActive()" class="mr-1" />
        <ReportBugButton />
        <TourHelpButton />
        <InformativosStatusButton />
        <RestaurantPrintStatusButton />
        <ColorToggle class="mr-1" />
        <NavUserSidebar variant="icon" />
      </div>

      <div class="flex min-w-0 flex-1 items-center gap-3 lg:hidden">
        <NavUserSidebar variant="icon" />
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Área de trabalho</p>
          <p class="truncate text-sm font-semibold text-foreground">{{ uiStore.contaInfo.nome || 'Gestão Fácil' }}</p>
        </div>
      </div>
    </div>

  </header>

  <Teleport to="body">
    <button
      type="button"
      class="fixed bottom-16 right-0 z-[80] flex h-14 w-10 -translate-y-1/2 items-center rounded-l-full bg-primary/80 pl-3 pr-0 text-primary-foreground shadow-lg transition hover:bg-primary active:scale-95 lg:hidden"
      :aria-expanded="mobileOpen"
      aria-controls="site-navigation-mobile"
      :aria-label="mobileOpen ? 'Fechar menu' : 'Abrir menu'"
      @click="toggleMobileMenu"
    >
      <X v-if="mobileOpen" class="h-5 w-5" />
      <PanelRightClose v-else class="h-5 w-5" />
    </button>
  </Teleport>

  <Teleport to="body">
    <div v-if="mobileOpen" class="fixed inset-0 z-[100] lg:hidden" @keydown.esc="closeMobileMenu">
      <button type="button" class="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]" aria-label="Fechar menu" @click="closeMobileMenu" />
      <aside id="site-navigation-mobile" class="absolute inset-y-0 right-0 flex w-[min(23rem,calc(100vw-2.5rem))] flex-col border-l bg-background text-foreground shadow-2xl" role="dialog" aria-modal="true" aria-label="Navegação">
        <div class="flex items-center gap-3 border-b px-4 py-3">
          <div class="min-w-0 flex-1 px-2">
            <p class="truncate text-sm font-semibold text-foreground">{{ uiStore.contaInfo.nome || 'Gestão Fácil' }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground">Use o ícone da conta no cabeçalho para suas opções.</p>
          </div>
          <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Fechar menu" @click="closeMobileMenu"><X class="h-5 w-5" /></button>
        </div>

        <nav class="hidden_scrollbar flex-1 overflow-y-auto p-3" aria-label="Navegação móvel">
          <p class="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Navegação</p>
          <RouterLink :to="homeLink" class="mb-2 flex items-center gap-3 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground shadow-sm" @click="closeMobileMenu"><LayoutGrid class="h-4 w-4" />Visão geral</RouterLink>

          <div v-for="item in mobileItems" :key="item.key || item.nome" class="mb-1">
            <template v-if="item.children?.length">
              <button type="button" class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition hover:bg-muted" :class="sectionActive(item) ? 'bg-primary text-white' : 'text-foreground'" :aria-expanded="mobileSections.includes(item.nome)" @click="toggleMobileSection(item.nome)">
                <component v-if="(item.icone && typeof item.icone !== 'string')" :is="item.icone" class="h-[18px] w-[18px] shrink-0" />
                <i v-else-if="item.icone" :class="[item.icone, 'w-[18px] text-center']" />
                <span class="min-w-0 flex-1 truncate">{{ item.nome }}</span>
                <ChevronDown class="h-4 w-4 shrink-0 transition-transform" :class="mobileSections.includes(item.nome) && 'rotate-180'" />
              </button>
              <div v-if="mobileSections.includes(item.nome)" class="ml-5 mt-1 space-y-1 border-l-2 border-primary/50 py-1 pl-3">
                <RouterLink v-for="child in item.children.filter((entry) => entry.show !== false)" :key="child.key || child.nome" :to="child.link || '/'" class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground" :class="isActive(child) && 'bg-primary font-semibold text-white'" @click="closeMobileMenu">
                  <component v-if="(child.icone && typeof child.icone !== 'string')" :is="child.icone" class="h-4 w-4 shrink-0" />
                  <i v-else-if="child.icone" :class="[child.icone, 'w-4 text-center']" />
                  <span class="truncate">{{ child.nome }}</span>
                </RouterLink>
              </div>
            </template>
            <RouterLink v-else :to="item.link || '/'" class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-muted" :class="isActive(item) && 'bg-primary text-primary-foreground shadow-sm'" @click="closeMobileMenu">
              <component v-if="(item.icone && typeof item.icone !== 'string')" :is="item.icone" class="h-[18px] w-[18px] shrink-0" />
              <i v-else-if="item.icone" :class="[item.icone, 'w-[18px] text-center']" />
              <span class="truncate">{{ item.nome }}</span>
            </RouterLink>
          </div>
        </nav>

        <div class="space-y-3 border-t p-4" @click="closeMobileMenuAfterAction">
          <InstallAppButton />
          <div class="grid grid-cols-4 gap-2">
            <ColorToggle class="h-10 w-full" />
            <InformativosStatusButton class="h-10 w-full" />
            <TourHelpButton class="h-10 w-full" />
            <ReportBugButton class="h-10 w-full" />
          </div>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
