<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import type { ContasFinanceiro } from '@/types/schemas'
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  conta: ContasFinanceiro | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const saving = ref(false)
const form = ref({
  id: undefined as number | undefined,
  nome: '',
})

const title = computed(() => (props.conta ? 'Editar conta financeira' : 'Nova conta financeira'))

const description = computed(() =>
  props.conta ? 'Atualize os dados da conta selecionada.' : 'Preencha os dados da nova conta financeira.',
)

watch(
  () => [open.value, props.conta] as const,
  ([isOpen]) => {
    if (!isOpen) return

    form.value = {
      id: props.conta?.id,
      nome: props.conta?.nome ?? '',
    }
  },
  { immediate: true },
)

async function submit() {
  try {
    if (!form.value.nome.trim()) {
      toast.error('Informe o nome da conta')
      return
    }

    saving.value = true
    await LancamentosRepository.criarConta({
      id: form.value.id,
      nome: form.value.nome.trim(),
    })
    toast.success('Conta salva com sucesso!')
    open.value = false
    emit('saved')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao salvar a conta')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalView v-model:open="open" :title="title" :description="description" size="md">
    <form @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-6 px-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nome da conta *</label>
          <Input v-model="form.nome" type="text" placeholder="Ex: Nubank PJ" />
        </div>

        <div class="flex gap-2 justify-end">
          <Button type="button" variant="secondary" @click="open = false">Fechar</Button>
          <Button :disabled="saving" class="bg-primary text-white hover:bg-primary/90">
            {{ saving ? 'Salvando...' : 'Salvar conta' }}
          </Button>
        </div>
      </div>
    </form>
  </ModalView>
</template>
