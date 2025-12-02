<script setup lang="ts">
import type { ArenaAgendamentos } from "@/types/schemas";
import { formatToCapitalize } from "@/utils/formatters";
import { startOfWeek, addDays, format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale";
import { ArrowBigLeft, ArrowBigRight, Dot } from "lucide-vue-next";
import { computed, inject, ref } from "vue";

const selectedDate = ref(inject("selectedDate", new Date()))
const props = defineProps<{ eventos: ArenaAgendamentos[] }>()

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
        format(new Date(e.startAt), "yyyy-MM-dd") === dataStr
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
            <h1 class="text-md">{{ format(inicioSemana, "dd/MM/yyyy") }} até {{ format(addDays(inicioSemana,
                6), "dd/MM/yyyy") }}</h1>
        </div>
        <ArrowBigRight class="cursor-pointer p-2" :size="35" @click="changeWeek('next')" />
    </div>
    <div class="grid grid-cols-7 gap-2">

        <div v-for="dia in diasSemana" :key="dia.toISOString()" class="border rounded p-2 text-sm"
            :class="{ 'bg-slate-200 dark:bg-slate-800': isSameDay(dia, new Date()) }">
            <div>{{ formatToCapitalize(format(dia, "EEEEEE dd/MM", { locale: ptBR })) }}</div>
            <div v-for="ev in eventosDoDia(dia)" :key="ev.id"
                class="mt-1 text-xs truncate flex items-center px-1 py-1 gap-1 rounded" :class="{
                    'bg-teal-500 text-teal-50 dark:bg-teal-900 dark:text-teal-50': ev.status === 'CONFIRMADA',
                    'bg-yellow-500 text-yellow-50 dark:bg-yellow-900 dark:text-yellow-50': ev.status === 'PENDENTE',
                    'bg-blue-500 text-blue-50 dark:bg-blue-900 dark:text-blue-50': ev.status === 'FINALIZADA',
                }">
                {{ format(new Date(ev.startAt), "HH:mm") }}
                {{ ev.Cliente?.nome || ev.nomeCliente || "Sem descrição" }}
            </div>
            <div v-show="!eventosDoDia(dia).length"
                class="mt-1 bg-gray-100 dark:bg-gray-800 text-xs truncate px-1 py-1 rounded">
                Sem informação
            </div>
        </div>
    </div>
</template>
