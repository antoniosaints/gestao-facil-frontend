<template>
    <AlertDialog :open="open">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{{ title }}</AlertDialogTitle>
                <AlertDialogDescription>
                    {{ description }}
                </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
                <AlertDialogCancel @click="cancelar">
                    Cancelar
                </AlertDialogCancel>

                <AlertDialogAction class="text-white bg-danger hover:bg-danger/40" @click="confirmar">
                    {{ confirmText }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '../ui/alert-dialog'

const props = defineProps({
    open: { type: Boolean, required: true },
    title: { type: String, default: 'Confirmar ação' },
    description: { type: String, default: 'Tem certeza que deseja continuar?' },
    confirmText: { type: String, default: 'Confirmar' }
})

const emit = defineEmits(['confirm', 'cancel'])

function confirmar() {
    // Garante que nenhum elemento dentro do modal fique focado
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    emit('confirm')
}

function cancelar() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    emit('cancel')
}

// Opcional: remove foco automaticamente ao fechar o diálogo
watch(
    () => props.open,
    (open) => {
        if (!open && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
        }
    }
)
</script>
