<template>
  <span class="inline-flex">
    <Button type="button" :variant="variant" :size="size" :class="buttonClass" :title="title" @click="abrir">
      <Sparkles class="h-4 w-4" :class="{ 'mr-1': !iconOnly }" />
      <span v-if="!iconOnly">{{ buttonLabel }}</span>
    </Button>

    <ModalView v-model:open="open" :title="title" :icon="Sparkles" size="lg"
      description="Gere ou melhore o texto com IA. Revise antes de aplicar.">
      <div class="grid gap-4 px-4">
        <div class="flex flex-wrap gap-2">
          <Button v-for="m in modos" :key="m" type="button" size="sm"
            :variant="ultimoModo === m ? 'default' : 'outline'"
            :class="ultimoModo === m ? 'text-white' : ''"
            :disabled="loading || ((m === 'melhorar' || m === 'resumir') && !temTexto)"
            @click="gerar(m)">
            {{ rotuloModo[m] }}
          </Button>
        </div>

        <div v-if="loading" class="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <LoaderCircle class="h-4 w-4 animate-spin" /> Gerando com IA...
        </div>

        <div v-else-if="resultado" class="grid gap-2">
          <label class="text-xs font-medium text-muted-foreground">Resultado (editável)</label>
          <Textarea v-model="resultado" rows="6" class="bg-background dark:bg-background/60" />
        </div>

        <p v-else class="py-4 text-center text-sm text-muted-foreground">
          Escolha uma ação acima para gerar o texto.
        </p>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="open = false">Fechar</Button>
          <Button type="button" variant="outline" :disabled="loading || !ultimoModo" @click="gerar(ultimoModo!)">
            <RefreshCw class="h-4 w-4" /> Regenerar
          </Button>
          <Button type="button" class="text-white" :disabled="!resultado.trim()" @click="aceitar">
            <Check class="h-4 w-4" /> Aplicar
          </Button>
        </div>
      </div>
    </ModalView>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import ModalView from '@/components/formulario/ModalView.vue'
import { Check, LoaderCircle, RefreshCw, Sparkles } from 'lucide-vue-next'
import { IaRepository, isIaQuotaError } from '@/repositories/ia-repository'

type Modo = 'gerar' | 'melhorar' | 'resumir'

const props = withDefaults(
  defineProps<{
    modos?: Modo[]
    contexto?: string
    // Geração customizada (ex.: descrição de produto, OS). Recebe o modo e devolve o texto.
    customGenerate?: (modo: Modo) => Promise<string>
    title?: string
    buttonLabel?: string
    iconOnly?: boolean
    variant?: 'default' | 'outline' | 'secondary' | 'ghost'
    size?: 'default' | 'sm' | 'icon'
    buttonClass?: string
  }>(),
  {
    modos: () => ['gerar', 'melhorar', 'resumir'],
    title: 'Assistente de IA',
    buttonLabel: 'IA',
    iconOnly: false,
    variant: 'outline',
    size: 'sm',
    buttonClass: '',
  },
)

const model = defineModel<string | null>({ default: '' })
const toast = useToast()

const open = ref(false)
const loading = ref(false)
const resultado = ref('')
const ultimoModo = ref<Modo | null>(null)

const temTexto = computed(() => !!(model.value && model.value.trim()))

const rotuloModo: Record<Modo, string> = {
  gerar: 'Gerar',
  melhorar: 'Melhorar',
  resumir: 'Resumir',
}

function abrir() {
  resultado.value = ''
  ultimoModo.value = null
  open.value = true
}

async function gerar(modo: Modo) {
  ultimoModo.value = modo
  loading.value = true
  try {
    let text: string
    if (props.customGenerate) {
      text = await props.customGenerate(modo)
    } else {
      const r = await IaRepository.texto({ modo, texto: model.value, contexto: props.contexto })
      text = r.text
    }
    resultado.value = (text || '').trim()
  } catch (e: any) {
    if (isIaQuotaError(e)) {
      toast.error('Limite mensal de IA do plano atingido. Fale com o administrador.')
    } else {
      toast.error(e?.response?.data?.message || 'Erro ao gerar com IA')
    }
  } finally {
    loading.value = false
  }
}

function aceitar() {
  model.value = resultado.value
  open.value = false
}
</script>
