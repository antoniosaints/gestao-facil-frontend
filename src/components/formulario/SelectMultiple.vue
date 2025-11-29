<template>
  <div class="relative inline-block text-sm" ref="root">
    <button
      @click="toggle"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white shadow-sm"
      :aria-expanded="open"
      type="button"
    >
      <span class="truncate max-w-xs" v-if="selectedLabels.length">{{ selectedLabels.join(', ') }}</span>
      <span v-else class="text-muted-foreground">{{ placeholder }}</span>
      <svg class="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <transition name="fade">
      <div
        v-if="open"
        class="absolute z-50 mt-2 w-64 max-h-72 overflow-auto rounded-lg border bg-popover shadow-lg p-2"
        @keydown.esc.stop="close"
      >
        <!-- Search -->
        <div class="px-2 pb-2">
          <input
            v-model="query"
            type="search"
            placeholder="Pesquisar..."
            class="w-full rounded-md border px-2 py-1 text-sm"
          />
        </div>

        <!-- Options list -->
        <ul class="divide-y overflow-auto">
          <li
            v-for="opt in filteredOptions"
            :key="opt.value"
            class="flex items-center justify-between gap-2 px-2 py-2 hover:bg-muted rounded-md"
          >
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="isSelected(opt.value)"
                @change="toggleOption(opt.value)"
                class="h-4 w-4"
              />
              <div class="flex flex-col leading-none">
                <span class="text-sm">{{ opt.label }}</span>
                <span class="text-xs text-muted-foreground">{{ opt.subtitle }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div class="text-xs text-muted-foreground">{{ opt.count ?? '' }}</div>
              <svg v-if="opt.trend === 'up'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 19V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5 12l7-7 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="opt.trend === 'down'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 12l-7 7-7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </li>

          <li v-if="!filteredOptions.length" class="px-2 py-3 text-sm text-muted-foreground">Nenhum resultado</li>
        </ul>

        <!-- Footer actions -->
        <div class="mt-2 flex items-center justify-between px-2">
          <button class="text-xs px-2 py-1 rounded hover:bg-muted" @click="clear">Limpar filtros</button>
          <div class="flex gap-2">
            <button class="text-xs px-2 py-1 rounded hover:bg-muted" @click="selectAllVisible">Selecionar todos</button>
            <button class="text-xs px-2 py-1 rounded bg-primary text-white" @click="apply">Aplicar</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

export interface OptionItem {
  label: string
  value: string | number
  count?: number
  subtitle?: string
  trend?: 'up' | 'down' | null
}

export default defineComponent({
  name: 'MultiselectDropdown',
  props: {
    modelValue: { type: Array as () => (string|number)[], default: () => [] },
    options: { type: Array as () => OptionItem[], required: true },
    placeholder: { type: String, default: 'Priority' }
  },
  emits: ['update:modelValue', 'apply'],
  setup(props, { emit }) {
    const open = ref(false)
    const query = ref('')
    const selected = ref<Set<string|number>>(new Set(props.modelValue))
    const root = ref<HTMLElement | null>(null)

    const toggle = () => { open.value = !open.value }
    const close = () => { open.value = false }

    const isSelected = (v: string|number) => selected.value.has(v)
    const toggleOption = (v: string|number) => {
      if (selected.value.has(v)) selected.value.delete(v)
      else selected.value.add(v)
      emit('update:modelValue', Array.from(selected.value))
    }

    const filteredOptions = computed(() => {
      const q = query.value.trim().toLowerCase()
      if (!q) return props.options
      return props.options.filter(o => o.label.toLowerCase().includes(q) || (o.subtitle ?? '').toLowerCase().includes(q))
    })

    const selectedLabels = computed(() => {
      return props.options.filter(o => selected.value.has(o.value)).map(o => o.label)
    })

    const clear = () => {
      selected.value.clear()
      emit('update:modelValue', [])
    }

    const selectAllVisible = () => {
      filteredOptions.value.forEach(o => selected.value.add(o.value))
      emit('update:modelValue', Array.from(selected.value))
    }

    const apply = () => {
      emit('apply', Array.from(selected.value))
      close()
    }

    // sync props -> internal selected
    watch(() => props.modelValue, (nv) => {
      selected.value = new Set(nv || [])
    })

    // click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (!root.value) return
      if (!root.value.contains(e.target as Node)) close()
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      open,
      query,
      toggle,
      close,
      filteredOptions,
      isSelected,
      toggleOption,
      clear,
      selectAllVisible,
      apply,
      selectedLabels,
      root
    }
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }

</style>
