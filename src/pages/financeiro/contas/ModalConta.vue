<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ImagePlus, Trash2, Wallet } from 'lucide-vue-next'
import { isAxiosError } from 'axios'
import { useToast } from 'vue-toastification'

import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import type { ContasFinanceiro } from '@/types/schemas'
import { formatToNumberValue } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  conta: ContasFinanceiro | null
  somenteCalculos?: boolean
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
  ignorarNosCalculos: false,
  corDestaque: '#2563EB',
  icone: null as string | null,
})

const title = computed(() => {
  if (props.somenteCalculos) return 'Cálculos gerais'
  return props.conta ? 'Editar conta financeira' : 'Nova conta financeira'
})
const description = computed(() => props.conta?.nome ?? 'Cadastre uma conta para registrar receitas e despesas.')

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
    saldoInicial: String(props.conta?.saldoInicial ?? 0).replace(".", ","),
    ignorarNosCalculos: props.conta?.ignorarNosCalculos ?? false,
    corDestaque: props.conta?.corDestaque || '#2563EB',
    icone: props.conta?.icone || null,
  }
  iconFile.value = null
  removePersistedIcon.value = false
  iconVersion.value = 0
  resetPreview()
}

watch(
  () => [open.value, props.conta, props.somenteCalculos] as const,
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
  if (saving.value) return
  saving.value = true

  try {
    if (props.somenteCalculos) {
      if (!form.value.id) return
      await LancamentosRepository.atualizarCalculosContaFinanceira(form.value.id, form.value.ignorarNosCalculos)
      toast.success('Participação nos cálculos atualizada.')
      open.value = false
      emit('saved')
      return
    }

    if (!form.value.nome.trim()) {
      toast.error('Informe o nome da conta')
      return
    }

    const saldoInicial = formatToNumberValue(form.value.saldoInicial)
    const saldoOriginal = formatToNumberValue(props.conta?.saldoInicial ?? 0)
    const ignorarNosCalculos = form.value.ignorarNosCalculos
    const novaConta = form.value.id === undefined
    const response = await LancamentosRepository.criarConta({
      id: form.value.id,
      nome: form.value.nome.trim(),
      ...(novaConta || saldoInicial !== saldoOriginal ? { saldoInicial } : {}),
      ...(novaConta || ignorarNosCalculos !== (props.conta?.ignorarNosCalculos ?? false)
        ? { ignorarNosCalculos }
        : {}),
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
    const message = isAxiosError(error) ? error.response?.data?.message : undefined
    toast.error(message || 'Não foi possível salvar a conta.')
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  resetPreview()
})
</script>

<template>
  <ModalView v-model:open="open" :title="title" :description="description" :size="somenteCalculos ? 'lg' : 'xl'">
    <form id="edicaoContaFinanceira" class="space-y-5 px-4" @submit.prevent="submit">
      <fieldset v-if="!somenteCalculos" class="grid min-w-0 gap-4 sm:grid-cols-3" :disabled="saving">
        <div class="space-y-2 sm:col-span-2">
          <Label for="nomeConta">Nome da conta *</Label>
          <Input id="nomeConta" v-model="form.nome" placeholder="Ex.: Nubank PJ" required />
        </div>
        <div class="space-y-2">
          <Label for="saldoInicialConta">Saldo inicial</Label>
          <Input id="saldoInicialConta" v-model="form.saldoInicial" inputmode="decimal" placeholder="0,00" />
        </div>
      </fieldset>

      <fieldset
        v-if="!somenteCalculos"
        :disabled="saving"
        class="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_9rem]"
      >
        <legend class="px-1 text-sm font-medium">Identidade visual</legend>
        <div class="flex min-w-0 items-start gap-3">
          <div
            class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted"
            :style="{ backgroundColor: form.corDestaque + '14', borderColor: form.corDestaque || undefined }"
          >
            <img v-if="imageSrc" :src="imageSrc" alt="Ícone da conta" class="size-full object-cover" />
            <Wallet v-else class="size-5" :style="{ color: form.corDestaque || '#2563EB' }" aria-hidden="true" />
          </div>
          <div class="min-w-0 space-y-2">
            <p class="text-sm font-medium">Ícone da conta</p>
            <input
              ref="iconInput"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="hidden"
              @change="onIconChange"
            />
            <div class="flex flex-wrap gap-1">
              <Button type="button" size="sm" variant="outline" @click="openIconInput">
                <ImagePlus class="size-4" />
                {{ imageSrc ? 'Trocar ícone' : 'Enviar ícone' }}
              </Button>
              <Button v-if="imageSrc" type="button" size="sm" variant="ghost" class="text-destructive" @click="removeIcon">
                <Trash2 class="size-4" />
                Remover
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">Até 512 × 512 px e 5 MB.</p>
          </div>
        </div>
        <div class="space-y-2">
          <Label for="corConta">Cor de destaque</Label>
          <div class="flex h-9 items-center gap-2 rounded-md border px-2">
            <input v-model="form.corDestaque" type="color" aria-label="Escolher cor" class="size-6 shrink-0 border-0 bg-transparent p-0" />
            <Input id="corConta" v-model="form.corDestaque" placeholder="#2563EB" class="h-8 min-w-0 border-0 px-0 shadow-none focus-visible:ring-0" />
          </div>
        </div>
      </fieldset>

      <div class="flex items-center justify-between gap-4 rounded-xl border p-4">
        <div class="space-y-1">
          <Label for="ignorarContaNosCalculos">Ignorar nos cálculos gerais</Label>
          <p id="ignorarContaNosCalculosDescricao" class="text-xs text-muted-foreground">
            A conta mantém o saldo próprio e continua disponível para receitas e despesas.
          </p>
        </div>
        <Switch
          id="ignorarContaNosCalculos"
          v-model="form.ignorarNosCalculos"
          :disabled="saving"
          aria-describedby="ignorarContaNosCalculosDescricao"
          class="shrink-0"
        />
      </div>

    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" class="flex-1 sm:flex-none" :disabled="saving" @click="open = false">
          Cancelar
        </Button>
        <Button type="submit" form="edicaoContaFinanceira" class="flex-1 sm:flex-none" :disabled="saving">
          {{ saving ? 'Salvando...' : somenteCalculos ? 'Salvar configuração' : 'Salvar conta' }}
        </Button>
      </div>
    </template>
  </ModalView>
</template>
