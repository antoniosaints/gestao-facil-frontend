<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { moneyMaskOptions } from '@/lib/imaska';
import { ArenaQuadrasRepository } from '@/repositories/quadras-repository';
import { useQuadraStore } from '@/stores/arena/quadraStore';
import { MapPinned } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { POSITION, TYPE, useToast } from 'vue-toastification';

const toast = useToast()
const store = useQuadraStore()
async function submit() {
    try {
        const toastId = toast.info('Salvando quadra...', {
            timeout: false,
            position: POSITION.BOTTOM_CENTER
        })
        store.form.id
            ? await ArenaQuadrasRepository.update(store.form.id, store.form)
            : await ArenaQuadrasRepository.save(store.form)
        toast.update(toastId, {
            content: store.form.id ? 'Quadra atualizada com sucesso!' : 'Quadra salva com sucesso!',
            options: {
                type: TYPE.SUCCESS,
                timeout: 3000
            }
        })
        store.openModal = false
        store.updateTable()
        store.reset()
    } catch (error) {
        console.log(error);
        toast.error('Erro ao registrar a quadra!')
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModal" :icon="MapPinned" title="Quadra" description="Preencha os dados da quadra"
        size="lg">
        <form @submit.prevent="submit" class="flex flex-col px-4">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full grid grid-cols-2 gap-4">
                <div class="w-full gap-2 flex flex-col col-span-2">
                    <Label for="nome">Nome da quadra</Label>
                    <Input id="nome" v-model="store.form.name" required placeholder="Nome" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="precoHora">Preço por hora</Label>
                    <Input id="precoHora" v-maska="moneyMaskOptions" v-model="store.form.precoHora" required
                        placeholder="R$ 0,00" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="tempoMinimo">Tempo mínimo</Label>
                    <Input id="tempoMinimo" type="number" v-model="store.form.tempoMinimo" placeholder="60" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="tempoReserva">Tempo reserva</Label>
                    <Input id="tempoReserva" type="number" v-model="store.form.tempoReserva" placeholder="60" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="status">Status</Label>
                    <Label for="status"
                        class="flex items-center border bg-card cursor-pointer rounded-md py-2 px-3 gap-2">
                        <Switch id="status" v-model="store.form.active" />
                        <Label for="status">{{ store.form.active ? 'Ativa' : 'Inativa' }}</Label>
                    </Label>
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="agendamentoOnline">Permitir online</Label>
                    <Label for="agendamentoOnline"
                        class="flex items-center cursor-pointer border bg-card rounded-md py-2 px-3 gap-2">
                        <Switch id="agendamentoOnline" v-model="store.form.permitirReservaOnline" />
                        <Label for="agendamentoOnline">{{ store.form.permitirReservaOnline ? 'Sim' : 'Não' }}</Label>
                    </Label>
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="agendamentoSemPagamento">Pagamento online</Label>
                    <Label for="agendamentoSemPagamento"
                        class="flex items-center cursor-pointer border bg-card rounded-md py-2 px-3 gap-2">
                        <Switch id="agendamentoSemPagamento" v-model="store.form.aprovarSemPagamento" />
                        <Label for="agendamentoSemPagamento">{{ store.form.aprovarSemPagamento ? 'Sim' : 'Não'
                        }}</Label>
                    </Label>
                </div>
                <div class="w-full gap-2 flex flex-col col-span-2">
                    <Label for="descricaoQuadra">Descrição</Label>
                    <Textarea id="descricaoQuadra" v-model="(store.form.description as string)"
                        placeholder="Observações" />
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModal = false"> Fechar </Button>
                <Button class="text-white" type="submit"> Registrar </Button>
            </div>
        </form>
    </ModalView>
</template>