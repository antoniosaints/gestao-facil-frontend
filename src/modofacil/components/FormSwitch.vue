<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Switch } from '@/components/ui/switch'
const props = defineProps<{ modelValue: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const control = ref<InstanceType<typeof Switch>>()
async function update(value: boolean) {
  emit('update:modelValue', value)
  await nextTick()
  control.value?.$el.dispatchEvent(new Event('input', { bubbles: true }))
}
</script>
<template>
  <Switch
    ref="control"
    :model-value="props.modelValue"
    :disabled="disabled"
    @update:model-value="update"
  />
</template>
