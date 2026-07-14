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
import { resolveFileUrl } from '@/utils/fileUrl'
import { LojaRepository, type LojaConfig, type LojaHeaderEstilo } from '@/repositories/loja-repository'
import { ExternalLink, ImagePlus, LoaderCircle, Package, Save, Store, Trash2 } from 'lucide-vue-next'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(true)
const saving = ref(false)
const uploadingBanner = ref(false)
const uploadingMobileBanner = ref(false)
const bannerInput = ref<HTMLInputElement | null>(null)
const bannerMobileInput = ref<HTMLInputElement | null>(null)

const config = reactive<LojaConfig>({
  slug: '',
  template: 'ESSENCIAL',
  themeVersion: 1,
  themeConfig: { font: 'Inter', radius: 'medio', gridDensity: 'confortavel', cardStyle: 'elevado', bannerHeight: 'medio', bannerOverlay: 25, bannerFocalPoint: 'center' },
  corPrimaria: '#4f46e5',
  corSecundaria: '#0ea5e9',
  headerEstilo: 'padrao',
  bannerUrl: null,
  bannerMobileUrl: null,
  bannerTitulo: null,
  bannerSubtitulo: null,
  mensagemBoasVindas: null,
  mostrarPrecos: true,
  mostrarDisponibilidade: true,
  ocultarEsgotados: false,
  quickAdd: true,
  pedidoWhatsapp: true,
  pagamentoOnline: false,
  gatewayPreferido: null,
  permitirLogin: false,
  permitirCadastro: false,
  permitirCheckoutVisitante: true,
  retiradaAtiva: true,
  entregaLocalAtiva: false,
  taxaEntrega: 0,
  freteGratisAcima: null,
  barraAvisoAtiva: false,
  barraAvisoTexto: null,
})

const lojaLink = computed(() => {
  return config.slug ? `${window.location.origin}/lojas/${config.slug}` : ''
})

const bannerSrc = computed(() => (config.bannerUrl ? resolveFileUrl(config.bannerUrl, { bustCache: true }) : ''))
const bannerMobileSrc = computed(() => (config.bannerMobileUrl ? resolveFileUrl(config.bannerMobileUrl, { bustCache: true }) : ''))
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
      slug: config.slug,
      template: config.template,
      themeVersion: config.themeVersion,
      themeConfig: config.themeConfig,
      corPrimaria: config.corPrimaria,
      corSecundaria: config.corSecundaria,
      headerEstilo: config.headerEstilo,
      bannerTitulo: config.bannerTitulo?.trim() || null,
      bannerSubtitulo: config.bannerSubtitulo?.trim() || null,
      mensagemBoasVindas: config.mensagemBoasVindas?.trim() || null,
      mostrarPrecos: config.mostrarPrecos,
      mostrarDisponibilidade: config.mostrarDisponibilidade,
      ocultarEsgotados: config.ocultarEsgotados,
      quickAdd: config.quickAdd,
      pedidoWhatsapp: config.pedidoWhatsapp,
      pagamentoOnline: config.pagamentoOnline,
      gatewayPreferido: config.gatewayPreferido,
      permitirLogin: config.permitirLogin,
      permitirCadastro: config.permitirCadastro,
      permitirCheckoutVisitante: config.permitirCheckoutVisitante,
      retiradaAtiva: config.retiradaAtiva,
      entregaLocalAtiva: config.entregaLocalAtiva,
      taxaEntrega: Number(config.taxaEntrega || 0),
      freteGratisAcima: config.freteGratisAcima ? Number(config.freteGratisAcima) : null,
      barraAvisoAtiva: config.barraAvisoAtiva,
      barraAvisoTexto: config.barraAvisoTexto?.trim() || null,
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

async function onMobileBannerSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]; input.value = ''
  if (!file?.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return toast.warning('Selecione uma imagem de até 5MB.')
  try { uploadingMobileBanner.value = true; const data = await LojaRepository.uploadBanner(file, 'mobile'); config.bannerMobileUrl = data.bannerUrl; toast.success('Banner mobile enviado.') }
  catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível enviar o banner mobile.') }
  finally { uploadingMobileBanner.value = false }
}

