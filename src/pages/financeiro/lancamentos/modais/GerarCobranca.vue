<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { FilePlus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'

const store = useLancamentosStore()
const toast = useToast()
const gateway = ref<'mercadopago' | 'pagseguro' | 'asaas' | undefined>()
const criterio = ref<'pendente' | 'pago' | 'total'>('pendente')

async function gerarCobrancaLancamento() {
    try {
        if (!gateway.value) return toast.error('Gateway de pagamento nao informado!')
        if (!store.idMutation) return toast.error('ID nao informado!')
        store.openModalCobranca = false
        toast.success('Relatorio gerado com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao gerar o relatorio')
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModalCobranca" title="Gerar cobrança" size="lg"
        description="Gerar uma cobrança de pagamento (Em desenvolvimento)">
        <div class="grid gap-4 px-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-6">
                    <label class="block text-sm font-medium mb-1">
                        Gateway
                    </label>
                    <Select v-model="gateway">
                        <SelectTrigger class="w-full">
                            <SelectValue placeholder="Selecione o gateway" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="mercadopago" disabled>Mercado pago</SelectItem>
                                <SelectItem value="asaas" disabled>Asaas</SelectItem>
                                <SelectItem value="pagseguro" disabled>Pagseguro</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <div class="md:col-span-6">
                    <label class="block text-sm font-medium mb-1">
                        Critério
                    </label>
                    <Select v-model="criterio">
                        <SelectTrigger class="w-full">
                            <SelectValue placeholder="Filtre o valor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="pendente">Total pendente</SelectItem>
                                <SelectItem value="pago">Total pago</SelectItem>
                                <SelectItem value="total">Total fatura</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModalCobranca = false">
                    Fechar
                </Button>
                <Button @click="gerarCobrancaLancamento" class="text-white" type="button">
                    <FilePlus />
                    Gerar cobrança
                </Button>
            </div>
        </div>
    </ModalView>
</template>
