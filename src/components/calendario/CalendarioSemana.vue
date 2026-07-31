<script setup lang="ts">
import type { CalendarEvent } from "@/components/calendario/types";
import { formatToCapitalize } from "@/utils/formatters";
import { startOfWeek, addDays, format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale";
import { ArrowBigLeft, ArrowBigRight } from "lucide-vue-next";
import { computed, inject, ref } from "vue";

const selectedDate = ref(inject("selectedDate", new Date()))
const props = defineProps<{ eventos: CalendarEvent[] }>()
const emit = defineEmits<{ eventClick: [event: CalendarEvent] }>()

// início da semana reativo
const inicioSemana = computed(() =>
    startOfWeek(selectedDate.value, { weekStartsOn: 0 }) // domingo
)

// dias da semana reativo
const diasSemana = computed(() =>
    Array.from({ length: 7 }, (_, i) => addDays(inicioSemana.value, i))
)

// eventos de cada dia
function eventosDoDia(data: Date) {
    const dataStr = format(data, "yyyy-MM-dd")
    return props.eventos.filter(e =>
        format(new Date(e.data), "yyyy-MM-dd") === dataStr
    )
}

function changeWeek(type: "prev" | "next") {
    selectedDate.value = type === "prev"
        ? addDays(selectedDate.value, -7)
        : addDays(selectedDate.value, 7)
}
</script>

<template>
    <div class="flex items-center space-x-4 rounded-lg mb-2 justify-between">
        <ArrowBigLeft class="cursor-pointer p-2" :size="35" @click="changeWeek('prev')" />
        <div class="flex flex-col items-center">
            <h1 class="text-md font-bold">{{ format(inicioSemana, "dd/MM/yyyy") }} até {{ format(addDays(inicioSemana,
                6), "dd/MM/yyyy") }}</h1>
        </div>
        <ArrowBigRight class="cursor-pointer p-2" :size="35" @click="changeWeek('next')" />
    </div>
    <div class="overflow-x-auto pb-2">
        <div class="grid min-w-[840px] grid-cols-7 gap-2">
            <div v-for="dia in diasSemana" :key="dia.toISOString()" class="min-h-32 rounded border p-2 text-sm"
                :class="{ 'bg-slate-200 dark:bg-slate-800': isSameDay(dia, new Date()) }">
                <div>{{ formatToCapitalize(format(dia, "EEE dd/MM", { locale: ptBR })) }}</div>
                <button v-for="ev in eventosDoDia(dia)" :key="ev.id" type="button"
                    class="mt-1 block w-full truncate rounded bg-primary px-1 py-1 text-left text-xs text-white hover:brightness-110"
                    @click="emit('eventClick', ev)">
                    {{ format(new Date(ev.data), "HH:mm") }}
                    {{ ev.descricao || "Sem descrição" }}
                </button>
                <div v-show="!eventosDoDia(dia).length"
                    class="mt-1 truncate rounded bg-gray-100 px-1 py-1 text-xs dark:bg-gray-800">
                    Sem informação
                </div>
            </div>
        </div>
    </div>
</template>
