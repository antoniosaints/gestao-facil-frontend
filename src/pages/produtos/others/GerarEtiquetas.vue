<template>
    <ModalView v-model:open="store.openModalEtiquetas" :title="title" :description="description" size="md">
        <div class="grid items-start gap-4 px-4 ">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <!-- Nome -->
                    <div class="md:col-span-12">
                        <Label for="quantidade"> Quantidade<span class="text-danger">*</span>
                        </Label>
                        <Input id="quantidade" v-model="quantidade" type="number" placeholder="Quantidade"
                            class="w-full dark:file:text-white bg-card py-2 h-auto" />
                    </div>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModalEtiquetas = false">
                    Fechar
                </Button>
                <Button @click="gerarEtiquetas(store.idMutation!)" class="text-white" type="button">
                    <FilePlus />
                    Gerar
                </Button>
            </div>
        </div>
    </ModalView>
</template>

<script lang="ts" setup>
import { Button } from "@/components/ui/button"
import { useProdutoStore } from "@/stores/produtos/useProduto"
import { useToast } from "vue-toastification"
import { ref } from "vue"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ModalView from "@/components/formulario/ModalView.vue"
import { ProdutoRepository } from "@/repositories/produto-repository"
import { FilePlus } from "lucide-vue-next"

const title = ref('Gerar etiquetas')
const description = ref('Informe a quantidade de etiquetas ou deixe em branco para gerar todas as etiquetas')

const store = useProdutoStore()
const toast = useToast()

const quantidade = ref<number | undefined>(undefined)

const gerarEtiquetas = async (id: number) => {
    try {
        await ProdutoRepository.gerarEtiquetas(id, quantidade.value)
        toast.success('Etiquetas geradas com sucesso')
    } catch (error) {
        toast.error('Erro ao gerar as etiquetas')
        console.log(error)
    }
}
</script>