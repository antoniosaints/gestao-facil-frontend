<template>
    <div>
        <div class="flex flex-col gap-4">
            <div class="flex flex-col md:flex-row gap-2 justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <ChartPie class="h-6 w-6" :stroke-width="2.5" />
                        Dashboard
                    </h2>
                    <p class="text-sm text-muted-foreground">Resumo geral e insights</p>
                </div>
                <div class="flex items-center gap-2 w-content">
                    <button type="button" id="limpar_filtro_dashboard_periodo"
                        class="bg-red-600 hidden text-white text-nowrap px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors">
                        <i class="fa-solid fa-filter-circle-xmark"></i>
                    </button>
                    <Calendarpicker :range="true" v-model="filtroPeriodo" @update:model-value="atualizarIndicadores" />
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
                <!-- Metric Item Start -->
                <RouterLink to="/clientes">
                    <div class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                        <div class="mb-6 flex items-center gap-3">
                            <UserRoundPlus class="w-10 h-10 bg-blue-500/10 p-2 rounded-md text-blue-500" />
                            <div>
                                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Assinantes</h3>
                                <span class="hidden md:block text-theme-xs text-gray-500 dark:text-gray-400">
                                    vinculados
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
                </RouterLink>

                <RouterLink to="/produtos">
                    <div class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                        <div class="mb-6 flex items-center gap-3">
                            <TrendingUpDown class="w-10 h-10 bg-green-500/10 p-2 rounded-md text-green-500" />
                            <div>
                                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Faturamento</h3>
                                <span class="hidden md:block text-theme-xs text-gray-500 dark:text-gray-400">
                                    do período
                                </span>
                            </div>
                        </div>

                        <div class="flex items-end justify-between">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    {{ data.totalProdutos }}
                                </h4>
                            </div>

                            <!-- <span
                                class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium text-blue-600 dark:text-blue-500">
                                <i class="fa-solid fa-boxes-packing"></i>
                                Total
                            </span> -->
                        </div>
                    </div>
                </RouterLink>

                <RouterLink to="/produtos">
                    <div class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                        <div class="mb-6 flex items-center gap-3">
                            <CalendarClock class="w-10 h-10 bg-orange-500/10 p-2 rounded-md text-orange-500" />

                            <div>
                                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Vencimentos</h3>
                                <span class="block text-theme-xs text-gray-500 dark:text-gray-400">próximos </span>
                            </div>
                        </div>

                        <div class="flex items-end justify-between">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90"
                                    id="produtos_em_baixa_dashboard">
                                    {{ data.produtosEmBaixa }}
                                </h4>
                            </div>

                            <!-- <span id="produtos_em_baixa_dashboard_alerta"
                                class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium text-red-600 dark:text-red-500">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                Atenção!
                            </span> -->
                        </div>
                    </div>
                </RouterLink>

                <RouterLink to="/vendas">
                    <div class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
                        <div class="mb-6 flex items-center gap-3">
                            <CircleDollarSign class="w-10 h-10 bg-yellow-500/10 p-2 rounded-md text-yellow-500" />
                            <div>
                                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Total</h3>
                                <span class="block text-theme-xs text-gray-500 dark:text-gray-400">
                                    a receber
                                </span>
                            </div>
                        </div>

                        <div class="flex items-end justify-between">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    {{ data.totalVendas }}
                                </h4>
                            </div>

                            <!-- <span id="porcentagem_vendas_dashboard_alerta"
                                class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium text-green-600 dark:text-green-500">
                                <i class="fa-solid fa-dollar-sign"></i>
                                <span id="porcentagem_vendas_dashboard">0%</span>
                            </span> -->
                        </div>
                    </div>
                </RouterLink>
                <!-- Metric Item End -->
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Gráfico de Barras -->
                <div
                    class="border-border bg-card shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1 flex items-center">
                            <UserPlus class="mr-2 w-5 h-5" />
                            Novos assinantes
                        </h2>
                        <RouterLink to="/vendas">
                            <button type="button"
                                class="border-2 border-gray-300 text-gray-900 dark:border-gray-400 dark:text-gray-200 text-nowrap px-3 py-1 rounded-md text-sm transition-colors">
                                <i class="fa-solid fa-square-arrow-up-right"></i>
                                Ver mais
                            </button>
                        </RouterLink>
                    </div>
                    <div>
                        <BarChart class="max-h-64" :data="dataVendas" :options="optionsChartBar" />
                    </div>
                </div>

                <!-- Gráfico de Linhas -->
                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1 flex items-center">
                            <TrendingUpDown class="mr-2 w-5 h-5" />
                            Faturamento mensal
                        </h2>
                        <RouterLink to="/financeiro/lancamentos">
                            <button type="button"
                                class="border-2 border-gray-300 text-gray-900 dark:border-gray-400 dark:text-gray-200 text-nowrap px-3 py-1 rounded-md text-sm transition-colors">
                                <i class="fa-solid fa-square-arrow-up-right"></i>
                                Ver mais
                            </button>
                        </RouterLink>
                    </div>
                    <div>
                        <LineChart class="max-h-64" :data="dataSaldo" :options="optionsChartLine" />
                    </div>
                </div>

                <!-- Últimas Vendas -->
                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <div class="flex justify-between items-center mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1 flex items-center">
                            <UserStar class="mr-2 w-5 h-5" />
                            Top clientes
                        </h2>
                        <RouterLink to="/produtos">
                            <button type="button"
                                class="border-2 border-gray-300 text-gray-900 dark:border-gray-400 dark:text-gray-200 text-nowrap px-3 py-1 rounded-md text-sm transition-color">
                                <i class="fa-solid fa-square-arrow-up-right"></i>
                                Ver mais
                            </button>
                        </RouterLink>
                    </div>
                    <div>
                        <BarChart class="max-h-64" :data="dataTicket" :options="optionsChartBarDefault" />
                    </div>
                </div>
                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <div class="flex justify-between items-center mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1 flex items-center">
                            <CalendarX2 class="mr-2 w-5 h-5" />
                            Inatividades por mês
                        </h2>
                        <RouterLink to="/produtos">
                            <button type="button"
                                class="border-2 border-gray-300 text-gray-950 dark:border-gray-400 dark:text-gray-200 text-nowrap px-3 py-1 rounded-md text-sm transition-color">
                                <i class="fa-solid fa-square-arrow-up-right"></i>
                                Ver mais
                            </button>
                        </RouterLink>
                    </div>
                    <div>
                        <BarChart class="max-h-64" :data="dataTopProdutos" :options="optionsChartBarDefault" />
                    </div>
                </div>
            </div>
        </div>
        <nav v-if="uiStore.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <RouterLink to="/vendas">
                <button type="button"
                    class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                    <Tags />
                    <span class="text-xs">Vendas</span>
                </button>
            </RouterLink>
            <RouterLink to="/servicos/os">
                <button type="button"
                    class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                    <FileDigit />
                    <span class="text-xs">Serviços</span>
                </button>
            </RouterLink>
            <RouterLink to="/produtos">
                <button type="button"
                    class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                    <Boxes />
                    <span class="text-xs">Produtos</span>
                </button>
            </RouterLink>
            <button type="button" @click="uiStore.openSidebar = true"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Menu />
                <span class="text-xs">Menu</span>
            </button>
        </nav>
    </div>
