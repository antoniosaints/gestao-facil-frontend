<template>
    <DatePicker v-model="data" :placeholder="placeholder" :teleport-center="teleport" :range="range"
        v-bind="range ? { presetDates } : {}" @range-end="emitRangeEnd" :required="required" cancel-text="Cancelar"
        select-text="Selecionar" :format-locale="ptBR" format="dd/MM/yyyy" :enable-time-picker="false"
        :transitions="false" :auto-apply="autoApply">
        <template v-if="range" #preset-date-range-button="{ label, value, presetDate }">
            <span role="button" :tabindex="0" @click="presetDate(value)" @keyup.enter.prevent="presetDate(value)"
                @keyup.space.prevent="presetDate(value)">
                {{ label }}
            </span>
        </template>
    </DatePicker>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ptBR } from "date-fns/locale";
import { endOfMonth, endOfYear, startOfMonth, startOfYear, subMonths } from "date-fns";

interface Props {
    placeholder?: string;
    modelValue?: Date | string | number | Date[] | null;
    teleport?: boolean;
    required?: boolean;
    range?: boolean;
    autoApply?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: "Selecione a data",
    modelValue: null,
    teleport: false,
    required: true,
    range: false,
    autoApply: true
})

const presetDates = ref([
    { label: 'Hoje', value: [new Date(), new Date()] },
    { label: 'Este mês', value: [startOfMonth(new Date()), endOfMonth(new Date())] },
    {
        label: 'Último mês',
        value: [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))],
    },
    { label: 'Esse ano', value: [startOfYear(new Date()), endOfYear(new Date())] },
]);


// Emits
const emit = defineEmits(["update:modelValue", "range-end"]);

// Ref interna
const data = ref(props.modelValue);

function emitRangeEnd() {
    emit("range-end", data.value);
}
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
