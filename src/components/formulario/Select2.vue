<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { Check, ChevronsUpDown, Search } from "lucide-vue-next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Combobox,
    ComboboxAnchor,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxList,
    ComboboxTrigger,
} from "@/components/ui/combobox"

interface Item {
    id: string | number
    label: string
}

const props = defineProps<{
    modelValue: string | number | null
    fetchItems: (search?: string) => Promise<Item[]>
    fetchById?: (id: string | number) => Promise<Item | null>
}>()

const emit = defineEmits<{
    (e: "update:modelValue", value: string | number | null): void
}>()

const items = ref<Item[]>([])
const selected = ref<Item | null>(null)
const search = ref("")

// Atualiza quando modelValue é alterado externamente
watch(
    () => props.modelValue,
    async (id) => {
        if (id) {
            // Se tiver função fetchById, usa ela
            if (props.fetchById) {
                const item = await props.fetchById(id)
                if (item) selected.value = item
            } else {
                // fallback usando fetchItems
                const result = await props.fetchItems()
                const found = result.find((i) => i.id == id)
                if (found) {
                    selected.value = found
                    if (!items.value.length) items.value = result
                }
            }
        } else {
            selected.value = null
        }
    },
    { immediate: true }
)

// Atualiza lista quando digita
watch(search, async (val) => {
    items.value = await props.fetchItems(val)
})

// Emite o id quando muda
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
        <ComboboxAnchor as-child>
            <ComboboxTrigger as-child>
                <Button variant="outline" class="justify-between w-auto overflow-hidden">
                    <span class="truncate whitespace-nowrap">
                        {{ selected?.label ?? 'Selecione...' }}
                    </span>
                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </ComboboxTrigger>
        </ComboboxAnchor>

        <ComboboxList>
            <div class="relative w-full max-w-sm items-center">
                <ComboboxInput v-model="search" class="pl-9 focus-visible:ring-0 border-0 border-b rounded-none h-10"
                    :display-value="(val: Item) => val?.label ?? ''" placeholder="Buscar..." />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                    <Search class="size-4 text-muted-foreground" />
                </span>
            </div>

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
