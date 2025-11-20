<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { addMonths, format, isSameDay, subMonths, isToday, isYesterday } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LancamentosRepository } from "@/repositories/lancamento-repository"
import { formatCurrencyBR, formatToCapitalize } from "@/utils/formatters"
import { ptBR } from "date-fns/locale"
import {
    ArrowLeft,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle2,
    Undo2,
    Plus,
    Home,
    Wallet,
    Calendar as CalendarIcon,
    Search,
    Filter,
    Info
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "vue-toastification"
import FormularioEfertivar from "./modais/FormularioEfertivar.vue"
import { useLancamentosStore } from "@/stores/lancamentos/useLancamentos"
import { goBack, goTo } from "@/hooks/links"
import { useUiStore } from "@/stores/ui/uiStore"
import ModalParcela from "./modais/ModalParcela.vue"
import LancamentoModal from "./formulario/LancamentoModal.vue"
import ModalView from "@/components/formulario/ModalView.vue"
import ClientesModal from "@/pages/clientes/modais/ClientesModal.vue"

const toast = useToast()
const store = useLancamentosStore()
const uiStore = useUiStore()
const openModalLancar = ref(false)

// Navigation
const navigateMonth = (direction: "prev" | "next") => {
    store.currentMonth = direction === "prev"
        ? subMonths(store.currentMonth, 1)
        : addMonths(store.currentMonth, 1)
    carregarLancamentos()
}

const openByTipo = (tipo: 'RECEITA' | 'DESPESA') => {
    store.form.tipo = tipo
    store.openSave()
    openModalLancar.value = false
}

// Interfaces
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

// State
const carregando = ref<boolean>(false)
const lancamentos = ref<DiaLancamento[]>([])

// Actions
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
        toast.error(error.response?.data?.message || "Erro ao estornar a parcela");
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

// Helpers
const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Hoje'
    if (isYesterday(date)) return 'Ontem'
    return format(date, "EEEE", { locale: ptBR })
}

const getDayNumber = (dateStr: string) => {
    return format(new Date(dateStr), "dd", { locale: ptBR })
}

// Totals Calculation
const totalReceitas = computed(() => {
    return lancamentos.value.reduce((acc, dia) => {
        return acc + dia.lancamentos
            .filter(l => l.tipo === 'RECEITA')
            .reduce((sum, l) => sum + l.valor, 0)
    }, 0)
})

const totalDespesas = computed(() => {
    return lancamentos.value.reduce((acc, dia) => {
        return acc + dia.lancamentos
            .filter(l => l.tipo === 'DESPESA')
            .reduce((sum, l) => sum + l.valor, 0)
    }, 0)
})

const saldoMensal = computed(() => totalReceitas.value - totalDespesas.value)

onMounted(carregarLancamentos)
watch(() => [store.filters.update], carregarLancamentos)
</script>

