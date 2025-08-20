<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const open = defineModel({ default: false })
</script>

<template>
    <Dialog v-model:open="open">
        <DialogContent class="sm:max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]">
            <DialogHeader class="p-6 pb-0">
                <DialogTitle>Formulário de vendas</DialogTitle>
            </DialogHeader>
            <div class="grid gap-4 py-4 overflow-y-auto px-6">
                <div class="flex flex-col justify-between">
                    <p>
                        This is some placeholder content to show the scrolling behavior for modals. We use repeated line
                        breaks to demonstrate how content can exceed minimum inner height, thereby showing inner
                        scrolling. When content becomes longer than the predefined max-height of modal, content will be
                        cropped and scrollable within the modal.
                    </p>
                </div>
            </div>
            <DialogFooter class="p-6 pt-0">
                <Button variant="outline" @click="open = false">Fechar</Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>