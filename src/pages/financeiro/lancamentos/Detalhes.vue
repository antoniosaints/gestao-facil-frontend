<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BadgeCheck, BadgeDollarSign, Edit, HandCoins, OctagonX, Trash2, Undo2 } from "lucide-vue-next"
import BadgeCell from "@/components/tabela/BadgeCell.vue"
import { useRoute } from "vue-router"
import type { LancamentoFinanceiro, ParcelaFinanceiro } from "@/types/schemas"
import http from "@/utils/axios"
import { useToast } from "vue-toastification"
import { formatDate } from "date-fns"
import { formatCurrencyBR, formatDateToPtBR } from "@/utils/formatters"
import { Separator } from "@/components/ui/separator"
import { LancamentosRepository } from "@/repositories/lancamento-repository"

const route = useRoute()
const toast = useToast()
const lancamento = ref<LancamentoFinanceiro & { parcelas: Array<ParcelaFinanceiro> }>()

interface DataLancamento {
    data: LancamentoFinanceiro & { parcelas: Array<ParcelaFinanceiro> }
}
async function getLancamento(id: number) {
    try {
        const [res] = await Promise.all([
            http.get<DataLancamento>(`/lancamentos/${id}`)
        ]);
        lancamento.value = res.data.data;
    } catch (error) {
        console.error(error);
        toast.error("Erro ao buscar o lançamento");
    }
}

const totalPago = computed(() => {
    return lancamento.value?.parcelas.filter((parcela) => parcela.pago).reduce((acc, parcela) => acc + Number(parcela.valor), 0);
})

const totalPendente = computed(() => {
    return lancamento.value?.parcelas.filter((parcela) => !parcela.pago).reduce((acc, parcela) => acc + Number(parcela.valor), 0);
})

function copiarUid() {
    navigator.clipboard.writeText(lancamento.value?.Uid ?? "");
    toast.success("UID copiado para clipboard");
}

function loadLancamento() {
    const id = Number(route.query.id);
    if (!id || isNaN(id)) {
        toast.error("ID de produto inválido");
        return;
    }
    getLancamento(id);
}

async function efetivarParcela(id: number) {
    try {
        await LancamentosRepository.pagarParcela(id);
        toast.success("Parcela efetivada com sucesso");
        loadLancamento();
    } catch (error) {
        console.error(error);
        toast.error("Erro ao efetivar a parcela");
    }
}
async function estornarParcela(id: number) {
    try {
        await LancamentosRepository.estornarParcela(id);
        toast.success("Parcela estornada com sucesso");
        loadLancamento();
    } catch (error) {
        console.error(error);
        toast.error("Erro ao estornar a parcela");
    }
}

onMounted(loadLancamento);
</script>

