<script setup lang="ts">
import { computed, inject, ref } from "vue"
import { ArrowBigLeft, ArrowBigRight } from "lucide-vue-next"
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatToCapitalize } from "@/utils/formatters";

const visualizacao = ref<"mes" | "semana" | "dia" | "agenda">(inject("visualizacao", 'mes'))
const props = defineProps<{ eventos: { id: number; titulo: string; data: string, fim: string }[] }>()
const hoje = new Date()

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const currentMonth = ref(inject("selectedDate", new Date()))

const monthStart = computed(() => startOfMonth(currentMonth.value));
const monthEnd = computed(() => endOfMonth(monthStart.value));

const startDate = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 0 }));
const endDate = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 0 }));

const days = computed(() =>
    eachDayOfInterval({ start: startDate.value, end: endDate.value })
);


function eventosDoDia(dia: Date | null) {
    if (!dia) return []
    const dataStr = format(dia, "yyyy-MM-dd")
    return props.eventos.filter(e => format(new Date(e.data), "yyyy-MM-dd") === dataStr)
}

const navigateMonth = (direction: "prev" | "next") => {
    currentMonth.value =
        direction === "prev"
            ? subMonths(currentMonth.value, 1)
            : addMonths(currentMonth.value, 1)
};

const navigateToDay = (dia: Date) => {
    currentMonth.value = dia
    visualizacao.value = 'dia'
}

</script>

<template>
    <div>
        <div class="flex justify-between items-center mb-2">
            <button @click="navigateMonth('prev')">
                <ArrowBigLeft class="w-5 h-5" />
            </button>
            <h2 class="font-bold">{{ formatToCapitalize(format(currentMonth, "MMMM yyyy", { locale: ptBR })) }}</h2>
            <button @click="navigateMonth('next')">
                <ArrowBigRight class="w-5 h-5" />
            </button>
        </div>

        <div class="grid grid-cols-7 text-center text-sm font-medium mb-1">
            <div v-for="d in diasSemana" :key="d">{{ d }}</div>
        </div>

        <div class="grid grid-cols-7 gap-1 text-xs">
            <div v-for="(dia, i) in days" :key="i" @click="navigateToDay(dia)"
                class="h-24 border bg-gray-200 dark:bg-gray-800 rounded cursor-pointer p-2 text-left"
                :class="{ 'bg-white dark:bg-gray-950': isSameMonth(dia, currentMonth), 'bg-blue-200 dark:bg-slate-900': isSameDay(dia, hoje) }">
                <div class="font-semibold">{{ format(dia, "dd") }}</div>
                <div v-for="ev in eventosDoDia(dia).slice(0, 2)" :key="ev.id"
                    class="mt-1 bg-primary text-white truncate px-1 rounded">
                    {{ format(new Date(ev.data), "HH:mm") }}
                    {{ ev.titulo }}
                </div>
                <div v-if="eventosDoDia(dia).length > 2" class="text-xs text-gray-500 dark:text-gray-300 ">
                    {{ eventosDoDia(dia).length - 2 }} mais ...
                </div>
            </div>
        </div>
    </div>
</template>
