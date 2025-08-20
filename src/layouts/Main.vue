<template>
    <div
        class="bg-background text-text dark:text-text-dark min-h-screen overflow-hidden flex flex-col">
        <HeaderMenu />
        <!-- Botão de abrir menu (mobile) -->
        <button type="button" id="openSidebarButton"
            class="md:hidden fixed left-0 top-1/2 transform -translate-y-1/2 z-30 bg-primary/70 text-white px-2 py-3 rounded-r-xl shadow-lg">
            ☰
        </button>
        <!-- Sidebar -->
        <aside id="sidebar-content-sistema"
            class="fixed shadow-md overflow-auto top-0 left-0 h-full w-full md:w-64 border border-border dark:border-border-dark bg-white dark:bg-gray-900 p-4 space-y-4 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out z-40">
            <TopMenu />
            <SidebarMenu :menu="menuItens" />
            <ColorToggle />

            <button id="closeSidebarButton"
                class="md:hidden mt-4 flex items-center border border-border gap-2 px-4 py-3 rounded transition text-white bg-orange-500 dark:bg-orange-800 dark:border-border-dark w-full justify-center">
                <i class="fa-solid fa-circle-xmark mr-1"></i> Fechar
            </button>
            <div class="flex flex-col gap-2 hidden">
                <button style="display: none" id="sendNotificationBtn"
                    class="px-4 py-2 bg-green-600 text-white rounded hidden hover:bg-green-700 transition">
                    <i class="fa-solid fa-paper-plane"></i>
                    Enviar Notificação
                </button>
            </div>
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
import type { SidebarMenuType } from '@/types/sidebar'

const menuItens: SidebarMenuType[] = [
    {
        nome: 'Dashboard',
        icone: 'fa-solid fa-chart-line',
        color: "orange",
        link: '/',
    },
    {
        nome: 'Vendas',
        icone: 'fa-solid fa-tags',
        color: "green",
        link: '/vendas',
    },
    {
        nome: 'Produtos',
        icone: 'fa-solid fa-boxes',
        color: "blue",
        link: '/produtos',
    },
    {
        nome: 'Financeiro',
        icone: 'fa-solid fa-coins',
        color: "emerald",
        children: [
            { nome: 'Painel', link: '/financeiro/painel', icone: 'fa-solid fa-chart-pie' },
            { nome: 'Lançamentos', link: '/financeiro/lancamentos', icone: 'fa-solid fa-coins' },
        ],
    },
    {
        nome: 'Clientes',
        icone: 'fa-solid fa-users',
        color: "violet",
        link: '/clientes',
    },
    {
        nome: 'Desenvolvimento',
        divisor: true,
    },
    {
        nome: 'Serviços',
        icone: 'fa-solid fa-screwdriver-wrench',
        color: "yellow",
        link: '/servicos',
        children: [
            // { nome: "Painel", link: "/financeiro/painel", icone: "fa-solid fa-chart-pie" },
            // { nome: "Lançamentos", link: "/financeiro/lancamentos", icone: "fa-solid fa-coins" },
        ],
    },
    {
        nome: 'Notas Fiscais',
        icone: 'fa-solid fa-receipt',
        color: "cyan",
        link: '/notas-fiscais',
        children: [
            // { nome: "Painel", link: "/financeiro/painel", icone: "fa-solid fa-chart-pie" },
            // { nome: "Lançamentos", link: "/financeiro/lancamentos", icone: "fa-solid fa-coins" },
        ],
    },
    {
        nome: 'Administração',
        divisor: true,
    },
    {
        nome: 'Usuários',
        icone: 'fa-solid fa-user',
        color: "purple",
        link: '/usuarios',
    },
    {
        nome: 'Configurações',
        icone: 'fa-solid fa-cog',
        color: "indigo",
        link: '/configuracoes',
    },
    {
        nome: 'Assinatura',
        divisor: true,
    },
    {
        nome: 'Modo Admin',
        color: "violet",
        icone: 'fa-solid fa-lock',
        link: '/admin',
    },
    {
        nome: 'Perfil',
        color: "blue",
        icone: 'fa-solid fa-user',
        link: '/perfil',
    },
    {
        nome: 'Sair',
        color: "red",
        icone: 'fa-solid fa-right-from-bracket',
        link: '/sair',
    },
]
</script>
