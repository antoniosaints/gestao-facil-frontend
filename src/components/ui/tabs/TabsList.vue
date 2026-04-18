<script setup lang="ts">
import type { TabsListProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsList } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<TabsListProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <TabsList v-bind="delegatedProps" :class="cn(
    'inline-flex max-w-full items-center justify-start gap-1 overflow-x-auto overflow-y-hidden rounded-t-md bg-muted p-1 text-muted-foreground touch-pan-x h-12 md:h-10',
    props.class,
  )">
    <slot />
  </TabsList>
</template>
