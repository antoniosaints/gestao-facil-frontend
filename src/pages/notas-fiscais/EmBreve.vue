<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>
<template><div class="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center p-5"><section class="w-full rounded-3xl border border-dashed bg-card p-10 text-center shadow-sm"><p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">Notas fiscais</p><h1 class="mt-3 text-3xl font-bold">{{ title }}</h1><p class="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{{ description }}</p><span class="mt-6 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Em breve</span></section></div></template>
