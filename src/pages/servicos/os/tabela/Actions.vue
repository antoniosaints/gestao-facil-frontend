<script setup lang="ts">
import { CircleDollarSign, FileArchive, Info, Menu, Pencil, RotateCcw, Wallet } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ItensOrdensServico, OrdensServico } from '@/types/schemas'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'

const store = useOrdemServicoStore()
const storeCobranca = useCobrancasFinanceirasStore()
const toast = useToast()

const { data } = defineProps<{
  data: OrdensServico & { ItensOrdensServico?: ItensOrdensServico[] }
}>()

function getTotal() {
  const subtotal = (data.ItensOrdensServico || []).reduce(
    (acc, item) => acc + Number(item.valor || 0) * Number(item.quantidade || 0),
    0,
  )

  return subtotal - Number(data.desconto || 0)
}

async function deletar(id: number) {
  if (!id) return toast.error('ID não informado!')
  const confirm = await useConfirm().confirm({
    title: 'Excluir OS',
    message: 'Tem certeza que deseja excluir esta OS?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    await OrdensServicoRepository.remove(id)
    store.updateTable()
    toast.success('OS deletada com sucesso')
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao deletar a OS')
  }
}

async function estornar(id: number) {
  const confirm = await useConfirm().confirm({
    title: 'Estornar faturamento',
    message: 'Tem certeza que deseja estornar o faturamento desta OS?',
    confirmText: 'Sim, estornar',
  })
  if (!confirm) return

  try {
    await OrdensServicoRepository.estornar(id)
    store.updateTable()
    toast.success('OS estornada com sucesso')
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao estornar a OS')
  }
}

async function confirmarAcao(id: number, uid: string) {
  const ok = await useConfirm().confirm({
    title: 'Gerar PDF',
    message: 'Tem certeza que deseja gerar o PDF desta OS?',
    confirmText: 'Sim, gerar!',
    cancelText: 'Cancelar',
    colorButton: 'primary',
  })
  if (!ok) return
  await getPDFOs(id, uid)
}

async function getPDFOs(id: number, uid: string) {
  try {
    let pix = false
    const ok = await useConfirm().confirm({
      title: 'Pix na OS',
      message: 'Deseja adicionar o PIX na OS?',
      confirmText: 'Sim!',
      cancelText: 'Não',
      colorButton: 'success',
    })
    if (ok) pix = true
    await OrdensServicoRepository.getOsPdf(id, uid, pix)
    toast.success('PDF gerado com sucesso')
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar PDF')
  }
}

function abrirFaturamento(id: number) {
  store.idMutation = id
  store.openModalFaturar = true
}

function abrirCobranca(id: number) {
  storeCobranca.openSave({
    id,
    tipo: 'os',
    valor: getTotal(),
  })
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white">
        <span class="sr-only">Abrir opções</span>
        <Menu class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="store.openDetalhes(data.id!)">
        <Info class="mr-2 h-4 w-4" />
        Detalhes
      </DropdownMenuItem>
      <DropdownMenuItem @click="store.openUpdate(data.id!)">
        <Pencil class="mr-2 h-4 w-4" />
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem v-if="data.status !== 'FATURADA'" @click="abrirFaturamento(data.id!)">
        <Wallet class="mr-2 h-4 w-4" />
        Faturar
      </DropdownMenuItem>
      <DropdownMenuItem v-else @click="estornar(data.id!)">
        <RotateCcw class="mr-2 h-4 w-4" />
        Estornar faturamento
      </DropdownMenuItem>
      <DropdownMenuItem @click="abrirCobranca(data.id!)">
        <CircleDollarSign class="mr-2 h-4 w-4" />
        Gerar cobrança
      </DropdownMenuItem>
      <DropdownMenuItem @click="confirmarAcao(data.id!, data.Uid!)">
        <FileArchive class="mr-2 h-4 w-4" />
        PDF A4
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-danger" @click="deletar(data.id!)">
        <i class="fa-regular fa-trash-can mr-1"></i>
        Excluir
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
