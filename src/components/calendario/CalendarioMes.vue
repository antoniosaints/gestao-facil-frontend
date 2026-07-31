<script setup lang="ts">
import { computed, inject, ref } from "vue"
import { ArrowBigLeft, ArrowBigRight } from "lucide-vue-next"
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatToCapitalize } from "@/utils/formatters";
import type { CalendarEvent } from "@/components/calendario/types";

const visualizacao = ref<"mes" | "semana" | "dia" | "agenda">(inject("visualizacao", 'mes'))
const props = defineProps<{ eventos: CalendarEvent[] }>()
const emit = defineEmits<{ eventClick: [event: CalendarEvent] }>()
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

        <div class="overflow-x-auto pb-2">
            <div class="min-w-[700px]">
                <div class="mb-1 grid grid-cols-7 text-center text-sm font-medium">
                    <div v-for="d in diasSemana" :key="d">{{ d }}</div>
                </div>

                <div class="grid grid-cols-7 gap-1 text-xs">
                    <div v-for="(dia, i) in days" :key="i" @click="navigateToDay(dia)"
                        class="h-24 cursor-pointer rounded border bg-gray-200 p-2 text-left dark:bg-gray-800"
                        :class="{ 'bg-white dark:bg-gray-950': isSameMonth(dia, currentMonth), 'bg-blue-200 dark:bg-slate-900': isSameDay(dia, hoje) }">
                        <div class="font-semibold">{{ format(dia, "dd") }}</div>
                        <button v-for="ev in eventosDoDia(dia).slice(0, 2)" :key="ev.id" type="button"
                            class="mt-1 block w-full truncate rounded bg-primary px-1 text-left text-white hover:brightness-110"
                            @click.stop="emit('eventClick', ev)">
                            {{ format(new Date(ev.data), "HH:mm") }}
                            {{ ev.descricao || "Sem descrição" }}
                        </button>
                        <div v-if="eventosDoDia(dia).length > 2" class="text-xs text-gray-500 dark:text-gray-300 ">
                            {{ eventosDoDia(dia).length - 2 }} mais ...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
