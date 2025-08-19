<template>
    <div
        class="bg-background dark:bg-background-dark text-text dark:text-text-dark min-h-screen overflow-hidden flex flex-col">
        <!-- Botão de abrir menu (mobile) -->
        <button type="button" id="openSidebarButton"
            class="md:hidden fixed left-0 top-1/2 transform -translate-y-1/2 z-30 bg-primary/70 text-white px-2 py-3 rounded-r-xl shadow-lg">
            ☰
        </button>
        <!-- Sidebar -->
        <aside id="sidebar-content-sistema"
            class="fixed shadow-md overflow-auto top-0 left-0 h-full w-full md:w-64 border border-border dark:border-border-dark bg-card dark:bg-card-dark p-4 space-y-4 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out z-40">

            <TopMenu />
            <SidebarMenu :menu="menuItens" />
            <nav class="flex flex-col space-y-2 select-none">
                <a onclick="loadPage('/')"
                    class="bg-background hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer border border-border dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition"><i
                        class="fa-solid fa-chart-simple text-orange-600 px-2"></i>Dashboard</a>
                <a onclick="loadPage('/vendas/resumo')"
                    class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 border border-border dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition"><i
                        class="fa-solid fa-tags text-green-600 px-2"></i> Vendas</a>
                <a onclick="loadPage('/produtos/resumo')"
                    class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 border border-border dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition"><i
                        class="fa-solid fa-boxes-stacked text-blue-600 px-2"></i> Produtos</a>

                <div
                    class="mb-2 cursor-pointer dark:bg-background-dark rounded-lg border dark:border-border-dark border-border transition-all">
                    <button
                        class="dropdown-toggle w-full flex items-center hover:bg-gray-200 dark:hover:bg-gray-800 justify-between border-b dark:border-border-dark border-border px-4 py-2 text-left cursor-pointer dark:bg-background-dark rounded-lg transition-colors group"
                        data-target="lancamentos_sidebar-dropdown">
                        <div class="flex items-center space-x-3">
                            <i class="fa-solid fa-coins w-4 h-4 text-emerald-600"></i>
                            <span class="font-medium">Financeiro</span>
                        </div>
                        <svg class="dropdown-arrow w-4 h-4 transition-transform duration-200" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div id="lancamentos_sidebar-dropdown" class="dropdown-content hidden m-1 space-y-1 transition-all">
                        <a href="javascript:void(0)" onclick="loadPage('/lancamentos/dashboard')"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-chart-pie text-emerald-600 mr-1"></i>
                            Painel
                        </a>
                        <a href="javascript:void(0)" onclick="loadPage('/lancamentos/resumo')"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-coins text-emerald-600 mr-1"></i>
                            Lançamentos
                        </a>
                        <a href="javascript:void(0)" onclick="loadPage('/lancamentos/resumo')"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-chart-pie text-emerald-600 mr-1"></i>
                            Categorias
                        </a>
                        <a href="javascript:void(0)" onclick="loadPage('/lancamentos/resumo')"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-bank text-emerald-600 mr-1"></i>
                            Bancos
                        </a>
                        <a href="javascript:void(0)" onclick="loadPage('/lancamentos/resumo')"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-link text-emerald-600 mr-1"></i>
                            Gateways
                        </a>
                    </div>
                </div>
                <a onclick="loadPage('/clientes/resumo')"
                    class="cursor-pointer border border-border hover:bg-gray-200 dark:hover:bg-gray-800 dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition">
                    <i class="fa-solid fa-user-tag text-violet-600 px-2"></i> Clientes</a>
                <div class="flex items-center my-6">
                    <div class="flex-grow border-t border-border"></div>
                    <span class="mx-4 text-gray-500 dark:text-gray-200 text-xs uppercase">Desenvolvimento</span>
                    <div class="flex-grow border-t border-border"></div>
                </div>
                <div
                    class="mb-2 cursor-pointer dark:bg-background-dark rounded-lg transition border dark:border-border-dark border-border">
                    <button
                        class="dropdown-toggle w-full flex items-center hover:bg-gray-200 dark:hover:bg-gray-800 justify-between border-b dark:border-border-dark border-border px-4 py-2 text-left cursor-pointer dark:bg-background-dark rounded-lg transition-colors group"
                        data-target="ordens_servico_sidebar-dropdown">
                        <div class="flex items-center space-x-3">
                            <i class="fa-solid fa-screwdriver-wrench w-4 h-4 text-yellow-600"></i>
                            <span class="font-medium">Serviços</span>
                            <i class="fa-solid fa-triangle-exclamation text-red-600"></i>
                        </div>
                        <svg class="dropdown-arrow w-4 h-4 transition-transform duration-200" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div id="ordens_servico_sidebar-dropdown" class="dropdown-content hidden m-1 space-y-1">
                        <a href="javascript:void(0)"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-scroll text-yellow-600 mr-1"></i>
                            Ordens
                        </a>
                        <a href="javascript:void(0)"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-clipboard text-yellow-600 mr-1"></i>
                            Checklists
                        </a>
                        <a href="javascript:void(0)"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-screwdriver-wrench text-yellow-600 mr-1"></i>
                            Serviços
                        </a>
                    </div>
                </div>
                <div
                    class="mb-2 cursor-pointer dark:bg-background-dark rounded-lg transition border dark:border-border-dark border-border">
                    <button
                        class="dropdown-toggle w-full flex items-center hover:bg-gray-200 dark:hover:bg-gray-800 justify-between border-b dark:border-border-dark border-border px-4 py-2 text-left cursor-pointer dark:bg-background-dark rounded-lg transition-colors group"
                        data-target="notas_fiscais_sistema_sidebar-dropdown">
                        <div class="flex items-center space-x-3">
                            <i class="fa-solid fa-clipboard w-4 h-4 text-cyan-600"></i>
                            <span class="font-medium">Notas fiscais</span>
                            <i class="fa-solid fa-triangle-exclamation text-red-600"></i>
                        </div>
                        <svg class="dropdown-arrow w-4 h-4 transition-transform duration-200" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div id="notas_fiscais_sistema_sidebar-dropdown" class="dropdown-content hidden m-1 space-y-1">
                        <a href="javascript:void(0)"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-clipboard text-cyan-600 mr-1"></i>
                            Consultar
                        </a>
                        <a href="javascript:void(0)"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-scroll text-cyan-600 mr-1"></i>
                            Emitir nota
                        </a>
                    </div>
                </div>
                <div class="flex items-center my-6">
                    <div class="flex-grow border-t border-border"></div>
                    <span class="mx-4 text-gray-500 dark:text-gray-200 text-xs uppercase">Administração</span>
                    <div class="flex-grow border-t border-border"></div>
                </div>

                <a onclick="loadPage('administracao/usuarios/resumo')"
                    class="bg-background cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 border border-border dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition">
                    <i class="fa-solid fa-user text-indigo-600 px-2"></i> Usuários</a>

                <div
                    class="mb-2 cursor-pointer dark:bg-background-dark rounded-lg transition border dark:border-border-dark border-border">
                    <button
                        class="dropdown-toggle w-full flex items-center hover:bg-gray-200 dark:hover:bg-gray-800 justify-between border-b dark:border-border-dark border-border px-4 py-2 text-left cursor-pointer dark:bg-background-dark rounded-lg transition-colors group"
                        data-target="configuracoes_sidebar-dropdown">
                        <div class="flex items-center space-x-3">
                            <i class="fa-solid fa-cog w-4 h-4"></i>
                            <span class="font-medium">Configurações</span>
                        </div>
                        <svg class="dropdown-arrow w-4 h-4 transition-transform duration-200" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div id="configuracoes_sidebar-dropdown" class="dropdown-content hidden m-1 space-y-1">
                        <a href="#"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-cog mr-1"></i>
                            Parâmetros
                        </a>
                        <a href="#"
                            class="block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors">
                            <i class="fa-solid fa-link mr-1"></i>
                            Integrações
                        </a>
                    </div>
                </div>
                <div class="flex items-center my-6">
                    <div class="flex-grow border-t border-border"></div>
                    <span class="mx-4 text-gray-500 dark:text-gray-200 text-xs uppercase">Assinatura</span>
                    <div class="flex-grow border-t border-border"></div>
                </div>
                <a onclick="loadPage('plano/assinatura')"
                    class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 border border-border dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition">
                    <i class="fa-solid fa-bolt text-orange-600 px-2"></i> Plano</a>

                <div class="flex items-center my-6">
                    <div class="flex-grow border-t border-border"></div>
                    <span class="mx-4 text-gray-500 dark:text-gray-200 text-xs uppercase">Autenticação</span>
                    <div class="flex-grow border-t border-border"></div>
                </div>
                <a onclick="toggleModeGerencial()"
                    class="bg-background hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer border border-border dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition">
                    <i class="fa-solid fa-square-arrow-up-right text-violet-600 px-2"></i>
                    Modo Gerencia</a>
                <a
                    class="bg-background hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer border border-border dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition"><i
                        class="fa-solid fa-user text-blue-600 px-2"></i> Perfil</a>
                <a onclick="logOut()"
                    class="bg-background hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer border border-border dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition"><i
                        class="fa-solid fa-right-from-bracket text-red-600 px-2"></i> Sair</a>

            </nav>

            <button onclick="toggleTheme()"
                class="mt-4 flex items-center border border-border gap-2 px-4 py-3 rounded transition bg-background dark:bg-background-dark dark:border-border-dark w-full justify-center">
                <i class="fa-solid fa-sun" id="icon-sun"></i>
                <i class="fa-solid fa-moon hidden" id="icon-moon"></i>
            </button>
            <button id="closeSidebarButton"
                class="md:hidden mt-4 flex items-center border border-border gap-2 px-4 py-3 rounded transition text-white bg-orange-500 dark:bg-orange-800 dark:border-border-dark w-full justify-center">
                <i class="fa-solid fa-circle-xmark mr-1"></i> Fechar
            </button>
            <div class="flex flex-col gap-2 hidden">
                <button style="display: none;" id="sendNotificationBtn"
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
import SidebarMenu from "@/components/layout/sidebarMenu.vue";
import TopMenu from "@/components/layout/topMenu.vue";
import type { SidebarMenuType } from "@/types/sidebar";

const menuItens: SidebarMenuType[] = [
    {
        nome: "Dashboard", icone: "fa-solid fa-chart-line", link: "/"
    },
    {
        nome: "Vendas", icone: "fa-solid fa-tags", link: "/vendas"
    },
]

</script>