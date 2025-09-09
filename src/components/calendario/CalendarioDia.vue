<script setup lang="ts">
import { addHours, format, isSameHour, startOfDay } from "date-fns"
import { ArrowBigRight, Plus } from "lucide-vue-next";
import Button from "../ui/button/Button.vue";

const props = defineProps<{ eventos: { id: number; titulo: string; data: string, fim: string }[] }>()

const hoje = new Date()
const dataHoje = format(hoje, "yyyy-MM-dd")

const eventosHoje = props.eventos.filter(e => format(e.data, "yyyy-MM-dd") === dataHoje)

const inicioDia = startOfDay(hoje)
const horas = Array.from({ length: 11 }, (_, i) => addHours(inicioDia, i + 8))
</script>

<template>

    <div>
        <div v-for="hora in horas" :key="hora.toISOString()"
            class="flex items-center space-x-4 p-3 border relative rounded-lg mb-2">
            <span
                class="absolute left-[-.85rem] bg-gray-50 dark:dark:bg-gray-900 border-2 p-1 border-primary rounded-full">
                <ArrowBigRight class="h-4 w-4" />
            </span>
            <div class="w-16 text-sm font-medium text-muted-foreground">
                {{ format(hora, "HH:mm") }}
            </div>
            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div v-for="ev in eventosHoje.filter(e => isSameHour(e.data, hora))"
                    class="px-3 py-2 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
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
