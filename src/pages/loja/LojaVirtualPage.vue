<script setup lang="ts">
import { ref } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings2, ShoppingBag } from 'lucide-vue-next'
import ConfiguracaoLoja from './ConfiguracaoLoja.vue'
import PedidosLoja from './PedidosLoja.vue'
const tab = ref('pedidos')
</script>

<template>
  <div class="space-y-4">
    <div><h1 class="text-2xl font-bold flex items-center gap-2"><ShoppingBag class="h-6 w-6 text-primary" :stroke-width="2.5" />Loja Virtual</h1><p class="text-sm text-muted-foreground">Gerencie pedidos, checkout e a experiência da sua vitrine.</p></div>
    <Tabs v-model="tab">
      <TabsList class="grid w-full max-w-sm grid-cols-2 rounded-lg"><TabsTrigger value="pedidos"><ShoppingBag class="mr-2 h-4 w-4 inline-flex" />Pedidos</TabsTrigger><TabsTrigger value="personalizacao"><Settings2 class="mr-2 h-4 w-4 inline-flex" />Personalização</TabsTrigger></TabsList>
      <TabsContent value="pedidos" class="mt-2"><PedidosLoja /></TabsContent>
      <TabsContent value="personalizacao" class="mt-4"><ConfiguracaoLoja /></TabsContent>
    </Tabs>
  </div>
</template>
