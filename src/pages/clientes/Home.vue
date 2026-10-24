<script setup lang="ts">
import Tabela from './tabela/Tabela.vue'
import Mobile from './tabela/Mobile.vue'
import { useClientesStore } from '@/stores/clientes/useClientes'
import ClientesModal from './modais/ClientesModal.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { BadgePlus, Link, RotateCw, UserStar } from 'lucide-vue-next'
import ModalFormularioPublico from './publico/ModalFormularioPublico.vue'
import { Button } from '@/components/ui/button'
const store = useClientesStore()
const uiStore = useUiStore()
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <UserStar class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Clientes & Fornecedores
        </h2>
        <p class="text-sm text-muted-foreground">Gerencie os contatos de clientes e fornecedores.</p>
      </div>
      <div v-if="!uiStore.isMobile" class="hidden md:flex flex-wrap gap-2 items-center">
        <Button @click="store.openSave" class="min-h-11 md:min-h-9">
          <BadgePlus aria-hidden="true" />Novo cliente
        </Button>
        <Button variant="outline" @click="store.openModalLink = true" class="min-h-11 md:min-h-9">
          <Link aria-hidden="true" />Link público
        </Button>
        <Button variant="outline" @click="store.updateTable" aria-label="Atualizar clientes e fornecedores" title="Atualizar listagem" class="min-h-11 md:min-h-9">
          <RotateCw aria-hidden="true" />
        </Button>
      </div>
    </div>
    <div v-if="!uiStore.isMobile" class="overflow-x-auto hidden md:block rounded-lg">
      <Tabela />
    </div>
    <div v-else class="overflow-x-auto block md:hidden rounded-lg">
      <Mobile />
    </div>
    <ClientesModal />
    <ModalFormularioPublico v-model:open="store.openModalLink" />
  </div>
</template>
