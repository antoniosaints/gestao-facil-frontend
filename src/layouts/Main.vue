<template>
    <div class="bg-body min-h-screen overflow-hidden flex flex-col">
        <HeaderMenu />
        <!-- Botão de abrir menu (mobile) -->
        <button type="button" @click="store.toggleSidebar"
            class="md:hidden fixed left-0 top-1/2 transform -translate-y-1/2 z-30 bg-primary/70 text-gray-700 dark:text-gray-300 px-2 py-3 rounded-r-xl shadow-lg">
            ☰
        </button>
        <!-- Sidebar -->
        <aside id="sidebar-content-sistema"
            class="fixed overflow-auto top-0 left-0 h-full w-full md:w-64 border border-border bg-white dark:bg-gray-900 p-4 space-y-4 transform transition-transform duration-300 ease-in-out z-40"
            :class="{ '-translate-x-full': !store.openSidebar }">

            <TopMenu />
            <SidebarMenu :menu="sidebarMenuOptions" />
            <ColorToggle />
            <LogoutButton />
            <button @click="store.toggleSidebar"
                class="md:hidden mt-4 flex items-center border border-border gap-2 px-4 py-3 rounded transition text-gray-700 dark:text-gray-300 bg-orange-500 dark:bg-orange-800 dark:border-border-dark w-full justify-center">
                <i class="fa-solid fa-circle-xmark mr-1"></i> Fechar
            </button>
        </aside>
        <main id="container-main-app-sistema"
            class="overflow-y-auto h-[calc(100vh-5rem)] text-gray-700 dark:text-gray-300 md:h-[calc(100vh-4.3rem)] p-6 mt-0 transition-all duration-300 ease-in-out"
            :class="{ 'md:ml-64': store.openSidebar }">
            <div class="max-w-7xl mx-auto" id="content">
                <AlertTopbar />
                <slot />
            </div>
        </main>
        <InstallPrompt />
    </div>
</template>

<script setup lang="ts">
import ColorToggle from '@/components/layout/colorToggle.vue'
import HeaderMenu from '@/components/layout/headerMenu.vue'
import SidebarMenu from '@/components/layout/sidebarMenu.vue'
import TopMenu from '@/components/layout/topMenu.vue'
import { sidebarMenuOptions } from './options'
import LogoutButton from '@/components/layout/logoutButton.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import InstallPrompt from '@/components/layout/installPrompt.vue'
import AlertTopbar from '@/components/layout/alertTopbar.vue'
const store = useUiStore()

window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
        store.openSidebar = false
    } else {
        store.openSidebar = true
    }
})
</script>
