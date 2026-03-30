<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

type CategoriaOption = {
  id?: number
  nome: string
  parentId: number | null
}

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  categoria: CategoriaOption | null
  categoriasPai: CategoriaOption[]
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const saving = ref(false)
const form = ref({
  id: undefined as number | undefined,
  nome: '',
  categoriaPai: 'null',
})

const title = computed(() => (props.categoria ? 'Editar categoria financeira' : 'Nova categoria financeira'))

const description = computed(() =>
  props.categoria
    ? 'Atualize os dados da categoria selecionada.'
    : 'Preencha os dados da nova categoria financeira.',
)

const categoriasPaiDisponiveis = computed(() =>
  props.categoriasPai.filter((item) => item.id !== props.categoria?.id),
)

watch(
  () => [open.value, props.categoria] as const,
  ([isOpen]) => {
    if (!isOpen) return

    form.value = {
      id: props.categoria?.id,
      nome: props.categoria?.nome ?? '',
      categoriaPai: props.categoria?.parentId ? String(props.categoria.parentId) : 'null',
    }
  },
  { immediate: true },
)

async function submit() {
  try {
    if (!form.value.nome.trim()) {
      toast.error('Informe o nome da categoria')
      return
    }

    saving.value = true
    await LancamentosRepository.criarCategoria({
      id: form.value.id,
      nome: form.value.nome.trim(),
      categoriaPai: form.value.categoriaPai !== 'null' ? Number(form.value.categoriaPai) : null,
    })
    toast.success('Categoria salva com sucesso!')
    open.value = false
    emit('saved')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao salvar a categoria')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalView v-model:open="open" :title="title" :description="description" size="md">
    <form @submit.prevent="submit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Nome da categoria *</label>
          <Input v-model="form.nome" type="text" placeholder="Ex: Receita de vendas" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Categoria pai</label>
          <Select v-model="form.categoriaPai">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Selecione a categoria pai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Sem categoria pai</SelectItem>
              <SelectItem v-for="item in categoriasPaiDisponiveis" :key="item.id" :value="String(item.id)">
                {{ item.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="md:col-span-2 flex gap-2 justify-end">
          <Button type="button" variant="secondary" @click="open = false">Fechar</Button>
          <Button :disabled="saving" class="bg-primary text-white hover:bg-primary/90">
            {{ saving ? 'Salvando...' : 'Salvar categoria' }}
          </Button>
        </div>
      </div>
    </form>
  </ModalView>
</template>
