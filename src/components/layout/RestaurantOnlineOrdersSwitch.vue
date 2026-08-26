<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { LoaderCircle, Store } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { RestauranteRepository } from '@/repositories/restaurante-repository'
import { useUiStore } from '@/stores/ui/uiStore'

const route = useRoute()
const toast = useToast()
const uiStore = useUiStore()
const loading = ref(false)
const loaded = ref(false)
const aceitarPedidosOnline = ref(true)

const isRestaurantArea = computed(() => route.matched.some((record) => record.meta.modulo === 'restaurante-delivery'))
const canManage = computed(() => uiStore.hasRestaurantCapability('CONFIGURACOES_GERENCIAR'))
const label = computed(() => aceitarPedidosOnline.value ? 'Recebendo pedidos' : 'Pedidos pausados')
const title = computed(() => canManage.value
  ? 'Controla apenas novos pedidos feitos no cardápio online.'
  : 'Você não tem permissão para alterar o recebimento de pedidos online.')

async function loadStatus() {
  if (!isRestaurantArea.value) return
  try {
    const status = await RestauranteRepository.statusPedidosOnline()
    aceitarPedidosOnline.value = status.aceitarPedidosOnline
    loaded.value = true
  } catch {
    loaded.value = false
  }
}

async function saveStatus(value: boolean) {
  if (loading.value || !canManage.value) return
  const previous = aceitarPedidosOnline.value
  aceitarPedidosOnline.value = value
  loading.value = true
  try {
    const status = await RestauranteRepository.salvarStatusPedidosOnline(value)
    aceitarPedidosOnline.value = status.aceitarPedidosOnline
    toast.success(value ? 'Cardápio online aberto para novos pedidos.' : 'Cardápio online pausado para novos pedidos.')
  } catch (error: any) {
    aceitarPedidosOnline.value = previous
    toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar os pedidos online.')
  } finally {
    loading.value = false
  }
}

watch(isRestaurantArea, (active) => {
  if (active) void loadStatus()
  else loaded.value = false
}, { immediate: true })
</script>

<template>
  <div
    v-if="isRestaurantArea && loaded"
    class="flex items-center gap-2 rounded-xl border bg-card px-2.5 py-1.5 shadow-sm"
    :title="title"
  >
    <Store class="h-4 w-4 shrink-0" :class="aceitarPedidosOnline ? 'text-emerald-600' : 'text-amber-600'" />
    <span class="hidden text-xs font-semibold lg:inline" :class="aceitarPedidosOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'">
      {{ label }}
    </span>
    <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin text-muted-foreground" />
    <Switch
      v-else
      :model-value="aceitarPedidosOnline"
      :disabled="!canManage"
      aria-label="Aceitar pedidos pelo cardápio online"
      @update:model-value="saveStatus(Boolean($event))"
    />
  </div>
</template>
