<script setup lang="ts">
import { ref, computed } from "vue"
import { ChevronLeft, ChevronRight } from "lucide-vue-next"
import { format } from "date-fns";

const props = defineProps<{ eventos: { id: number; titulo: string; data: string }[] }>()

const hoje = new Date()
const mesAtual = ref(hoje.getMonth())
const anoAtual = ref(hoje.getFullYear())

const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function gerarCalendario(mes: number, ano: number) {
    const primeiroDia = new Date(ano, mes, 1).getDay()
    const diasNoMes = new Date(ano, mes + 1, 0).getDate()
    const dias = []
    for (let i = 0; i < primeiroDia; i++) dias.push(null)
    for (let d = 1; d <= diasNoMes; d++) dias.push(d)
    return dias
}

const dias = computed(() => gerarCalendario(mesAtual.value, anoAtual.value))

function mesAnterior() {
    mesAtual.value = mesAtual.value === 0 ? 11 : mesAtual.value - 1
    if (mesAtual.value === 11) anoAtual.value--
}
function proximoMes() {
    mesAtual.value = mesAtual.value === 11 ? 0 : mesAtual.value + 1
    if (mesAtual.value === 0) anoAtual.value++
}

function eventosDoDia(dia: number | null) {
    if (!dia) return []
    const dataStr = `${anoAtual.value}-${String(mesAtual.value + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
    return props.eventos.filter(e => format(e.data, "yyyy-MM-dd") === format(new Date(dataStr), "yyyy-MM-dd"))
}
</script>

<template>
    <div>
        <div class="flex justify-between items-center mb-2">
            <button @click="mesAnterior">
                <ChevronLeft class="w-5 h-5" />
            </button>
            <h2 class="font-bold">{{ meses[mesAtual] }} {{ anoAtual }}</h2>
            <button @click="proximoMes">
                <ChevronRight class="w-5 h-5" />
            </button>
        </div>

        <div class="grid grid-cols-7 text-center text-sm font-medium mb-1">
            <div v-for="d in diasSemana" :key="d">{{ d }}</div>
        </div>

        <div class="grid grid-cols-7 gap-1 text-xs">
            <div v-for="(dia, i) in dias" :key="i" class="min-h-[80px] border rounded p-1 text-left">
                <div class="font-semibold">{{ dia }}</div>
                <div v-for="ev in eventosDoDia(dia)" :key="ev.id"
                    class="mt-1 bg-primary truncate text-white px-1 rounded">
                    {{ format(new Date(ev.data), "HH:mm") }}
                    {{ ev.titulo }}
                </div>
            </div>
        </div>
    </div>
</template>
