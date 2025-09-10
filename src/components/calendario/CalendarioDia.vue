<script setup lang="ts">
import { addDays, addHours, format, isSameDay, isSameHour, startOfDay, subDays } from "date-fns"
import { ArrowBigLeft, ArrowBigRight, Plus } from "lucide-vue-next";
import Button from "../ui/button/Button.vue";
import { computed, inject, ref } from "vue";
import { ptBR } from "date-fns/locale";
import { formatToCapitalize } from "@/utils/formatters";

const selectedDate = ref(inject("selectedDate", new Date()))
const props = defineProps<{ eventos: { id: number; titulo: string; data: string, fim: string }[] }>()
const eventosHoje = computed(() =>
    props.eventos.filter(e =>
        format(new Date(e.data), "yyyy-MM-dd") === format(selectedDate.value, "yyyy-MM-dd")
    )
)
const inicioDia = computed(() => startOfDay(selectedDate.value))
const horas = computed(() =>
    Array.from({ length: 11 }, (_, i) => addHours(inicioDia.value, i + 8))
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
        <div v-for="hora in horas" :key="hora.toISOString()"
            class="flex items-center space-x-4 p-3 border relative rounded-lg mb-2">
            <span
                class="absolute left-[-.85rem] bg-gray-50 dark:dark:bg-gray-900 border-2 p-1 border-primary rounded-full"
                :class="{ 'bg-primary text-white': sameHour(hora) }">
                <ArrowBigRight class="h-4 w-4" />
            </span>
            <div class="text-sm font-medium text-muted-foreground">
                {{ format(hora, "HH:mm") }}
            </div>
            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div v-for="ev in eventosHoje.filter(e => isSameHour(new Date(e.data), hora))" :key="ev.id"
                    class="px-3 py-2 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    <div class="font-medium truncate">
                        {{ ev.titulo }}
                    </div>
                    <div class="text-xs">
                        {{ format(new Date(ev.data), "HH:mm") }} -
                        {{ format(new Date(ev.fim), "HH:mm") }}
                    </div>
                </div>
            </div>

            <Button variant="outline" size="sm" class="flex-shrink-0" title="Reserva rápida">
                <Plus class="h-4 w-4" />
            </Button>
        </div>
    </div>
</template>
