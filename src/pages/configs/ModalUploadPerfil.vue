<template>
    <ModalView v-model:open="store.openModalProfile" :title="title" :description="description" size="md">
        <form @submit.prevent="submit" class="grid items-start gap-4 px-4 ">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <!-- Nome -->
                    <div class="md:col-span-12">
                        <Label for="profile_account"> Nova foto de perfil<span class="text-danger">*</span>
                        </Label>
                        <Input ref="file" id="profile_account" @change="onFileChange" required accept="image/*"
                            type="file" class="w-full dark:file:text-white bg-card py-2 h-auto" />
                    </div>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModalProfile = false">
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
import { useToast } from "vue-toastification"
import { ref } from "vue"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ModalView from "@/components/formulario/ModalView.vue"
import { useUiStore } from "@/stores/ui/uiStore"
import { ContaRepository } from "@/repositories/conta-repository"

const title = ref('Alterar foto da conta')
const description = ref('Selecione uma imagem')

const store = useUiStore()
const toast = useToast()

const file = ref<File | null>(null)

const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        file.value = target.files[0]
    }
}


async function submit() {
    if (!file.value) {
        toast.error('Selecione uma imagem')
        return
    }

    if (file.value.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB')
        return
    }

    if (file.value.type !== 'image/jpeg' && file.value.type !== 'image/png' && file.value.type !== 'image/webp') {
        toast.error('A imagem deve ser no formato JPEG, PNG ou WebP')
        return
    }

    try {
        await ContaRepository.uploadPerfil(file.value)
        await store.getDataUsuario()
        toast.success('Foto da conta atualizada')
        store.openModalProfile = false
    } catch (error: any) {
        console.log(error)
        toast.error('Erro ao atualizar a foto da conta')
    }
}
</script>