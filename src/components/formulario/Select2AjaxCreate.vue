<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import http from '@/utils/axios'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Item {
  id: string | number
  label: string
  caminho?: string
}

interface Props {
  placeholder?: string
  modelValue?: string | number | null
  url: string
  createUrl: string
  createLabel?: string
  createDefaults?: Record<string, unknown>
  allowClear?: boolean
  disabled?: boolean
  required?: boolean
  params?: { key: string; value: unknown }[]
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: false,
  required: false,
  placeholder: 'Selecione…',
  createLabel: 'cliente',
  createDefaults: () => ({}),
})
const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number | null): void
  (event: 'created', item: Item): void
}>()
const label = defineModel<string>('label', { default: '' })
const items = ref<Item[]>([])
const isOpen = ref(false)
const searchInputRef = ref<{ $el?: HTMLElement } | null>(null)
const selectedId = ref<string | number | null>(props.modelValue ?? null)
const selectedItem = ref<Item | null>(null)
const search = ref('')
const loading = ref(false)
const creating = ref(false)
const highlightedIndex = ref(-1)
const instanceUid = getCurrentInstance()?.uid ?? 0
let timeout: ReturnType<typeof setTimeout> | null = null

const normalizedSearch = computed(() => search.value.trim())
const canCreate = computed(() => {
  const value = normalizedSearch.value.toLocaleLowerCase('pt-BR')
  return (
    value.length >= 2 &&
    !items.value.some((item) => item.label.trim().toLocaleLowerCase('pt-BR') === value)
  )
})

function buildUrl(extra = '') {
  let url = `${props.url}${extra}`
  if (props.params?.length)
    url += `&${props.params.map((param) => `${param.key}=${encodeURIComponent(String(param.value))}`).join('&')}`
  return url
}
function clearSelection() {
  selectedId.value = null
  selectedItem.value = null
  label.value = ''
}
async function fetchItems() {
  loading.value = true
  try {
    const connector = props.url.includes('?') ? '&' : '?'
    const { data } = await http.get(
      buildUrl(`${connector}search=${encodeURIComponent(search.value)}`),
    )
    items.value = data.results ?? []
    highlightedIndex.value = items.value.length ? 0 : -1
  } finally {
    loading.value = false
  }
}
async function fetchById(id: string | number) {
  const connector = props.url.includes('?') ? '&' : '?'
  const { data } = await http.get(buildUrl(`${connector}id=${encodeURIComponent(id)}`))
  return data.results?.[0] ?? null
}
function selectItem(item: Item) {
  selectedItem.value = item
  selectedId.value = item.id
  label.value = item.label
  search.value = ''
  isOpen.value = false
}
async function createItem() {
  const name = normalizedSearch.value
  if (!canCreate.value || creating.value) return
  creating.value = true
  try {
    const response = await http.post(props.createUrl, { ...props.createDefaults, nome: name })
    const created = response.data?.data ?? response.data
    if (!created?.id) throw new Error('created_item_missing')
    const item = { id: created.id, label: created.label || created.nome || name }
    items.value.unshift(item)
    selectItem(item)
    emit('created', item)
  } finally {
    creating.value = false
  }
}
function moveHighlight(delta: number) {
  if (!items.value.length) return
  highlightedIndex.value = Math.max(
    0,
    Math.min(items.value.length - 1, highlightedIndex.value + delta),
  )
  nextTick(() => {
    const element = document.querySelector(
      `[data-sac-uid="${instanceUid}"][data-sac-index="${highlightedIndex.value}"]`,
    ) as HTMLElement | null
    element?.scrollIntoView({ block: 'nearest' })
  })
}
function onSearchKeydown(event: KeyboardEvent) {
  event.stopPropagation()
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveHighlight(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveHighlight(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const item = items.value[highlightedIndex.value]
    if (item) selectItem(item)
    else if (canCreate.value) void createItem()
  }
}
function focusSearchField() {
  setTimeout(() => {
    const input = searchInputRef.value?.$el as HTMLInputElement | undefined
    input?.focus()
    input?.select?.()
  }, 60)
}
function open() {
  isOpen.value = true
}

watch(
  () => props.modelValue,
  async (id) => {
    selectedId.value = id ?? null
    if (id != null && id !== '') {
      const item = await fetchById(id)
      if (item) {
        if (!items.value.some((current) => current.id === item.id)) items.value.push(item)
        selectedItem.value = item
        label.value = item.label
      }
    } else clearSelection()
  },
  { immediate: true },
)
watch(selectedId, (value) => emit('update:modelValue', value ?? null))
watch(search, () => {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(fetchItems, 300)
})
watch(isOpen, (opened) => {
  if (!opened) return
  void fetchItems()
  focusSearchField()
})
onMounted(fetchItems)
defineExpose({ open, focus: open })
</script>

<template>
  <div class="flex w-full max-w-full items-center gap-2">
    <Select v-model="selectedId" v-model:open="isOpen" :disabled="disabled" :required="required">
      <SelectTrigger
        class="bg-card dark:bg-card-dark"
        :class="{ 'w-[calc(100%-2.5rem)]': allowClear && selectedId }"
      >
        <SelectValue :value="selectedId" :placeholder="placeholder">
          <span class="block truncate text-left">{{ selectedItem?.label ?? placeholder }}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent class="w-min">
        <div class="p-1">
          <Input
            ref="searchInputRef"
            v-model="search"
            placeholder="Buscar…"
            class="w-full"
            @keydown="onSearchKeydown"
          />
        </div>
        <hr class="m-1" />
        <SelectGroup class="max-h-60 overflow-y-auto">
          <div v-if="loading" class="p-2 text-sm text-muted-foreground">Carregando…</div>
          <template v-else>
            <SelectItem
              v-for="(item, index) in items"
              :key="item.id"
              :value="item.id"
              class="cursor-pointer"
              :data-sac-uid="instanceUid"
              :data-sac-index="index"
              :class="index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''"
              @mouseenter="highlightedIndex = index"
              @click.stop="search = ''"
            >
              {{ item.caminho || item.label }}
            </SelectItem>
            <div v-if="!items.length && !canCreate" class="p-2 text-sm text-muted-foreground">
              Nenhum resultado
            </div>
          </template>
        </SelectGroup>
        <button
          v-if="canCreate"
          type="button"
          class="m-1 flex w-[calc(100%-0.5rem)] items-center rounded-md px-2 py-2 text-left text-sm font-medium text-primary transition hover:bg-accent disabled:opacity-60"
          :disabled="creating"
          @mousedown.prevent
          @click.stop="createItem"
        >
          <Plus class="mr-2 h-4 w-4" />
          {{ creating ? 'Criando…' : `Criar ${createLabel} “${normalizedSearch}”?` }}
        </button>
      </SelectContent>
    </Select>
    <button
      v-if="allowClear && selectedId"
      type="button"
      aria-label="Limpar seleção"
      class="flex h-8 w-8 items-center justify-center rounded bg-danger text-white hover:bg-danger/80 dark:bg-red-800"
      @click.stop="clearSelection"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
