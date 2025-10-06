<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import http from "@/utils/axios"
import { X } from "lucide-vue-next"

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectItem,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input"

interface Item {
    id: string | number
    label: string
}

const props = withDefaults(defineProps<{
    modelValue?: string | number | null
    url: string
    allowClear?: boolean
    required?: boolean
    params?: { key: string, value: any }[]
}>(), {
    allowClear: false,
    required: false
})

const emit = defineEmits<{
    (e: "update:modelValue", value: string | number | null): void
}>()

const items = ref<Item[]>([])
const selectedId = ref<string | number | null>(props.modelValue ?? null)
const selectedItem = ref<Item | null>(null)
const label = defineModel('label', {
    default: '',
    required: false
})
const search = ref("")
const loading = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

const clearSelection = () => {
    selectedId.value = null
    selectedItem.value = null
    label.value = ''
}

// Busca lista pelo texto
const fetchItems = async () => {
    loading.value = true
    try {
        let url = `${props.url}?search=${search.value || ''}`
        if (props.params) url += `&${props.params.map((p) => `${p.key}=${p.value}`).join('&')}`
        const { data } = await http.get(url)
        items.value = data.results ?? []
    } finally {
        loading.value = false
    }
}

// Busca item específico pelo ID
const fetchById = async (id: number | string) => {
    const url = `${props.url}?id=${id}`
    const { data } = await http.get(url)
    return data.results?.[0] ?? null
}

// Atualiza quando o modelValue externo mudar
watch(
    () => props.modelValue,
    async (id) => {
        selectedId.value = id ?? null

        if (id != null && id !== "") {
            const item = await fetchById(id)
            if (item) {
                // Evita duplicar
                const exists = items.value.find((i) => i.id === item.id)
                if (!exists) items.value.push(item)
                selectedItem.value = item
                label.value = item.label
            }
        } else {
            clearSelection()
        }
    },
    { immediate: true }
)

// Atualiza quando selecionar
watch(selectedId, (val) => {
    emit("update:modelValue", val ?? null)
})

// Debounce na busca
watch(search, (val) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(fetchItems, 300)
})

// Carrega inicial
onMounted(fetchItems)
</script>

<template>
    <div class="flex items-center w-full max-w-full gap-2">
        <Select v-model="selectedId" :required="required" @update:open="(open) => open && fetchItems()">
            <SelectTrigger class="bg-card dark:bg-card-dark"
                :class="{ 'w-[calc(100%-2.5rem)]': allowClear && selectedId }">
                <SelectValue :value="selectedId" :placeholder="'Selecione...'">
                    {{ selectedItem?.label ?? 'Selecione...' }}
                </SelectValue>
            </SelectTrigger>

            <SelectContent class="w-min">
                <div class="p-1">
                    <Input v-model="search" placeholder="Buscar..." class="w-full" @keydown.stop />
                </div>
                <hr class="m-1">
                <SelectGroup class="max-h-60 overflow-y-auto">
                    <template v-if="loading">
                        <div class="p-2 text-sm text-muted-foreground">Carregando...</div>
                    </template>
                    <template v-else-if="items.length === 0">
                        <div class="p-2 text-sm text-muted-foreground">Nenhum resultado</div>
                    </template>
                    <template v-else>
                        <SelectItem class="cursor-pointer" @click.stop="(search = '')" v-for="item in items"
                            :key="item.id" :value="item.id">
                            {{ item.label }}
                        </SelectItem>
                    </template>
                </SelectGroup>
            </SelectContent>
        </Select>
        <button v-if="allowClear && selectedId" type="button"
            class="bg-danger text-white dark:bg-red-800 hover:bg-danger/80 rounded h-8 w-8 flex items-center justify-center"
            @click.stop="clearSelection">
            <X class="h-4 w-4" />
        </button>
    </div>
</template>
