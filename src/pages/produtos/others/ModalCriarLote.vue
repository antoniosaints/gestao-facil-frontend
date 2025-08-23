<template>
    <ModalView v-model:open="openModal" :title="title" :description="description" size="md">
        <form @submit.prevent="submit" class="grid items-start gap-4 px-4 ">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <!-- Nome -->
                    <div class="md:col-span-12">
                        <Label for="arquivo_Csv"> Arquivo CSV<span class="text-danger">*</span>
                        </Label>
                        <Input ref="file" id="arquivo_Csv" @change="onFileChange" required accept="text/csv" type="file"
                            class="w-full dark:file:text-white bg-card py-2 h-auto" />
                    </div>
                    <div class="md:col-span-12 border-t">
                        <Button variant="link" type="button" class="dark:text-blue-500" @click="downloadCSV">
                            <i class="fa-solid fa-download mr-2"></i> Baixar modelo de CSV para importação
                        </Button>
                    </div>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="openModal = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>

<script lang="ts" setup>
import { Button } from "@/components/ui/button"
import { useProdutoStore } from "@/stores/produtos/useProduto"
import { useToast } from "vue-toastification"
import { inject, ref } from "vue"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ModalView from "@/components/formulario/ModalView.vue"

const title = ref('Cadastro em lote')
const description = ref('Faça o Upload do arquivo CSV baixado e preenchido')

const store = useProdutoStore()
const toast = useToast()

const openModal = inject('modalCsv', ref(false))

const downloadCSV = async () => {
    try {
        await store.csvDownload()
        toast.success('CSV gerado com sucesso')
    } catch (error) {
        toast.error('Erro ao gerar o CSV')
        console.log(error)
    }
}

const file = ref<File | null>(null)

const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        file.value = target.files[0]
    }
}


async function submit() {
    if (!file.value) {
        toast.error('Selecione um arquivo CSV')
        return
    }

    try {
        await store.sendCsvUpload(file.value)
        toast.success('Remessa de produtos criada com sucesso')
        store.updateTable()
        openModal.value = false
    } catch (error: any) {
        console.log(error)
        toast.error('Erro ao criar a remessa de produtos')
    }
}
</script>