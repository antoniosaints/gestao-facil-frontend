<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { moneyMaskOptions } from '@/lib/imaska'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { formatToNumberValue } from '@/utils/formatters'
import { vMaska } from 'maska/vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const store = useLancamentosStore()

async function registrarAlteracao() {
  try {
    if (!store.idMutation) return toast.error('Nenhuma parcela selecionada')

    await LancamentosRepository.atualizarParcela(store.idMutation, {
      vencimento: store.formParcela.vencimento.toISOString(),
      valor: formatToNumberValue(store.formParcela.valor as string),
      escopo: store.formParcela.escopo,
    })

    toast.success('Parcela atualizada com sucesso!')
    store.openModalParcela = false
    store.resetFormParcela()
    store.updateTable()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar a parcela, tente novamente.')
  }
}
</script>

<template>
  <ModalView
    v-model:open="store.openModalParcela"
    size="md"
    title="Editar parcela"
    description="Atualize a parcela atual ou replique a alteração para outras parcelas do mesmo lançamento."
  >
    <form @submit.prevent="registrarAlteracao" class="grid grid-cols-1 gap-2 px-4">
      <div>
        <Label>Vencimento</Label>
        <Calendarpicker required :teleport="true" v-model="store.formParcela.vencimento" />
      </div>
      <div>
        <Label>Valor</Label>
        <Input
          type="text"
          required
          v-model="(store.formParcela.valor as string)"
          placeholder="R$ 0,00"
          v-maska="moneyMaskOptions"
        />
      </div>
      <div>
        <Label>Aplicar alteração em</Label>
        <Select v-model="store.formParcela.escopo">
          <SelectTrigger>
            <SelectValue placeholder="Selecione o escopo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ATUAL">Somente esta parcela</SelectItem>
            <SelectItem value="TODAS">Todas as parcelas</SelectItem>
            <SelectItem value="PENDENTES">Somente as pendentes</SelectItem>
            <SelectItem value="PAGAS">Somente as pagas</SelectItem>
            <SelectItem value="ATUAL_EM_DIANTE">Da atual para frente</SelectItem>
            <SelectItem value="ATUAL_PARA_TRAS">Da atual para trás</SelectItem>
          </SelectContent>
        </Select>
        <p class="mt-1 text-xs text-muted-foreground">
          A data será deslocada mantendo o intervalo das parcelas selecionadas. O valor informado será aplicado a todas elas.
        </p>
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="store.openModalParcela = false; store.resetFormParcela()">Cancelar</Button>
        <Button variant="default" class="text-white">Registrar</Button>
      </div>
    </form>
  </ModalView>
</template>
