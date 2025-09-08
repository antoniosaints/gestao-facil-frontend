<script setup lang="ts">
import { format } from "date-fns"

const props = defineProps<{ eventos: { id: number; titulo: string; data: string }[] }>()

const hoje = new Date()
const dataHoje = format(hoje, "yyyy-MM-dd")

const eventosHoje = props.eventos.filter(e => format(e.data, "yyyy-MM-dd") === dataHoje)
</script>

<template>
    <div class="border rounded p-4">
        <h3 class="font-bold mb-2">Eventos do dia {{ format(new Date(), "dd/MM/yyyy") }}</h3>
        <div v-if="eventosHoje.length">
            <div v-for="ev in eventosHoje" :key="ev.id" class="mb-1 p-2 bg-primary text-white rounded truncate">
                {{ ev.titulo }}
            </div>
        </div>
        <div v-else class="text-gray-500 text-sm">Nenhuma ordem hoje.</div>
    </div>
</template>
