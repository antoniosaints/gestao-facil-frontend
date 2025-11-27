<script setup lang="ts">
import { computed, provide, ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { ArenaAgendamentos } from "@/types/schemas"
import CalendarioMes from "./CalendarioMes.vue"
import CalendarioSemana from "./CalendarioSemana.vue"
import CalendarioDia from "./CalendarioDia.vue"
import CalendarioAgenda from "./CalendarioAgenda.vue"
import Select2Ajax from "@/components/formulario/Select2Ajax.vue"

const visualizacao = ref<"mes" | "semana" | "dia" | "agenda">("mes")
const selectedDate = defineModel("selectedDate", {
    default: new Date(),
})
const arenaIdFilter = ref(null)
const arenaLabel = ref()

provide("visualizacao", visualizacao);
provide("selectedDate", selectedDate);

interface Props {
    eventos: ArenaAgendamentos[]
    title: string
    description?: string
}
const props = defineProps<Props>()

const eventosComputed = computed(() => {
    if (!arenaIdFilter.value) return props.eventos
    return props.eventos.filter(e => e.Quadra?.id === arenaIdFilter.value).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
})

</script>

<template>
    <Card class="shadow-md rounded-lg bg-background">
        <CardHeader class="flex justify-between items-center flex-row">
            <CardTitle class="text-lg font-normal flex items-center">
                <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <span v-show="arenaLabel" class="text-xs bg-teal-500 text-white dark:bg-teal-800 border border-teal-700 px-2 py-0.5 rounded-xl">{{ arenaLabel }}</span>
                        <h1>{{ title }}</h1>
                    </div>
                    <span v-if="description" class="text-sm text-muted-foreground">{{ description }}</span>
                </div>
            </CardTitle>
            <div class="flex gap-2">
                <Select v-model="visualizacao">
                    <SelectTrigger class="w-[160px]">
                        <SelectValue placeholder="Visualização" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mes">Mês</SelectItem>
                        <SelectItem value="semana">Semana</SelectItem>
                        <SelectItem value="dia">Dia</SelectItem>
                        <SelectItem value="agenda">Agenda</SelectItem>
                    </SelectContent>
                </Select>
                <Select2Ajax class="col-span-12 md:col-span-3"
                v-model="arenaIdFilter" url="/arenas/quadras/select2" placeholder="Quadra.." v-model:label="arenaLabel" :allow-clear="true" />
            </div>
        </CardHeader>

        <CardContent>
            <CalendarioMes v-if="visualizacao === 'mes'"
                :eventos="eventosComputed" />
            <CalendarioSemana v-if="visualizacao === 'semana'"
                :eventos="eventosComputed" />
            <CalendarioDia v-if="visualizacao === 'dia'"
                :eventos="eventosComputed" />
            <CalendarioAgenda v-if="visualizacao === 'agenda'"
                :eventos="eventosComputed" />
        </CardContent>
    </Card>
</template>
