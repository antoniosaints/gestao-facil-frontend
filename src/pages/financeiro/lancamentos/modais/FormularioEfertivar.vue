<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import ModalView from '@/components/formulario/ModalView.vue';
import Select2Ajax from '@/components/formulario/Select2Ajax.vue';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
import type { MetodoPagamentoFinanceiro } from '@/types/schemas';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const store = useLancamentosStore()
const toast = useToast()

interface pagarParcela {
    dataPagamento: Date,
    metodoPagamento: MetodoPagamentoFinanceiro,
    contaPagamento: number | null
}

const data = ref<pagarParcela>({
    dataPagamento: new Date(),
    metodoPagamento: 'PIX',
    contaPagamento: null
})

const emit = defineEmits(['success'])

async function submit() {
    try {
        if (!store.idMutation) return toast.error("Nenhuma parcela selecionada")
        if (!data.value.contaPagamento) return toast.error("Selecione uma conta de pagamento")
        await LancamentosRepository.pagarParcela(store.idMutation, {
            dataPagamento: data.value.dataPagamento.toISOString(),
            metodoPagamento: data.value.metodoPagamento,
            contaPagamento: data.value.contaPagamento
        })
        toast.success("Parcela efetivada com sucesso!")
        store.openModalEfetivar = false
        store.idMutation = null
        store.updateTable()
        emit('success', true)
    } catch (error: any) {
        console.log(error)
        toast.error(error.response.data.message || "Erro ao efetivar a parcela")
    }
}

function closeModal() {
    store.idMutation = null
    store.openModalEfetivar = false
}
</script>

<template>
    <ModalView v-model:open="store.openModalEfetivar" title="Efetivar parcela"
        description="Preencha os dados da nova categoria" size="sm">
        <form @submit.prevent="submit">
            <div class="grid grid-cols-1 gap-2 px-4">
                <div>
                    <label class="block text-sm font-medium mb-1">
                        Data efetivação
                    </label>
                    <Calendarpicker :required="true" :teleport="true" v-model="data.dataPagamento" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">
                        Conta
                    </label>
                    <Select2Ajax id="contasFinanceiroId" v-model="data.contaPagamento"
                        url="lancamentos/contas/select2" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">
                        Método de pagamento
                    </label>
                    <Select v-model="data.metodoPagamento">
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o metodo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PIX">
                                PIX
                            </SelectItem>
                            <SelectItem value="BOLETO">
                                Boleto
                            </SelectItem>
                            <SelectItem value="DINHEIRO">
                                Dinheiro
                            </SelectItem>
                            <SelectItem value="DEBITO">
                                Débito
                            </SelectItem>
                            <SelectItem value="CREDITO">
                                Crédito
                            </SelectItem>
                            <SelectItem value="TRANSFERENCIA">
                                Transferência
                            </SelectItem>
                            <SelectItem value="CHEQUE">
                                Cheque
                            </SelectItem>
                            <SelectItem value="GATEWAY">
                                Gateway
                            </SelectItem>
                            <SelectItem value="OUTRO">
                                Outro
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="flex gap-2 justify-end mt-4">
                    <Button type="button" @click="closeModal" variant="secondary">
                        Fechar
                    </Button>
                    <Button class="bg-blue-500 dark:bg-blue-900 hover:bg-blue-700 dark:text-white">
                        Registrar
                    </Button>
                </div>
            </div>
        </form>
    </ModalView>
</template>