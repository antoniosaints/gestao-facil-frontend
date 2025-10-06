<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { vMaska } from "maska/vue"
import { moneyMaskOptions } from '@/lib/imaska'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { formatToNumberValue } from '@/utils/formatters'

const store = useProdutoStore()
const toast = useToast()

const formulario = ref({
    quantidade: 0,
    clienteFornecedor: undefined,
    custo: '',
    data: new Date().toISOString().slice(0, 10),
    desconto: '',
    frete: '',
    notaFiscal: ''
})

async function submit() {
    try {
        if (!store.idMutation) return toast.error('ID não informado!')
        await ProdutoRepository.repor({
            produtoId: store.idMutation,
            custo: formatToNumberValue(formulario.value.custo),
            quantidade: formulario.value.quantidade,
            clienteFornecedor: formulario.value.clienteFornecedor,
            data: formulario.value.data,
            desconto: formatToNumberValue(formulario.value.desconto),
            frete: formatToNumberValue(formulario.value.frete),
            notaFiscal: formulario.value.notaFiscal,
        })
        toast.success('Reposição de produto registrada!')
        store.updateTable()
        store.openModalReposicao = false
    } catch (error: any) {
        console.error(error)
        toast.error('Erro ao realizar a reposição de produto!')
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModalReposicao" title="Reposição de Produto" size="lg"
        description="Registrar nova reposição no estoque">
        <form @submit.prevent="submit" class="grid gap-4 px-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <!-- Quantidade -->
                <div class="md:col-span-6">
                    <label class="block text-sm font-medium mb-1">
                        Quantidade <span class="text-red-500">*</span>
                    </label>
                    <Input type="number" v-model.number="formulario.quantidade" placeholder="Ex: 50" required />
                </div>

                <!-- Custo -->
                <div class="md:col-span-6">
                    <label class="block text-sm font-medium mb-1">Custo (R$)</label>
                    <Input type="text" v-maska="moneyMaskOptions" v-model="formulario.custo" placeholder="Ex: 12.50" />
                </div>

                <!-- Cliente / Fornecedor -->
                <div class="md:col-span-6">
                    <label class="block text-sm font-medium mb-1">
                        Fornecedor
                    </label>
                    <Select2Ajax :url="'/clientes/select2'" :params="[{ key: 'fornecedor', value: true }]"
                        v-model:model-value="formulario.clienteFornecedor" :allowClear="true" />
                </div>


                <!-- Data -->
                <div class="md:col-span-6">
                    <label class="block text-sm font-medium mb-1">Data</label>
                    <Calendarpicker v-model="formulario.data" :teleport="true" />
                </div>

                <!-- Desconto -->
                <div class="md:col-span-6">
                    <label class="block text-sm font-medium mb-1">Desconto (R$)</label>
                    <Input type="text" v-maska="moneyMaskOptions" v-model="formulario.desconto"
                        placeholder="Ex: 5.00" />
                </div>

                <!-- Frete -->
                <div class="md:col-span-6">
                    <label class="block text-sm font-medium mb-1">Frete (R$)</label>
                    <Input type="text" v-maska="moneyMaskOptions" v-model="formulario.frete" placeholder="Ex: 10.00" />
                </div>

                <!-- Nota Fiscal -->
                <div class="md:col-span-12">
                    <label class="block text-sm font-medium mb-1">Nota Fiscal</label>
                    <Input type="text" v-model="formulario.notaFiscal" placeholder="Número da nota fiscal" />
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModalReposicao = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>
