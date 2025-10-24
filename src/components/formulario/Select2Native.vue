<script setup lang="ts">
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from "vue"
import http from "@/utils/axios"
import { X, ChevronDown } from "lucide-vue-next"
import { Input } from "@/components/ui/input"

interface Item {
    id: string | number
    label: string
}

interface Props {
    modelValue?: string | number | null
    url: string
    allowClear?: boolean
    disabled?: boolean
    required?: boolean
    params?: { key: string; value: any }[]
    placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
    allowClear: false,
    required: false,
    placeholder: "Selecione...",
})

const emit = defineEmits<{
    (e: "update:modelValue", value: string | number | null): void
}>()

const items = ref<Item[]>([])
const selectedId = ref<string | number | null>(props.modelValue ?? null)
const selectedItem = ref<Item | null>(null)
const search = ref("")
const loading = ref(false)
const open = ref(false)
const dropdown = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const dropdownPosition = ref<"bottom" | "top">("bottom")
let timeout: ReturnType<typeof setTimeout> | null = null

// Limpa seleção
const clearSelection = () => {
    selectedId.value = null
    selectedItem.value = null
    emit("update:modelValue", null)
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
        const { data } = await http.get(url)
        items.value = data.results ?? []
    } finally {
        loading.value = false
    }
}

// Busca item por ID
const fetchById = async (id: number | string) => {
    const url = `${props.url}?id=${id}`
    const { data } = await http.get(url)
    return data.results?.[0] ?? null
}

// Atualiza seleção externa
watch(
    () => props.modelValue,
    async (id) => {
        selectedId.value = id ?? null
        if (id != null && id !== "") {
            const item = await fetchById(id)
            if (item) selectedItem.value = item
        } else clearSelection()
    },
    { immediate: true }
)

// Atualiza modelValue externo
watch(selectedId, (val) => emit("update:modelValue", val ?? null))

// Busca com debounce
watch(search, () => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(fetchItems, 300)
})

// Define posição automática do dropdown
const updateDropdownPosition = () => {
    if (!trigger.value) return
    const rect = trigger.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    dropdownPosition.value = spaceBelow > spaceAbove ? "bottom" : "top"
}

// Abre e posiciona o dropdown
const toggle = async () => {
    if (props.disabled) return
    open.value = !open.value
    if (open.value) {
        await nextTick()
        updateDropdownPosition()
        fetchItems()
    }
}

// Seleciona item
const selectItem = (item: Item) => {
    selectedId.value = item.id
    selectedItem.value = item
    open.value = false
    search.value = ""
}

// Fecha ao clicar fora
const handleClickOutside = (e: MouseEvent) => {
    if (!dropdown.value?.contains(e.target as Node) && !trigger.value?.contains(e.target as Node)) {
        open.value = false
    }
}

onMounted(() => {
    document.addEventListener("click", handleClickOutside)
    window.addEventListener("resize", updateDropdownPosition)
    fetchItems()
})

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside)
    window.removeEventListener("resize", updateDropdownPosition)
})
</script>

<template>
    <div ref="dropdown" class="relative w-full z-[999]">
        <div class="flex items-center gap-2">
            <!-- Botão principal -->
            <button ref="trigger" type="button"
                class="flex justify-between items-center border rounded-md w-full h-10 px-3 text-sm bg-card dark:bg-card-dark"
                :class="{ 'opacity-50 cursor-not-allowed': disabled }" :disabled="disabled" @click="toggle">
                <span class="truncate">
                    {{ selectedItem?.label ?? props.placeholder }}
                </span>
                <ChevronDown class="w-4 h-4 ml-2 shrink-0" />
            </button>

            <!-- Botão limpar -->
            <button v-if="allowClear && selectedId" type="button" aria-label="Limpar seleção"
                class="bg-danger text-white dark:bg-red-800 hover:bg-danger/80 rounded h-8 w-8 flex items-center justify-center"
                @click.stop="clearSelection">
                <X class="h-4 w-4" />
            </button>
        </div>

        <!-- Dropdown -->
        <div v-if="open" class="absolute z-50 w-full bg-popover dark:bg-popover-dark border rounded-md shadow-lg"
            :class="dropdownPosition === 'bottom' ? 'mt-1 top-full' : 'mb-1 bottom-full'">
            <div class="p-2">
                <Input ref="searchInput" v-model="search" placeholder="Buscar..." class="w-full text-sm" />
            </div>
            <hr class="m-1" />

            <div class="max-h-60 overflow-y-auto">
                <div v-if="loading" class="p-2 text-sm text-muted-foreground">
                    Carregando...
                </div>
                <div v-else-if="items.length === 0" class="p-2 text-sm text-muted-foreground">
                    Nenhum resultado
                </div>
                <div v-else>
                    <button v-for="item in items" :key="item.id"
                        class="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded" @click="selectItem(item)">
                        {{ item.label }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
