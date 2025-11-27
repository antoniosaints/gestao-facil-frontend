<script setup lang="ts">
import { addDays, addHours, addMinutes, format, isSameDay, isSameHour, isWithinInterval, startOfDay, subDays, subMinutes } from "date-fns"
import { ArrowBigLeft, ArrowBigRight, Plus, Ticket } from "lucide-vue-next";
import { computed, inject, ref } from "vue";
import { ptBR } from "date-fns/locale";
import { formatToCapitalize } from "@/utils/formatters";
import type { ArenaAgendamentos } from "@/types/schemas";
import { Button } from "@/components/ui/button";
import { useReservaStore } from "@/stores/arena/reservaStore";

const store = useReservaStore()
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
            class="flex items-center space-x-4 px-2 py-1 border relative rounded-lg mb-2"
            :class="{ 'border-primary': sameHour(dateRow) }">
            <span v-if="sameHour(dateRow)"
                class="absolute left-[-.85rem] bg-gray-50 dark:dark:bg-gray-900 border p-1 border-primary rounded-full">
                <ArrowBigRight class="h-4 w-4" />
            </span>
            <div class="text-sm font-medium text-muted-foreground" :class="{ 'text-primary': sameHour(dateRow) }">
                {{ format(dateRow, "HH:mm") }}
            </div>
            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div
                    v-if="!eventosHoje.filter(e => isWithinInterval(addMinutes(dateRow, 1), { start: new Date(e.startAt), end: new Date(e.endAt) })).length">
                    <div class="flex items-center rounded-md bg-secondary/20 border py-1 px-2">
                        <div class="text-center">
                            <p class="text-gray-500 text-xs dark:text-gray-300">Nenhuma reserva aqui.</p>
                        </div>
                    </div>
                </div>
                <div v-for="ev in eventosHoje.filter(e => isWithinInterval(addMinutes(dateRow, 1), { start: new Date(e.startAt), end: new Date(e.endAt) }))"
                    :key="ev.id" class="px-3 py-2 rounded-xl border flex flex-col" :class="{
                        'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-50': ev.status === 'CONFIRMADA',
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-50': ev.status === 'PENDENTE',
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-50': ev.status === 'FINALIZADA',
                    }">
                    <div class="font-medium text-sm truncate">
                        <span class="text-xs px-1 rounded" :class="{
                            'bg-teal-200 dark:bg-teal-900': ev.status === 'CONFIRMADA',
                            'bg-yellow-200 dark:bg-yellow-900': ev.status === 'PENDENTE',
                            'bg-blue-200 dark:bg-blue-900': ev.status === 'FINALIZADA',
                        }">{{ ev.Quadra?.name || "Sem quadra" }}</span>
                        {{ ev.Cliente?.nome || "Sem descrição" }}
                    </div>
                    <div class="text-xs">
                        ({{ format(new Date(ev.startAt), "HH:mm") }}
                        -
                        {{ format(subMinutes(new Date(ev.endAt), 1), "HH:mm") }})
                    </div>
                    <span class="text-xs text-muted-foreground">
                        {{ ev.observacoes || "Sem observações" }}
                    </span>
                </div>
            </div>

            <Button variant="outline" size="sm" class="flex-shrink-0" @click="store.openSave(dateRow.toISOString())"
                title="Reserva rápida">
                <Plus class="h-4 w-4" />
            </Button>
        </div>
    </div>
</template>
