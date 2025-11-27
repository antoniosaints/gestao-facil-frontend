<script setup lang="ts">
import { addDays, addHours, format, isSameDay, isSameHour, isWithinInterval, startOfDay, subDays } from "date-fns"
import { ArrowBigLeft, ArrowBigRight, Plus } from "lucide-vue-next";
import { computed, inject, ref } from "vue";
import { ptBR } from "date-fns/locale";
import { formatToCapitalize } from "@/utils/formatters";
import type { ArenaAgendamentos } from "@/types/schemas";
import { Button } from "@/components/ui/button";

const selectedDate = ref(inject("selectedDate", new Date()))
const props = defineProps<{ eventos: ArenaAgendamentos[] }>()
const eventosHoje = computed(() =>
    props.eventos.filter(e =>
        format(new Date(e.startAt), "yyyy-MM-dd") === format(selectedDate.value, "yyyy-MM-dd")
    )
)
const inicioDia = computed(() => startOfDay(selectedDate.value))
const horas = computed(() =>
    Array.from({ length: 18 }, (_, i) => addHours(inicioDia.value, i + 6))
)
const changeDay = (type: "prev" | "next") => {
    selectedDate.value = type === "prev" ? subDays(selectedDate.value, 1) : addDays(selectedDate.value, 1)
}

const sameHour = (hour: any) => {
    const now = new Date();
    return (
        isSameDay(hour, new Date()) &&
        now.getHours() === hour.getHours()
    );
}

</script>

<template>

    <div>
        <div class="flex items-center space-x-4 rounded-lg mb-2 justify-between">
            <ArrowBigLeft class="cursor-pointer p-2" :size="35" @click="changeDay('prev')" />
            <div class="flex flex-col items-center">
                <span class="text-sm font-medium text-muted-foreground">{{
                    formatToCapitalize(format(selectedDate, "EEEE",
                        { locale: ptBR }))
                }}</span>
                <h1 class="text-md font-bold">{{ format(selectedDate, "dd/MM/yyyy") }}</h1>
            </div>
            <ArrowBigRight class="cursor-pointer p-2" :size="35" @click="changeDay('next')" />
        </div>
        <div v-for="dateRow in horas" :key="dateRow.toISOString()"
            class="flex items-center space-x-4 p-3 border relative rounded-lg mb-2">
            <span
                class="absolute left-[-.85rem] bg-gray-50 dark:dark:bg-gray-900 border-2 p-1 border-primary rounded-full"
                :class="{ 'bg-primary text-white': sameHour(dateRow) }">
                <ArrowBigRight class="h-4 w-4" />
            </span>
            <div class="text-sm font-medium text-muted-foreground">
                {{ format(dateRow, "HH:mm") }}
            </div>
            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div v-for="ev in eventosHoje.filter(e => isWithinInterval(dateRow, { start: new Date(e.startAt), end: new Date(e.endAt) }))" :key="ev.id"
                    class="px-3 py-2 rounded-xl bg-teal-100 border flex flex-col text-teal-800 dark:bg-teal-800 dark:text-teal-50">
                    <div class="font-medium text-sm truncate">
                        <span class="text-xs bg-teal-200 dark:bg-teal-700 px-1 rounded">{{ ev.Quadra?.name || "Sem quadra" }}</span>
                        {{ ev.Cliente?.nome || "Sem descrição" }}
                    </div>
                    <div class="text-xs">
                        ({{ format(new Date(ev.startAt), "HH:mm") }}
                        -
                        {{ format(new Date(ev.endAt), "HH:mm") }})
                        <span></span>
                    </div>
                    <span class="text-xs">
                        {{ ev.observacoes || "Sem observações" }}
                    </span>
                </div>
            </div>

            <Button variant="outline" size="sm" class="flex-shrink-0" title="Reserva rápida">
                <Plus class="h-4 w-4" />
            </Button>
        </div>
    </div>
</template>
