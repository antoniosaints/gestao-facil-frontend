<template>
    <ModalView v-model:open="store.openModalRelatorioGeral" :title="title" :description="description" size="md">
        <form @submit.prevent="submit" class="grid items-start gap-4 px-4 ">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <!-- Nome -->
                    <div class="md:col-span-12">
                        <Label for="desde_data"> Desde a data
                        </Label>
                        <Calendarpicker :required="false" :teleport="true" />
                    </div>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModalRelatorioGeral = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    <FilePlus />
                    Gerar
                </Button>
            </div>
        </form>
    </ModalView>
</template>

<script lang="ts" setup>
import { Button } from "@/components/ui/button"
import { useProdutoStore } from "@/stores/produtos/useProduto"
import { useToast } from "vue-toastification"
import { ref } from "vue"
import { Label } from "@/components/ui/label"
import ModalView from "@/components/formulario/ModalView.vue"
import { ProdutoRepository } from "@/repositories/produto-repository"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import { FilePlus } from "lucide-vue-next"

const title = ref('Gerar relatório de produtos')
const description = ref('Gerar um relatório de produtos com estoque e preços')

const store = useProdutoStore()
const toast = useToast()


async function submit() {
    try {
        await ProdutoRepository.gerarRelatorioGeral()
        toast.success('Relatório geral gerado com sucesso')
        store.updateTable()
        store.openModalRelatorioGeral = false
    } catch (error: any) {
        console.log(error)
        toast.error('Erro ao criar ao gerar, tente novamente.')
    }
}
</script>