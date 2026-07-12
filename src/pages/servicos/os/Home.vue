<script setup lang="ts">
import { useUiStore } from '@/stores/ui/uiStore'
import { BadgePlus, FileDigit, RotateCw } from 'lucide-vue-next'
import Tabela from './tabela/Tabela.vue'
import Mobile from './tabela/Mobile.vue'
import OrdemServicoModal from '../modais/OrdemServicoModal.vue'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import ModalChecklist from '../modais/ModalChecklist.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import ModalDetalhesOrdem from './ModalDetalhesOrdem.vue'
import ModalFaturarOs from './ModalFaturarOs.vue'
import GerarCobranca from '@/pages/financeiro/lancamentos/modais/GerarCobranca.vue'

const store = useOrdemServicoStore()
const uiStore = useUiStore()
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <FileDigit class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Ordens de serviço
        </h2>
        <p class="text-sm text-muted-foreground">Ordens de serviço com faturamento e cobrança reaproveitando o fluxo financeiro.</p>
      </div>
      <div class="hidden items-center justify-between gap-2 md:flex">
        <button
          class="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-white"
          @click="store.openSave"
        >
          <BadgePlus class="inline-flex h-5 w-5" /> <span class="hidden md:inline">Nova OS</span>
        </button>
        <button
          class="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          @click="store.updateTable"
        >
          <RotateCw class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto rounded-lg">
      <Tabela />
    </div>
    <div v-else class="overflow-x-auto rounded-lg">
      <Mobile />
    </div>

    <OrdemServicoModal />
    <ModalChecklist />
    <ClientesModal />
    <ModalDetalhesOrdem />
    <ModalFaturarOs />
    <GerarCobranca />
  </div>
</template>