async function removerBannerMobile() {
  try { await LojaRepository.removeBanner('mobile'); config.bannerMobileUrl = null; toast.success('Banner mobile removido.') }
  catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível remover o banner mobile.') }
}

function abrirLoja() {
  if (lojaLink.value) window.open(lojaLink.value, '_blank')
}

function updateTheme(key: string, value: string | number) {
  config.themeConfig = { ...(config.themeConfig || {}), [key]: value }
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
          <CardHeader class="py-3"><CardTitle class="text-base">Layout da loja</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-3 sm:grid-cols-3">
              <button v-for="preset in [{ id: 'ESSENCIAL', name: 'Essencial', text: 'Minimalista e direto, com grade densa.' }, { id: 'EDITORIAL', name: 'Editorial', text: 'Hero amplo, tipografia e mais respiro.' }, { id: 'IMPACTO', name: 'Impacto', text: 'Contraste alto, cards grandes e quick-add.' }]" :key="preset.id" type="button" class="rounded-xl border p-4 text-left transition" :class="config.template === preset.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'" @click="config.template = preset.id as any"><span class="font-bold">{{ preset.name }}</span><span class="mt-1 block text-xs text-muted-foreground">{{ preset.text }}</span></button>
            </div>
            <div><Label class="text-xs">Endereço profissional</Label><div class="flex items-center gap-2"><span class="text-sm text-muted-foreground">/lojas/</span><Input v-model="config.slug" class="h-9" /></div></div>
          </CardContent>
        </Card>
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
            <div><Label class="text-xs">Fonte</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" :value="config.themeConfig?.font" @change="updateTheme('font', ($event.target as HTMLSelectElement).value)"><option value="Inter">Inter</option><option value="system">Sistema</option><option value="Georgia">Georgia</option></select></div>
            <div><Label class="text-xs">Arredondamento</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" :value="config.themeConfig?.radius" @change="updateTheme('radius', ($event.target as HTMLSelectElement).value)"><option value="none">Sem arredondamento</option><option value="small">Discreto</option><option value="medio">Médio</option><option value="grande">Grande</option></select></div>
            <div><Label class="text-xs">Densidade da grade</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" :value="config.themeConfig?.gridDensity" @change="updateTheme('gridDensity', ($event.target as HTMLSelectElement).value)"><option value="compacta">Compacta</option><option value="confortavel">Confortável</option><option value="arejada">Arejada</option></select></div>
            <div><Label class="text-xs">Estilo dos cards</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" :value="config.themeConfig?.cardStyle" @change="updateTheme('cardStyle', ($event.target as HTMLSelectElement).value)"><option value="plano">Plano</option><option value="elevado">Elevado</option><option value="contorno">Contorno</option></select></div>
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
                <Input :model-value="config.bannerTitulo ?? ''" placeholder="Ex.: Bem-vindo à nossa loja" @update:model-value="config.bannerTitulo = String($event)" />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Subtítulo do banner</Label>
                <Input :model-value="config.bannerSubtitulo ?? ''" placeholder="Ex.: Frete grátis acima de R$ 199" @update:model-value="config.bannerSubtitulo = String($event)" />
              </div>
            </div>
            <div class="border-t pt-3">
              <Label class="text-xs">Banner mobile</Label>
              <div class="mt-2 flex items-center gap-3"><div class="h-28 w-20 overflow-hidden rounded-lg border bg-muted"><img v-if="bannerMobileSrc" :src="bannerMobileSrc" class="h-full w-full object-cover" /></div><div class="space-y-2"><input ref="bannerMobileInput" type="file" accept="image/*" class="hidden" @change="onMobileBannerSelected" /><Button type="button" variant="outline" size="sm" :disabled="uploadingMobileBanner" @click="bannerMobileInput?.click()"><ImagePlus class="mr-1 h-4 w-4" />{{ config.bannerMobileUrl ? 'Trocar mobile' : 'Enviar mobile' }}</Button><Button v-if="config.bannerMobileUrl" type="button" variant="outline" size="sm" class="ml-2 text-red-600" @click="removerBannerMobile"><Trash2 class="mr-1 h-4 w-4" />Remover</Button></div></div>
            </div>
            <div class="grid gap-3 border-t pt-3 sm:grid-cols-3"><div><Label class="text-xs">Altura</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm" :value="config.themeConfig?.bannerHeight" @change="updateTheme('bannerHeight', ($event.target as HTMLSelectElement).value)"><option value="pequeno">Pequena</option><option value="medio">Média</option><option value="grande">Grande</option></select></div><div><Label class="text-xs">Ponto focal</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm" :value="config.themeConfig?.bannerFocalPoint" @change="updateTheme('bannerFocalPoint', ($event.target as HTMLSelectElement).value)"><option value="center">Centro</option><option value="top">Topo</option><option value="bottom">Base</option><option value="left">Esquerda</option><option value="right">Direita</option></select></div><div><Label class="text-xs">Sobreposição {{ config.themeConfig?.bannerOverlay }}%</Label><input class="mt-2 w-full" type="range" min="0" max="80" :value="Number(config.themeConfig?.bannerOverlay || 0)" @input="updateTheme('bannerOverlay', Number(($event.target as HTMLInputElement).value))" /></div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="py-3"><CardTitle class="text-base">Textos e opções</CardTitle></CardHeader>
          <CardContent class="space-y-3">
            <div class="space-y-1">
              <Label class="text-xs">Mensagem de boas-vindas</Label>
              <Textarea :model-value="config.mensagemBoasVindas ?? ''" rows="2" placeholder="Uma frase curta que aparece no topo da loja." @update:model-value="config.mensagemBoasVindas = String($event)" />
            </div>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
              <span>Mostrar preços na loja</span>
              <Switch v-model:model-value="config.mostrarPrecos" />
            </label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Mostrar disponibilidade</span><Switch v-model:model-value="config.mostrarDisponibilidade" /></label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Ocultar produtos esgotados</span><Switch v-model:model-value="config.ocultarEsgotados" /></label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Adicionar rápido ao carrinho</span><Switch v-model:model-value="config.quickAdd" /></label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
              <span>Botão “Pedir pelo WhatsApp”</span>
              <Switch v-model:model-value="config.pedidoWhatsapp" />
            </label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Barra de aviso promocional</span><Switch v-model:model-value="config.barraAvisoAtiva" /></label>
            <Input v-if="config.barraAvisoAtiva" :model-value="config.barraAvisoTexto ?? ''" placeholder="Ex.: Frete grátis acima de R$ 199" @update:model-value="config.barraAvisoTexto = String($event)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="py-3"><CardTitle class="text-base">Checkout e entrega</CardTitle></CardHeader>
          <CardContent class="space-y-3">
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Pagamento online</span><Switch v-model:model-value="config.pagamentoOnline" /></label>
            <div v-if="config.pagamentoOnline" class="grid grid-cols-2 gap-2"><button v-for="gateway in ['MERCADOPAGO','ABACATEPAY']" :key="gateway" class="rounded-lg border p-3 text-sm font-semibold" :class="config.gatewayPreferido === gateway ? 'border-primary bg-primary/5' : ''" @click="config.gatewayPreferido = gateway as any">{{ gateway === 'MERCADOPAGO' ? 'Mercado Pago' : 'AbacatePay' }}</button></div>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Retirada no local</span><Switch v-model:model-value="config.retiradaAtiva" /></label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Entrega local</span><Switch v-model:model-value="config.entregaLocalAtiva" /></label>
            <div v-if="config.entregaLocalAtiva" class="grid grid-cols-2 gap-3"><div><Label>Taxa fixa</Label><Input v-model.number="config.taxaEntrega" type="number" min="0" /></div><div><Label>Frete grátis acima de</Label><Input :model-value="config.freteGratisAcima ?? ''" type="number" min="0" @update:model-value="config.freteGratisAcima = $event === '' ? null : Number($event)" /></div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="py-3"><CardTitle class="text-base">Clientes</CardTitle></CardHeader>
          <CardContent class="space-y-3">
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Permitir login</span><Switch v-model:model-value="config.permitirLogin" /></label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Permitir cadastro</span><Switch v-model:model-value="config.permitirCadastro" /></label>
            <label class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span>Checkout como visitante</span><Switch v-model:model-value="config.permitirCheckoutVisitante" /></label>
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