</template>

<script setup lang="ts">
import BarChart from '@/components/graficos/BarChart.vue';
import LineChart from '@/components/graficos/LineChart.vue';
import { useDashboardStore } from '@/stores/dashboard/useDashboardStore';
import { onMounted, ref } from 'vue';
import { VendaRepository } from '@/repositories/venda-repository';
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import { optionsChartBar, optionsChartBarDefault, optionsChartLine } from '@/composables/useChartOptions';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { Boxes, CalendarClock, CalendarX2, ChartPie, CircleDollarSign, FileDigit, HandCoins, Menu, Star, Tag, Tags, TrendingUpDown, UserPlus, UserRoundPlus, UserStar } from 'lucide-vue-next';
import { endOfMonth, startOfMonth } from 'date-fns';
import { useToast } from 'vue-toastification';
import { ProdutoRepository } from '@/repositories/produto-repository';
import { useUiStore } from '@/stores/ui/uiStore';

const store = useDashboardStore();
const uiStore = useUiStore();
const toast = useToast();
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())]);

const dataVendas: any = ref({ labels: [], datasets: [] });
const dataSaldo: any = ref({ labels: [], datasets: [] });
const dataTicket: any = ref({ labels: [], datasets: [] });
const dataTopProdutos: any = ref({ labels: [], datasets: [] });
const data = ref({
    totalClientes: 0,
    totalProdutos: 0,
    produtosEmBaixa: 0,
    totalVendas: 'R$ 0,00',
});

async function getDataDashboard() {
    try {
        const inicio = filtroPeriodo.value === null ? startOfMonth(new Date()).toISOString() : filtroPeriodo.value[0].toISOString();
        const fim = filtroPeriodo.value === null ? endOfMonth(new Date()).toISOString() : filtroPeriodo.value[1].toISOString();
        const [vendas, saldo, ticket, topProdutos, resultado] = await Promise.all([
            VendaRepository.getResumoMensal(),
            LancamentosRepository.getSaldoMensal(),
            ProdutoRepository.getTicketMedioMensal(),
            VendaRepository.getTopProdutos(inicio, fim),
            store.getResumo()
        ])

        dataVendas.value = { labels: [...vendas.data.labels], datasets: [...vendas.data.datasets] };
        dataSaldo.value = { labels: [...saldo.labels], datasets: [...saldo.datasets] };
        dataTicket.value = { labels: [...ticket.labels], datasets: [...ticket.datasets] };
        dataTopProdutos.value = { labels: [...topProdutos.labels], datasets: [...topProdutos.datasets] };
        data.value.totalClientes = resultado.data.clientes;
        data.value.totalProdutos = resultado.data.produtos.length;
        data.value.produtosEmBaixa = resultado.data.estoquesBaixos.length;
        data.value.totalVendas = resultado.data.vendasCount;
    } catch (error) {
        console.log(error);
        toast.warning('Erro ao buscar os dados do dashboard, recarregue a página!');
    }
}

async function atualizarIndicadores() {
    await getDataDashboard()
    toast.info('Indicadores atualizados!')
}

onMounted(() => {
    getDataDashboard();
});
</script>
