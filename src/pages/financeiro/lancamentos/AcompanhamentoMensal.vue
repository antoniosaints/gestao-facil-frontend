<script setup lang="ts">
import { ref, onMounted } from "vue"
import { addMonths, format, subMonths } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { LancamentosRepository } from "@/repositories/lancamento-repository"
import { formatToCapitalize } from "@/utils/formatters"
import { ptBR } from "date-fns/locale"
import { ArrowBigLeft, ArrowBigRight, BadgeCheck, CalendarClock, Dot, Trash, Undo2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useToast } from "vue-toastification"

const toast = useToast()
const currentMonth = ref(new Date())
const navigateMonth = (direction: "prev" | "next") => {
    currentMonth.value =
        direction === "prev"
            ? subMonths(currentMonth.value, 1)
            : addMonths(currentMonth.value, 1)

    carregarLancamentos()
};
// Dados
interface Lancamento {
    id: number
    descricao: string
    parcelaId: number
    valor: number
    status: string
    categoria: string
    tipo: string
}

interface DiaLancamento {
    dia: string
    lancamentos: Lancamento[]
    saldo: number
}

const carregando = ref<boolean>(false)
const lancamentos = ref<DiaLancamento[]>([])

async function carregarLancamentos() {
    try {
        carregando.value = true
        const { data } = await LancamentosRepository.getLancamentosMensais(currentMonth.value.toISOString().slice(0, 7))
        console.log(data)
        lancamentos.value = data
    } catch (e) {
        console.error(e)
    } finally {
        carregando.value = false
    }
}

async function efetivarParcela(id: number) {
    try {
        await LancamentosRepository.pagarParcela(id);
        toast.success("Parcela efetivada com sucesso");
        carregarLancamentos();
    } catch (error: any) {
        console.error(error);
        toast.error(error.response.data.message || "Erro ao efetivar a parcela");
    }
}
async function estornarParcela(id: number) {
    try {
        await LancamentosRepository.estornarParcela(id);
        toast.success("Parcela estornada com sucesso");
        carregarLancamentos();
    } catch (error: any) {
        console.error(error);
        toast.error(error.response.data.message || "Erro ao estornar a parcela");
    }
}
onMounted(carregarLancamentos)
</script>

<template>
    <div class="space-y-4">
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CalendarClock class="h-6 w-6" :stroke-width="2.5" />
                    Acompanhamento
                </h2>
                <p class="text-sm text-muted-foreground">Lançamentos financeiros por mês</p>
            </div>
        </div>
        <div class="flex justify-between items-center mb-2 bg-background border px-4 rounded-xl py-4">
            <button @click="navigateMonth('prev')">
                <ArrowBigLeft class="w-5 h-5" />
            </button>
            <h2 class="text-xl">{{ formatToCapitalize(format(currentMonth, "MMMM yyyy", { locale: ptBR })) }}</h2>
            <button @click="navigateMonth('next')">
                <ArrowBigRight class="w-5 h-5" />
            </button>
        </div>

        <!-- Loading -->
        <div v-if="carregando" class="text-center py-4 text-gray-500">
            Carregando lançamentos...
        </div>

        <!-- Lista de Lançamentos -->
        <div v-else class="space-y-4">
            <Card v-for="dia in lancamentos" :key="dia.dia" class="bg-transparent border-none shadow-none">
                <CardContent class="p-0 border-none">
                    <p class="text-sm px-3 bg-card border py-1 mb-1 rounded-md">
                        {{ format(new Date(dia.dia), "dd/MM/yyyy") }}
                    </p>
                    <div class="flex flex-col gap-2">
                        <div v-for="item in dia.lancamentos" :key="item.id"
                            class="flex flex-col sm:flex-row justify-between py-1 pl-6 gap-2 bg-background border px-3 rounded-md relative">
                            <div v-if="item.tipo === 'RECEITA'"
                                class="absolute left-0 top-0 w-2 h-full rounded-l-md bg-success/90"></div>
                            <div v-else class="absolute left-0 top-0 w-2 h-full rounded-l-md bg-danger/90"></div>
                            <div class="flex flex-col justify-center">
                                <div class="font-medium text-md">
                                    <RouterLink :to="`/financeiro/detalhes?id=${item.id}`"
                                        class="hover:underline hover:cursor-pointer hover:text-primary">
                                        {{ item.descricao }}
                                    </RouterLink>
                                    <Dot class="inline" :size="16" absoluteStrokeWidth />
                                    <span :class="[
                                        'text-xs',
                                        item.status === 'PENDENTE' ? 'text-red-600' : 'text-green-600'
                                    ]">
                                        {{ item.status === 'PENDENTE' ? 'Pendente' : 'Paga' }}
                                    </span>
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {{ item.categoria }}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {{ item.tipo === 'RECEITA' ? 'Receita' : 'Despesa' }}
                                </div>
                            </div>
                            <div>
                                <div :class="[
                                    'flex items-center text-right justify-end',
                                    item.tipo === 'RECEITA' ? 'text-green-500' : 'text-red-500'
                                ]">
                                    R$ {{ item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                                </div>
                                <div class="flex gap-2 mt-2 justify-end">
                                    <!-- <Button variant="outline" class="bg-transparent text-red-500" size="sm">
                                        <Trash :size="16" absoluteStrokeWidth />
                                    </Button> -->
                                    <Button @click="estornarParcela(item.parcelaId)" v-if="item.status === 'PAGO'"
                                        variant="outline" class="bg-transparent text-yellow-700 dark:text-yellow-500"
                                        size="sm">
                                        <Undo2 :size="16" absoluteStrokeWidth />
                                    </Button>
                                    <Button @click="efetivarParcela(item.parcelaId)" v-else variant="outline"
                                        class="bg-transparent text-green-500" size="sm">
                                        <BadgeCheck :size="16" absoluteStrokeWidth />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div v-if="lancamentos.length === 0" class="text-center text-gray-400 py-6">
                Nenhum lançamento encontrado.
            </div>
        </div>
    </div>
</template>

<style scoped>
@media (max-width: 640px) {
    .card-content {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
