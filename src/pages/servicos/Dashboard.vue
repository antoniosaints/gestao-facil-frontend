<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Clock, Wrench, Undo2, BadgePlus, PlusSquare, SquareArrowOutUpRight, CircleDollarSign, FileSpreadsheet } from "lucide-vue-next"
import Calendario from "@/components/calendario/Calendario.vue"
import { onMounted, ref } from "vue"
import type { OrdensServico } from "@/types/schemas"
import { OrdensServicoRepository } from "@/repositories/os-repository"
import { formatCurrencyBR } from "@/utils/formatters"
import { watch } from "vue"
import { endOfMonth, startOfMonth } from "date-fns"
import { useUiStore } from "@/stores/ui/uiStore"
import { goBack, goTo } from "@/hooks/links"
import { useOrdemServicoStore } from "@/stores/servicos/useOrdensServicos"
import OrdemServicoModal from "./modais/OrdemServicoModal.vue"

const osStore = useOrdemServicoStore();
const dataSelecionada = ref(new Date())
const uiStore = useUiStore()

interface ResumoOrdens {
    total: string
    faturado: string
    aberta: string
    andamento: string
    quantidade: number
    qtdAberta: number
    qtdAndamento: number
    qtdFaturada: number
}

const resumo = ref<ResumoOrdens>()
const eventos = ref<OrdensServico[]>([])
const getDataDashboard = async () => {
    try {
        const inicio = startOfMonth(dataSelecionada.value).toISOString();
        const fim = endOfMonth(dataSelecionada.value).toISOString();
        const [r, e] = await Promise.all([
            OrdensServicoRepository.getResumo(),
            OrdensServicoRepository.getEventos(inicio, fim),
        ])
        resumo.value = r.data
        eventos.value = e.data
    } catch (error) {
        console.error(error)
    }
}

watch(dataSelecionada, () => {
    getDataDashboard()
})

watch(() => osStore.filters.update, () => {
    getDataDashboard()
})

onMounted(() => {
    getDataDashboard()
})
</script>

<template>
    <div class="space-y-4">
        <!-- Cabeçalho -->
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Wrench class="h-6 w-6" :stroke-width="2.5" />
                    Painel de serviços
                </h2>
                <p class="text-sm text-muted-foreground">Acompanhamento e controle de serviços</p>
            </div>
            <button @click="osStore.openSave"
                class="bg-primary text-white px-3 py-2 text-sm rounded-md items-center gap-1 hidden md:flex">
                <BadgePlus class="h-5 w-5 inline-flex" /> <span>Novo serviço</span>
            </button>
        </div>

        <!-- Estatísticas -->
        <div class="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card class="shadow-md rounded-lg">
                <CardHeader class="flex flex-row items-center justify-between pb-1">
                    <CardTitle class="text-sm font-medium">Abertas</CardTitle>
                    <SquareArrowOutUpRight class="h-6 w-6 text-primary dark:text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div class="text-xl md:text-2xl font-bold text-primary dark:text-blue-500">{{
                        formatCurrencyBR(resumo?.aberta!)
                    }}</div>
                    <div class="text-sm">Quantidade: {{ resumo?.qtdAberta }}</div>
                </CardContent>
            </Card>
            <Card class="shadow-md rounded-lg">
                <CardHeader class="flex flex-row items-center justify-between pb-1">
                    <CardTitle class="text-sm font-medium">Em andamento</CardTitle>
                    <Clock class="h-6 w-6 text-info dark:text-cyan-500" />
                </CardHeader>
                <CardContent>
                    <div class="text-xl md:text-2xl font-bold text-info dark:text-cyan-500">{{
                        formatCurrencyBR(resumo?.andamento!)
                        }}</div>
                    <div class="text-sm">Quantidade: {{ resumo?.qtdAndamento }}</div>
                </CardContent>
            </Card>
            <Card class="shadow-md rounded-lg">
                <CardHeader class="flex flex-row items-center justify-between pb-1">
                    <CardTitle class="text-sm font-medium">Faturadas</CardTitle>
                    <CircleDollarSign class="h-6 w-6 text-success dark:text-green-500" />
                </CardHeader>
                <CardContent>
                    <div class="text-xl md:text-2xl font-bold text-success dark:text-green-500">{{
                        formatCurrencyBR(resumo?.faturado!)
                        }}</div>
                    <div class="text-sm">Quantidade: {{ resumo?.faturado }}</div>
                </CardContent>
            </Card>
            <Card class="shadow-md rounded-lg">
                <CardHeader class="flex flex-row items-center justify-between pb-1">
                    <CardTitle class="text-sm font-medium">Resumo geral</CardTitle>
                    <FileSpreadsheet class="h-6 w-6 text-muted-foreground dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                    <div class="text-xl md:text-2xl font-bold text-muted-foreground dark:text-gray-400">{{
                        formatCurrencyBR(resumo?.total!)
                        }}</div>
                    <div class="text-sm">Quantidade: {{ resumo?.quantidade }}</div>
                </CardContent>
            </Card>
        </div>

        <Calendario v-model:selected-date="dataSelecionada" :eventos="eventos" title="Calendário de Serviços"
            description="Visualização de eventos de serviços" />

        <nav v-if="uiStore.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <button type="button" @click="goTo('/servicos')"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Wrench />
                <span class="text-xs">Serviços</span>
            </button>
            <button type="button" @click="osStore.openSave"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <PlusSquare />
                <span class="text-xs">Nova OS</span>
            </button>
            <button type="button" @click="goBack"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Undo2 />
                <span class="text-xs">Voltar</span>
            </button>
        </nav>
        <OrdemServicoModal />
    </div>
</template>
