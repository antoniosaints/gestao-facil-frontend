<template>
    <div>
        <div class="flex flex-col gap-4">
            <div class="flex flex-col md:flex-row gap-2 justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        Dashboard
                    </h2>
                    <p class="text-sm text-muted-foreground">Resumo geral e insights</p>
                </div>
                <div class="flex items-center gap-2 w-content">
                    <button type="button" id="limpar_filtro_dashboard_periodo"
                        class="bg-red-600 hidden text-white text-nowrap px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors">
                        <i class="fa-solid fa-filter-circle-xmark"></i>
                    </button>
                    <Calendarpicker :range="true" v-model="filtroPeriodo" />
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
                <!-- Metric Item Start -->
                <div @click="goTo('/clientes')"
                    class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                    <div class="mb-6 flex items-center gap-3">
                        <i class="fa-solid fa-user-tag h-8 w-8 bg-violet-500/10 p-2 rounded-md text-violet-500"></i>

                        <div>
                            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Clientes</h3>
                            <span class="block text-theme-xs text-gray-500 dark:text-gray-400">
                                Registrados
                            </span>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                                {{ data.totalClientes }}
                            </h4>
                        </div>
                    </div>
                </div>

                <div @click="goTo('/produtos')"
                    class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                    <div class="mb-6 flex items-center gap-3">
                        <i class="fa-solid fa-boxes-packing w-8 h-8 bg-blue-500/10 p-2 rounded-md text-blue-500"></i>

                        <div>
                            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Produtos</h3>
                            <span class="block text-theme-xs text-gray-500 dark:text-gray-400">
                                Cadastrados
                            </span>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                                {{ data.totalProdutos }}
                            </h4>
                        </div>

                        <span
                            class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium text-blue-600 dark:text-blue-500">
                            <i class="fa-solid fa-boxes-packing"></i>
                            Total
                        </span>
                    </div>
                </div>

                <div @click="goTo('/produtos')"
                    class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                    <div class="mb-6 flex items-center gap-3">
                        <i class="fa-solid fa-cubes w-8 h-8 bg-red-500/10 p-2 rounded-md text-red-500"></i>

                        <div>
                            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Produtos</h3>
                            <span class="block text-theme-xs text-gray-500 dark:text-gray-400"> Em baixa </span>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90"
                                id="produtos_em_baixa_dashboard">
                                {{ data.produtosEmBaixa }}
                            </h4>
                        </div>

                        <span id="produtos_em_baixa_dashboard_alerta"
                            class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium text-red-600 dark:text-red-500">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            Atenção!
                        </span>
                    </div>
                </div>

                <div @click="goTo('/vendas')"
                    class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                    <div class="mb-6 flex items-center gap-3">
                        <i class="fa-solid fa-dollar-sign h-8 w-8 bg-green-500/10 p-2 rounded-md text-green-400"></i>

                        <div>
                            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Vendas</h3>
                            <span class="block text-theme-xs text-gray-500 dark:text-gray-400">
                                Resumo
                            </span>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                                {{ data.totalVendas }}
                            </h4>
                        </div>

                        <span id="porcentagem_vendas_dashboard_alerta"
                            class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium text-green-600 dark:text-green-500">
                            <i class="fa-solid fa-dollar-sign"></i>
                            <span id="porcentagem_vendas_dashboard">0%</span>
                        </span>
                    </div>
                </div>
                <!-- Metric Item End -->
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Gráfico de Barras -->
                <div
                    class="border-border bg-card shadow-md rounded-lg p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1">
                            <i class="fa-solid fa-chart-simple text-green-600"></i> Vendas Mensais
                        </h2>
                        <button type="button" @click="goTo('/vendas')"
                            class="border-2 border-gray-300 text-gray-900 dark:border-gray-400 dark:text-gray-200 text-nowrap px-3 py-1 rounded-md text-sm transition-colors">
                            <i class="fa-solid fa-square-arrow-up-right"></i>
                            Ver mais
                        </button>
                    </div>
                    <div>
                        <BarChart class="max-h-64" :data="dataVendas" :options="optionsChartBar" />
                    </div>
                </div>

                <!-- Gráfico de Linhas -->
                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-lg p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1">
                            <i class="fa-solid fa-chart-simple text-green-600"></i> Saldo mensal
                        </h2>
                        <button @click="goTo('/lancamentos/resumo')" type="button"
                            class="border-2 border-gray-300 text-gray-900 dark:border-gray-400 dark:text-gray-200 text-nowrap px-3 py-1 rounded-md text-sm transition-colors">
                            <i class="fa-solid fa-square-arrow-up-right"></i>
                            Ver mais
                        </button>
                    </div>
                    <div>
                        <LineChart class="max-h-64" :data="dataSaldo" :options="optionsChartLine" />
                    </div>
                </div>

                <!-- Últimas Vendas -->
                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-lg p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <div class="flex justify-between items-center mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1">
                            <i class="fa-solid fa-boxes-packing text-blue-600"></i> Últimos Produtos
                        </h2>
                        <button @click="goTo('/produtos')" type="button"
                            class="border-2 border-gray-300 text-gray-900 dark:border-gray-400 dark:text-gray-200 text-nowrap px-3 py-1 rounded-md text-sm transition-color">
                            <i class="fa-solid fa-square-arrow-up-right"></i>
                            Ver mais
                        </button>
                    </div>
                    <div class="overflow-x-auto max-h-96 relative sm:rounded-lg">
                        <div id="produtos_tabela_dashboard_sem_produtos"
                            class="p-2 text-sm h-80 text-gray-500 dark:text-gray-400 flex justify-center items-center flex-col">
                            <i class="fa-solid fa-boxes-stacked text-5xl"></i>
                            Nenhum produto cadastrado
                        </div>
                        <div id="lista_produtos_dashboard_cards" class="py-2 px-1 flex flex-col gap-2"></div>
                    </div>
                </div>
                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-lg p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <div class="flex justify-between items-center mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1">
                            <i class="fa-solid fa-box-open text-red-600"></i>
                            Estoques baixos
                        </h2>
                        <button @click="goTo('/produtos')" type="button"
                            class="border-2 border-gray-300 text-gray-950 dark:border-gray-400 dark:text-gray-200 text-nowrap px-3 py-1 rounded-md text-sm transition-color">
                            <i class="fa-solid fa-square-arrow-up-right"></i>
                            Ver mais
                        </button>
                    </div>
                    <div class="overflow-x-auto max-h-96 relative sm:rounded-lg">
                        <div id="produtos_em_baixa_dashboard_sem_produtos"
                            class="p-2 text-sm h-80 text-gray-500 dark:text-gray-400 flex justify-center items-center flex-col">
                            <i class="fa-solid fa-box-open text-5xl"></i>
                            Nenhum produto em baixa
                        </div>
                        <div id="lista_produtos_em_baixa_cards" class="py-2 px-1 flex flex-col gap-2"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import BarChart from '@/components/graficos/BarChart.vue';
