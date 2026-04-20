<script setup lang="ts">
import { CalendarClock, RefreshCcw } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUiStore } from '@/stores/ui/uiStore'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { statusCicloOptions } from './shared'
import CobrancasTabela from './components/CobrancasTabela.vue'
import CobrancasMobile from './components/CobrancasMobile.vue'

const uiStore = useUiStore()
const store = useAssinaturasStore()
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CalendarClock class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Cobranças recorrentes
        </h2>
        <p class="text-sm text-muted-foreground">
          Visão operacional em tabela no desktop e cards paginados no mobile, consistente com o restante do módulo.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Select v-model="store.cobrancasFilters.status">
          <SelectTrigger class="w-[180px] bg-card">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in statusCicloOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" class="gap-2" @click="store.refreshCobrancas()">
          <RefreshCcw class="h-4 w-4" /> Atualizar
        </Button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <CobrancasTabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <CobrancasMobile />
    </div>
  </div>
</template>
