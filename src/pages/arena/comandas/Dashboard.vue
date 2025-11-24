<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <ChartBarStacked class="h-6 w-6" :stroke-width="2.5" />
                    Dashboard
                </h2>
                <p class="text-sm text-muted-foreground">
                    Resumo e insights da empresa
                </p>
            </div>
            <div class="justify-between gap-2 items-center hidden md:flex">
                <button
                    class="border border-blue-500 hover:border-blue-700 text-blue-900 dark:text-blue-200 bg-blue-500/20 px-3 py-1.5 text-sm rounded-lg">
                    <Funnel class="w-4 h-4 inline-flex" />
                    Filtar
                </button>
            </div>
        </div>
        <div class="overflow-x-auto rounded-lg">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-8 bg-card rounded-lg p-4 flex flex-col gap-2 justify-evenly">
                    <h1 class="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        <Rocket class="h-6 w-6 inline-flex text-orange-500" />
                        Olá, {{ uiStore.usuarioLogged.nome.split(' ')[0] }}
                    </h1>
                    <div class="flex gap-2 text-sm text-muted-foreground">
                        <RouterLink to="/arena/comandas">
                            <span class="py-2 px-3 gap-2 flex items-center bg-body/60 rounded-md border cursor-pointer">
                                <Tag class="w-4 h-4 inline-flex text-green-500" />
                                Nova venda
                            </span>
                        </RouterLink>
                        <span class="py-2 px-3 gap-2 flex items-center bg-body/60 rounded-md border cursor-pointer">
                            <ClockPlus class="w-4 h-4 inline-flex text-purple-500" />
                            Novo agendamento
                        </span>
                        <span class="py-2 px-3 gap-2 flex items-center bg-body/60 rounded-md border cursor-pointer">
                            <CalendarPlus class="w-4 h-4 inline-flex text-blue-500" />
                            Nova assinatura
                        </span>
                    </div>
                    <p class="text-md text-muted-foreground">Seja bem vindo ao dashboard, preparamos um resumo detalhado
                        de tudo que precisa saber para tomar as decisões corretas.</p>
                </div>
                <div class="col-span-12 md:col-span-4 bg-card rounded-lg p-4 flex flex-col justify-between">
                    <h1 class="text-xl font-bold text-gray-700 dark:text-gray-300">
                        <Link class="h-6 w-6 inline-flex text-blue-500" />
                        Link de agendamento
                    </h1>
                    <p class="text-xs text-muted-foreground">Copie seu link e envie para os clientes. com ele você pode
                        receber agendamentos online e sem se preocupar com cobranças.</p>
                    <span @click="copyLink"
                        class="text-sm text-muted-foreground mt-2 cursor-pointer flex items-center gap-2 bg-body/60 px-3 py-2 rounded-md">
                        <Copy class="h-6 w-6 inline-flex text-blue-500" />
                        <span class="text-blue-500">https://gestao-facil-erp.com.br/</span>
                    </span>
                </div>

                <div class="border-border col-span-12 bg-card shadow-md rounded-xl p-4 md:col-span-6 border">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-lg font-semibold px-0 py-1 flex items-center">
                            <Tag class="mr-2 w-5 h-5" />
                            Vendas Mensais
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
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import BarChart from '@/components/graficos/BarChart.vue';
import { optionsChartBar } from '@/composables/useChartOptions';
import { VendaRepository } from '@/repositories/venda-repository';
import { useUiStore } from '@/stores/ui/uiStore';
import { endOfMonth, startOfMonth } from 'date-fns';
import { CalendarPlus, ChartBarStacked, CircleX, ClockPlus, Copy, Funnel, Link, Rocket, Tag } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';
const toast = useToast()
const uiStore = useUiStore()
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())]);
const dataVendas: any = ref({ labels: [], datasets: [] });
const copyLink = () => {
    navigator.clipboard.writeText('https://gestao-facil-erp.com.br/')
    toast.success('Link copiado com sucesso!', {
        timeout: 2000,
        position: POSITION.BOTTOM_RIGHT,
        showCloseButtonOnHover: true,
        closeButton: CircleX,
    })
}

async function getDataDashboard() {
    try {
        const inicio = filtroPeriodo.value === null ? startOfMonth(new Date()).toISOString() : filtroPeriodo.value[0].toISOString();
        const fim = filtroPeriodo.value === null ? endOfMonth(new Date()).toISOString() : filtroPeriodo.value[1].toISOString();
        const [vendas] = await Promise.all([
            VendaRepository.getResumoMensal(),
        ])

        dataVendas.value = { labels: [...vendas.data.labels], datasets: [...vendas.data.datasets] };
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