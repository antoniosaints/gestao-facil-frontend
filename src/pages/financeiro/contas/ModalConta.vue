<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ImagePlus, Palette, Trash2, Wallet } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import type { ContasFinanceiro } from '@/types/schemas'
import { formatToNumberValue } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  conta: ContasFinanceiro | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const saving = ref(false)
const iconInput = ref<HTMLInputElement | null>(null)
const iconFile = ref<File | null>(null)
const iconPreview = ref<string | null>(null)
const iconVersion = ref(0)
const removePersistedIcon = ref(false)

const form = ref({
  id: undefined as number | undefined,
  nome: '',
  saldoInicial: '',
  corDestaque: '#2563EB',
  icone: null as string | null,
})

const title = computed(() => (props.conta ? 'Editar conta financeira' : 'Nova conta financeira'))

const description = computed(() =>
  props.conta
    ? 'Atualize os dados, a identidade visual e o ícone da conta selecionada.'
    : 'Preencha os dados da nova conta financeira.',
)

const imageSrc = computed(() => {
  if (iconPreview.value) return iconPreview.value
  if (removePersistedIcon.value) return null
  if (!form.value.icone) return null
  return resolveFileUrl(form.value.icone, { fallback: '/imgs/logo.png', bustCache: iconVersion.value > 0 })
})

function resetPreview() {
  if (iconPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(iconPreview.value)
  }
  iconPreview.value = null
}

function openIconInput() {
  iconInput.value?.click()
}

function resetForm() {
  form.value = {
    id: props.conta?.id,
    nome: props.conta?.nome ?? '',
    saldoInicial: String(props.conta?.saldoInicial ?? 0),
    corDestaque: props.conta?.corDestaque || '#2563EB',
    icone: props.conta?.icone || null,
  }
  iconFile.value = null
  removePersistedIcon.value = false
  iconVersion.value = 0
  resetPreview()
}

watch(
  () => [open.value, props.conta] as const,
  ([isOpen]) => {
    if (!isOpen) return
    resetForm()
  },
  { immediate: true },
)

function removeIcon() {
  iconFile.value = null
  resetPreview()

  if (form.value.icone) {
    removePersistedIcon.value = true
  }
}

async function validateImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ width: image.width, height: image.height })
      image.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'))
      image.src = objectUrl
    })

    if (dimensions.width > 512 || dimensions.height > 512) {
      throw new Error('O ícone deve ter no máximo 512x512 pixels.')
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function onIconChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.error('O ícone deve ter no máximo 5MB.')
    input.value = ''
    return
  }

  try {
    await validateImageDimensions(file)
  } catch (error: any) {
    toast.error(error?.message || 'Imagem inválida para o ícone.')
    input.value = ''
    return
  }

  resetPreview()
  iconFile.value = file
  iconPreview.value = URL.createObjectURL(file)
  removePersistedIcon.value = false
  input.value = ''
}

async function submit() {
  try {
    if (!form.value.nome.trim()) {
      toast.error('Informe o nome da conta')
      return
    }

    saving.value = true
    const response = await LancamentosRepository.criarConta({
      id: form.value.id,
      nome: form.value.nome.trim(),
      saldoInicial: formatToNumberValue(form.value.saldoInicial || 0),
      corDestaque: form.value.corDestaque || null,
      removeIcon: removePersistedIcon.value,
    })

    const contaId = Number(response?.data?.id || form.value.id)

    if (contaId && iconFile.value) {
      await LancamentosRepository.uploadContaFinanceiraIcon(contaId, iconFile.value)
      iconVersion.value = Date.now()
    }

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

onBeforeUnmount(() => {
  resetPreview()
})
</script>

<template>
  <ModalView v-model:open="open" :title="title" :description="description" size="lg">
    <form @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-6 px-4">
        <div class="grid gap-4 grid-cols-1 md:grid-cols-3">
          <div class="space-y-3">
            <div
              class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted"
              :style="{ backgroundColor: `${form.corDestaque}14`, borderColor: form.corDestaque || undefined }"
            >
              <img v-if="imageSrc" :src="imageSrc" alt="Ícone da conta" class="h-full w-full object-cover" />
              <Wallet v-else class="h-8 w-8" :style="{ color: form.corDestaque || '#2563EB' }" />
            </div>
            <input
              ref="iconInput"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="hidden"
              @change="onIconChange"
            />
            <Button type="button" variant="outline" class="w-full" @click="openIconInput">
              <ImagePlus class="mr-2 h-4 w-4" />
              {{ iconFile ? 'Trocar ícone' : 'Enviar ícone' }}
            </Button>
            <Button
              v-if="imageSrc || form.icone"
              type="button"
              variant="outline"
              class="w-full"
              @click="removeIcon"
            >
              <Trash2 class="mr-2 h-4 w-4" />
              Remover ícone
            </Button>
            <p class="text-xs text-muted-foreground">Imagem opcional com até 512x512 e 5MB.</p>
          </div>

          <div class="grid grid-cols-1 gap-4 col-span-2">
            <div>
              <label class="mb-1 block text-sm font-medium">Nome da conta *</label>
              <Input v-model="form.nome" type="text" placeholder="Ex: Nubank PJ" />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Saldo inicial</label>
              <Input v-model="form.saldoInicial" type="number" step="0.01" placeholder="0,00" />
              <p class="mt-1 text-xs text-muted-foreground">Usado como ponto de partida dos saldos da conta financeira.</p>
            </div>

            <div>
              <label class="mb-1 flex items-center gap-2 text-sm font-medium">
                <Palette class="h-4 w-4" />
                Cor de destaque
              </label>
              <div class="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                <input v-model="form.corDestaque" type="color" class="h-10 w-12 rounded border-0 bg-transparent p-0" />
                <Input v-model="form.corDestaque" placeholder="#2563EB" class="border-0 px-0 shadow-none focus-visible:ring-0" />
              </div>
              <p class="mt-1 text-xs text-muted-foreground">A cor aparece nos cards e identificadores visuais da conta.</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="open = false">Fechar</Button>
          <Button :disabled="saving" class="bg-primary text-white hover:bg-primary/90">
            {{ saving ? 'Salvando...' : 'Salvar conta' }}
          </Button>
        </div>
      </div>
    </form>
  </ModalView>
</template>
