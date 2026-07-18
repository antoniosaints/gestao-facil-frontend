<script setup lang="ts">
import { ref, watch, onMounted, nextTick, getCurrentInstance } from "vue"
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

interface Props {
    placeholder?: string
    modelValue?: string | number | null
    url: string
    allowClear?: boolean
    disabled?: boolean
    required?: boolean
    params?: { key: string, value: any }[]
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
const isOpen = ref(false)
const searchInputRef = ref<{ $el?: HTMLElement } | null>(null)
const selectedId = ref<string | number | null>(props.modelValue ?? null)
const selectedItem = ref<Item | null>(null)
const label = defineModel('label', {
    default: '',
    required: false
})
const search = ref("")
const loading = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

// Navegação por teclado na lista de resultados (setas + Enter).
// O primeiro resultado fica pré-destacado após cada busca.
const highlightedIndex = ref(-1)
const instanceUid = getCurrentInstance()?.uid ?? 0

const clearSelection = () => {
    selectedId.value = null
    selectedItem.value = null
    label.value = ''
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
        let url = buildUrl(`?search=${encodeURIComponent(search.value || "")}`)
        const { data } = await http.get(url)
        items.value = data.results ?? []
        // Pré-marca o primeiro resultado para permitir seleção rápida com Enter.
        highlightedIndex.value = items.value.length ? 0 : -1
    } finally {
        loading.value = false
    }
}

// Move o destaque entre os resultados (setas para cima/baixo).
function moverDestaque(delta: number) {
    if (!items.value.length) return
    const total = items.value.length
    const proximo = highlightedIndex.value + delta
    highlightedIndex.value = Math.max(0, Math.min(total - 1, proximo))
    scrollDestaqueIntoView()
}

// Seleciona o item atualmente destacado (Enter).
function selecionarDestaque() {
    const item = items.value[highlightedIndex.value]
    if (item) selecionarItem(item)
}

// Seleciona um item por completo, mantendo o mesmo estado de um clique.
function selecionarItem(item: Item) {
    selectedItem.value = item
    label.value = item.label
    selectedId.value = item.id
    search.value = ''
    isOpen.value = false
}

function scrollDestaqueIntoView() {
    nextTick(() => {
        const el = document.querySelector(
            `[data-sa-uid="${instanceUid}"][data-sa-index="${highlightedIndex.value}"]`,
        ) as HTMLElement | null
        el?.scrollIntoView({ block: "nearest" })
    })
}

// Handler de teclado do campo de busca. Preserva o comportamento atual de
// impedir a navegação/typeahead nativa do Select (stopPropagation) e adiciona
// setas + Enter para navegar/selecionar os resultados.
function onSearchKeydown(e: KeyboardEvent) {
    e.stopPropagation()
    if (e.key === "ArrowDown") {
        e.preventDefault()
        moverDestaque(1)
    } else if (e.key === "ArrowUp") {
        e.preventDefault()
        moverDestaque(-1)
    } else if (e.key === "Enter") {
        e.preventDefault()
        selecionarDestaque()
    }
}

// Busca item específico pelo ID
const fetchById = async (id: number | string) => {
    const connector = props.url.includes('?') ? '&' : '?'
    const url = buildUrl(`${connector}id=${encodeURIComponent(id)}`)
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

// Foca o campo de busca ao abrir o dropdown (usado pelo atalho de cliente no PDV)
function focusSearchField() {
    setTimeout(() => {
        const input = searchInputRef.value?.$el as HTMLInputElement | undefined
        input?.focus()
        input?.select?.()
    }, 60)
}

watch(isOpen, (open) => {
    if (open) {
        fetchItems()
        focusSearchField()
    }
})

// Abre o dropdown programaticamente com o campo de busca focado
function open() {
    isOpen.value = true
}

defineExpose({ open, focus: open })

// Carrega inicial
onMounted(fetchItems)
</script>

<template>
    <div class="flex items-center w-full max-w-full gap-2">
        <Select v-model="selectedId" v-model:open="isOpen" :disabled="disabled" :required="required">
            <SelectTrigger class="bg-card dark:bg-card-dark"
                :class="{ 'w-[calc(100%-2.5rem)]': allowClear && selectedId }">
                <SelectValue :value="selectedId" :placeholder="placeholder">
                    {{ selectedItem?.label ?? placeholder }}
                </SelectValue>
            </SelectTrigger>

            <SelectContent class="w-min">
                <div class="p-1">
                    <Input ref="searchInputRef" v-model="search" placeholder="Buscar..." class="w-full"
                        @keydown="onSearchKeydown" />
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
                        <SelectItem class="cursor-pointer" v-for="(item, index) in items" :key="item.id"
                            :value="item.id" :data-sa-uid="instanceUid" :data-sa-index="index"
                            :class="index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''"
                            @mouseenter="highlightedIndex = index" @click.stop="(search = '')">
                            {{ item.label }}
                        </SelectItem>
                    </template>
                </SelectGroup>
            </SelectContent>
        </Select>
        <button v-if="allowClear && selectedId" type="button" aria-label="Limpar seleção"
            class="bg-danger text-white dark:bg-red-800 hover:bg-danger/80 rounded h-8 w-8 flex items-center justify-center"
            @click.stop="clearSelection">
            <X class="h-4 w-4" />
        </button>
    </div>
</template>
