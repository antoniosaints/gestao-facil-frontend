<template>
    <div>
        <UseTemplate>
            <form @submit.prevent="submit" class="grid items-start gap-4 px-4 ">
                <div class="bg-background dark:bg-background-dark rounded-md w-full h-full">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <!-- Nome -->
                        <div class="md:col-span-12">
                            <Label for="arquivo_Csv"> Arquivo CSV<span class="text-danger">*</span>
                            </Label>
                            <Input id="arquivo_Csv" accept="text/csv" type="file"
                                class="w-full p-2 dark:file:text-white" />
                        </div>
                        <div class="md:col-span-12 border-t">
                            <Button variant="link" type="button" class="dark:text-blue-600" @click="downloadCSV">
                                <i class="fa-solid fa-download mr-2"></i> Baixar modelo de CSV para importação
                            </Button>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="secondary" @click="isOpen = false">
                        Fechar
                    </Button>
                    <Button class="text-white" type="submit">
                        Registrar
                    </Button>
                </div>
            </form>
        </UseTemplate>

        <Dialog v-if="isDesktop" v-model:open="isOpen">
            <DialogContent class="sm:max-w-[425px] md:max-w-md grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]">
                <DialogHeader class="p-6 pb-0">
                    <DialogTitle>{{ title }}</DialogTitle>
                    <DialogDescription>
                        {{ description }}
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4 overflow-y-auto px-2">
                    <GridForm />
                </div>
            </DialogContent>
        </Dialog>

        <Drawer v-else v-model:open="isOpen">
            <DrawerContent>
                <DrawerHeader class="text-left">
                    <DrawerTitle>{{ title }}</DrawerTitle>
                    <DrawerDescription>
                        {{ description }}
                    </DrawerDescription>
                </DrawerHeader>
                <div class="overflow-y-auto max-h-[calc(100vh-8rem)] mb-6">
                    <GridForm />
                </div>
            </DrawerContent>
        </Drawer>
    </div>
</template>

<script lang="ts" setup>
import { createReusableTemplate, useMediaQuery } from "@vueuse/core"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { useProdutoStore } from "@/stores/produtos/useProduto"
import { useToast } from "vue-toastification"
import { ref } from "vue"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Reuse `form` section
const [UseTemplate, GridForm] = createReusableTemplate()
const isDesktop = useMediaQuery("(min-width: 768px)")
const title = ref('Cadastro em lote')
const description = ref('Faça o Upload do arquivo CSV baixado e preenchido')

const store = useProdutoStore()
const toast = useToast()

const isOpen = defineModel<boolean>({ default: false })

const downloadCSV = async () => {
    try {
        await store.csvDownload()
        toast.success('CSV gerado com sucesso')
    } catch (error) {
        toast.error('Erro ao gerar o CSV')
        console.log(error)
    }
}

async function submit() {
    try {
        if (store.form.id) {
            await store.update(store.form, store.form.id)
            toast.success('Produto atualizado com sucesso')
        } else {
            await store.save(store.form)
            toast.success('Produto salvo com sucesso')
        }
        store.reset()
        store.filters.update = !store.filters.update
        isOpen.value = false
    } catch (error: any) {
        console.log(error)
        const errors = error?.response?.data?.data ? error?.response?.data?.data.map((item: any) => item.message).join('\n') : "Ocorreu um erro ao salvar o produto"
        toast.error(errors)
    }
}

</script>