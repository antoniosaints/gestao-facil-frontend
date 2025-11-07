<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { addMonths, format, subMonths } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { LancamentosRepository } from "@/repositories/lancamento-repository"
import { formatCurrencyBR, formatToCapitalize } from "@/utils/formatters"
import { ptBR } from "date-fns/locale"
import { ArrowBigLeft, ArrowBigRight, BadgeCheck, CalendarClock, CircleDollarSign, Dot, PenLine, Pin, ReceiptText, Trash, Undo2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useToast } from "vue-toastification"
import FormularioEfertivar from "./modais/FormularioEfertivar.vue"
import { useLancamentosStore } from "@/stores/lancamentos/useLancamentos"
import { goBack, goTo } from "@/hooks/links"
import { useUiStore } from "@/stores/ui/uiStore"
import ModalParcela from "./modais/ModalParcela.vue"

const toast = useToast()
const store = useLancamentosStore()
const uiStore = useUiStore()
const navigateMonth = (direction: "prev" | "next") => {
    store.currentMonth =
        direction === "prev"
            ? subMonths(store.currentMonth, 1)
            : addMonths(store.currentMonth, 1)

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
        const { data } = await LancamentosRepository.getLancamentosMensais(store.currentMonth.toISOString().slice(0, 7))
        lancamentos.value = data
    } catch (e) {
        console.error(e)
    } finally {
        carregando.value = false
    }
}

async function efetivarParcela(id: number) {
    store.idMutation = id
    store.openModalEfetivar = true
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

function editarParcela(parcela: Lancamento, data: string) {
    store.idMutation = parcela.parcelaId!
    store.formParcela = {
        valor: parcela.valor,
        vencimento: new Date(data)
    }
    store.openModalParcela = true
}
onMounted(carregarLancamentos)
watch(() => store.filters.update, carregarLancamentos)
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CalendarClock class="h-6 w-6" :stroke-width="2.5" />
                    Acompanhamento
                </h2>
                <p class="text-sm text-muted-foreground">Lançamentos financeiros por mês</p>
            </div>
        </div>
        <div class="flex justify-between items-center mb-4 px-1 rounded-xl text-gray-800 dark:text-gray-200">
            <button class="bg-card px-4 py-2 rounded-l-xl border" @click="navigateMonth('prev')">
                <ArrowBigLeft class="w-5 h-5" />
            </button>
            <h2 class="text-xl">{{ formatToCapitalize(format(store.currentMonth, "MMMM yyyy", { locale: ptBR })) }}</h2>
            <button class="bg-card px-4 py-2 rounded-r-xl border" @click="navigateMonth('next')">
                <ArrowBigRight class="w-5 h-5" />
            </button>
        </div>

        <!-- Loading -->
        <div v-if="carregando" class="text-center py-4 text-gray-500">
            Carregando lançamentos...
        </div>

        <!-- Lista de Lançamentos -->
        <div v-else class="space-y-4 min-h-40 px-1 overflow-auto max-h-[calc(100vh-15.6rem)]">
            <Card v-for="dia in lancamentos" :key="dia.dia" class="bg-transparent border-none shadow-none">
                <CardContent class="p-0 border-none">
                    <p class="text-sm px-3 bg-card/40 border py-1 mb-1 rounded-md">
                        {{ format(new Date(dia.dia), "dd/MM/yyyy") }}
                    </p>
                    <div class="flex flex-col gap-2">
                        <div v-for="item in dia.lancamentos" :key="item.id"
                            class="flex justify-between py-1 pl-6 gap-2 bg-background border px-3 rounded-lg relative">
                            <div v-if="item.tipo === 'RECEITA'"
                                class="absolute left-0 top-0 w-2 h-full rounded-l-md bg-success/90"></div>
                            <div v-else class="absolute left-0 top-0 w-2 h-full rounded-l-md bg-danger/90"></div>
                            <div class="flex flex-col justify-center">
                                <div class="font-medium text-md">
                                    <Pin class="inline mr-1" :size="16" />
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
                                <div :class="['text-xs', item.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600']">
                                    {{ item.tipo === 'RECEITA' ? 'Receita' : 'Despesa' }}
                                </div>
                            </div>
                            <div>
                                <div :class="[
                                    'flex items-center text-right justify-end',
                                    item.tipo === 'RECEITA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                ]">
                                    {{ formatCurrencyBR(item.valor) }}
                                </div>
                                <div class="flex gap-2 mt-2 justify-end">
                                    <Button @click="editarParcela(item, dia.dia)" variant="outline"
                                        class="bg-transparent w-9 text-blue-500 rounded-lg" size="sm">
                                        <PenLine :size="16" absoluteStrokeWidth />
                                    </Button>
                                    <Button @click="estornarParcela(item.parcelaId)" v-if="item.status === 'PAGO'"
                                        variant="outline"
                                        class="bg-transparent w-9 text-yellow-700 rounded-lg dark:text-yellow-500"
                                        size="sm">
                                        <Undo2 :size="16" absoluteStrokeWidth />
                                    </Button>
                                    <Button @click="efetivarParcela(item.parcelaId)" v-else variant="outline"
                                        class="bg-transparent w-9 text-green-500 rounded-lg" size="sm">
                                        <BadgeCheck :size="16" absoluteStrokeWidth />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div v-if="lancamentos.length === 0" class="text-center text-gray-600 dark:text-gray-400 py-6 flex flex-col h-full justify-center items-center
                min-h-[calc(100vh-15.6rem)]">
                <ReceiptText class="w-12 h-12 mx-auto mb-2" />
                Nenhum lançamento encontrado.
                <RouterLink :to="`/financeiro/lancamentos`">
                    <Button class="mt-4">
                        <CircleDollarSign />
                        Adicionar Lançamentos
                    </Button>
                </RouterLink>
            </div>
        </div>
        <nav v-if="uiStore.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <button type="button" @click="goTo('/financeiro/lancamentos')"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <CircleDollarSign />
                <span class="text-xs">Lançamentos</span>
            </button>
            <button type="button" @click="goBack"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Undo2 />
                <span class="text-xs">Voltar</span>
            </button>
        </nav>
        <FormularioEfertivar @success="carregarLancamentos" />
        <ModalParcela />
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
