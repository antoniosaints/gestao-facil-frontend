<script setup lang="ts">
import { Button } from '@/components/ui/button'
import type { AdminWhatsAppInstance } from '@/repositories/whatsapp-repository'
import { MenuSquare } from 'lucide-vue-next'
import { useAdminWhatsApp } from '../useAdminWhatsApp'

defineProps<{ data: AdminWhatsAppInstance }>()
const { openManage } = useAdminWhatsApp()
</script>

<template>
  <Button size="sm" class="h-8 gap-2 text-white" @click="openManage(data)">
    <MenuSquare class="h-4 w-4" />
    Gerenciar
  </Button>
</template>
