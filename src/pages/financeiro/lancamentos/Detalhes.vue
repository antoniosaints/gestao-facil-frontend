<script setup lang="ts">
import { ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BadgeDollarSign, Box, Edit, FileText, Trash2 } from "lucide-vue-next"
import BadgeCell from "@/components/tabela/BadgeCell.vue"

interface Parcela {
    numero: number
    vencimento: string
    valor: number
    status: "PAGO" | "PENDENTE"
}

interface Lancamento {
    descricao: string
    tipo: "RECEITA" | "DESPESA"
    total: number
    parcelas: Parcela[]
}

const lancamento = ref<Lancamento>({
    descricao: "Mensalidade Academia",
    tipo: "DESPESA",
    total: 300,
    parcelas: [
        { numero: 1, vencimento: "2025-09-10", valor: 100, status: "PAGO" },
        { numero: 2, vencimento: "2025-10-10", valor: 100, status: "PENDENTE" },
        { numero: 3, vencimento: "2025-11-10", valor: 100, status: "PENDENTE" },
    ],
})
</script>

<template>
    <div class="mx-auto space-y-4">
        <!-- Card do Lançamento -->
        <div class="flex items-center justify-between flex-col md:flex-row bg-card shadow-md border rounded-md p-4">
            <h1 class="text-md md:text-lg flex items-center gap-2">
                <BadgeDollarSign class="w-6 h-6 text-emerald-600" />
                <BadgeCell class="text-sm" :color="'green'" :label="'Efetivado'" />
                #FIN_732834257
            </h1>
            <div class="hidden md:flex gap-2">
                <RouterLink to="/produtos" as-child>
                    <Button variant="outline">
                        <ArrowLeft class="w-4 h-4 mr-1" /> Voltar
                    </Button>
                </RouterLink>
                <Button variant="default" class="text-white">
                    <Edit class="w-4 h-4 mr-1" /> Editar
                </Button>
                <Button variant="destructive">
                    <Trash2 class="w-4 h-4 mr-1" /> Excluir
                </Button>
                <Button variant="outline">
                    <i class="fa-solid fa-sync "></i>
                </Button>
            </div>
        </div>
        <Card class="shadow-md rounded-md">
            <CardHeader>
                <CardTitle class="flex justify-between items-center font-normal">
                    <span>{{ lancamento.descricao }}</span>
                    <Badge :variant="lancamento.tipo === 'RECEITA' ? 'default' : 'destructive'">
                        {{ lancamento.tipo }}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p class="text-lg font-semibold">Total: R$ {{ lancamento.total.toFixed(2) }}</p>
            </CardContent>
        </Card>

        <!-- Tabela de Parcelas -->
        <Card class="shadow-md rounded-md">
            <CardHeader>
                <CardTitle>Parcelas</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead class="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="p in lancamento.parcelas" :key="p.numero">
                            <TableCell>{{ p.numero }}</TableCell>
                            <TableCell>{{ p.vencimento }}</TableCell>
                            <TableCell>R$ {{ p.valor.toFixed(2) }}</TableCell>
                            <TableCell>
                                <Badge :variant="p.status === 'PAGO' ? 'default' : 'secondary'">
                                    {{ p.status }}
                                </Badge>
                            </TableCell>
                            <TableCell class="flex justify-end">
                                <div class="flex items-center gap-2">
                                    <RouterLink to="/produtos" as-child>
                                        <Button variant="outline">
                                            <ArrowLeft class="w-4 h-4 mr-1" /> Voltar
                                        </Button>
                                    </RouterLink>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
</template>