<template>
    <div class="mx-auto space-y-4">
        <!-- Card do Lançamento -->
        <div class="flex items-center justify-between flex-col md:flex-row bg-card shadow-md border rounded-md p-4">
            <h1 class="text-md md:text-lg flex items-center gap-2">
                <BadgeDollarSign class="w-6 h-6 text-emerald-600" />
                <BadgeCell class="text-sm" :color="'green'" :label="'Efetivado'" />
                #{{ lancamento?.Uid }}
                <p class="text-sm text-muted-foreground">{{ lancamento?.vendaId ? ' (Lançamento automático)' : '' }}</p>
            </h1>
            <div class="hidden md:flex gap-2">
                <RouterLink to="/financeiro/lancamentos" as-child>
                    <Button variant="outline">
                        <ArrowLeft class="w-4 h-4 mr-1" /> Voltar
                    </Button>
                </RouterLink>
                <Button :disabled="lancamento?.vendaId" variant="default" class="text-white">
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
        <Card class="rounded-md">
            <CardHeader>
                <CardTitle class="flex items-center gap-2 font-normal">
                    <BadgeDollarSign class="w-5 h-5" /> Informações do lançamento
                </CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div class="flex items-center gap-2"><span>Código:</span>
                    <div class="flex items-center gap-2">
                        <BadgeCell color="gray" :label="lancamento?.Uid || 'N/A'" class="text-sm" :capitalize="false" />
                        <Button @click="copiarUid" variant="outline" size="xs"><i
                                class="fa-solid fa-copy fa-xs"></i></Button>
                    </div>
                </div>
                <div><span>Recorrência:</span>
                    <BadgeCell :color="lancamento?.recorrente ? 'purple' : 'green'"
                        :label="lancamento?.recorrente ? 'Recorrente' : 'Único'" class="ml-2 text-sm"
                        :capitalize="false" />
                </div>
                <div><span>Valor total:</span>
                    <BadgeCell color="green" :label="formatCurrencyBR(lancamento?.valorTotal || 0)"
                        class="ml-2 text-sm" />
                </div>
                <div><span>Desconto:</span> {{ formatCurrencyBR(lancamento?.desconto || 0) }}</div>
                <div><span>Total pago:</span>
                    <BadgeCell color="emerald" :label="formatCurrencyBR(totalPago!)" class="ml-2 text-sm" />
                </div>
                <div><span>Total pendente:</span>
                    <BadgeCell color="yellow" :label="formatCurrencyBR(totalPendente!)" class="ml-2 text-sm" />
                </div>
                <div><span>Data cadastro:</span> {{ lancamento?.dataLancamento ?
                    formatDateToPtBR(lancamento?.dataLancamento,
                        false) :
                    'N/A'
                }}</div>
                <div><span>Parcelas:</span> {{lancamento?.parcelas.length === 1 && !lancamento.recorrente ? 'À vista' :
                    `${lancamento?.parcelas.filter((p) => p.numero != 0).length} parcelas`}}</div>
                <Separator class="col-span-2" />
                <div class="col-span-2"><span>Descrição:</span> {{ lancamento?.descricao || 'N/A' }}</div>
            </CardContent>
        </Card>
        <!-- Tabela de Parcelas -->
        <Card class="shadow-md rounded-md" v-if="lancamento?.parcelas.length">
            <CardHeader>
                <CardTitle class="flex items-center gap-2 font-normal">
                    <HandCoins class="w-5 h-5" /> Parcelas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="relative overflow-x-auto shadow-md sm:rounded-lg border border-border">
                    <Table>
                        <TableHeader class="text-sm bg-body">
                            <TableRow>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Valor Pago</TableHead>
                                <TableHead>Pagamento</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead class="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody class="bg-body/30">
                            <TableRow v-for="p in lancamento?.parcelas" :key="p.numero">
                                <TableCell>
                                    <span
                                        class="font-normal px-2 py-1.5 text-nowrap bg-primary text-sm text-white rounded-md">
                                        {{ p.numero === 1 && lancamento.parcelas.length === 1 ? "À vista" : p.numero ===
                                            0 ? "Entrada" : `Parcela ${p.numero}` }}
                                    </span>
                                </TableCell>
                                <TableCell>{{ p.vencimento ? formatDate(p.vencimento, "dd/MM/yyyy") : "-" }}</TableCell>
                                <TableCell>{{ formatCurrencyBR(p.valor) }}</TableCell>
                                <TableCell>{{ p.valorPago ? formatCurrencyBR(p.valorPago || 0) : "-" }}</TableCell>
                                <TableCell>{{ p.dataPagamento ? formatDate(p.dataPagamento, "dd/MM/yyyy") : "-" }}
                                </TableCell>
                                <TableCell>
                                    <Badge class="text-white px-2 py-1 rounded-md text-sm font-normal"
                                        :variant="p.pago ? 'default' : 'destructive'">
                                        {{ p.pago ? "Pago" : "Pendente" }}
                                    </Badge>
                                </TableCell>
                                <TableCell class="flex justify-end">
                                    <div class="flex items-center gap-2">
                                        <Button v-if="!p.pago" :disabled="lancamento.vendaId"
                                            @click="efetivarParcela(p.id!)" variant="default"
                                            class="w-8 h-8 p-0 text-white">
                                            <BadgeCheck class="w-4 h-4" />
                                        </Button>
                                        <!-- <Button v-if="!p.pago" variant="default"
                                            class="w-8 h-8 p-0 bg-danger hover:bg-danger/80 text-white">
                                            <OctagonX class="w-4 h-4" />
                                        </Button> -->
                                        <Button v-if="p.pago" :disabled="lancamento.vendaId"
                                            @click="estornarParcela(p.id!)" variant="default"
                                            class="w-8 h-8 p-0 bg-warning hover:bg-warning/80 text-white">
                                            <Undo2 class="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
