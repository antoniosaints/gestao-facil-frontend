<template>
  <div class="bg-body flex min-h-screen flex-col overflow-hidden">
    <SiteNavigation v-if="store.usaNavegacaoSite" :menu="sidebarMenu" />
    <HeaderMenu v-else home-path="/admin" />

    <button
      v-if="!store.usaNavegacaoSemSidebar"
      type="button"
      class="fixed bottom-16 right-0 z-30 flex h-14 w-10 -translate-y-1/2 items-center rounded-l-full bg-primary/70 pl-3 pr-0 text-gray-200 shadow-lg md:hidden"
      @click="store.toggleSidebar"
    >
      <PanelRightClose />
    </button>
    <RouterLink
      v-else-if="store.usaNavegacaoPorCards"
      to="/admin"
      class="fixed right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
    >
      <LayoutGrid class="h-5 w-5" />
      <span class="sr-only">Abrir módulos do CEO</span>
    </RouterLink>

    <SidebarV2 v-if="store.usaNavegacaoSideV2" :menu="sidebarMenu" />
    <aside
      v-else-if="!store.usaNavegacaoSemSidebar"
      id="sidebar-content-sistema"
      class="fixed left-0 top-0 z-40 flex h-full w-full flex-col space-y-4 overflow-auto border-r bg-sidebar p-4 md:w-64"
      :class="{ '-translate-x-full': !store.openSidebar }"
    >
      <TopMenu />
      <SidebarMenu :menu="sidebarMenu" />
      <div class="grid grid-cols-12 items-center justify-center gap-2">
        <LogoutButton class="col-span-10 md:col-span-12" />
        <ColorToggle v-if="store.isMobile" class="col-span-2 h-full w-full" />
      </div>
      <button
        class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-400 bg-sidebar px-4 py-3 text-white transition md:hidden"
        @click="store.toggleSidebar"
      >
        <i class="fa-solid fa-circle-xmark mr-1"></i> Fechar
      </button>
    </aside>

    <main
      id="container-main-app-sistema"
      class="mt-0 min-h-0 flex-1 overflow-y-auto p-6 text-gray-700 transition-all duration-300 ease-in-out dark:text-gray-300"
      :class="{
        'md:ml-64': store.openSidebar && !store.usaNavegacaoSemSidebar && !store.usaNavegacaoSideV2,
        'md:ml-72': store.openSidebar && store.usaNavegacaoSideV2,
      }"
    >
      <div class="mx-auto max-w-7xl" id="content">
        <AlertTopbar />
        <CardsNavigationHub
          v-if="store.usaNavegacaoPorCards && route.name === 'admin-home'"
          :menu="sidebarMenu"
          home-path="/admin"
          module-route-name="admin-navegacao-cards-modulo"
        />
        <slot v-else-if="!loading" />
        <div v-else class="mx-auto flex h-[calc(100vh-12rem)] max-w-7xl flex-col items-center justify-center gap-4">
          <div class="h-16 w-16 animate-spin rounded-full border-b-2 border-primary"></div>
          <p class="ml-2 text-primary">Carregando informações do usuário...</p>
        </div>
      </div>
    </main>
    <InstallPrompt />
    <ConfirmModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutGrid, PanelRightClose } from 'lucide-vue-next'
import AlertTopbar from '@/components/layout/alertTopbar.vue'
import ColorToggle from '@/components/layout/colorToggle.vue'
import HeaderMenu from '@/components/layout/headerMenu.vue'
import InstallPrompt from '@/components/layout/installPrompt.vue'
import LogoutButton from '@/components/layout/logoutButton.vue'
import SidebarMenu from '@/components/layout/sidebarMenu.vue'
import SidebarV2 from '@/components/layout/SidebarV2.vue'
import SiteNavigation from '@/components/layout/SiteNavigation.vue'
import TopMenu from '@/components/layout/topMenu.vue'
import ConfirmModal from '@/components/hooks/ConfirmModal.vue'
import CardsNavigationHub from '@/pages/navegacao/CardsNavigationHub.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { entrarNaConta } from '@/pluguins/socket'
import { sidebarMenuOptionsAdmin } from './optionsAdmin'
import { updateMetaTags } from '@/utils/theme'
import { useSocketEvent } from '@/composables/useSocketEvent'

const store = useUiStore()
const route = useRoute()
const loading = ref(false)
const sidebarMenu = computed(() => sidebarMenuOptionsAdmin(store.permissoes))

function ajustarSidebar() {
  store.openSidebar = store.usaNavegacaoSemSidebar ? false : window.innerWidth >= 768
}

window.addEventListener('resize', ajustarSidebar)

watch(
  () => store.usaNavegacaoSemSidebar,
  ajustarSidebar,
  { immediate: true },
)

async function initialize() {
  loading.value = true
  try {
    if (store.usuarioLogged.contaId) entrarNaConta(store.usuarioLogged.contaId)
  } finally {
    loading.value = false
  }
}

useSocketEvent('sessao:updated', async () => {
  await Promise.all([store.getDataUsuario(), store.getStatus()])
})

onMounted(() => {
  void initialize()
  updateMetaTags()
})
</script>
