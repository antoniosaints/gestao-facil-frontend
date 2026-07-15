<template>
  <div class="space-y-1.5">
    <Label :for="id" class="text-xs">{{ label }}</Label>
    <Input :id="id" type="number" :step="step" :min="min" inputmode="decimal" class="bg-card h-9"
      :model-value="modelValue ?? ''" @update:model-value="onInput" />
  </div>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: number | null | undefined
    step?: number
    min?: number
  }>(),
  { step: 0.1, min: 0 },
)

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const id = `nf-${useId()}`

function onInput(value: string | number) {
  const str = String(value).trim()
  if (str === '') {
    emit('update:modelValue', null)
    return
  }
  const num = Number(str.replace(',', '.'))
  emit('update:modelValue', Number.isFinite(num) ? num : null)
}
</script>
