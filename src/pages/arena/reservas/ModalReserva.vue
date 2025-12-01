<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import ModalView from '@/components/formulario/ModalView.vue';
import Select2Ajax from '@/components/formulario/Select2Ajax.vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArenaReservasRepository } from '@/repositories/reservas-repository';
import { useReservaStore } from '@/stores/arena/reservaStore';
import { useClientesStore } from '@/stores/clientes/useClientes';
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarClock } from 'lucide-vue-next';
import { computed } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

const toast = useToast()
const store = useReservaStore()
const storeCliente = useClientesStore()
const dateBase = computed(() => store.form.startAt ? new Date(store.form.startAt) : new Date())

const hours = computed(() => {
    if (!dateBase.value) return []
    const base = dateBase.value

    const list: Date[] = []
    for (let h = 6; h <= 23; h++) {
        list.push(setMinutes(setHours(base, h), 0))
    }
    return list
})

const filteredEndHours = computed(() => {
    if (!store.form.startAt) return hours.value
    return hours.value.filter(h => h > new Date(store.form.startAt!))
})

async function submit() {
    try {
        const payload = {
            ...store.form,
            clienteId: store.form.clienteId ?? undefined,
            inicio: format(store.form.startAt, "yyyy-MM-dd'T'HH:mm:ss", { locale: ptBR }),
            fim: format(store.form.endAt, "yyyy-MM-dd'T'HH:mm:ss", { locale: ptBR })
        }
        store.form.id
            ? await ArenaReservasRepository.update(store.form.id, payload)
            : await ArenaReservasRepository.save(payload)
        toast.success(store.form.id ? 'Quadra atualizada com sucesso!' : 'Quadra salva com sucesso!')
        store.openModal = false
        store.updateTable()
        store.reset()
    } catch (error: any) {
        console.log(error);
        toast.error(error?.response?.data?.message ?? 'Erro ao registrar a quadra!')
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModal" :icon="CalendarClock" title="Reserva"
        description="Preencha os dados da reserva" size="md">
        <form @submit.prevent="submit" class="flex flex-col px-4">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full grid grid-cols-2 gap-2">
                <div class="w-full gap-1 flex flex-col col-span-2">
                    <Label for="nome" class="flex items-center gap-2">Cliente <span
                            class="text-blue-500 text-xs cursor-pointer" @click="storeCliente.openSave">+ Novo
                            cliente</span>
                    </Label>
                    <Select2Ajax placeholder="Selecione o cliente" :url="'/clientes/select2'"
                        v-model:model-value="store.form.clienteId" :allowClear="true" />
                </div>
                <div class="w-full gap-1 flex flex-col">
                    <Label for="quadraReserva">Quadra</Label>
                    <Select2Ajax id="quadraReserva" class="col-span-12 md:col-span-3" v-model="store.form.quadraId"
                        url="/arenas/quadras/select2" />
                </div>
                <div class="w-full gap-1 flex flex-col">
                    <Label for="diaAgendamento">Data da reserva</Label>
                    <Calendarpicker id="diaAgendamento" v-model="dateBase" required :teleport="true" />
                </div>
                <div class="w-full gap-1 flex flex-col">
                    <Label for="inicioAgendamento">Inicia</Label>
                    <Select id="inicioAgendamento" v-model="store.form.startAt">
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="h in hours" :key="h.toISOString()" :value="h.toISOString()">
                                {{ format(h, "HH:mm", { locale: ptBR }) }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="w-full gap-1 flex flex-col">
                    <Label for="fimAgendamento">Termina</Label>
                    <Select id="fimAgendamento" v-model="store.form.endAt">
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="h in filteredEndHours" :key="h.toISOString()" :value="h.toISOString()">
                                {{ format(h, "HH:mm", { locale: ptBR }) }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <!-- <div class="w-full gap-2 flex flex-col">
                    <Label for="recorrenteReserva">Recorrente</Label>
                    <Label for="recorrenteReserva"
                        class="flex items-center border bg-card cursor-pointer rounded-md py-2 px-3 gap-2">
                        <Switch id="recorrenteReserva" v-model="store.form.recorrente" />
                        <Label for="recorrenteReserva">{{ store.form.recorrente ? 'Sim' : 'Não' }}</Label>
                    </Label>
                </div> -->
                <div class="w-full gap-1 flex flex-col col-span-2">
                    <Label for="observacaoReserva">Observação</Label>
                    <Textarea id="observacaoReserva" v-model="(store.form.observacoes as string)"
                        placeholder="Observação" />
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModal = false"> Fechar </Button>
                <Button class="text-white" type="submit"> Registrar </Button>
            </div>
        </form>
    </ModalView>
</template>