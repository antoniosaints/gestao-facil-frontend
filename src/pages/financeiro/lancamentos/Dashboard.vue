<script setup lang="ts">
import { Landmark } from 'lucide-vue-next';

</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex flex-col md:flex-row gap-2 justify-between items-center">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Landmark class="h-6 w-6" :stroke-width="2.5" />
                    Painel financeiro
                </h2>
                <p class="text-sm text-muted-foreground">Resumo geral e insights</p>
            </div>
            <div class="flex items-center space-x-2 w-content">
                <button type="button" id="limpar_filtro_dashboard_financeiro_periodo"
                    class="bg-red-600 hidden text-white text-nowrap px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors">
                    <i class="fa-solid fa-filter-circle-xmark"></i>
                </button>
                <input id="filtro_dashboard_financeiro_periodo" placeholder="Filtrar por período"
                    class="rounded-md border w-max bg-card dark:bg-card-dark border-border dark:border-border-dark px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                </input>
            </div>
        </div>
        <div class="flex flex-col gap-4" id="dashboard_financeiro_container_main">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
                <!-- Metric Item Start -->
                <div onclick="loadPage('/lancamentos/resumo')"
                    class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                    <div class="mb-6 flex items-center gap-3">
                        <i class="fa-solid fa-arrow-up h-8 w-8 bg-emerald-500/10 p-2 rounded-md text-emerald-500"></i>

                        <div>
                            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
                                Total
                            </h3>
                            <span class="block text-theme-xs text-gray-500 dark:text-gray-400">
                                Receitas
                            </span>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90"
                                id="total_receitas_dashboard">
                                0
                            </h4>
                        </div>

                        <span
                            class="flex items-center gap-1 rounded-full bg-green-50 py-0.5 pl-2 pr-2.5 text-xs font-medium text-green-600 dark:bg-green-500/15 dark:text-green-500">
                            <i class="fa-solid fa-coins"></i>
                            Entradas
                        </span>
                    </div>
                </div>

                <div onclick="loadPage('/lancamentos/resumo')"
                    class="rounded-2xl cursor-pointer border shadow-md border-border bg-card px-6 pb-5 pt-6">
                    <div class="mb-6 flex items-center gap-3">
                        <i class="fa-solid fa-arrow-down w-8 h-8 bg-red-500/10 p-2 rounded-md text-red-500"></i>

                        <div>
                            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
                                Total
                            </h3>
                            <span class="block text-theme-xs text-gray-500 dark:text-gray-400">
                                Despesas
                            </span>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90"
                                id="total_despesas_dashboard">
                                0
                            </h4>
                        </div>

                        <span
                            class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-xs font-medium text-red-600 dark:text-red-500">
                            <i class="fa-solid fa-coins"></i>
                            Saídas
                        </span>
                    </div>
                </div>

                <div onclick="loadPage('/lancamentos/resumo')"
                    class="rounded-2xl cursor-pointer border shadow-md border-border bg-card px-6 pb-5 pt-6">
                    <div class="mb-6 flex items-center gap-3">
                        <i
                            class="fa-solid fa-money-bill-trend-up w-8 h-8 bg-blue-500/10 p-2 rounded-md text-blue-500"></i>

                        <div>
                            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
                                Saldo
                            </h3>
                            <span class="block text-theme-xs text-gray-500 dark:text-gray-400">
                                Geral
                            </span>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90"
                                id="saldo_financeiro_dashboard">
                                0
                            </h4>
                        </div>

                        <span id="produtos_em_baixa_dashboard_alerta"
                            class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-xs font-medium text-blue-600 dark:text-blue-500">
                            <i class="fa-solid fa-coins"></i>
                            Lucro
                        </span>
                    </div>
                </div>

                <div onclick="loadPage('/lancamentos/resumo')"
                    class="rounded-2xl cursor-pointer border shadow-md border-border bg-card px-6 pb-5 pt-6">
                    <div class="mb-6 flex items-center gap-3">
                        <i
                            class="fa-solid fa-hourglass-end h-8 w-8 bg-yellow-500/10 p-2 rounded-md text-yellow-400"></i>

                        <div>
                            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
                                Lançamentos
                            </h3>
                            <span class="block text-theme-xs text-gray-500 dark:text-gray-400">
                                Pendentes
                            </span>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90"
                                id="resumo_pendentes_total">
                                R$ 0,00
                            </h4>
                        </div>

                        <span id="porcentagem_vendas_dashboard_alerta"
                            class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-xs font-medium text-yellow-600 dark:text-yellow-500">
                            <i class="fa-solid fa-dollar-sign"></i>
                            <span id="porcentagem_vendas_dashboard">
                                Revisar
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
                        Balanço mensal
                    </h2>
                    <canvas class="max-h-64" id="grafico_receita_despesa_mensal"></canvas>
                </div>

                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
                        Resumo por
                        status
                    </h2>
                    <canvas class="max-h-64" id="grafico_por_status_pagamento"></canvas>
                </div>

                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
                        Plano de contas
                    </h2>
                    <canvas class="max-h-64" id="grafico_plano_contas"></canvas>
                </div>

                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-pie text-emerald-600"></i> Resumo
                        por
                        categoria
                    </h2>
                    <canvas class="max-h-64" id="grafico_por_categoria"></canvas>
                </div>
            </div>
        </div>
    </div>
</template>