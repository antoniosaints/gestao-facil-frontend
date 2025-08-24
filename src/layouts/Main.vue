<template>
    <div class="bg-background text-text dark:text-text-dark min-h-screen overflow-hidden flex flex-col">
        <HeaderMenu />
        <!-- Botão de abrir menu (mobile) -->
        <button type="button" id="openSidebarButton"
            class="md:hidden fixed left-0 top-1/2 transform -translate-y-1/2 z-30 bg-primary/70 text-white px-2 py-3 rounded-r-xl shadow-lg">
            ☰
        </button>
        <!-- Sidebar -->
        <aside id="sidebar-content-sistema"
            class="fixed shadow-md overflow-auto top-0 left-0 h-full w-full md:w-64 border border-border bg-white dark:bg-gray-900 p-4 space-y-4 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out z-40">
            <TopMenu />
            <SidebarMenu :menu="sidebarMenuOptions" />
            <ColorToggle />
            <LogoutButton />

            <button id="closeSidebarButton"
                class="md:hidden mt-4 flex items-center border border-border gap-2 px-4 py-3 rounded transition text-white bg-orange-500 dark:bg-orange-800 dark:border-border-dark w-full justify-center">
                <i class="fa-solid fa-circle-xmark mr-1"></i> Fechar
            </button>
        </aside>
        <main id="container-main-app-sistema"
            class="overflow-y-auto h-[calc(100vh-5rem)] md:h-[calc(100vh-4.3rem)] p-6 md:ml-64 mt-0">
            <div class="max-w-7xl mx-auto" id="content">
                <slot />
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import ColorToggle from '@/components/layout/colorToggle.vue'
import HeaderMenu from '@/components/layout/headerMenu.vue'
import SidebarMenu from '@/components/layout/sidebarMenu.vue'
import TopMenu from '@/components/layout/topMenu.vue'
import { sidebarMenuOptions } from './options'
import LogoutButton from '@/components/layout/logoutButton.vue'
</script>
