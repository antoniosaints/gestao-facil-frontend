<template>
  <div
    class="bg-background dark:bg-background-dark text-text dark:text-text-dark min-h-screen overflow-hidden flex flex-col"
  >
    <HeaderMenu />
    <!-- Botão de abrir menu (mobile) -->
    <button
      type="button"
      id="openSidebarButton"
      class="md:hidden fixed left-0 top-1/2 transform -translate-y-1/2 z-30 bg-primary/70 text-white px-2 py-3 rounded-r-xl shadow-lg"
    >
      ☰
    </button>
    <!-- Sidebar -->
    <aside
      id="sidebar-content-sistema"
      class="fixed shadow-md overflow-auto top-0 left-0 h-full w-full md:w-64 border border-border dark:border-border-dark bg-card dark:bg-card-dark p-4 space-y-4 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out z-40"
    >
      <TopMenu />
      <SidebarMenu :menu="menuItens" />
      <ColorToggle />

      <button
        id="closeSidebarButton"
        class="md:hidden mt-4 flex items-center border border-border gap-2 px-4 py-3 rounded transition text-white bg-orange-500 dark:bg-orange-800 dark:border-border-dark w-full justify-center"
      >
        <i class="fa-solid fa-circle-xmark mr-1"></i> Fechar
      </button>
      <div class="flex flex-col gap-2 hidden">
        <button
          style="display: none"
          id="sendNotificationBtn"
          class="px-4 py-2 bg-green-600 text-white rounded hidden hover:bg-green-700 transition"
        >
          <i class="fa-solid fa-paper-plane"></i>
          Enviar Notificação
        </button>
      </div>
    </aside>
    <main
      id="container-main-app-sistema"
      class="overflow-y-auto h-[calc(100vh-5rem)] md:h-[calc(100vh-4.3rem)] p-6 md:ml-64 mt-0"
    >
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
    link: '/',
  },
  {
    nome: 'Vendas',
    icone: 'fa-solid fa-tags',
    link: '/vendas',
  },
  {
    nome: 'Produtos',
    icone: 'fa-solid fa-boxes',
    link: '/produtos',
  },
  {
    nome: 'Financeiro',
    icone: 'fa-solid fa-coins',
    children: [
      { nome: 'Painel', link: '/financeiro/painel', icone: 'fa-solid fa-chart-pie' },
      { nome: 'Lançamentos', link: '/financeiro/lancamentos', icone: 'fa-solid fa-coins' },
    ],
  },
  {
    nome: 'Clientes',
    icone: 'fa-solid fa-users',
    link: '/clientes',
  },
  {
    nome: 'Desenvolvimento',
    divisor: true,
  },
  {
    nome: 'Serviços',
    icone: 'fa-solid fa-screwdriver-wrench',
    link: '/servicos',
    children: [
      // { nome: "Painel", link: "/financeiro/painel", icone: "fa-solid fa-chart-pie" },
      // { nome: "Lançamentos", link: "/financeiro/lancamentos", icone: "fa-solid fa-coins" },
    ],
  },
  {
    nome: 'Notas Fiscais',
    icone: 'fa-solid fa-receipt',
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
    link: '/usuarios',
  },
  {
    nome: 'Configurações',
    icone: 'fa-solid fa-cog',
    link: '/configuracoes',
  },
  {
    nome: 'Assinatura',
    divisor: true,
  },
  {
    nome: 'Modo Admin',
    icone: 'fa-solid fa-lock',
    link: '/admin',
  },
  {
    nome: 'Perfil',
    icone: 'fa-solid fa-user',
    link: '/perfil',
  },
  {
    nome: 'Sair',
    icone: 'fa-solid fa-right-from-bracket',
    link: '/sair',
  },
]
</script>
