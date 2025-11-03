<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue';
import { vMaska } from "maska/vue"
import { moneyMaskOptions } from "@/lib/imaska";
import { useVendasStore } from '@/stores/vendas/useVenda';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const store = useVendasStore();
const toast = useToast();
const propostaPreco = ref<string | null>('')

function getValorTotalCarrinhoCentavos() {
    return store.carrinho.reduce((total: number, item: any) => {
        const sub = Math.round(Number(item.subtotal) * 100); // converte para centavos
        return total + sub;
    }, 0);
}

function proporValorVendaCliente(valorPropostoReais: number) {
    if (!valorPropostoReais) return;

    const valorCarrinhoCentavos = getValorTotalCarrinhoCentavos();
    const valorPropostoCentavos = Math.round(valorPropostoReais * 100);

    if (valorPropostoCentavos >= valorCarrinhoCentavos) {
        store.form.desconto = 0;
        return;
    }

    store.tipoDesconto = "VALOR";
    const descontoCentavos = valorCarrinhoCentavos - valorPropostoCentavos;

    // guarda em reais (duas casas fixas)
    store.form.desconto = Number((descontoCentavos / 100).toFixed(2));
}

function definirValorProporcionalVenda() {
    const valorTratado = propostaPreco.value
        ? parseFloat(propostaPreco.value.replace(",", "."))
        : 0;

    proporValorVendaCliente(valorTratado);
    propostaPreco.value = null;
    store.openModalPropor = false;
    toast.success("Valor da venda proporcionado com sucesso!");
}

</script>

<template>
    <ModalView v-model:open="store.openModalPropor" title="Propor valor" size="sm"
        description="Preencha o valor da venda!">
        <form @submit.prevent="definirValorProporcionalVenda" class="flex flex-col px-4">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full">
                <div class="grid w-full items-center gap-1.5">
                    <Label for="valorProposto">Valor proposto</Label>
                    <Input v-model="(propostaPreco as string)" id="valorProposto" v-maska="moneyMaskOptions" type="text"
                        placeholder="R$ 0,00" />
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModalPropor = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>