<script setup lang="ts">
import { ref } from "vue"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
    title: string
    description?: string
    onConfirm: () => void | Promise<void>
}

const props = defineProps<Props>()
const open = defineModel<boolean>("open", { default: false })

const loading = ref(false)

const handleConfirm = async () => {
    loading.value = true
    try {
        await props.onConfirm()
        open.value = false
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <Dialog v-model:open="open">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ props.title }}</DialogTitle>
                <DialogDescription v-if="props.description">
                    {{ props.description }}
                </DialogDescription>
            </DialogHeader>

            <DialogFooter>
                <Button variant="outline" @click="open = false">
                    Cancelar
                </Button>
                <Button class="text-white" :disabled="loading" @click="handleConfirm">
                    {{ loading ? "Confirmando..." : "Confirmar" }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
