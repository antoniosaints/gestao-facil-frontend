<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { computed, inject, provide, ref, watch } from "vue";
import { type LucideIcon } from "lucide-vue-next";
import { allocateModalLayer, modalLayerKey } from "./modal-layer";

// Reativo vindo de fora (pode ter vários na mesma página)
const isOpen = defineModel<boolean>("open", { default: false })

// Propriedades fixas do componente
const { size } = defineProps<{
    icon?: LucideIcon
    title: string
    description?: string,
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
}>()

const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
}

const sizeModal = computed(() => size ? sizeClasses[size] : 'max-w-4xl')

const isDesktop = useMediaQuery("(min-width: 768px)")
const parentLayer = inject(modalLayerKey, null)
const layer = ref(60)

provide(modalLayerKey, layer)

watch(
    () => isOpen.value,
    (open) => {
        if (open) {
            layer.value = allocateModalLayer(parentLayer?.value)
        }
    },
    { immediate: true }
)

const overlayStyle = computed(() => ({
    zIndex: layer.value,
}))

const contentStyle = computed(() => ({
    zIndex: layer.value + 1,
}))
</script>

<template>
    <div>
        <!-- Desktop: Modal -->
        <Dialog v-if="isDesktop" v-model:open="isOpen">
            <DialogContent class="p-0 max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)_auto]"
                :overlay-style="overlayStyle" :content-style="contentStyle"
                :class="[sizeModal, 'mx-auto']">
                <DialogHeader class="p-6 pb-0">
                    <DialogTitle class="font-normal text-xl -mb-1 flex items-center gap-1">
                        <component v-if="icon" :is="icon" class="h-5 w-5 inline-flex" />
                        {{ title }}
                    </DialogTitle>
                    <DialogDescription v-if="description">
                        {{ description }}
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4 overflow-y-auto px-2">
                    <slot />
                </div>
            </DialogContent>
        </Dialog>

        <!-- Mobile: Drawer -->
        <Drawer v-else v-model:open="isOpen">
            <DrawerContent :overlay-style="overlayStyle" :content-style="contentStyle">
                <DrawerHeader class="text-left">
                    <DrawerTitle>{{ title }}</DrawerTitle>
                    <DrawerDescription v-if="description">
                        {{ description }}
                    </DrawerDescription>
                </DrawerHeader>
                <div class="overflow-y-auto max-h-[calc(100vh-6rem)] pb-6">
                    <slot />
                </div>
            </DrawerContent>
        </Drawer>
    </div>
</template>
