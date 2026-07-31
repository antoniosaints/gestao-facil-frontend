<script setup lang="ts">
import type { CalendarEvent } from "@/components/calendario/types";
import { format, startOfDay, addHours, isEqual } from "date-fns"
import { computed, inject, ref } from "vue";

const selectedDate = ref(inject("selectedDate", new Date()))
const props = defineProps<{ eventos: CalendarEvent[] }>()
const emit = defineEmits<{ eventClick: [event: CalendarEvent] }>()

const hoje = computed(() => selectedDate.value)
const inicioDia = computed(() => startOfDay(hoje.value))

// gera lista de horas (08h às 18h por exemplo)
const horas = computed(() => Array.from({ length: 18 }, (_, i) => addHours(inicioDia.value, i + 6)))

function eventosNaHora(hora: Date) {
    return props.eventos.filter(e => {
        const dataEv = new Date(e.data)
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
                    <button v-for="ev in eventosNaHora(hora)" :key="ev.id" type="button"
                        class="rounded-sm bg-primary p-1 text-left text-xs text-white hover:brightness-110"
                        @click="emit('eventClick', ev)">
                        {{ format(new Date(ev.data), "HH:mm") }} -
                        {{ ev.descricao || "Sem descrição" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
