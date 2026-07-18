<script setup lang="ts">
import { ref, watch } from "vue"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog"
import { usePwaInstall } from "@/composables/usePwaInstall"

const { canInstall, promptInstall } = usePwaInstall()
const showDialog = ref(false)

// Abre o diálogo automaticamente quando o app fica instalável, a menos que o
// usuário já tenha recusado antes.
watch(
    canInstall,
    (value) => {
        if (value && !localStorage.getItem("pwaInstallDismissed")) {
            showDialog.value = true
        }
    },
    { immediate: true },
)

const instalarApp = async () => {
    await promptInstall()
    localStorage.setItem("pwaInstallDismissed", "true")
    showDialog.value = false
}

const fecharDialog = () => {
    localStorage.setItem("pwaInstallDismissed", "true")
    showDialog.value = false
}
</script>

<template>
    <AlertDialog :open="showDialog">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle><i class="fa-solid fa-mobile-screen-button"></i> Instale nosso app</AlertDialogTitle>
                <AlertDialogDescription>
                    Adicione a aplicação à tela inicial para ter acesso mais rápido e uma melhor experiência.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="fecharDialog">Agora não</AlertDialogCancel>
                <AlertDialogAction class="text-white bg-success hover:bg-success/40" @click="instalarApp">Instalar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
