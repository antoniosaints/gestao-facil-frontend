<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import http from '@/utils/axios'
import EntityLink from '@/components/navigation/EntityLink.vue'
import type { LinkedRecordKind } from '@/components/navigation/linkedRecord'
import { X } from 'lucide-vue-next'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type {
  SelectAjaxLoader,
  SelectAjaxOption,
  SelectAjaxQuery,
  SelectAjaxResult,
} from './select-ajax'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    modelValue?: string | number | null
    url?: string
    loadOptions?: SelectAjaxLoader
    allowClear?: boolean
    linkedKind?: LinkedRecordKind
    disabled?: boolean
    required?: boolean
    usePlaceholderAsLabel?: boolean
    params?: { key: string; value: unknown }[]
  }>(),
  { allowClear: false, required: false, placeholder: 'Selecione…', usePlaceholderAsLabel: true },
)
const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  select: [item: SelectAjaxOption]
}>()
const label = defineModel<string>('label', { default: '' })
const items = ref<SelectAjaxOption[]>([])
const isOpen = ref(false)
const searchInputRef = ref<{ $el?: HTMLElement } | null>(null)
const selectedId = ref<string | number | null>(props.modelValue ?? null)
const selectedItem = ref<SelectAjaxOption | null>(null)
const search = ref(''),
  loading = ref(false),
  listError = ref(''),
  selectionError = ref(''),
  page = ref(1),
  hasMore = ref(false)
const error = computed(() => listError.value || selectionError.value)
const highlightedIndex = ref(-1)
const instanceUid = getCurrentInstance()?.uid ?? 0
let timeout: ReturnType<typeof setTimeout> | undefined
let focusTimeout: ReturnType<typeof setTimeout> | undefined
let request = 0,
  selectionRequest = 0

async function options(query: SelectAjaxQuery): Promise<SelectAjaxResult> {
  let result: SelectAjaxResult
  if (props.loadOptions) result = await props.loadOptions(query)
  else {
    if (!props.url) return { results: [] }
    const parameters = new URLSearchParams()
    if (query.id != null) parameters.set('id', String(query.id))
    else {
      parameters.set('search', query.search)
      parameters.set('page', String(query.page))
    }
    props.params?.forEach(({ key, value }) => parameters.set(key, String(value)))
    const connector = props.url.includes('?') ? '&' : '?'
    const { data } = await http.get(`${props.url}${connector}${parameters}`)
    result = data
  }
  if (!Array.isArray(result?.results)) throw new Error('Resposta inválida do seletor.')
  return result
}
const sameId = (a: unknown, b: unknown) => a != null && b != null && String(a) === String(b)
function clearSelection() {
  selectionRequest++
  selectedId.value = null
  selectedItem.value = null
  label.value = ''
  selectionError.value = ''
}
async function fetchItems(more = false) {
  const token = ++request
  loading.value = true
  listError.value = ''
  const nextPage = more ? page.value + 1 : 1
  try {
    const result = await options({ search: search.value, page: nextPage })
    if (token !== request) return
    items.value = more
      ? [
          ...items.value,
          ...result.results.filter(
            (item) => !items.value.some((current) => current.id === item.id),
          ),
        ]
      : result.results
    hasMore.value = !!result.hasMore
    page.value = nextPage
    const selected = items.value.find((item) => sameId(item.id, selectedId.value))
    if (selected) {
      selectedItem.value = selected
      label.value = selected.label
      selectionError.value = ''
    }
    highlightedIndex.value = items.value.findIndex((item) => !item.disabled)
  } catch {
    if (token === request) listError.value = 'Não foi possível carregar as opções. Tente novamente.'
  } finally {
    if (token === request) loading.value = false
  }
}
function selectItem(item: SelectAjaxOption) {
  if (item.disabled) return
  selectedItem.value = item
  selectedId.value = item.id
  label.value = item.label
  selectionError.value = ''
  search.value = ''
  isOpen.value = false
  emit('select', item)
}
function moveHighlight(delta: number) {
  let index = highlightedIndex.value + delta
  while (index >= 0 && index < items.value.length) {
    if (!items.value[index]?.disabled) {
      highlightedIndex.value = index
      break
    }
    index += delta
  }
  nextTick(() =>
    document
      .querySelector<HTMLElement>(
        `[data-sa-uid="${instanceUid}"][data-sa-index="${highlightedIndex.value}"]`,
      )
      ?.scrollIntoView?.({ block: 'nearest' }),
  )
}
function onSearchKeydown(event: KeyboardEvent) {
  event.stopPropagation()
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    moveHighlight(event.key === 'ArrowDown' ? 1 : -1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const item = items.value[highlightedIndex.value]
    if (item) selectItem(item)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    isOpen.value = false
  }
}
function changeSelection(value: unknown) {
  const item = items.value.find((item) => String(item.id) === String(value))
  if (item) selectItem(item)
}
async function loadSelection(id: string | number | null | undefined, force = false) {
  const token = ++selectionRequest
  selectedId.value = id ?? null
  if (id == null || id === '') {
    clearSelection()
    return
  }
  if (!force && sameId(selectedItem.value?.id, id)) return
  selectedItem.value = null
  label.value = ''
  selectionError.value = ''
  try {
    const item =
      (!force && items.value.find((item) => sameId(item.id, id))) ||
      (await options({ search: '', page: 1, id })).results.find((item) => sameId(item.id, id))
    if (token !== selectionRequest) return
    if (!item) {
      selectionError.value = 'A opção selecionada não está disponível. Escolha outra.'
      return
    }
    selectedItem.value = item
    label.value = item.label
  } catch {
    if (token === selectionRequest && !sameId(selectedItem.value?.id, id))
      selectionError.value = 'Não foi possível carregar a seleção.'
  }
}
watch(
  () => props.modelValue,
  (id) => loadSelection(id),
  { immediate: true },
)
watch(selectedId, (value) => emit('update:modelValue', value ?? null))
watch(search, () => {
  if (timeout) clearTimeout(timeout)
  // Invalidate in-flight results immediately when the search changes.
  request++
  items.value = []
  hasMore.value = false
  highlightedIndex.value = -1
  listError.value = ''
  loading.value = true
  timeout = setTimeout(() => fetchItems(), 300)
})
function focusSearchField() {
  if (focusTimeout) clearTimeout(focusTimeout)
  focusTimeout = setTimeout(() => {
    searchInputRef.value?.$el?.focus()
  }, 60)
}
watch(isOpen, (open) => {
  if (open) {
    void fetchItems()
    focusSearchField()
  }
})
function open() {
  isOpen.value = true
}
onMounted(() => fetchItems())
async function refresh() {
  clearTimeout(timeout)
  request++
  items.value = []
  await Promise.all([fetchItems(), loadSelection(props.modelValue, true)])
}
watch([() => props.url, () => JSON.stringify(props.params), () => props.loadOptions], () =>
  refresh(),
)
onBeforeUnmount(() => {
  request++
  selectionRequest++
  clearTimeout(timeout)
  clearTimeout(focusTimeout)
})
defineExpose({ open, focus: open, refresh })
</script>

