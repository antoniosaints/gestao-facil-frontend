<script setup lang="ts">
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsAdminWhatsApp } from './columnDef'

defineProps<{ filters: Record<string, any> }>()
</script>

<template>
  <DataTable :columns="columnsAdminWhatsApp" api="/admin/whatsapp/instances" :filters="filters" />
</template>
