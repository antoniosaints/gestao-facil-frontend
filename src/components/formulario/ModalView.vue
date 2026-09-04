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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { computed, inject, provide, ref, watch, type CSSProperties } from "vue";
import { type LucideIcon } from "lucide-vue-next";
import { allocateModalLayer, modalLayerKey } from "./modal-layer";

// Reativo vindo de fora (pode ter vários na mesma página)
const isOpen = defineModel<boolean>("open", { default: false })

// Propriedades fixas do componente
const { size, themeStyle, desktopVariant } = defineProps<{
    icon?: LucideIcon
    title: string
    description?: string,
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
    themeStyle?: CSSProperties
    desktopVariant?: 'dialog' | 'sheet'
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
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
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
    ...themeStyle,
    zIndex: layer.value + 1,
}))
</script>

<template>
    <div>
        <!-- Desktop: painel lateral opcional -->
        <Sheet v-if="isDesktop && desktopVariant === 'sheet'" v-model:open="isOpen">
            <SheetContent :overlay-style="overlayStyle" :content-style="contentStyle"
                :class="[sizeModal, 'p-0']">
                <SheetHeader class="p-6 pb-0">
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <SheetTitle class="font-normal text-xl -mb-1 flex items-center gap-1">
                                <component v-if="icon" :is="icon" class="h-5 w-5 inline-flex" />
                                {{ title }}
                            </SheetTitle>
                            <SheetDescription v-if="description">
                                {{ description }}
                            </SheetDescription>
                        </div>
                        <slot name="header-actions" />
                    </div>
                </SheetHeader>
                <div class="grid min-h-0 flex-1 gap-4 overflow-y-auto px-2 py-4">
                    <slot />
                </div>
            </SheetContent>
        </Sheet>

        <!-- Desktop: modal central -->
        <Dialog v-else-if="isDesktop" v-model:open="isOpen">
            <DialogContent class="p-0 max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)_auto]"
                :overlay-style="overlayStyle" :content-style="contentStyle"
                :class="[sizeModal, 'mx-auto']">
                <DialogHeader class="p-6 pb-0">
                    <div class="flex items-start justify-between gap-3 pr-8">
                        <div class="min-w-0">
                            <DialogTitle class="font-normal text-xl -mb-1 flex items-center gap-1">
                                <component v-if="icon" :is="icon" class="h-5 w-5 inline-flex" />
                                {{ title }}
                            </DialogTitle>
                            <DialogDescription v-if="description">
                                {{ description }}
                            </DialogDescription>
                        </div>
                        <slot name="header-actions" />
                    </div>
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
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <DrawerTitle>{{ title }}</DrawerTitle>
                            <DrawerDescription v-if="description">
                                {{ description }}
                            </DrawerDescription>
                        </div>
                        <slot name="header-actions" />
                    </div>
                </DrawerHeader>
                <div class="overflow-y-auto max-h-[calc(100vh-6rem)] pb-6">
                    <slot />
                </div>
            </DrawerContent>
        </Drawer>
    </div>
</template>
