<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, ClipboardList, CheckCircle2, Clock, DollarSign } from "lucide-vue-next"
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

const eventos = [
    { id: 1, titulo: "Troca de tela - Cliente X", data: "2025-09-08T09:30", fim: "2025-09-08T11:00", status: "concluida" },
    { id: 6, titulo: "Notebook - Cliente Z", data: "2025-09-08T14:30", fim: "2025-09-08T16:00", status: "concluida" },
    { id: 2, titulo: "Manutenção impressora - Cliente Y", data: "2025-09-08T11:00", fim: "2025-09-08T13:00", status: "concluida" },
    { id: 3, titulo: "Notebook - Cliente Z", data: "2025-09-08T14:30", fim: "2025-09-08T16:00", status: "concluida" },
    { id: 4, titulo: "Backup servidor", data: "2025-09-08T16:00", fim: "2025-09-08T18:00", status: "concluida" },
]

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
            <Button class="text-white">
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

        <Calendario :eventos="eventos" title="Calendário de Serviços"
            description="Visualização de eventos de serviços" />

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
