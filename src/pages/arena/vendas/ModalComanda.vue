<script setup lang="ts">
import ModalView from "@/components/formulario/ModalView.vue";
import { Button } from "@/components/ui/button";
import { useVendasStore } from "@/stores/vendas/useVenda";
import { ref } from "vue";
import { POSITION, useToast } from "vue-toastification";
import { useUiStore } from "@/stores/ui/uiStore";
import { useComandaStore } from "@/stores/arena/comandaStore";
import { Input } from "@/components/ui/input";

const description = ref('Preencha os campos abaixo')
const toast = useToast()
const store = useVendasStore()
const storeComanda = useComandaStore()
const storeUi = useUiStore()

async function submit() {
    const hasId = store.form.id;

    try {

    } catch (error: any) {
        console.log(error);
        const msg = error?.response?.data?.message || 'Ocorreu um erro ao registrar os ítens';
        toast.error(msg, { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
    }
}

</script>

<template>
    <ModalView v-model:open="storeComanda.openModal" :title="storeComanda.form.id ? 'Editar comanda' : 'Nova comanda'"
        :description="description" size="2xl">
        <form @submit.prevent="submit" class="space-y-4 px-4">
            <div class="grid grid-cols-12 gap-2">
                <div class="col-span-6">
                    <Label>Cliente</Label>
                    <Input type="text" v-model="(storeComanda.form.observacao as string)" placeholder="Observação" />
                </div>
                <div class="col-span-6">
                    <Label>Local</Label>
                    <Input type="text" v-model="(storeComanda.form.observacao as string)" placeholder="Observação" />
                </div>
                <div class="col-span-12">
                    <Label>Observação</Label>
                    <Input type="text" v-model="(storeComanda.form.observacao as string)" placeholder="Observação" />
                </div>
            </div>
            <div class="flex justify-end gap-2">
                <Button type="button" variant="secondary" @click="storeComanda.openModal = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>
