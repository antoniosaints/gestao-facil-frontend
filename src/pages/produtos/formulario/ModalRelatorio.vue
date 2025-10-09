<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { FilePlus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'

const store = useProdutoStore()
const toast = useToast()
const ordem = ref<'asc' | 'desc'>("asc")

async function generateRelatorio() {
    try {
        if (!store.idMutation) return toast.error('ID nao informado!')
        await ProdutoRepository.gerarRelatorio(store.idMutation!, ordem.value)
        store.openModalRelatorio = false
        toast.success('Relatorio gerado com sucesso')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao gerar o relatorio')
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModalRelatorio" title="Relatório de Reposição" size="md"
        description="Gerar um relatório de reposição do produto">
        <div class="grid gap-4 px-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-12">
                    <label class="block text-sm font-medium mb-1">
                        Ordenar por data
                    </label>
                    <Select v-model="ordem">
                        <SelectTrigger class="w-full">
                            <SelectValue placeholder="Selecione a ordem" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="desc">Mais antigo > Mais novo</SelectItem>
                                <SelectItem value="asc">Mais novo > Mais antigo</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModalRelatorio = false">
                    Fechar
                </Button>
                <Button @click="generateRelatorio" class="text-white" type="button">
                    <FilePlus />
                    Gerar relatório
                </Button>
            </div>
        </div>
    </ModalView>
</template>
