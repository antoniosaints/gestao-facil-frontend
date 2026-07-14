<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUiStore } from '@/stores/ui/uiStore'
import { HashGenerator } from '@/utils/generators'
import { resolveFileUrl } from '@/utils/fileUrl'
import { LojaRepository, type LojaConfig, type LojaHeaderEstilo } from '@/repositories/loja-repository'
import { ExternalLink, ImagePlus, LoaderCircle, Package, Save, Store, Trash2 } from 'lucide-vue-next'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(true)
const saving = ref(false)
const uploadingBanner = ref(false)
const bannerInput = ref<HTMLInputElement | null>(null)

const config = reactive<LojaConfig>({
  corPrimaria: '#4f46e5',
  corSecundaria: '#0ea5e9',
  headerEstilo: 'padrao',
  bannerUrl: null,
  bannerTitulo: null,
  bannerSubtitulo: null,
  mensagemBoasVindas: null,
  mostrarPrecos: true,
  pedidoWhatsapp: true,
  permitirLogin: false,
  permitirCadastro: false,
})

const lojaLink = computed(() => {
  const id = uiStore.contaInfo.id
  if (!id) return ''
  return `${window.location.origin}/catalogo/${HashGenerator.encode(id)}`
})

const bannerSrc = computed(() => (config.bannerUrl ? resolveFileUrl(config.bannerUrl, { bustCache: true }) : ''))
const nomeLoja = computed(() => uiStore.contaInfo.nomeFantasia || uiStore.contaInfo.nome || 'Minha Loja')

const headerOpcoes: { valor: LojaHeaderEstilo; nome: string; descricao: string }[] = [
  { valor: 'padrao', nome: 'Padrão', descricao: 'Logo à esquerda, nome ao lado.' },
  { valor: 'centralizado', nome: 'Centralizado', descricao: 'Logo e nome centralizados.' },
  { valor: 'banner', nome: 'Com banner', descricao: 'Destaque com imagem de capa.' },
]

async function carregar() {
  loading.value = true
  try {
    const data = await LojaRepository.getConfig()
    Object.assign(config, data)
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar a configuração da loja.')
  } finally {
    loading.value = false
  }
}

async function salvar() {
  try {
    saving.value = true
    const data = await LojaRepository.saveConfig({
      corPrimaria: config.corPrimaria,
      corSecundaria: config.corSecundaria,
      headerEstilo: config.headerEstilo,
      bannerTitulo: config.bannerTitulo?.trim() || null,
      bannerSubtitulo: config.bannerSubtitulo?.trim() || null,
      mensagemBoasVindas: config.mensagemBoasVindas?.trim() || null,
      mostrarPrecos: config.mostrarPrecos,
      pedidoWhatsapp: config.pedidoWhatsapp,
    })
    Object.assign(config, data)
    toast.success('Loja atualizada com sucesso.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível salvar a loja.')
  } finally {
    saving.value = false
  }
}

function pickBanner() {
  bannerInput.value?.click()
}

async function onBannerSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.warning('Selecione uma imagem para o banner.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.warning('O banner excede o limite de 5MB.')
    return
  }
  try {
    uploadingBanner.value = true
    const data = await LojaRepository.uploadBanner(file)
    config.bannerUrl = data.bannerUrl
    toast.success('Banner enviado.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível enviar o banner.')
  } finally {
    uploadingBanner.value = false
  }
}

async function removerBanner() {
  try {
    await LojaRepository.removeBanner()
    config.bannerUrl = null
    toast.success('Banner removido.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível remover o banner.')
  }
}

function abrirLoja() {
  if (lojaLink.value) window.open(lojaLink.value, '_blank')
}

