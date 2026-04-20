<script setup lang="ts">
import { Package, RefreshCcw } from 'lucide-vue-next'

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
import { statusComodatoOptions } from './shared'
import ComodatosTabela from './components/ComodatosTabela.vue'
import ComodatosMobile from './components/ComodatosMobile.vue'

const uiStore = useUiStore()
const store = useAssinaturasStore()
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Package class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Comodatos
        </h2>
        <p class="text-sm text-muted-foreground">
          Equipamentos cedidos com a mesma linguagem de tabela no desktop e cards operacionais no mobile.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Select v-model="store.comodatosFilters.status">
          <SelectTrigger class="w-[180px] bg-card">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in statusComodatoOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" class="gap-2" @click="store.refreshComodatos()">
          <RefreshCcw class="h-4 w-4" /> Atualizar
        </Button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <ComodatosTabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <ComodatosMobile />
    </div>
  </div>
</template>
