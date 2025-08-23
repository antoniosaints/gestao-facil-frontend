<template>
    <ModalView v-model:open="openModal" :title="title" :description="description" size="md">
        <form @submit.prevent="submit" class="grid items-start gap-4 px-4 ">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="grid w-full max-w-sm items-center gap-1.5">
                        <Label for="email">Email</Label>
                        <Input id="email" type="email" placeholder="Email" />
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
import ModalView from "@/components/formulario/ModalView.vue"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const title = ref('Reposição de estoque')
const description = ref('Realize a reposição do estoque')

const store = useProdutoStore()
const toast = useToast()

const openModal = inject('modalReposicao', ref(false))

async function submit() {
    try {
        await store.repor({
            produtoId: 1,
            quantidade: 1
        })
        toast.success('Reposição de produto registrada!')
        store.updateTable()
        openModal.value = false
    } catch (error: any) {
        console.log(error)
        toast.error('Erro ao realizar a reposição de produto!')
    }
}
</script>