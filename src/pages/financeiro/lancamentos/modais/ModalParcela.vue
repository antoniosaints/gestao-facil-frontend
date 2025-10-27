<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { moneyMaskOptions } from '@/lib/imaska';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
import { vMaska } from 'maska/vue';
import { useToast } from 'vue-toastification';

const toast = useToast()
const store = useLancamentosStore()

async function registrarAlteracao() {
    try {
        if (!store.idMutation) return toast.error('Nenhuma parcela selecionada')
        await LancamentosRepository.atualizarParcela(store.idMutation, {
            vencimento: store.formParcela.vencimento.toISOString(),
            valor: Number(store.formParcela.valor?.toString()?.replace(',', '.'))
        })

        toast.success('Parcela atualizada com sucesso!')
        store.openModalParcela = false
        store.updateTable()
    } catch (error) {
        console.error(error)
        toast.error('Erro ao atualizar a parcela, tente novamente.')
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModalParcela" size="sm" title="Formulario de parcela"
        description="Preencha os campos abaixo">
        <form @submit.prevent="registrarAlteracao" class="grid grid-cols-1 gap-2 px-4">
            <div>
                <Label>Vencimento</Label>
                <Calendarpicker required :teleport="true" v-model="store.formParcela.vencimento" />
            </div>
            <div>
                <Label>Valor</Label>
                <Input type="text" required v-model="(store.formParcela.valor as string)" placeholder="R$ 0,00"
                    v-maska="moneyMaskOptions" />
            </div>
            <div class="flex justify-end gap-2 mt-3">
                <Button variant="default" class="text-white">Registrar</Button>
            </div>
        </form>
    </ModalView>
</template>