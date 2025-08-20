<script setup lang="ts">
import { computed } from "vue"

interface Props {
  label: string
  color: "cyan" | "yellow" | "gray" | "violet" | "purple" | "green" | "emerald" | "orange" | "red" | "blue"
  icon?: string
  capitalize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  capitalize: true,
})

function formatToCapitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

const formattedLabel = computed(() =>
  props.capitalize ? formatToCapitalize(props.label) : props.label
)

const baseClasses =
  "inline-flex items-center gap-1 px-2 py-0.5 border-2 rounded-xl w-max";


const colors = {
  cyan: "text-cyan-800 border-cyan-400 dark:border-cyan-700 dark:text-cyan-300",
  yellow: "text-yellow-800 border-yellow-400 dark:border-yellow-700 dark:text-yellow-300",
  gray: "text-gray-800 border-gray-400 dark:border-gray-700 dark:text-gray-300",
  violet: "text-violet-800 border-violet-400 dark:border-violet-700 dark:text-violet-300",
  purple: "text-purple-800 border-purple-400 dark:border-purple-700 dark:text-purple-300",
  green: "text-green-800 border-green-400 dark:border-green-700 dark:text-green-300",
  emerald: "text-emerald-800 border-emerald-400 dark:border-emerald-700 dark:text-emerald-300",
  orange: "text-orange-800 border-orange-400 dark:border-orange-700 dark:text-orange-300",
  blue: "text-blue-800 border-blue-400 dark:border-blue-700 dark:text-blue-300",
  red: "text-red-800 border-red-400 dark:border-red-700 dark:text-red-300",
}
</script>

<template>
  <span :class="[baseClasses, colors[props.color] || colors.cyan]">
    <i v-if="props.icon" :class="props.icon"></i>
    <span>{{ formattedLabel }}</span>
  </span>
</template>
