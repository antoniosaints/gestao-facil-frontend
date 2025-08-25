<template>
    <DatePicker :placeholder="placeholder" required v-model="data" :dark="(colorTheme === 'dark')" cancelText="Cancelar"
        selectText="Selecionar" :format-locale="ptBR" :format="'dd/MM/yyyy'" :enable-time-picker="false" auto-apply />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ptBR } from 'date-fns/locale';
import { colorTheme } from '@/utils/theme';

const props = defineProps({
    placeholder: {
        type: String,
        default: 'Selecione a data'
    },
    modelValue: {
        type: Date,
        default: new Date()
    }
})

const emit = defineEmits(['update:modelValue'])

const data = ref(props.modelValue)

watch(data, () => {
    emit('update:modelValue', data.value)
})

watch(props, () => {
    data.value = props.modelValue
})
</script>
