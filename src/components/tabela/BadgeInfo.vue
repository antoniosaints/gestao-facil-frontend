<template>
    <span
        class="px-2 py-1 flex flex-nowrap cursor-pointer justify-center items-center gap-2 truncate w-max border border-gray-700 text-gray-900 bg-gray-100 dark:border-gray-500 dark:bg-gray-950 dark:text-gray-100 rounded-md">
        {{ conteudo }}
    </span>
</template>

<script setup lang="ts">
defineProps<{ conteudo: string }>()
</script>