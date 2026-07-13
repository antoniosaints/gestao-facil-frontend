<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, KeyRound, LoaderCircle, RotateCcw, ShieldAlert, CheckCircle2 } from 'lucide-vue-next'
import {
  IaAdminRepository,
  type IaCoreConfig,
  type IaCoreConfigPayload,
  type IaModelo,
} from '@/repositories/ia-admin-repository'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const config = ref<IaCoreConfig | null>(null)
const modelos = ref<IaModelo[]>([])

// Formulário: a chave só é enviada quando o CEO digita uma nova (não recarregamos a existente).
const form = ref<{ modelId: string; apiKey: string; systemPrompt: string; ativo: boolean }>({
  modelId: '',
  apiKey: '',
  systemPrompt: '',
  ativo: true,
})

async function load() {
  try {
    loading.value = true
    const [cfg, listaModelos] = await Promise.all([
      IaAdminRepository.getCoreConfig(),
      IaAdminRepository.listModelos().catch(() => [] as IaModelo[]),
    ])
    config.value = cfg
    modelos.value = listaModelos
    form.value = {
      modelId: cfg.modelId,
      apiKey: '',
      systemPrompt: cfg.systemPrompt,
      ativo: cfg.ativo,
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar a configuração do Core IA.')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!form.value.modelId.trim()) {
    toast.warning('Informe o modelo que o Core IA vai usar.')
    return
  }
  const payload: IaCoreConfigPayload = {
    modelId: form.value.modelId.trim(),
    systemPrompt: form.value.systemPrompt,
    ativo: form.value.ativo,
  }
  // Só envia a chave quando o CEO digitou uma nova.
  if (form.value.apiKey.trim()) payload.apiKey = form.value.apiKey.trim()

  try {
    saving.value = true
    config.value = await IaAdminRepository.saveCoreConfig(payload)
    form.value.apiKey = ''
    form.value.systemPrompt = config.value.systemPrompt
    toast.success('Configuração do Core IA salva.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível salvar a configuração.')
  } finally {
    saving.value = false
  }
}

function restaurarPromptPadrao() {
  if (config.value) form.value.systemPrompt = config.value.defaultSystemPrompt
}

onMounted(load)
</script>

<template>
  <div class="container mx-auto flex max-w-3xl flex-col gap-4 py-4">
    <header class="flex items-center gap-3">
      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Bot class="h-6 w-6" />
      </div>
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Core IA</h1>
        <p class="text-sm text-muted-foreground">
          Configure o assistente interno que atende os clientes do sistema: modelo, chave de API dedicada, prompt e comportamento.
        </p>
      </div>
    </header>

    <div v-if="loading && !config" class="flex items-center justify-center p-10 text-sm text-muted-foreground">
      <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando...
    </div>

    <Card v-else class="border-border/70 bg-card shadow-sm">
      <CardHeader class="pb-4">
        <CardTitle class="flex items-center gap-2 text-base font-semibold">
          <Bot class="h-4 w-4 text-primary" />
          Configuração do assistente
        </CardTitle>
        <CardDescription>
          Vale para o chat "Core IA" de todos os assinantes com o app ativo. As alterações valem para as próximas conversas.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Ativo -->
        <div class="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 p-3">
          <div>
            <div class="text-sm font-medium text-foreground">Core IA ativo</div>
            <div class="text-xs text-muted-foreground">Desligado, o chat responde que o assistente está indisponível.</div>
          </div>
          <Switch :model-value="form.ativo" @update:model-value="(v) => (form.ativo = Boolean(v))" />
        </div>

        <!-- Modelo -->
        <div class="space-y-1">
          <Label for="core-modelo">Modelo</Label>
          <Input id="core-modelo" v-model="form.modelId" placeholder="Ex.: gemini-2.0-flash" list="core-modelos-sugeridos" />
          <datalist id="core-modelos-sugeridos">
            <option v-for="modelo in modelos" :key="modelo.id" :value="modelo.modelId">{{ modelo.nome }}</option>
          </datalist>
          <p class="text-[11px] text-muted-foreground">
            Identificador exato do provedor (Gemini). Use um modelo mais capaz para respostas melhores.
          </p>
        </div>

        <!-- Chave de API dedicada -->
        <div class="space-y-1">
          <Label for="core-apikey">Chave de API dedicada</Label>
          <div class="relative">
            <KeyRound class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="core-apikey"
              v-model="form.apiKey"
              type="password"
              autocomplete="off"
              class="pl-9"
              :placeholder="config?.apiKeyConfigured ? `Chave atual: ${config.apiKeyMasked} — digite para trocar` : 'Cole a chave de API do Core IA'"
            />
          </div>
          <p class="flex items-center gap-1.5 text-[11px]" :class="config?.apiKeyConfigured ? 'text-green-600' : 'text-amber-600'">
            <CheckCircle2 v-if="config?.apiKeyConfigured" class="h-3.5 w-3.5" />
            <ShieldAlert v-else class="h-3.5 w-3.5" />
            {{ config?.apiKeyConfigured ? 'Chave dedicada configurada. Deixe em branco para manter.' : 'Sem chave dedicada — usando a chave padrão do ambiente.' }}
          </p>
        </div>

        <!-- Prompt de sistema -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <Label for="core-prompt">Prompt de sistema (comportamento)</Label>
            <Button type="button" variant="ghost" size="sm" class="h-7 gap-1 text-xs" @click="restaurarPromptPadrao">
              <RotateCcw class="h-3.5 w-3.5" /> Restaurar padrão
            </Button>
          </div>
          <Textarea id="core-prompt" v-model="form.systemPrompt" rows="10" class="font-mono text-xs" placeholder="Defina a personalidade e as regras do assistente..." />
          <p class="text-[11px] text-muted-foreground">
            A data atual e o link do site são anexados automaticamente. As ferramentas do ERP continuam disponíveis.
          </p>
        </div>
      </CardContent>
      <CardFooter class="justify-end border-t pt-4">
        <Button class="text-white" :disabled="saving" @click="save">
          <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          {{ saving ? 'Salvando...' : 'Salvar configuração' }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
