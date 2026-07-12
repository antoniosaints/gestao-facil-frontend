<script setup lang="ts">
import { computed } from 'vue'
import type { Table } from '@tanstack/vue-table'
import type { OrdensServico } from '@/types/schemas'
import { Button } from '@/components/ui/button'
import { DollarSign, FileText, SquareMinus, Trash2, X } from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from 'vue-toastification'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'

const props = defineProps<{ table: Table<OrdensServico> }>()
const store = useOrdemServicoStore()
const toast = useToast()

// Visibilidade/contagem da barra: reativa a store.selectedIds (resetado por updateTable).
const total = computed(() => store.selectedIds.length)

// Linhas selecionadas COM dados completos (status). É uma função (lida no momento da ação)
// e não um computed: um computed que filtra getRowModel().rows não cria dependência de
// selectedIds quando `rows` está vazio no primeiro cálculo e ficaria preso vazio.
function ordensSelecionadas(): OrdensServico[] {
  return props.table
    .getRowModel()
    .rows.filter((row) => store.selectedIds.includes(row.original.id!))
    .map((row) => row.original)
}

const isFaturada = (os: OrdensServico) => os.status === 'FATURADA'

function limparSelecao() {
  props.table.resetRowSelection()
  store.resetSelectedIds()
}

async function executarSequencial(
  ordens: OrdensServico[],
  fn: (os: OrdensServico) => Promise<unknown>,
) {
  let sucesso = 0
  let falhas = 0
  for (const os of ordens) {
    try {
      await fn(os)
      sucesso++
    } catch (error) {
      console.log(error)
      falhas++
    }
  }
  return { sucesso, falhas }
}

function notificar(acao: string, sucesso: number, falhas: number, ignoradas: number) {
  if (sucesso > 0) toast.success(`${sucesso} OS ${acao} com sucesso.`)
  if (falhas > 0) toast.error(`${falhas} OS falharam ao processar.`)
  if (ignoradas > 0) toast.info(`${ignoradas} OS ignorada(s) por não estarem no status válido.`)
}

// Faturar: ignora as já FATURADAS; abre o modal para aplicar os mesmos dados às elegíveis.
function faturar() {
  const selecionadas = ordensSelecionadas()
  const elegiveis = selecionadas.filter((os) => !isFaturada(os))
  const ignoradas = selecionadas.length - elegiveis.length
  if (!elegiveis.length) {
    return toast.info('Nenhuma OS pendente para faturar (todas já estão faturadas).')
  }
  if (ignoradas > 0) toast.info(`${ignoradas} OS já faturada(s) serão ignoradas.`)
  store.idsFaturarMassa = elegiveis.map((os) => os.id!).filter(Boolean)
  store.idMutation = null
  store.openModalFaturar = true
}

// Estornar: apenas as FATURADAS.
async function estornar() {
  const selecionadas = ordensSelecionadas()
  const elegiveis = selecionadas.filter(isFaturada)
  const ignoradas = selecionadas.length - elegiveis.length
  if (!elegiveis.length) {
    return toast.info('Nenhuma OS faturada para estornar.')
  }
  const confirm = await useConfirm().confirm({
    title: 'Estornar OS',
    message: `Estornar ${elegiveis.length} OS faturada(s)?${ignoradas ? ` ${ignoradas} não faturada(s) serão ignoradas.` : ''}`,
    confirmText: 'Sim, estornar!',
  })
  if (!confirm) return
  const { sucesso, falhas } = await executarSequencial(elegiveis, (os) =>
    OrdensServicoRepository.estornar(os.id!),
  )
  notificar('estornada(s)', sucesso, falhas, ignoradas)
  store.updateTable()
}

// PDF: gera o PDF A4 de todas as selecionadas (sem PIX, para não perguntar por OS).
async function gerarPdf() {
  const selecionadas = ordensSelecionadas()
  if (!selecionadas.length) return
  const { sucesso, falhas } = await executarSequencial(selecionadas, (os) =>
    OrdensServicoRepository.getOsPdf(os.id!, os.Uid!, false),
  )
  notificar('gerada(s) em PDF', sucesso, falhas, 0)
}

// Excluir: ignora as FATURADAS (não podem ser excluídas em massa).
async function excluir() {
  const selecionadas = ordensSelecionadas()
  const elegiveis = selecionadas.filter((os) => !isFaturada(os))
  const ignoradas = selecionadas.length - elegiveis.length
  if (!elegiveis.length) {
    return toast.info('Nenhuma OS elegível para exclusão (OS faturadas não podem ser excluídas).')
  }
  const confirm = await useConfirm().confirm({
    title: 'Excluir OS',
    message: `Excluir ${elegiveis.length} OS?${ignoradas ? ` ${ignoradas} faturada(s) serão ignoradas.` : ''}`,
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  const { sucesso, falhas } = await executarSequencial(elegiveis, (os) =>
    OrdensServicoRepository.remove(os.id!),
  )
  notificar('excluída(s)', sucesso, falhas, ignoradas)
  store.updateTable()
}
</script>

<template>
  <div
    v-if="total > 0"
    class="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2"
  >
    <span class="text-sm font-medium text-foreground">{{ total }} OS selecionada(s)</span>

    <div class="ml-auto flex flex-wrap items-center gap-2">
      <Button size="sm" class="bg-green-600 text-white hover:bg-green-700" @click="faturar">
        <DollarSign class="h-4 w-4" /> Faturar
      </Button>
      <Button size="sm" variant="secondary" @click="estornar">
        <SquareMinus class="h-4 w-4" /> Estornar
      </Button>
      <Button size="sm" variant="outline" class="bg-card" @click="gerarPdf">
        <FileText class="h-4 w-4" /> PDF
      </Button>
      <Button size="sm" variant="destructive" @click="excluir">
        <Trash2 class="h-4 w-4" /> Excluir
      </Button>
      <Button size="sm" variant="ghost" class="text-muted-foreground" @click="limparSelecao">
        <X class="h-4 w-4" /> Limpar
      </Button>
    </div>
  </div>
</template>
