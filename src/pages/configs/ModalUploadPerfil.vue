<template>
    <ModalView v-model:open="store.openModalProfile" :title="title" :description="description" size="md">
        <form @submit.prevent="submit" class="grid items-start gap-4 px-4 ">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-12">
                        <FileUpload accept="image/*" @update:file="onFileSelected" />
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
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import ModalView from '@/components/formulario/ModalView.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { ContaRepository } from '@/repositories/conta-repository'
import FileUpload from '@/components/formulario/fileUpload.vue'
import { resolveFileUrl } from '@/utils/fileUrl'

const title = ref('Alterar foto da conta')
const description = ref('Selecione uma imagem')

const store = useUiStore()
const toast = useToast()

const file = ref<File | null>(null)

function onFileSelected(archive: File | null) {
    file.value = archive
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
        store.setLogoProfile(resolveFileUrl(store.contaInfo?.profile, { bustCache: true }))
    } catch (error: any) {
        console.log(error)
        toast.error('Erro ao atualizar a foto da conta')
    }
}
</script>
