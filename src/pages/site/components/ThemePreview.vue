<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeCustomization } from '@/types/schemas'
import {
  getThemePalette,
  normalizeThemeCustomization,
  type ThemeMode,
} from '@/utils/themeCustomization'
const props = defineProps<{ theme: Partial<ThemeCustomization>; mode: ThemeMode; name?: string }>()
const palette = computed(() => getThemePalette(props.theme, props.mode))
const normalized = computed(() => normalizeThemeCustomization(props.theme))
</script>

<template>
  <figure
    class="overflow-hidden border shadow-sm"
    :style="{
      background: palette.background,
      color: palette.foreground,
      borderColor: palette.border,
      borderRadius: normalized.radius,
      fontFamily: normalized.fonte,
      '--app-font': normalized.fonte,
    }"
  >
    <figcaption
      class="border-b px-4 py-3 text-xs font-semibold"
      :style="{ borderColor: palette.border }"
    >
      Prévia ilustrativa · {{ mode === 'light' ? 'Modo claro' : 'Modo escuro' }}
    </figcaption>
    <div class="flex min-h-56">
      <aside
        class="w-16 shrink-0 space-y-4 p-3"
        :style="{ background: palette.sidebar, color: palette.sidebarForeground }"
        aria-hidden="true"
      >
        <div class="grid h-9 w-9 place-items-center rounded-lg border border-current font-bold">
          G
        </div>
        <div
          v-for="item in 4"
          :key="item"
          class="mx-auto h-2 w-6 rounded-full bg-current opacity-40"
        />
      </aside>
      <div class="min-w-0 flex-1 space-y-4 p-4">
        <p class="truncate text-sm font-semibold">{{ name || 'Seu empreendimento' }}</p>
        <div
          class="rounded-lg border p-3"
          :style="{ background: palette.card, borderColor: palette.border }"
        >
          <p class="text-xs" :style="{ color: palette.mutedForeground }">
            Seu painel, do seu jeito
          </p>
          <p class="mt-1 text-lg font-semibold">Visão do negócio</p>
          <div class="mt-4 flex h-12 items-end gap-2" aria-hidden="true">
            <div
              v-for="n in 5"
              :key="n"
              class="flex-1 rounded-t"
              :style="{
                height: `${20 + n * 15}%`,
                background: palette.primary,
                opacity: 0.4 + n / 10,
              }"
            />
          </div>
        </div>
        <span
          class="inline-block rounded-lg px-3 py-2 text-xs font-semibold"
          :style="{ background: palette.primary, color: palette.primaryForeground }"
          >Nova atividade</span
        >
      </div>
    </div>
  </figure>
</template>
