<script setup lang="ts">
import type { OrdensServico } from "@/types/schemas";
import { format, startOfDay, addHours, isEqual, parseISO } from "date-fns"
import { inject, ref } from "vue";

const selectedDate = ref(inject("selectedDate", new Date()))
const props = defineProps<{ eventos: OrdensServico[] }>()

const hoje = selectedDate.value
const inicioDia = startOfDay(hoje)

// gera lista de horas (08h às 18h por exemplo)
const horas = Array.from({ length: 11 }, (_, i) => addHours(inicioDia, i + 8))

function eventosNaHora(hora: Date) {
    return props.eventos.filter(e => {
        const dataEv = e.data
        return isEqual(
            new Date(dataEv.getFullYear(), dataEv.getMonth(), dataEv.getDate(), dataEv.getHours(), 0),
            hora
        )
    })
}
</script>

<template>
    <div class="rounded">
        <h3 class="font-bold p-2">Agenda do dia {{ format(hoje, "dd/MM/yyyy") }}</h3>
        <div class="divide-y">
            <div v-for="hora in horas" :key="hora.toISOString()" class="flex items-start">
                <!-- Coluna da hora -->
                <div class="w-16 text-right pr-2 text-sm text-gray-600 dark:text-gray-400">
                    {{ format(hora, "HH:mm") }}
                </div>

                <!-- Eventos -->
                <div class="flex flex-col gap-1 min-h-[40px] w-full border-l p-2">
                    <div v-for="ev in eventosNaHora(hora)" :key="ev.id"
                        class="p-1 text-xs bg-primary text-white rounded-sm">
                        {{ format(new Date(ev.data), "HH:mm") }} -
                        {{ ev.descricao || "Sem descrição" }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