<template>
  <div class="grid min-w-0 w-full gap-1">
    <div class="flex min-w-0 w-full items-center gap-2">
      <Select
        :model-value="selectedId ?? ''"
        v-model:open="isOpen"
        :disabled="disabled"
        :required="required"
        @update:model-value="changeSelection"
      >
        <SelectTrigger
          class="min-w-0 flex-1 bg-card text-left text-base sm:text-sm"
          :aria-label="
            ($attrs['aria-label'] as string) || (usePlaceholderAsLabel ? placeholder : undefined)
          "
        >
          <SelectValue :placeholder="placeholder">
            <span class="block truncate">{{ selectedItem?.label || label || placeholder }}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent class="max-w-[calc(100vw-1.5rem)]" @close-auto-focus="search = ''">
          <div class="p-1">
            <Input
              ref="searchInputRef"
              v-model="search"
              placeholder="Buscar…"
              aria-label="Buscar opções"
              class="w-full text-base sm:text-sm"
              @keydown="onSearchKeydown"
            />
          </div>
          <SelectGroup class="max-h-[min(15rem,40dvh)] overflow-y-auto">
            <SelectItem
              v-if="selectedItem && !items.some((item) => item.id === selectedItem!.id)"
              :value="selectedItem.id"
              disabled
              aria-hidden="true"
              class="hidden"
              >{{ selectedItem.label }}</SelectItem
            >
            <div
              v-if="loading && !items.length"
              class="p-2 text-sm text-muted-foreground"
              role="status"
            >
              Carregando…
            </div>
            <SelectItem
              v-for="(item, index) in items"
              :key="item.id"
              :value="item.id"
              :disabled="item.disabled"
              :data-sa-uid="instanceUid"
              :data-sa-index="index"
              class="cursor-pointer whitespace-normal break-words"
              :class="index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''"
              @mouseenter="highlightedIndex = index"
            >
              {{ item.caminho || item.label }}
            </SelectItem>
            <div
              v-if="!loading && !error && !items.length"
              class="p-2 text-sm text-muted-foreground"
            >
              Nenhum resultado
            </div>
          </SelectGroup>
          <div v-if="hasMore && !error" class="border-t p-1">
            <Button
              type="button"
              variant="ghost"
              class="w-full"
              :disabled="loading"
              @click.stop="fetchItems(true)"
              >{{ loading ? 'Carregando…' : 'Carregar mais opções' }}</Button
            >
          </div>
          <div v-if="error" class="p-2 text-sm">
            <p role="alert" class="text-destructive">{{ error }}</p>
            <Button type="button" variant="outline" size="sm" @click.stop="refresh()"
              >Tentar novamente</Button
            >
          </div>
        </SelectContent>
      </Select>
      <EntityLink
        v-if="linkedKind && selectedId != null && (selectedItem?.label || label)"
        :kind="linkedKind"
        :record-id="selectedId"
        :label="selectedItem?.label || label"
        icon-only
        new-tab
        class="shrink-0 p-1"
      />
      <Button
        v-if="allowClear && selectedId != null"
        type="button"
        variant="ghost"
        size="icon"
        class="shrink-0"
        aria-label="Limpar seleção"
        @click.stop="clearSelection"
        ><X class="h-4 w-4"
      /></Button>
    </div>
    <p v-if="error && !isOpen" role="alert" class="text-xs text-destructive">{{ error }}</p>
  </div>
</template>
