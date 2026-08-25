<script setup lang="ts">
import { type Component, type HTMLAttributes, useAttrs } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  /** Ícone ou texto exibido junto ao campo, por exemplo: `:iconLabel="Percent"` ou `icon-label="R$"`. */
  iconLabel?: Component | string
  /** Posição do rótulo. Por padrão ele é exibido ao final do campo. */
  iconLabelPosition?: 'left' | 'right'
  /** Texto de apoio acessível para o rótulo exibido no campo. */
  iconLabelTitle?: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const attrs = useAttrs()
const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
</script>

<template>
  <input
    v-if="!props.iconLabel"
    v-model="modelValue"
    v-bind="attrs"
    :class="cn(inputClass, props.class)"
  />
  <div v-else class="relative w-full">
    <input
      v-model="modelValue"
      v-bind="attrs"
      :class="cn(inputClass, props.iconLabelPosition === 'left' ? 'pl-12' : 'pr-12', props.class)"
    />
    <span
      :class="
        cn(
          'pointer-events-none absolute inset-y-0 flex w-10 items-center justify-center text-muted-foreground',
          props.iconLabelPosition === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        )
      "
      :title="props.iconLabelTitle"
      :aria-label="props.iconLabelTitle"
    >
      <component
        v-if="typeof props.iconLabel !== 'string'"
        :is="props.iconLabel"
        class="h-4 w-4"
        aria-hidden="true"
      />
      <span v-else class="text-xs font-semibold">{{ props.iconLabel }}</span>
    </span>
  </div>
</template>
