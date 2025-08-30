<template>
    <DatePicker v-model="data" :placeholder="placeholder" :teleport-center="teleport" :required="required"
        :dark="colorTheme === 'dark'" cancel-text="Cancelar" select-text="Selecionar" :format-locale="ptBR"
        format="dd/MM/yyyy" :enable-time-picker="false" auto-apply />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ptBR } from "date-fns/locale";
import { colorTheme } from "@/utils/theme";

// Props
const props = defineProps({
    placeholder: {
        type: String,
        default: "Selecione a data",
    },
    modelValue: {
        type: [Date, String, Number], // aceita mais formatos
        default: null,
    },
    teleport: {
        type: Boolean,
        default: false, // pode ser true ou "body"
    },
    required: {
        type: Boolean,
        default: true,
    }
});

// Emits
const emit = defineEmits(["update:modelValue"]);

// Ref interna
const data = ref(props.modelValue);

// Sincroniza -> interno → externo
watch(data, (val) => {
    emit("update:modelValue", val);
});

// Sincroniza -> externo → interno
watch(
    () => props.modelValue,
    (val) => {
        data.value = val;
    }
);
</script>
