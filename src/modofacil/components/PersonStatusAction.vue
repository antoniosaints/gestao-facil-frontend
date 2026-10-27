<script setup lang="ts">
import RecordStatusAction from './RecordStatusAction.vue'
import type { Row } from '../adapters/domain'
defineProps<{ record: Row; disabled?: boolean; iconOnly?: boolean }>()
const emit = defineEmits<{ changed: [] }>()
</script>
<template>
  <RecordStatusAction
    kind="person"
    :record="record"
    :disabled="disabled"
    :icon-only="iconOnly"
    @changed="emit('changed')"
  />
</template>
