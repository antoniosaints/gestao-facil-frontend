<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, LayoutGrid, Menu, X } from 'lucide-vue-next'
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

function isActive(item: SidebarMenuType | Omit<SidebarMenuType, 'children'>) {
  return Boolean(item.link && (route.path === item.link || route.path.startsWith(`${item.link}/`)))
}

function sectionActive(item: SidebarMenuType) {
  return isActive(item) || Boolean(item.children?.some((child) => isActive(child)))
}

function toggleMobileSection(name: string) {
  mobileSections.value = mobileSections.value.includes(name)
    ? mobileSections.value.filter((section) => section !== name)
    : [...mobileSections.value, name]
}

function closeMobileMenu() {
  mobileOpen.value = false
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

      <button
        type="button"
        class="ml-auto grid h-10 w-10 place-items-center rounded-xl border bg-card text-foreground shadow-sm lg:hidden"
        :aria-expanded="mobileOpen"
        aria-controls="site-navigation-mobile"
        aria-label="Abrir menu"
        @click="mobileOpen = !mobileOpen"
      >
        <X v-if="mobileOpen" class="h-5 w-5" />
        <Menu v-else class="h-5 w-5" />
      </button>
    </div>

    <div v-if="mobileOpen" id="site-navigation-mobile" class="border-t bg-background lg:hidden">
      <nav class="max-h-[calc(100vh-4rem)] overflow-y-auto p-3" aria-label="Navegação móvel">
        <RouterLink
          to="/"
          class="mb-2 flex items-center gap-3 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground"
          @click="closeMobileMenu"
        >
          <LayoutGrid class="h-4 w-4" />Visão geral
        </RouterLink>
        <div v-for="item in items" :key="item.key || item.nome" class="border-b last:border-b-0">
          <button
            v-if="item.children?.length"
            type="button"
            class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium"
            :class="sectionActive(item) ? 'text-primary' : 'text-foreground'"
            :aria-expanded="mobileSections.includes(item.nome)"
            @click="toggleMobileSection(item.nome)"
          >
            <component v-if="(item.icone && typeof item.icone !== 'string')" :is="item.icone" class="h-4 w-4" />
            <i v-else-if="item.icone" :class="item.icone" />
            <span class="flex-1">{{ item.nome }}</span>
            <ChevronDown class="h-4 w-4 transition-transform" :class="mobileSections.includes(item.nome) && 'rotate-180'" />
          </button>
          <RouterLink
            v-else
            :to="item.link || '/'"
            class="flex items-center gap-3 py-3 text-sm font-medium"
            :class="isActive(item) ? 'text-primary' : 'text-foreground'"
            @click="closeMobileMenu"
          >
            <component v-if="(item.icone && typeof item.icone !== 'string')" :is="item.icone" class="h-4 w-4" />
            <i v-else-if="item.icone" :class="item.icone" />
            {{ item.nome }}
          </RouterLink>
          <div v-if="item.children?.length && mobileSections.includes(item.nome)" class="space-y-1 pb-3 pl-7">
            <RouterLink
              v-for="child in item.children.filter((entry) => entry.show !== false)"
              :key="child.key || child.nome"
              :to="child.link || '/'"
              class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground"
              :class="isActive(child) && 'bg-primary/10 font-medium text-primary'"
              @click="closeMobileMenu"
            >
              <component v-if="(child.icone && typeof child.icone !== 'string')" :is="child.icone" class="h-4 w-4" />
              <i v-else-if="child.icone" :class="child.icone" />
              {{ child.nome }}
            </RouterLink>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-4 gap-2 border-t pt-4">
          <ColorToggle class="h-10 w-full" />
          <InformativosStatusButton class="h-10 w-full" />
          <TourHelpButton class="h-10 w-full" />
          <ReportBugButton class="h-10 w-full" />
        </div>
        <div class="mt-3"><NavUserSidebar variant="header" /></div>
      </nav>
    </div>
  </header>
</template>
