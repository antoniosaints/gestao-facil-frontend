<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, ClipboardList, CheckCircle2, Clock, ChevronLeft, ChevronRight, DollarSign } from "lucide-vue-next"
import { computed, ref } from "vue"
import Calendario from "@/components/calendario/Calendario.vue"

const estatisticas = [
    { titulo: "Abertas", valor: 12, icone: ClipboardList, cor: "text-blue-500" },
    { titulo: "Em andamento", valor: 8, icone: Clock, cor: "text-yellow-500" },
    { titulo: "Concluídas", valor: 25, icone: CheckCircle2, cor: "text-green-500" },
    { titulo: "Faturamento", valor: "R$ 15.000", icone: DollarSign, cor: "text-blue-500" },
]

const ultimasOrdens = [
    { id: "OS-001", cliente: "Empresa X", status: "Aberta", data: "07/09/2025" },
    { id: "OS-002", cliente: "João Silva", status: "Em andamento", data: "06/09/2025" },
    { id: "OS-003", cliente: "Maria Souza", status: "Concluída", data: "05/09/2025" },
]

const hoje = new Date()
const mesAtual = ref(hoje.getMonth())
const anoAtual = ref(hoje.getFullYear())

// nomes dos meses
const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

// dias da semana
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

// gera os dias do calendário
function gerarCalendario(mes: number, ano: number) {
    const primeiroDia = new Date(ano, mes, 1).getDay()
    const diasNoMes = new Date(ano, mes + 1, 0).getDate()

    const dias = []
    for (let i = 0; i < primeiroDia; i++) {
        dias.push(null) // espaços antes do 1º dia
    }
    for (let d = 1; d <= diasNoMes; d++) {
        dias.push(d)
    }
    return dias
}

const dias = computed(() => gerarCalendario(mesAtual.value, anoAtual.value))

function mesAnterior() {
    if (mesAtual.value === 0) {
        mesAtual.value = 11
        anoAtual.value--
    } else {
        mesAtual.value--
    }
}

function proximoMes() {
    if (mesAtual.value === 11) {
        mesAtual.value = 0
        anoAtual.value++
    } else {
        mesAtual.value++
    }
}

function isHoje(dia: number | null) {
    return (
        dia &&
        dia === hoje.getDate() &&
        mesAtual.value === hoje.getMonth() &&
        anoAtual.value === hoje.getFullYear()
    )
}
</script>

<template>
    <div class="space-y-4">
        <!-- Cabeçalho -->
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-bold text-black dark:text-white">
                    Painel de serviços
                </h2>
                <p class="text-sm text-muted-foreground">Acompanhamento e controle de serviços</p>
            </div>
            <Button>
                <PlusCircle class="w-4 h-4 mr-2" /> Nova OS
            </Button>
        </div>

        <!-- Estatísticas -->
        <div class="grid gap-4 md:grid-cols-4">
            <Card v-for="item in estatisticas" :key="item.titulo" class="shadow-md rounded-lg">
                <CardHeader class="flex flex-row items-center justify-between pb-2">
                    <CardTitle class="text-sm font-medium">{{ item.titulo }}</CardTitle>
                    <component :is="item.icone" class="w-5 h-5" :class="item.cor" />
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">{{ item.valor }}</div>
                </CardContent>
            </Card>
        </div>

        <Calendario />

        <!-- Últimas Ordens -->
        <Card class="shadow-md rounded-lg">
            <CardHeader>
                <CardTitle>Últimas Ordens de Serviço</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="ordem in ultimasOrdens" :key="ordem.id">
                            <TableCell>{{ ordem.id }}</TableCell>
                            <TableCell>{{ ordem.cliente }}</TableCell>
                            <TableCell>
                                <span :class="{
                                    'text-blue-600 font-semibold': ordem.status === 'Aberta',
                                    'text-yellow-600 font-semibold': ordem.status === 'Em andamento',
                                    'text-green-600 font-semibold': ordem.status === 'Concluída'
                                }">
                                    {{ ordem.status }}
                                </span>
                            </TableCell>
                            <TableCell>{{ ordem.data }}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
</template>