<template>
    <div class="overflow-auto rounded-lg max-w-6xl mx-auto md:pb-0 min-h-[calc(100vh-13rem)]">
        <!-- Header Section -->
        <div class="top-0 z-10 bg-card backdrop-blur-md rounded-lg border-b px-4 py-3 space-y-4">
            <!-- Month Navigation -->
            <div class="flex items-center justify-between max-w-6xl mx-auto w-full">
                <Button variant="ghost" size="icon" @click="navigateMonth('prev')"
                    class="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowLeft class="w-5 h-5" />
                </Button>

                <div class="flex flex-col items-center">
                    <h2 class="text-lg font-semibold capitalize">
                        {{ format(store.currentMonth, "MMMM yyyy", { locale: ptBR }) }}
                    </h2>
                    <div class="flex items-center gap-2 text-xs font-medium">
                        <span :class="saldoMensal >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                            {{ formatCurrencyBR(saldoMensal) }}
                        </span>
                    </div>
                </div>

                <Button variant="ghost" size="icon" @click="navigateMonth('next')"
                    class="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowRight class="w-5 h-5" />
                </Button>
            </div>

            <!-- Quick Stats (Desktop only) -->
            <div class="hidden md:grid grid-cols-3 gap-4 max-w-6xl mx-auto w-full">
                <Card
                    class="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                    <CardContent class="px-4 py-2 flex items-center justify-between">
                        <div>
                            <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Receitas</p>
                            <p class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{{
                                formatCurrencyBR(totalReceitas) }}</p>
                        </div>
                        <div class="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                            <TrendingUp class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card class="bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 shadow-sm">
                    <CardContent class="px-4 py-2 flex items-center justify-between">
                        <div>
                            <p class="text-xs text-red-600 dark:text-red-400 font-medium">Despesas</p>
                            <p class="text-lg font-bold text-red-700 dark:text-red-300">{{
                                formatCurrencyBR(totalDespesas) }}</p>
                        </div>
                        <div class="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                            <TrendingDown class="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <div class="flex gap-2 items-center justify-end">
                    <Button @click="openByTipo('RECEITA')"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <Plus class="w-4 h-4 mr-2" /> Receita
                    </Button>
                    <Button @click="openByTipo('DESPESA')" class="bg-red-600 hover:bg-red-700 text-white shadow-sm">
                        <Plus class="w-4 h-4 mr-2" /> Despesa
                    </Button>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-6xl mx-auto py-4 space-y-6">
            <!-- Loading State -->
            <div v-if="carregando" class="flex flex-col items-center justify-center py-12 space-y-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p class="text-sm text-muted-foreground">Carregando lançamentos...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="lancamentos.length === 0"
                class="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                    <CalendarIcon class="w-8 h-8 text-gray-400" />
                </div>
                <div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum lançamento</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Não há registros para este mês.</p>
                </div>
                <Button @click="openModalLancar = true" variant="outline" class="mt-4">
                    Adicionar Lançamento
                </Button>
            </div>

            <!-- Transactions List -->
            <div v-else class="space-y-3">
                <div v-for="dia in lancamentos" :key="dia.dia" class="space-y-3">
                    <!-- Day Header -->
                    <div class="flex items-center gap-3 top-[120px] md:top-[180px] z-0">
                        <div
                            class="flex flex-col items-center justify-center bg-white dark:bg-card border rounded-lg w-10 h-10 shadow-sm">
                            <span class="text-md font-bold leading-none">{{ getDayNumber(dia.dia) }}</span>
                            <span class="text-[9px] text-muted-foreground uppercase font-medium">{{ format(new
                                Date(dia.dia), "MMM", { locale: ptBR }) }}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                                {{ getDayLabel(dia.dia) }}
                            </span>
                            <span class="text-xs text-muted-foreground">
                                Saldo do dia: {{ formatCurrencyBR(dia.saldo) }}
                            </span>
                        </div>
                    </div>

                    <!-- Transactions Cards -->
                    <div class="grid gap-1 pl-0 md:pl-14">
                        <div v-for="item in dia.lancamentos" :key="item.id"
                            class="group relative bg-white dark:bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between overflow-hidden">

                            <!-- Left Border Indicator -->
                            <div :class="[
                                'absolute left-0 top-0 bottom-0 w-1',
                                item.tipo === 'RECEITA' ? 'bg-emerald-500' : 'bg-rose-500'
                            ]"></div>

                            <div class="flex items-center gap-4 overflow-hidden">
                                <!-- Icon/Category -->
                                <div :class="[
                                    'flex-shrink-0 w-10 h-10 rounded-full items-center justify-center hidden md:flex',
                                    item.tipo === 'RECEITA' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'
                                ]">
                                    <TrendingUp v-if="item.tipo === 'RECEITA'" class="w-5 h-5" />
                                    <TrendingDown v-else class="w-5 h-5" />
                                </div>

                                <!-- Details -->
                                <div class="flex flex-col min-w-0">
                                    <span class="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                                        {{ item.descricao }}
                                    </span>
                                    <span class="text-xs text-muted-foreground truncate">
                                        {{ item.categoria }}
                                    </span>
                                </div>
                            </div>

                            <!-- Right Side -->
                            <div class="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-4">
                                <div class="flex flex-col items-end">
                                    <span :class="[
                                        'text-xs',
                                        item.tipo === 'RECEITA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    ]">
                                        {{ item.tipo === 'DESPESA' ? '-' : '+' }}{{ formatCurrencyBR(item.valor) }}
                                    </span>
                                    <Badge :variant="item.status === 'PAGO' ? 'default' : 'outline'" :class="[
                                        'text-[10px] px-1.5 py-0 h-5 text-normal border-none',
                                        item.status === 'PAGO'
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                                            : 'text-yellow-600 border-yellow-200 dark:text-yellow-500'
                                    ]">
                                        {{ item.status === 'PAGO' ? 'Pago' : 'Pendente' }}
                                    </Badge>
                                </div>

                                <!-- Actions Menu -->
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="outline" size="icon"
                                            class="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <MoreVertical class="w-4 h-4 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" class="w-40">
                                        <RouterLink :to="`/financeiro/detalhes?id=${item.id}`">
                                            <DropdownMenuItem>
                                                <Info class="w-4 h-4 mr-2 text-blue-600" />
                                                Detalhes
                                            </DropdownMenuItem>
                                        </RouterLink>
                                        <DropdownMenuItem @click="editarParcela(item, dia.dia)">
                                            <Edit class="w-4 h-4 mr-2" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-if="item.status !== 'PAGO'"
                                            @click="efetivarParcela(item.parcelaId)">
                                            <CheckCircle2 class="w-4 h-4 mr-2 text-emerald-600" />
                                            Efetivar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-else @click="estornarParcela(item.parcelaId)">
                                            <Undo2 class="w-4 h-4 mr-2 text-yellow-600" />
                                            Estornar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Bottom Navigation -->
        <div v-if="uiStore.isMobile"
            class="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border z-10 pb-safe">
            <div class="flex items-center justify-around h-16 px-2">
                <button @click="goTo('/financeiro/lancamentos')"
                    class="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors">
                    <Home class="w-5 h-5" />
                    <span class="text-[10px] font-medium">Início</span>
                </button>

                <button @click="openModalLancar = true" class="flex flex-col items-center justify-center -mt-6">
                    <div
                        class="w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform">
                        <Plus class="w-6 h-6 text-white" />
                    </div>
                    <span class="text-[10px] font-medium mt-1 text-primary">Novo</span>
                </button>

                <button @click="goBack"
                    class="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors">
                    <Undo2 class="w-5 h-5" />
                    <span class="text-[10px] font-medium">Voltar</span>
                </button>
            </div>
        </div>

        <!-- Modals -->
        <ModalView v-model:open="openModalLancar" title="Novo Lançamento" size="sm">
            <div class="grid grid-cols-2 gap-4 p-4">
                <button @click="openByTipo('RECEITA')"
                    class="flex flex-col items-center justify-center p-4 rounded-xl border bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 transition-all group">
                    <div
                        class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <TrendingUp class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span class="font-medium text-emerald-900 dark:text-emerald-100">Receita</span>
                </button>

                <button @click="openByTipo('DESPESA')"
                    class="flex flex-col items-center justify-center p-4 rounded-xl border bg-rose-50 hover:bg-rose-100 hover:border-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 transition-all group">
                    <div
                        class="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <TrendingDown class="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span class="font-medium text-rose-900 dark:text-rose-100">Despesa</span>
                </button>
            </div>
        </ModalView>

        <FormularioEfertivar @success="carregarLancamentos" />
        <ModalParcela />
        <LancamentoModal />
        <ClientesModal />
    </div>
</template>

<style scoped>
.pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
}
</style>
