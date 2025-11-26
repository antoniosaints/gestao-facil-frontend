<script setup lang="ts">
import { provide, ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { ArenaAgendamentos } from "@/types/schemas"
import CalendarioMes from "./CalendarioMes.vue"
import CalendarioSemana from "./CalendarioSemana.vue"
import CalendarioDia from "./CalendarioDia.vue"
import CalendarioAgenda from "./CalendarioAgenda.vue"

const visualizacao = ref<"mes" | "semana" | "dia" | "agenda">("mes")
const selectedDate = defineModel("selectedDate", {
    default: new Date(),
})

provide("visualizacao", visualizacao);
provide("selectedDate", selectedDate);

interface Props {
    eventos: ArenaAgendamentos[]
    title: string
    description?: string
}
defineProps<Props>()

</script>

<template>
    <Card class="shadow-md rounded-lg bg-background">
        <CardHeader class="flex justify-between items-center flex-row">
            <CardTitle class="text-lg font-normal flex items-center">
                <div class="flex flex-col">
                    <h1>{{ title }}</h1>
                    <span v-if="description" class="text-sm text-muted-foreground">{{ description }}</span>
                </div>
            </CardTitle>
            <Select v-model="visualizacao">
                <SelectTrigger class="w-[160px]">
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
                :eventos="eventos.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())" />
            <CalendarioSemana v-if="visualizacao === 'semana'"
                :eventos="eventos.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())" />
            <CalendarioDia v-if="visualizacao === 'dia'"
                :eventos="eventos.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())" />
            <CalendarioAgenda v-if="visualizacao === 'agenda'"
                :eventos="eventos.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())" />
        </CardContent>
    </Card>
</template>
