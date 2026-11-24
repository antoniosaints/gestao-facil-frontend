<script setup lang="ts">
import http from "@/utils/axios"
import { ref, onMounted } from "vue"
import { useToast } from "vue-toastification"
import { Button } from "@/components/ui/button"

const toast = useToast()
const isSubscribed = ref(false)
const isSupported = ref("serviceWorker" in navigator && "Notification" in window)

const applicationServerKey = import.meta.env.VITE_API_PUSH

onMounted(async () => {
    if (!isSupported.value) return

    try {
        const reg = await navigator.serviceWorker.ready
        const subscription = await reg.pushManager.getSubscription()

        if (subscription) {
            // Existe inscrição válida
            console.log("[Push] Inscrição existente")
            isSubscribed.value = true
            localStorage.setItem("pushEndpoint", subscription.endpoint)
        } else {
            // Não existe -> remove qualquer resquício
            console.log("[Push] Nenhuma inscrição ativa, limpando...")
            localStorage.removeItem("pushEndpoint")

            // força limpeza caso o navegador tenha lixo armazenado
            const oldSubs = await reg.pushManager.getSubscription()
            if (oldSubs) {
                await oldSubs.unsubscribe()
                console.log("[Push] Inscrição antiga removida")
            }

            isSubscribed.value = false
        }
    } catch (err) {
        console.error("[Push] Erro ao verificar inscrição:", err)
        isSubscribed.value = false
        localStorage.removeItem("pushEndpoint")
    }
})

async function subscribeUserOnReceiverPush() {
    // Verifica suporte básico
    if (!('serviceWorker' in navigator)) {
        return toast.error("Seu navegador não suporta Service Workers.")
    }

    if (!('PushManager' in window)) {
        return toast.error("Seu navegador não suporta notificações push.")
    }

    if (!window.isSecureContext) {
        return toast.warning("Notificações push exigem HTTPS.")
    }

    // Solicita permissão
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
        return toast.warning("Permissão de notificação negada.")
    }

    try {
        // Aguarda service worker pronto
        const reg = await navigator.serviceWorker.ready

        // Verifica inscrição existente
        let subscription = await reg.pushManager.getSubscription()

        // Converte applicationServerKey
        const vapidKey = applicationServerKey
        if (!vapidKey) {
            return toast.error("Chave VAPID inválida ou ausente.")
        }
        const convertedKey = urlBase64ToUint8Array(vapidKey)

        // Faz nova inscrição se necessário
        if (!subscription) {
            subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey,
            })
        }

        // Envia para backend
        const { data } = await http.post("subscribe", subscription)
        localStorage.setItem("pushEndpoint", subscription.endpoint)
        isSubscribed.value = true

        data.new ? toast.success(data.message) : toast.info(data.message)

    } catch (err: any) {
        console.error("Erro ao inscrever:", err)
        if (err.name === 'AbortError') {
            toast.error("Falha no serviço de push. Verifique a chave VAPID ou conexão.")
        } else {
            toast.error("Erro ao inscrever para notificações.")
        }
    }
}
async function unsubscribeUserToReceivePush() {
    const reg = await navigator.serviceWorker.ready
    const subscription = await reg.pushManager.getSubscription()
    if (!subscription) {
        toast.info("Nenhuma inscrição ativa para cancelar.")
        return
    }

    try {
        await http.post("unsubscribe", { endpoint: subscription.endpoint })
        await subscription.unsubscribe()
        localStorage.removeItem("pushEndpoint")
        isSubscribed.value = false
        toast.info("Inscrição cancelada")
    } catch (err: any) {
        console.error("Erro ao cancelar inscrição:", err)
        const msg = err?.response?.data?.message || "Erro ao cancelar inscrição"
        toast.error(msg);
        localStorage.removeItem("pushEndpoint")
        isSubscribed.value = false
    }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
</script>

<template>
    <div class="space-y-2">
        <p class="text-sm font-medium">Este navegador</p>
        <Button v-if="isSupported && !isSubscribed" type="button" variant="outline" class="w-full"
            @click="subscribeUserOnReceiverPush">
            Inscrever este navegador
        </Button>
        <Button v-else-if="isSubscribed" type="button" variant="outline" class="w-full"
            @click="unsubscribeUserToReceivePush">
            Cancelar inscrição neste navegador
        </Button>
        <p v-else class="text-sm text-muted-foreground">Seu navegador não suporta notificações push.</p>
    </div>
</template>
