<script setup lang="ts">
import spinner from '../assets/infinite-spinner.svg'

withDefaults(defineProps<{ loading: boolean; collapsed?: boolean; label?: string }>(), {
  label: 'Carregando página…',
})
</script>
<template>
  <div class="min-h-[calc(100dvh-65px-3rem)]">
    <div
      v-if="loading"
      role="status"
      aria-live="polite"
      :aria-label="label"
      class="fixed inset-x-0 bottom-0 top-[65px] z-20 flex items-center justify-center bg-background"
      :class="collapsed ? 'lg:left-[80px]' : 'lg:left-[288px]'"
      @wheel.prevent
      @touchmove.prevent
    >
      <img
        :src="spinner"
        alt=""
        aria-hidden="true"
        class="h-16 w-32 sm:h-20 sm:w-40 motion-reduce:hidden"
      />
      <svg
        viewBox="0 0 300 150"
        aria-hidden="true"
        class="hidden h-16 w-32 sm:h-20 sm:w-40 motion-reduce:block"
      >
        <path
          fill="none"
          stroke="#0DA6EA"
          stroke-width="19"
          stroke-linecap="round"
          d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"
        />
      </svg>
      <span class="sr-only">{{ label }}</span>
    </div>
    <div
      :class="{ invisible: loading }"
      :inert="loading ? true : undefined"
      :aria-hidden="loading ? true : undefined"
    >
      <slot />
    </div>
  </div>
</template>
