<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import BarChart from '@/components/graficos/BarChart.vue';
import PieChart from '@/components/graficos/PieChart.vue';
import { optionsChartBarDefault, optionsChartPie } from '@/composables/useChartOptions';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Landmark } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
const toast = useToast();
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])
const balancoData: any = ref({ labels: [], datasets: [] });
const statusData: any = ref({ labels: [], datasets: [] });
const contasData: any = ref({ labels: [], datasets: [] });
const categoriasData: any = ref({ labels: [], datasets: [] });
const dataResumo = ref<{ despesas: string, receitas: string, saldo: string }>({
    despesas: 'R$ 0,00',
    receitas: 'R$ 0,00',
    saldo: 'R$ 0,00'
})
const dataResumoStatus = ref<{ pendente: string, pago: string }>({
    pendente: 'R$ 0,00',
    pago: 'R$ 0,00'
})
async function getDataDashboard() {
    try {
        const inicio = filtroPeriodo.value === null ? startOfMonth(new Date()) : filtroPeriodo.value[0].toISOString();
        const fim = filtroPeriodo.value === null ? endOfMonth(new Date()) : filtroPeriodo.value[1].toISOString();
        const [resumo, resumoStatus, balanco, status, categorias, contas] = await Promise.all([
            LancamentosRepository.resumoTotal(),
            LancamentosRepository.resumoStatusTotal(),
            LancamentosRepository.graficoBalanco(),
            LancamentosRepository.graficoStatus(inicio, fim),
            LancamentosRepository.graficoCategorias(inicio, fim),
            LancamentosRepository.graficoContas(inicio, fim),
        ])
        balancoData.value = { labels: [...balanco.labels], datasets: [...balanco.datasets] };
        statusData.value = { labels: [...status.labels], datasets: [...status.datasets] };
        contasData.value = { labels: [...contas.labels], datasets: [...contas.datasets] };
        categoriasData.value = { labels: [...categorias.labels], datasets: [...categorias.datasets] };
        dataResumo.value = resumo
        dataResumoStatus.value = resumoStatus
    } catch (error) {
        console.log(error)
        toast.warning('Erro ao buscar os dados do dashboard, recarregue a página!')
    }
}

async function atualizarIndicadores() {
    await getDataDashboard()
    toast.info('Indicadores atualizados!')
}

onMounted(() => {
    getDataDashboard()
})
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
                <Calendarpicker :range="true" v-model="filtroPeriodo" @update:model-value="atualizarIndicadores" />
            </div>
        </div>
        <div class="flex flex-col gap-4" id="dashboard_financeiro_container_main">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
                <!-- Metric Item Start -->
                <div class="rounded-2xl cursor-pointer border border-border shadow-md bg-card px-6 pb-5 pt-6">
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
                                {{ dataResumo.receitas }}
                            </h4>
                        </div>

                        <span
                            class="flex items-center gap-1 rounded-full bg-green-50 py-0.5 pl-2 pr-2.5 text-xs font-medium text-green-600 dark:bg-green-500/15 dark:text-green-500">
                            <i class="fa-solid fa-coins"></i>
                            Entradas
                        </span>
                    </div>
                </div>

                <div class="rounded-2xl cursor-pointer border shadow-md border-border bg-card px-6 pb-5 pt-6">
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
                                {{ dataResumo.despesas }}
                            </h4>
                        </div>

                        <span
                            class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-xs font-medium text-red-600 dark:text-red-500">
                            <i class="fa-solid fa-coins"></i>
                            Saídas
                        </span>
                    </div>
                </div>

                <div class="rounded-2xl cursor-pointer border shadow-md border-border bg-card px-6 pb-5 pt-6">
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
                                {{ dataResumo.saldo }}
                            </h4>
                        </div>

                        <span id="produtos_em_baixa_dashboard_alerta"
                            class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-xs font-medium text-blue-600 dark:text-blue-500">
                            <i class="fa-solid fa-coins"></i>
                            Lucro
                        </span>
                    </div>
                </div>

                <div class="rounded-2xl cursor-pointer border shadow-md border-border bg-card px-6 pb-5 pt-6">
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
                                {{ dataResumoStatus.pendente }}
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
                    <BarChart class="max-h-64" :data="balancoData" :options="optionsChartBarDefault" />
                </div>

                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
                        Resumo por
                        status
                    </h2>
                    <BarChart class="max-h-64" :data="statusData" :options="optionsChartBarDefault" />
                </div>

                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-simple text-emerald-600"></i>
                        Plano de contas
                    </h2>
                    <PieChart class="max-h-64" :data="contasData" :options="optionsChartPie" />
                </div>

                <div
                    class="border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-xl p-4 col-span-1 sm:col-span-2 lg:col-span-2 border">
                    <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-chart-pie text-emerald-600"></i> Resumo
                        por
                        categoria
                    </h2>
                    <BarChart class="max-h-64" :data="categoriasData" :options="optionsChartBarDefault" />
                </div>
            </div>
        </div>
    </div>
</template>