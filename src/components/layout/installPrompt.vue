<script setup lang="ts">
import { ref, onMounted } from "vue"
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

const showDialog = ref(false)
const deferredPrompt = ref<any>(null)

onMounted(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault()
        deferredPrompt.value = e

        // Só mostra se o usuário nunca recusou
        if (!localStorage.getItem("pwaInstallDismissed")) {
            showDialog.value = true
        }
    })
})

const instalarApp = async () => {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const choice = await deferredPrompt.value.userChoice
    if (choice.outcome === "accepted") {
        console.log("Usuário aceitou instalar")
        localStorage.setItem("pwaInstallDismissed", "true")
    } else {
        console.log("Usuário recusou instalar")
        localStorage.setItem("pwaInstallDismissed", "true")
    }
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
                <AlertDialogAction @click="instalarApp">Instalar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
