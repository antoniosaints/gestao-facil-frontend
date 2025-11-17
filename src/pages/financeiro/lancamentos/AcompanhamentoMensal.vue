<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { addMonths, format, isSameDay, subMonths } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { LancamentosRepository } from "@/repositories/lancamento-repository"
import { formatCurrencyBR, formatToCapitalize } from "@/utils/formatters"
import { ptBR } from "date-fns/locale"
import { ArrowBigLeft, ArrowBigRight, BadgeCheck, BadgePlus, CalendarClock, CircleDollarSign, Dot, PenLine, Pin, Plus, ReceiptText, Trash, TrendingDown, TrendingUp, Undo2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useToast } from "vue-toastification"
import FormularioEfertivar from "./modais/FormularioEfertivar.vue"
import { useLancamentosStore } from "@/stores/lancamentos/useLancamentos"
import { goBack, goTo } from "@/hooks/links"
import { useUiStore } from "@/stores/ui/uiStore"
import ModalParcela from "./modais/ModalParcela.vue"
import LancamentoModal from "./formulario/LancamentoModal.vue"
import ModalView from "@/components/formulario/ModalView.vue"

const toast = useToast()
const store = useLancamentosStore()
const uiStore = useUiStore()
const openModalLancar = ref(false)
const navigateMonth = (direction: "prev" | "next") => {
    store.currentMonth =
        direction === "prev"
            ? subMonths(store.currentMonth, 1)
            : addMonths(store.currentMonth, 1)

    carregarLancamentos()
};

const openByTipo = (tipo: 'RECEITA' | 'DESPESA') => {
    store.form.tipo = tipo
    store.openSave()
}

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
watch(() => [store.filters.update], carregarLancamentos)
</script>

<template>
    <div>
        <div class="flex flex-col md:flex-row gap-2 justify-between mb-2">
            <div>
                <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CalendarClock class="h-6 w-6" :stroke-width="2.5" />
                    Acompanhamento
                </h2>
                <p class="text-sm text-muted-foreground">Lançamentos financeiros por mês</p>
            </div>
            <div class="gap-2 py-2 hidden md:flex">
                <button @click="openByTipo('RECEITA')"
                    class="bg-success text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Receita</span>
                </button>
                <button @click="openByTipo('DESPESA')"
                    class="bg-danger text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
                    <BadgePlus class="h-5 w-5 inline-flex" /> <span class="hidden md:inline">Despesa</span>
                </button>
            </div>
        </div>
        <div class="flex justify-between items-center mb-2 px-1 rounded-xl text-gray-800 dark:text-gray-200">
            <button class="bg-card px-4 py-1 rounded-xl border flex items-center gap-2" @click="navigateMonth('prev')">
                <ArrowBigLeft class="w-5 h-5" />
                <span class="hidden md:inline">Anterior</span>
            </button>
            <h2 class="text-xl">{{ formatToCapitalize(format(store.currentMonth, "MMMM 'de' yyyy", { locale: ptBR })) }}
            </h2>
            <button class="bg-card px-4 py-1 rounded-xl border flex items-center gap-2" @click="navigateMonth('next')">
                <span class="hidden md:inline">Proximo</span>
                <ArrowBigRight class="w-5 h-5" />
            </button>
        </div>

        <!-- Loading -->
        <div v-if="carregando" class="text-center py-4 text-gray-500">
            Carregando lançamentos...
        </div>

        <!-- Lista de Lançamentos -->
        <div v-else
            class="space-y-4 min-h-40 px-1 overflow-auto max-h-[calc(100vh-14.1rem)] md:max-h-[calc(100vh-13.7rem)]">
            <Card v-for="dia in lancamentos" :key="dia.dia" class="bg-transparent border-none shadow-none">
                <CardContent class="p-0 border-none">
                    <p class="text-xs px-3 bg-card/40 capitalize py-0.5 rounded-t-sm">
                        {{ format(new Date(dia.dia), isSameDay(dia.dia, new Date()) ? "'Hoje,' dd/MM" : "EEEE',' dd/MM",
                            {
                                locale: ptBR
                            }) }}
                    </p>
                    <div class="flex flex-col">
                        <div v-for="item in dia.lancamentos" :key="item.id"
                            class="flex justify-between py-1 group pl-5 gap-2 bg-background border border-t-0 px-3 first:rounded-t-none rounded-none last:rounded-b-sm relative">
                            <div v-if="item.tipo === 'RECEITA'"
                                class="absolute left-0 top-0 w-2 h-full group-last:rounded-bl-sm bg-success/90"></div>
                            <div v-else class="absolute left-0 top-0 w-2 h-full group-last:rounded-bl-sm bg-danger/90">
                            </div>
                            <div class="flex flex-col justify-center">
                                <div class="font-medium text-md">
                                    <Pin class="inline mr-1" :size="12" />
                                    <RouterLink :to="`/financeiro/detalhes?id=${item.id}`"
                                        class="hover:underline hover:cursor-pointer hover:text-primary text-sm md:text-md">
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
        <ModalView v-model:open="openModalLancar" title="Selecione o tipo de lançamento" size="md"
            description="Adicionar transação financeira">
            <div class="grid grid-cols-2 gap-4 p-4">
                <div @click="openByTipo('RECEITA')"
                    class="p-4 rounded-lg cursor-pointer border-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700">
                    <div
                        class="flex justify-center items-center p-1 mx-auto mb-2 rounded-full w-[30px] h-[30px] max-w-[30px] max-h-[30px]">
                        <TrendingUp class="w-10 h-10 text-green-500 dark:text-green-400" />
                    </div>
                    <div class="font-medium text-center text-gray-500 dark:text-gray-400">Receita</div>
                </div>
                <div @click="openByTipo('DESPESA')"
                    class="p-4 rounded-lg cursor-pointer border-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700">
                    <div
                        class="flex justify-center items-center p-1 mx-auto mb-2 rounded-full w-[30px] h-[30px] max-w-[30px] max-h-[30px]">
                        <TrendingDown class="w-10 h-10 text-red-500 dark:text-red-400" />
                    </div>
                    <div class="font-medium text-center text-gray-500 dark:text-gray-400">Despesa</div>
                </div>
                <Button type="button" variant="outline" class="col-span-2 pt-2 -mb-2"
                    @click="openModalLancar = false">Fechar</Button>
            </div>
        </ModalView>
        <nav v-if="uiStore.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <button type="button" @click="goTo('/financeiro/lancamentos')"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <CircleDollarSign />
                <span class="text-xs">Geral</span>
            </button>
            <button type="button" @click="openModalLancar = true"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Plus />
                <span class="text-xs">Novo</span>
            </button>
            <button type="button" @click="goBack"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Undo2 />
                <span class="text-xs">Voltar</span>
            </button>
        </nav>
        <FormularioEfertivar @success="carregarLancamentos" />
        <ModalParcela />
        <LancamentoModal />
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
