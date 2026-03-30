<script setup lang="ts">
import { computed, ref } from 'vue'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { useToast } from 'vue-toastification'
import { FileDown, LoaderCircle } from 'lucide-vue-next'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { VendaRepository } from '@/repositories/venda-repository'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()
const loading = ref(false)
const filtroPeriodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

function getPeriodoFormatado() {
  const [inicio, fim] = filtroPeriodo.value

  return {
    inicio: format(inicio, "yyyy-MM-dd'T'00:00:00"),
    fim: format(fim, "yyyy-MM-dd'T'23:59:59"),
  }
}

async function exportarRelatorio() {
  try {
    loading.value = true

    const { inicio, fim } = getPeriodoFormatado()
    await VendaRepository.gerarRelatorioPDF(inicio, fim)
    toast.success('Relatório gerado com sucesso.')
    openModel.value = false
  } catch (error) {
    console.error(error)
    toast.error('Erro ao gerar o relatório de vendas.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="openModel"
    title="Exportar relatório de vendas"
    description="Selecione o período para gerar um PDF com resumo de vendas e visão financeira."
    size="md"
  >
    <div class="space-y-4 px-4">
      <div class="rounded-xl border border-border bg-muted/30 p-4">
        <div class="font-medium text-foreground">Período do relatório</div>
        <div class="mt-1 text-sm text-muted-foreground">
          O PDF incluirá vendas, cobranças vinculadas, custos estimados, receitas, despesas e resultado líquido.
        </div>
      </div>

      <Calendarpicker v-model="filtroPeriodo" :range="true" :teleport="true" />

      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" :disabled="loading" @click="openModel = false">
          Fechar
        </Button>
        <Button type="button" class="text-white" :disabled="loading" @click="exportarRelatorio">
          <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
          <FileDown v-else class="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>
    </div>
  </ModalView>
</template>
