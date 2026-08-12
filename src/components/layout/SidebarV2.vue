<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, PanelLeftClose } from 'lucide-vue-next'
import type { SidebarMenuType } from '@/types/sidebar'
import { useUiStore } from '@/stores/ui/uiStore'
import ColorToggle from './colorToggle.vue'
import InformativosStatusButton from './InformativosStatusButton.vue'
import InstallAppButton from './InstallAppButton.vue'
import LogoutButton from './logoutButton.vue'
import NavUserSidebar from './navUserSidebar.vue'

const props = defineProps<{ menu: SidebarMenuType[] }>()
const store = useUiStore()
const route = useRoute()
const openDropdowns = ref<string[]>([])

const menu = computed(() => props.menu.filter((item) => item.show !== false))

function isActive(item: SidebarMenuType | Omit<SidebarMenuType, 'children'>) {
  return Boolean(item.link && (route.path === item.link || route.path.startsWith(`${item.link}/`)))
}

function sectionActive(item: SidebarMenuType) {
  return isActive(item) || Boolean(item.children?.some((child) => isActive(child)))
}

function toggleDropdown(name: string) {
  openDropdowns.value = openDropdowns.value.includes(name)
    ? openDropdowns.value.filter((item) => item !== name)
    : [...openDropdowns.value, name]
}

watch(
  () => route.path,
  () => {
    const activeSections = menu.value
      .filter((item) => item.children?.some((child) => isActive(child)))
      .map((item) => item.nome)
    openDropdowns.value = [...new Set([...openDropdowns.value, ...activeSections])]
  },
  { immediate: true },
)
</script>

<template>
  <button
    v-if="store.isMobile && store.openSidebar"
    type="button"
    class="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[1px]"
    aria-label="Fechar menu"
    @click="store.openSidebar = false"
  />
  <aside
    id="sidebar-content-sistema-v2"
    class="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-background text-foreground shadow-[8px_0_30px_-24px_rgb(15_23_42/0.35)] transition-transform duration-300 md:shadow-none"
    :class="{ '-translate-x-full': !store.openSidebar }"
  >
    <div class="flex h-[60px] items-center gap-3 border-b px-6 text-foreground">
       <NavUserSidebar variant="sidebar" />
    </div>

    <nav class="hidden_scrollbar flex-1 overflow-y-auto px-2 pb-4 pt-2" aria-label="Menu lateral">
      <template v-for="item in menu" :key="item.key || item.nome">
        <p v-if="item.divisor" class="px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {{ item.nome }}
        </p>
        <button
          v-else-if="item.children?.length"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-primary/80 hover:text-gray-50"
          :class="sectionActive(item) && 'bg-primary text-white'"
          :aria-expanded="openDropdowns.includes(item.nome)"
          @click="toggleDropdown(item.nome)"
        >
          <component v-if="(item.icone && typeof item.icone !== 'string')" :is="item.icone" class="h-[18px] w-[18px] shrink-0" />
          <i v-else-if="item.icone" :class="[item.icone, 'w-[18px] text-center']" />
          <span class="min-w-0 flex-1 truncate">{{ item.nome }}</span>
          <ChevronDown class="h-4 w-4 shrink-0 transition-transform" :class="openDropdowns.includes(item.nome) && 'rotate-180'" />
        </button>
        <div
          v-if="item.children?.length && openDropdowns.includes(item.nome)"
          class="mb-1 ml-5 mt-1 space-y-0.5 border-l-2 border-primary/65 py-0.5 pl-3"
        >
          <RouterLink
            v-for="child in item.children.filter((entry) => entry.show !== false)"
            :key="child.key || child.nome"
            :to="child.link || '/'"
            class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-primary/80 hover:text-white"
            :class="isActive(child) && 'font-medium text-white bg-primary/80'"
            @click="store.isMobile && (store.openSidebar = false)"
          >
            <component v-if="(child.icone && typeof child.icone !== 'string')" :is="child.icone" class="h-4 w-4 shrink-0" />
            <i v-else-if="child.icone" :class="[child.icone, 'w-4 text-center']" />
            <span class="truncate">{{ child.nome }}</span>
          </RouterLink>
        </div>
        <RouterLink
          v-if="!item.divisor && !item.children?.length"
          :to="item.link || '/'"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary/80 hover:text-gray-50"
          :class="isActive(item) && 'bg-primary text-white'"
          @click="store.isMobile && (store.openSidebar = false)"
        >
          <component v-if="(item.icone && typeof item.icone !== 'string')" :is="item.icone" class="h-[18px] w-[18px] shrink-0" />
          <i v-else-if="item.icone" :class="[item.icone, 'w-[18px] text-center']" />
          <span class="truncate">{{ item.nome }}</span>
        </RouterLink>
      </template>
    </nav>

    <div class="space-y-3 border-t p-4">
      <InstallAppButton class="w-full justify-start rounded-lg" />
      <NavUserSidebar variant="header" />
      <div class="grid grid-cols-2 gap-2">
        <ColorToggle class="h-10 w-full" />
        <LogoutButton variant="header" class="h-10 w-full" />
      </div>
      <InformativosStatusButton v-if="store.isMobile" sidebar class="w-full" />
    </div>
  </aside>
</template>

<style scoped>
.hidden_scrollbar {
  scrollbar-width: none;
}

.hidden_scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
