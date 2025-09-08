<script setup lang="ts">
import { provide, ref } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

import CalendarioMes from "@/components/calendario/CalendarioMes.vue"
import CalendarioSemana from "@/components/calendario/CalendarioSemana.vue"
import CalendarioDia from "@/components/calendario/CalendarioDia.vue"
import CalendarioAgenda from "@/components/calendario/CalendarioAgenda.vue"

const visualizacao = ref<"mes" | "semana" | "dia" | "agenda">("mes")

// Exemplo de eventos de ordens com hora
const eventos = [
    { id: 1, titulo: "Troca de tela - Cliente X", data: "2025-09-08T09:30", fim: "2025-09-08T11:00" },
    { id: 6, titulo: "Notebook - Cliente Z", data: "2025-09-08T14:30", fim: "2025-09-08T16:00" },
    { id: 2, titulo: "Manutenção impressora - Cliente Y", data: "2025-09-08T11:00", fim: "2025-09-08T13:00" },
    { id: 3, titulo: "Notebook - Cliente Z", data: "2025-09-08T14:30", fim: "2025-09-08T16:00" },
    { id: 4, titulo: "Backup servidor", data: "2025-09-08T16:00", fim: "2025-09-08T18:00" },
]

provide("visualizacao", visualizacao)
</script>

<template>
    <Card class="shadow-md rounded-lg bg-background">
        <CardHeader class="flex justify-between items-center flex-row">
            <CardTitle class="text-lg font-semibold">Calendário de Ordens</CardTitle>
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
                :eventos="eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())" />
            <CalendarioSemana v-if="visualizacao === 'semana'"
                :eventos="eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())" />
            <CalendarioDia v-if="visualizacao === 'dia'"
                :eventos="eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())" />
            <CalendarioAgenda v-if="visualizacao === 'agenda'"
                :eventos="eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())" />
        </CardContent>
    </Card>
</template>
