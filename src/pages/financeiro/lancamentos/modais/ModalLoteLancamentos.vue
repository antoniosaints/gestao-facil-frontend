<template>
  <ModalView
    v-model:open="store.openModalLote"
    title="Lançamentos em lote"
    description="Baixe o CSV modelo, preencha as linhas e importe os lançamentos em uma única remessa."
    size="lg"
  >
    <form @submit.prevent="submit" class="grid gap-4 px-4">
      <div class="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
        <p class="font-medium text-foreground">Campos principais do CSV</p>
        <p class="mt-1">
          descrição, tipo, dataLancamento, valor, modoValorParcelamento, tipoLancamentoModo, parcelas,
          periodoParcelamento, cliente, categoria e contaFinanceira.
        </p>
      </div>

      <div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Label for="arquivoCsvLancamentos">Arquivo CSV</Label>
          <Input
            id="arquivoCsvLancamentos"
            accept=".csv,text/csv"
            type="file"
            class="mt-1 h-auto py-2"
            @change="onFileChange"
          />
          <p v-if="file" class="mt-1 text-xs text-muted-foreground">
            Selecionado: {{ file.name }}
          </p>
        </div>
        <Button type="button" variant="outline" @click="downloadCSV">
          <Download class="h-4 w-4" /> Baixar modelo
        </Button>
      </div>

      <div v-if="resultado" class="rounded-xl border bg-card p-4">
        <p class="text-sm font-medium text-foreground">Resultado da última importação</p>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ resultado.inseridos }} lançamento(s) importado(s)
          <span v-if="resultado.erros.length">• {{ resultado.erros.length }} linha(s) com erro</span>
        </p>
        <ul v-if="resultado.erros.length" class="mt-3 max-h-40 space-y-1 overflow-auto text-xs text-rose-600">
          <li v-for="item in resultado.erros" :key="`${item.linha}-${item.erro}`">
            Linha {{ item.linha }}: {{ item.erro }}
          </li>
        </ul>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" @click="store.openModalLote = false">Fechar</Button>
        <Button class="text-white" :disabled="loading" type="submit">
          <Upload class="h-4 w-4" /> {{ loading ? 'Importando...' : 'Importar CSV' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>

<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { Download, Upload } from 'lucide-vue-next'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'

const store = useLancamentosStore()
const toast = useToast()

const loading = ref(false)
const file = ref<File | null>(null)
const resultado = ref<{
  inseridos: number
  erros: Array<{ linha: number; erro: string }>
} | null>(null)

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  file.value = target.files?.[0] || null
}

async function downloadCSV() {
  try {
    await LancamentosRepository.downloadCsvModelo()
    toast.success('Modelo CSV baixado com sucesso')
  } catch (error) {
    console.error(error)
    toast.error('Não foi possível baixar o modelo CSV')
  }
}

async function submit() {
  if (!file.value) {
    toast.error('Selecione um arquivo CSV')
    return
  }

  try {
    loading.value = true
    const response = await LancamentosRepository.importarCsv(file.value)
    resultado.value = {
      inseridos: response.inseridos || 0,
      erros: response.erros || [],
    }

    store.updateTable()

    if (resultado.value.erros.length) {
      toast.warning(
        `Importação concluída com ${resultado.value.inseridos} lançamento(s) e ${resultado.value.erros.length} erro(s).`,
      )
      return
    }

    toast.success(`${resultado.value.inseridos} lançamento(s) importado(s) com sucesso`)
    store.openModalLote = false
    file.value = null
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao importar lançamentos em lote')
  } finally {
    loading.value = false
  }
}
</script>
