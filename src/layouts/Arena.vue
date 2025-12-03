<template>
    <div class="bg-body min-h-screen overflow-hidden flex flex-col">
        <HeaderMenu />
        <!-- Botão de abrir menu (mobile) -->
        <button type="button" @click="store.toggleSidebar"
            class="md:hidden fixed flex items-center right-0 w-10 h-14 pl-3 pr-0 bottom-16 transform -translate-y-1/2 z-30 bg-primary/70 text-gray-200 dark:text-gray-300 px-2 py-3 rounded-l-full shadow-lg">
            <PanelRightClose />
        </button>
        <!-- Sidebar -->
        <aside id="sidebar-content-sistema"
            class="fixed overflow-auto top-0 flex flex-col justify-between hidden_scrollbar left-0 h-full w-full border-r md:w-64 bg-teal-800 dark:bg-teal-950 p-4 space-y-2 transform transition-transform duration-300 ease-in-out z-40"
            :class="{ '-translate-x-full': !store.openSidebar }">

            <!-- <TopMenu /> -->
            <div>
                <NavUserSidebar />
                <SidebarMenuArena :menu="sidebarMenuArenaOptions(store.permissoes)" />
            </div>
            <div>
                <div class="grid grid-cols-12 gap-2 items-center justify-center">
                    <LogoutButton class="col-span-10 md:col-span-12" />
                    <ColorToggle class="col-span-2 h-full w-full" v-if="store.isMobile" />
                </div>
                <button @click="store.toggleSidebar"
                    class="md:hidden mt-4 flex items-center border border-gray-400 dark:border-gray-500 gap-2 px-4 py-3 rounded-lg transition bg-sidebar text-white w-full justify-center">
                    <i class="fa-solid fa-circle-xmark mr-1"></i> Fechar
                </button>
            </div>
        </aside>
        <main id="container-main-app-sistema"
            class="overflow-y-auto h-[calc(100vh-5rem)] text-gray-700 dark:text-gray-300 md:h-[calc(100vh-4.3rem)] p-6 mt-0 transition-all duration-300 ease-in-out"
            :class="{ 'md:ml-64': store.openSidebar }">
            <div class="max-w-7xl mx-auto" id="content">
                <AlertTopbar />
                <div v-if="store.loading || progress > 0"
                    class="absolute hidden md:block top-14 h-2 transition-all duration-100 ease-linear"
                    :style="{ width: progress + '%' }" :class="{
                        'bg-primary/50': env.VITE_MODE_SYSTEM === 'erp',
                        'bg-success/50': env.VITE_MODE_SYSTEM === 'arena',
                        'left-[16rem]': store.openSidebar,
                        'left-0': !store.openSidebar
                    }"></div>

                <slot v-if="!loading" />
                <div v-else
                    class="flex flex-col gap-4 max-w-7xl mx-auto items-center justify-center h-[calc(100vh-12rem)]">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary dark:border-primary-dark">
                    </div>
                    <p class="ml-2 text-primary dark:text-primary-dark">Carregando informações do usuário...</p>
                </div>
            </div>
        </main>
        <InstallPrompt />
        <ConfirmModal />
    </div>
</template>

<script setup lang="ts">
import ColorToggle from '@/components/layout/colorToggle.vue'
import HeaderMenu from '@/components/layout/headerMenu.vue'
import LogoutButton from '@/components/layout/logoutButton.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import InstallPrompt from '@/components/layout/installPrompt.vue'
import AlertTopbar from '@/components/layout/alertTopbar.vue'
import { PanelRightClose } from 'lucide-vue-next'
import ConfirmModal from '@/components/hooks/ConfirmModal.vue'
import { onMounted, ref, watch } from 'vue'
import { entrarNaConta } from '@/pluguins/socket'
import { sidebarMenuArenaOptions } from './optionsArena'
import SidebarMenuArena from '@/components/layout/sidebarMenuArena.vue'
import NavUserSidebar from '@/components/layout/navUserSidebar.vue'
import { updateMetaTags } from '@/utils/theme'
import { env } from '@/utils/dotenv'
const loading = ref(false)
const store = useUiStore()
window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
        store.openSidebar = false
    } else {
        store.openSidebar = true
    }
})

const progress = ref(0)

watch(() => store.loading, (v) => {
    if (v) startProgress()
    else finishProgress()
})


let interval: any

function startProgress() {
    progress.value = 0

    clearInterval(interval)

    interval = setInterval(() => {
        if (progress.value < 60) {
            progress.value += 3     // rápido no começo
        } else if (progress.value < 90) {
            progress.value += 1     // lento depois
        }
    }, 100)
}

function finishProgress() {
    clearInterval(interval)

    const complete = setInterval(() => {
        progress.value += 5
        if (progress.value >= 80) {
            clearInterval(complete)
            progress.value = 0
        }
    }, 30)
}


async function initialize() {
    loading.value = true
    try {
        if (store.usuarioLogged.contaId) entrarNaConta(store.usuarioLogged.contaId) // socket IO para conectar no websocket da conta
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    initialize()
    updateMetaTags()
})
</script>

<style scoped>
.hidden_scrollbar {
    overflow: auto;
    /* ou scroll, conforme sua necessidade */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE e Edge antigo */
}
</style>
