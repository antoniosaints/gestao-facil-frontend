<script setup lang="ts">
import { ref, onMounted } from "vue"
import { addMonths, format, subMonths } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { LancamentosRepository } from "@/repositories/lancamento-repository"
import { Input } from "@/components/ui/input"
import { formatToCapitalize } from "@/utils/formatters"
import { ptBR } from "date-fns/locale"
import { ArrowBigLeft, ArrowBigRight, CalendarClock } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

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
                    <p class="text-sm px-3 bg-card border py-1 mb-1 rounded-md">{{ format(new Date(dia.dia),
                        "dd/MM/yyyy") }}</p>
                    <div class="flex flex-col gap-2">
                        <div v-for="item in dia.lancamentos" :key="item.id"
                            class="flex flex-col sm:flex-row justify-between py-1 pl-6 gap-2 bg-background border px-3 rounded-md relative">
                            <div v-if="item.tipo === 'RECEITA'"
                                class="absolute left-0 top-0 w-2 h-full rounded-l-md bg-success/90"></div>
                            <div v-else class="absolute left-0 top-0 w-2 h-full rounded-l-md bg-danger/90"></div>
                            <div>
                                <div class="font-medium text-md">{{ item.descricao }}</div>
                                <div class="text-xs text-muted-foreground">
                                    {{ item.categoria }}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {{ item.tipo === 'RECEITA' ? 'Receita' : 'Despesa' }} · {{ item.status }}
                                </div>
                            </div>
                            <div>
                                <div :class="[
                                    'text-right',
                                    item.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'
                                ]">
                                    R$ {{ item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                                </div>
                                <!-- <div class="flex gap-2 mt-2">
                                    <Button variant="default" class="bg-danger hover:bg-danger"
                                        size="sm">Excluir</Button>
                                    <Button variant="default" class="bg-success hover:bg-success"
                                        size="sm">Efetivar</Button>
                                </div> -->
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
