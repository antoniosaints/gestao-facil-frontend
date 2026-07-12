<script setup lang="ts">
import { computed } from 'vue'
import type { Table } from '@tanstack/vue-table'
import type { Vendas } from '@/types/schemas'
import { Button } from '@/components/ui/button'
import { DollarSign, FileText, Printer, SquareMinus, Trash2, X } from 'lucide-vue-next'
import {
  estornarVendasEmMassa,
  excluirVendasEmMassa,
  faturarVendasEmMassa,
  gerarCupomPdfVendasEmMassa,
  imprimirVendasEmMassa,
} from '../ActionsVendas'

const props = defineProps<{ table: Table<Vendas> }>()

const vendasSelecionadas = computed(() =>
  props.table.getSelectedRowModel().rows.map((row) => row.original),
)
const total = computed(() => vendasSelecionadas.value.length)

function limparSelecao() {
  props.table.resetRowSelection()
}

async function executar(acao: (vendas: Vendas[]) => boolean | Promise<boolean>) {
  const limpar = await acao(vendasSelecionadas.value)
  if (limpar) limparSelecao()
}
</script>

<template>
  <div
    v-if="total > 0"
    class="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2"
  >
    <span class="text-sm font-medium text-foreground">
      {{ total }} venda(s) selecionada(s)
    </span>

    <div class="ml-auto flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        class="bg-green-600 text-white hover:bg-green-700"
        @click="executar(faturarVendasEmMassa)"
      >
        <DollarSign class="h-4 w-4" /> Faturar
      </Button>
      <Button
        size="sm"
        variant="secondary"
        @click="executar(estornarVendasEmMassa)"
      >
        <SquareMinus class="h-4 w-4" /> Estornar
      </Button>
      <Button
        size="sm"
        variant="outline"
        class="bg-card"
        @click="executar(imprimirVendasEmMassa)"
      >
        <Printer class="h-4 w-4" /> Imprimir
      </Button>
      <Button
        size="sm"
        variant="outline"
        class="bg-card"
        @click="executar(gerarCupomPdfVendasEmMassa)"
      >
        <FileText class="h-4 w-4" /> Cupom PDF
      </Button>
      <Button
        size="sm"
        variant="destructive"
        @click="executar(excluirVendasEmMassa)"
      >
        <Trash2 class="h-4 w-4" /> Excluir
      </Button>

      <Button
        size="sm"
        variant="ghost"
        class="text-muted-foreground"
        @click="limparSelecao"
      >
        <X class="h-4 w-4" /> Limpar
      </Button>
    </div>
  </div>
</template>
