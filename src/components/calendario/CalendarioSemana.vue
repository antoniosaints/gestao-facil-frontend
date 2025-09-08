<script setup lang="ts">
import { startOfWeek, addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale";

const props = defineProps<{ eventos: { id: number; titulo: string; data: string }[] }>()

const hoje = new Date()
const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 }) // domingo
const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i))

function eventosDoDia(data: Date) {
    const dataStr = format(data, "yyyy-MM-dd")
    return props.eventos.filter(e => format(e.data, "yyyy-MM-dd") === dataStr)
}
</script>

<template>
    <div class="grid grid-cols-7 gap-2">
        <div v-for="dia in diasSemana" :key="dia.toISOString()" class="border rounded p-2 text-sm">
            <div class="font-bold">{{ format(dia, "EEE dd/MM", { locale: ptBR }) }}</div>
            <div v-for="ev in eventosDoDia(dia)" :key="ev.id" class="mt-1 bg-primary truncate text-white px-1 rounded">
                {{ format(new Date(ev.data), "HH:mm") }}
                {{ ev.titulo }}
            </div>
        </div>
    </div>
</template>
