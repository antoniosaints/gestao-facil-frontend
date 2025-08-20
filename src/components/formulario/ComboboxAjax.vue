<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { Check, Search } from "lucide-vue-next"
import { cn } from "@/lib/utils"
import {
    Combobox,
    ComboboxAnchor,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxList
} from "@/components/ui/combobox"

interface Item {
    id: string | number
    label: string
}

const props = defineProps<{
    modelValue: string | number | null
    fetchItems: (search?: string) => Promise<Item[]>
}>()

const emit = defineEmits<{
    (e: "update:modelValue", value: string | number | null): void
}>()

const items = ref<Item[]>([])
const selected = ref<Item | null>(null)
const search = ref("")

// Atualiza quando modelValue é setado externamente
watch(
    () => props.modelValue,
    async (id) => {
        if (id) {
            const result = await props.fetchItems()
            const found = result.find((i) => i.id == id)
            if (found) {
                selected.value = found
                if (!items.value.length) items.value = result
            }
        } else {
            selected.value = null
        }
    },
    { immediate: true }
)

// Busca quando digita
watch(search, async (val) => {
    items.value = await props.fetchItems(val)
})

// Atualiza modelValue ao selecionar
watch(selected, (val) => {
    emit("update:modelValue", val ? val.id : null)
})

onMounted(async () => {
    if (!items.value.length) {
        items.value = await props.fetchItems()
    }
})
</script>

<template>
    <Combobox v-model="selected" by="id">
        <ComboboxAnchor>
            <div class="relative w-full max-w-sm items-center">
                <ComboboxInput v-model="search" class="pl-9" :display-value="(val: Item) => val?.label ?? ''"
                    placeholder="Selecione..." />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                    <Search class="size-4 text-muted-foreground" />
                </span>
            </div>
        </ComboboxAnchor>

        <ComboboxList>
            <ComboboxEmpty>Nenhum item encontrado.</ComboboxEmpty>

            <ComboboxGroup>
                <ComboboxItem v-for="item in items" :key="item.id" :value="item">
                    {{ item.label }}

                    <ComboboxItemIndicator>
                        <Check :class="cn('ml-auto h-4 w-4')" />
                    </ComboboxItemIndicator>
                </ComboboxItem>
            </ComboboxGroup>
        </ComboboxList>
    </Combobox>
</template>
