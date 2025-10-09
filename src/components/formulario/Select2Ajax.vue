<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"
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

// Tipos
interface Item {
    id: string | number
    label: string
}

interface ApiResponse<T> {
    results: T[]
}

interface Props {
    modelValue?: string | number | null
    url: string
    allowClear?: boolean
    required?: boolean
    params?: { key: string; value: any }[]
}

const props = withDefaults(defineProps<Props>(), {
    allowClear: false,
    required: false,
})

const emit = defineEmits<{
    (e: "update:modelValue", value: string | number | null): void
}>()

// Estado
const items = ref<Item[]>([])
const selectedId = ref<string | number | null>(props.modelValue ?? null)
const selectedItem = ref<Item | null>(null)
const search = ref("")
const loading = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

// Label derivado automaticamente
const label = computed(() => selectedItem.value?.label ?? "")

// Limpa seleção
const clearSelection = () => {
    selectedId.value = null
    selectedItem.value = null
}

// Monta URL com parâmetros extras
const buildUrl = (extra: string = "") => {
    let url = `${props.url}${extra}`
    if (props.params && props.params.length > 0) {
        url += `&${props.params.map((p) => `${p.key}=${encodeURIComponent(p.value)}`).join("&")}`
    }
    return url
}

// Busca lista pelo texto
const fetchItems = async () => {
    loading.value = true
    try {
        const url = buildUrl(`?search=${encodeURIComponent(search.value || "")}`)
        const { data } = await http.get<ApiResponse<Item>>(url)
        items.value = data.results ?? []
    } catch {
        items.value = []
    } finally {
        loading.value = false
    }
}

// Busca item específico pelo ID
const fetchById = async (id: number | string) => {
    const url = buildUrl(`?id=${id}`)
    const { data } = await http.get<ApiResponse<Item>>(url)
    return data.results?.[0] ?? null
}

// Atualiza quando o modelValue externo mudar
watch(
    () => props.modelValue,
    async (id) => {
        selectedId.value = id ?? null

        if (id != null && id !== "") {
            // Evita duplicar e faz cache
            let item = items.value.find((i) => i.id === id)
            if (!item) {
                item = await fetchById(id)
                if (item) items.value.push(item)
            }
            selectedItem.value = item ?? null
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
watch(search, () => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(fetchItems, 300)
})

// Limpa a busca ao selecionar um item
const handleSelect = () => {
    search.value = ""
}

// Carrega inicial
onMounted(fetchItems)
</script>

<template>
    <div class="flex items-center w-full max-w-full gap-2">
        <Select v-model="selectedId" :required="required" :disabled="loading"
            @update:open="(open) => open && fetchItems()">
            <SelectTrigger class="bg-card dark:bg-card-dark"
                :class="{ 'w-[calc(100%-2.5rem)]': allowClear && selectedId }" aria-label="Selecionar item"
                :title="label">
                <SelectValue :value="selectedId" placeholder="Selecione...">
                    {{ label || 'Selecione...' }}
                </SelectValue>
            </SelectTrigger>

            <SelectContent class="w-min">
                <div class="p-1">
                    <Input v-model="search" placeholder="Buscar..." class="w-full" @keydown.stop />
                </div>
                <hr class="m-1" />

                <SelectGroup class="max-h-60 overflow-y-auto">
                    <template v-if="loading">
                        <div class="p-2 text-sm text-muted-foreground">Carregando...</div>
                    </template>
                    <template v-else-if="items.length === 0">
                        <div class="p-2 text-sm text-muted-foreground">Nenhum resultado</div>
                    </template>
                    <template v-else>
                        <SelectItem v-for="item in items" :key="item.id" :value="item.id" class="cursor-pointer"
                            @click.stop="handleSelect">
                            {{ item.label }}
                        </SelectItem>
                    </template>
                </SelectGroup>
            </SelectContent>
        </Select>

        <button v-if="allowClear && selectedId" type="button"
            class="bg-danger text-white dark:bg-red-800 hover:bg-danger/80 rounded h-8 w-8 flex items-center justify-center"
            @click.stop="clearSelection" aria-label="Limpar seleção">
            <X class="h-4 w-4" />
        </button>
    </div>
</template>
