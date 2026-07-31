<script setup lang="ts">
import { provide, ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

import CalendarioMes from "@/components/calendario/CalendarioMes.vue"
import CalendarioSemana from "@/components/calendario/CalendarioSemana.vue"
import CalendarioDia from "@/components/calendario/CalendarioDia.vue"
import CalendarioAgenda from "@/components/calendario/CalendarioAgenda.vue"
import type { CalendarEvent } from "@/components/calendario/types"

const visualizacao = ref<"mes" | "semana" | "dia" | "agenda">("mes")
const selectedDate = defineModel("selectedDate", {
    default: new Date(),
})

provide("visualizacao", visualizacao);
provide("selectedDate", selectedDate);

interface Props {
    eventos: CalendarEvent[]
    title: string
    description?: string
}
defineProps<Props>()
const emit = defineEmits<{
    eventClick: [event: CalendarEvent]
    createEvent: [date: Date]
}>()

</script>

<template>
    <Card class="shadow-md rounded-lg bg-background">
        <CardHeader class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <CardTitle class="text-lg font-normal flex items-center">
                <div class="flex flex-col">
                    <h1>{{ title }}</h1>
                    <span v-if="description" class="text-sm text-muted-foreground">{{ description }}</span>
                </div>
            </CardTitle>
            <Select v-model="visualizacao">
                <SelectTrigger class="w-full sm:w-[160px]">
                    <SelectValue placeholder="Visualização" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="mes">Mês</SelectItem>
                    <SelectItem value="semana">Semana</SelectItem>
                    <SelectItem value="dia">Dia</SelectItem>
                    <SelectItem value="agenda">Agenda (horas)</SelectItem>
                </SelectContent>
            </Select>
        </CardHeader>

        <CardContent>
            <CalendarioMes v-if="visualizacao === 'mes'"
                :eventos="[...eventos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())"
                @event-click="emit('eventClick', $event)" />
            <CalendarioSemana v-if="visualizacao === 'semana'"
                :eventos="[...eventos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())"
                @event-click="emit('eventClick', $event)" />
            <CalendarioDia v-if="visualizacao === 'dia'"
                :eventos="[...eventos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())"
                @event-click="emit('eventClick', $event)"
                @create-event="emit('createEvent', $event)" />
            <CalendarioAgenda v-if="visualizacao === 'agenda'"
                :eventos="[...eventos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())"
                @event-click="emit('eventClick', $event)" />
        </CardContent>
    </Card>
</template>
