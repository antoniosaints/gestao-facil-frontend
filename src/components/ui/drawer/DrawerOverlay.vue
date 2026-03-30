<script lang="ts" setup>
import type { DialogOverlayProps } from "reka-ui"
import type { HTMLAttributes, StyleValue } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { DrawerOverlay } from "vaul-vue"
import { cn } from "@/lib/utils"

const props = defineProps<DialogOverlayProps & { class?: HTMLAttributes["class"]; style?: StyleValue }>()

const delegatedProps = reactiveOmit(props, "class", "style")
</script>

<template>
  <DrawerOverlay
    v-bind="delegatedProps"
    :style="props.style"
    :class="cn('fixed inset-0 z-50 bg-black/80', props.class)"
  />
</template>
