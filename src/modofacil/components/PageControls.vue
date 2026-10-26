<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
const props = defineProps<{ page: number; pages: number; total: number; loading: boolean }>()
defineEmits<{ change: [page: number] }>()
const mobilePages = computed(() => {
  const count = Math.min(3, props.pages)
  const first = Math.max(1, Math.min(props.page - 1, props.pages - count + 1))
  return Array.from({ length: count }, (_, index) => first + index)
})
const visiblePages = computed(() => {
  const count = Math.min(5, props.pages)
  const first = Math.max(1, Math.min(props.page - 2, props.pages - count + 1))
  return Array.from({ length: count }, (_, index) => first + index)
})
</script>
<template>
  <nav class="mt-3 flex flex-wrap items-center justify-between gap-3" aria-label="Paginação">
    <span class="text-xs text-muted-foreground" role="status"
      ><template v-if="loading && !total">Carregando registros…</template
      ><template v-else
        >{{ total }} {{ total === 1 ? 'registro' : 'registros' }} · Página {{ page }} de
        {{ pages }}</template
      ></span
    >
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="!h-10 !min-h-10 !w-10 !p-0 sm:!h-8 sm:!min-h-8 sm:!w-8"
        :disabled="page <= 1 || loading"
        aria-label="Primeira página"
        :class="'!hidden sm:!inline-flex'"
        @click="$emit('change', 1)"
      >
        <ChevronsLeft :size="14" />
      </button>
      <button
        type="button"
        class="!h-10 !min-h-10 !w-10 !p-0 sm:!h-8 sm:!min-h-8 sm:!w-8"
        :disabled="page <= 1 || loading"
        aria-label="Página anterior"
        @click="$emit('change', page - 1)"
      >
        <ChevronLeft :size="14" />
      </button>
      <button
        v-for="number in visiblePages"
        :key="number"
        type="button"
        class="!h-10 !min-h-10 !w-10 !p-0 !text-xs sm:!h-8 sm:!min-h-8 sm:!w-8"
        :class="[
          number === page ? '!border-blue-600 !bg-blue-600 !text-white shadow-sm' : '',
          !mobilePages.includes(number) ? '!hidden sm:!inline-flex' : '',
        ]"
        :disabled="loading"
        :aria-current="number === page ? 'page' : undefined"
        :aria-label="`Página ${number}`"
        @click="$emit('change', number)"
      >
        {{ number }}
      </button>
      <button
        type="button"
        class="!h-10 !min-h-10 !w-10 !p-0 sm:!h-8 sm:!min-h-8 sm:!w-8"
        :disabled="page >= pages || loading"
        aria-label="Próxima página"
        @click="$emit('change', page + 1)"
      >
        <ChevronRight :size="14" />
      </button>
      <button
        type="button"
        class="!h-10 !min-h-10 !w-10 !p-0 sm:!h-8 sm:!min-h-8 sm:!w-8"
        :disabled="page >= pages || loading"
        aria-label="Última página"
        :class="'!hidden sm:!inline-flex'"
        @click="$emit('change', pages)"
      >
        <ChevronsRight :size="14" />
      </button>
    </div>
  </nav>
</template>
