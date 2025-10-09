<script setup lang="ts">
import http from "@/utils/axios"
import { ref, onMounted } from "vue"
import { useToast } from "vue-toastification"

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

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
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
        const convertedKey = urlBase64ToUint8Array(vapidKey)

        if (!vapidKey || convertedKey.length === 0) {
            return toast.error("Chave VAPID inválida ou ausente.")
        }

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
    <div class="flex flex-col gap-2">
        <label>Receber notificações</label>
        <div>
            <button v-if="isSupported && !isSubscribed" @click="subscribeUserOnReceiverPush"
                class="px-3 py-1 rounded-md bg-blue-100 border-2 border-blue-500 text-blue-500 dark:bg-blue-900 dark:text-blue-200">
                <i class="fa-solid fa-bell"></i> Inscrever para receber notificações
            </button>

            <button v-if="isSupported && isSubscribed" @click="unsubscribeUserToReceivePush"
                class="px-3 py-1 rounded-md bg-red-100 border-2 border-red-500 text-red-500 dark:bg-red-900 dark:text-red-200">
                <i class="fa-solid fa-bell-slash"></i> Cancelar inscrição de notificações
            </button>

            <p v-if="!isSupported" class="text-gray-500">
                Seu navegador não suporta notificações push.
            </p>
        </div>
    </div>
</template>