onMounted(carregar)
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Store class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Loja Virtual
        </h2>
        <p class="text-sm text-muted-foreground">Personalize a aparência da sua loja online.</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="!lojaLink" @click="abrirLoja">
          <ExternalLink class="mr-1 h-4 w-4" /> Abrir loja
        </Button>
        <Button class="text-white" :disabled="saving || loading" @click="salvar">
          <LoaderCircle v-if="saving" class="mr-1 h-4 w-4 animate-spin" />
          <Save v-else class="mr-1 h-4 w-4" />
          Salvar
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20 text-muted-foreground">
      <LoaderCircle class="mr-2 h-5 w-5 animate-spin" /> Carregando...
    </div>

    <div v-else class="grid gap-4 lg:grid-cols-5">
      <!-- Formulário -->
      <div class="space-y-4 lg:col-span-3">
        <Card>
          <CardHeader class="py-3"><CardTitle class="text-base">Cores</CardTitle></CardHeader>
          <CardContent class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <Label class="text-xs">Cor primária</Label>
              <div class="flex items-center gap-2">
                <input v-model="config.corPrimaria" type="color" class="h-9 w-12 cursor-pointer rounded border bg-transparent" />
                <Input v-model="config.corPrimaria" class="h-9" />
              </div>
            </div>
            <div class="space-y-1">
              <Label class="text-xs">Cor secundária</Label>
              <div class="flex items-center gap-2">
                <input v-model="config.corSecundaria" type="color" class="h-9 w-12 cursor-pointer rounded border bg-transparent" />
                <Input v-model="config.corSecundaria" class="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="py-3"><CardTitle class="text-base">Formato do cabeçalho</CardTitle></CardHeader>
          <CardContent class="grid gap-2 sm:grid-cols-3">
            <button
              v-for="op in headerOpcoes"
              :key="op.valor"
              type="button"
              class="rounded-lg border p-3 text-left transition"
              :class="config.headerEstilo === op.valor ? 'border-primary ring-1 ring-primary' : 'hover:bg-muted'"
              @click="config.headerEstilo = op.valor"
            >
              <span class="block text-sm font-medium">{{ op.nome }}</span>
              <span class="block text-xs text-muted-foreground">{{ op.descricao }}</span>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="py-3"><CardTitle class="text-base">Banner / capa</CardTitle></CardHeader>
          <CardContent class="space-y-3">
            <div class="aspect-[16/6] w-full overflow-hidden rounded-lg border bg-muted/40">
              <img v-if="bannerSrc" :src="bannerSrc" alt="Banner" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImagePlus class="h-8 w-8" />
              </div>
            </div>
            <input ref="bannerInput" type="file" accept="image/*" class="hidden" @change="onBannerSelected" />
            <div class="flex gap-2">
              <Button type="button" variant="outline" size="sm" :disabled="uploadingBanner" @click="pickBanner">
                <LoaderCircle v-if="uploadingBanner" class="mr-1 h-4 w-4 animate-spin" />
                <ImagePlus v-else class="mr-1 h-4 w-4" />
                {{ config.bannerUrl ? 'Trocar banner' : 'Enviar banner' }}
              </Button>
              <Button v-if="config.bannerUrl" type="button" variant="outline" size="sm" class="text-red-600" @click="removerBanner">
                <Trash2 class="mr-1 h-4 w-4" /> Remover
              </Button>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1">
                <Label class="text-xs">Título do banner</Label>
                <Input v-model="config.bannerTitulo" placeholder="Ex.: Bem-vindo à nossa loja" />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Subtítulo do banner</Label>
                <Input v-model="config.bannerSubtitulo" placeholder="Ex.: Frete grátis acima de R$ 199" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="py-3"><CardTitle class="text-base">Textos e opções</CardTitle></CardHeader>
          <CardContent class="space-y-3">
            <div class="space-y-1">
              <Label class="text-xs">Mensagem de boas-vindas</Label>
              <Textarea v-model="config.mensagemBoasVindas" rows="2" placeholder="Uma frase curta que aparece no topo da loja." />
            </div>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
              <span>Mostrar preços na loja</span>
              <Switch v-model:model-value="config.mostrarPrecos" />
            </label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
              <span>Botão “Pedir pelo WhatsApp”</span>
              <Switch v-model:model-value="config.pedidoWhatsapp" />
            </label>
          </CardContent>
        </Card>

        <Card class="border-dashed">
          <CardHeader class="py-3"><CardTitle class="text-base">Contas de clientes</CardTitle></CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Login e cadastro de clientes na loja chegam em breve. Você poderá permitir que seus clientes criem contas com e-mail e senha.
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Pré-visualização -->
      <div class="lg:col-span-2">
        <div class="sticky top-4">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
          <div class="overflow-hidden rounded-xl border bg-background shadow-sm">
            <!-- Header -->
            <div
              v-if="config.headerEstilo !== 'banner'"
              class="flex items-center gap-2 px-4 py-3"
              :class="config.headerEstilo === 'centralizado' ? 'justify-center' : ''"
              :style="{ backgroundColor: config.corPrimaria }"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
                <Store class="h-4 w-4" />
              </div>
              <span class="truncate text-sm font-bold text-white">{{ nomeLoja }}</span>
            </div>
            <div
              v-else
              class="relative flex h-28 items-end p-4"
              :style="bannerSrc ? { backgroundImage: `url(${bannerSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: config.corPrimaria }"
            >
              <div class="absolute inset-0 bg-black/35"></div>
              <div class="relative text-white">
                <p class="text-sm font-bold">{{ config.bannerTitulo || nomeLoja }}</p>
                <p v-if="config.bannerSubtitulo" class="text-xs opacity-90">{{ config.bannerSubtitulo }}</p>
              </div>
            </div>

            <div class="p-4">
              <p v-if="config.mensagemBoasVindas" class="mb-3 text-xs text-muted-foreground">{{ config.mensagemBoasVindas }}</p>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="n in 2" :key="n" class="overflow-hidden rounded-lg border">
                  <div class="flex aspect-square items-center justify-center bg-muted/40 text-muted-foreground">
                    <Package class="h-8 w-8" />
                  </div>
                  <div class="p-2">
                    <p class="truncate text-xs font-medium">Produto {{ n }}</p>
                    <p v-if="config.mostrarPrecos" class="text-sm font-bold" :style="{ color: config.corPrimaria }">R$ 99,90</p>
                  </div>
                </div>
              </div>
              <button
                v-if="config.pedidoWhatsapp"
                class="mt-3 w-full rounded-md py-2 text-xs font-medium text-white"
                :style="{ backgroundColor: config.corSecundaria }"
              >
                Pedir pelo WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
