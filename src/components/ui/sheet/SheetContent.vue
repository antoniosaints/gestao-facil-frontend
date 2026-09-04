<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes, StyleValue } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { usePortalLayer } from '@/components/formulario/modal-layer'

type SheetSide = 'left' | 'right'

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      class?: HTMLAttributes['class']
      overlayClass?: HTMLAttributes['class']
      overlayStyle?: StyleValue
      contentStyle?: StyleValue
      side?: SheetSide
    }
  >(),
  { side: 'right' },
)
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'overlayClass', 'overlayStyle', 'contentStyle', 'side')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
const overlayZIndex = usePortalLayer(0, 50)
const contentZIndex = usePortalLayer(1, 51)

const sideClasses: Record<SheetSide, string> = {
  right:
    'right-0 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
  left:
    'left-0 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
}
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      :style="[props.overlayStyle, { zIndex: overlayZIndex }]"
      :class="cn('fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', props.overlayClass)"
    />
    <DialogContent
      v-bind="forwarded"
      :style="[props.contentStyle, { zIndex: contentZIndex }]"
      :class="cn('fixed inset-y-0 z-50 flex h-dvh w-full max-w-md flex-col gap-4 bg-background p-6 shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out', sideClasses[props.side], props.class)"
    >
      <slot />

      <DialogClose
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Fechar</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