import LineChart from '@/components/graficos/LineChart.vue';
import { useDashboardStore } from '@/stores/dashboard/useDashboardStore';
import { onMounted, ref } from 'vue';
import { VendaRepository } from '@/repositories/venda-repository';
import { goTo } from '@/hooks/links';
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import { optionsChartBar, optionsChartLine } from '@/composables/useChartOptions';
import { LancamentosRepository } from '@/repositories/lancamento-repository';

const store = useDashboardStore();
const filtroPeriodo = ref([new Date(), new Date()]);

const dataVendas: any = ref({ labels: [], datasets: [] });
const dataSaldo: any = ref({ labels: [], datasets: [] });

async function getResumoVendas() {
    try {
        const { data } = await VendaRepository.getResumoMensal();
        dataVendas.value = { labels: [...data.labels], datasets: [...data.datasets] };
    } catch (error) {
        console.log(error);
    }
}

async function getSaldoMensal() {
    try {
        const data = await LancamentosRepository.getSaldoMensal();
        dataSaldo.value = { labels: [...data.labels], datasets: [...data.datasets] };
    } catch (error) {
        console.log(error);
    }
}

const data = ref({
    totalClientes: 0,
    totalProdutos: 0,
    produtosEmBaixa: 0,
    totalVendas: 'R$ 0,00',
});

const getDataDashboard = async () => {
    const resultado = await store.getResumo();
    data.value.totalClientes = resultado.data.clientes;
    data.value.totalProdutos = resultado.data.produtos.length;
    data.value.produtosEmBaixa = resultado.data.estoquesBaixos.length;
    data.value.totalVendas = resultado.data.vendasCount;
}

onMounted(() => {
    getDataDashboard();
    getResumoVendas();
    getSaldoMensal();
});
</script>
