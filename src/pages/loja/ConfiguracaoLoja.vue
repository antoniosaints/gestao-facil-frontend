<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useUiStore } from '@/stores/ui/uiStore'
import { resolveFileUrl } from '@/utils/fileUrl'
import { readableForeground } from '@/utils/themeCustomization'
import { LojaRepository, type LojaConfig, type LojaHeaderEstilo } from '@/repositories/loja-repository'
import ToggleRow from './components/ToggleRow.vue'
import SecoesManager from './components/SecoesManager.vue'
import {
  Building2,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  LoaderCircle,
  Package,
  Palette,
  PanelTop,
  Plus,
  Save,
  Store,
  Trash2,
  Type,
  Users,
} from 'lucide-vue-next'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(true)
const saving = ref(false)
const uploadingMobileBanner = ref(false)
const uploadingLogo = ref(false)
const uploadingCarrossel = ref(false)
const bannerMobileInput = ref<HTMLInputElement | null>(null)
const logoInput = ref<HTMLInputElement | null>(null)
const carrosselInput = ref<HTMLInputElement | null>(null)

type SectionId = 'aparencia' | 'cabecalho' | 'banner' | 'conteudo' | 'secoes' | 'vendas' | 'clientes' | 'rodape'
const activeSection = ref<SectionId>('aparencia')
const sections: { id: SectionId; label: string; icon: any; desc: string }[] = [
  { id: 'aparencia', label: 'Aparência', icon: Palette, desc: 'Tema, cores e fundo' },
  { id: 'cabecalho', label: 'Cabeçalho', icon: PanelTop, desc: 'Logo, título e subtítulo' },
  { id: 'banner', label: 'Banner', icon: ImageIcon, desc: 'Capa e carrossel de destaque' },
  { id: 'conteudo', label: 'Conteúdo', icon: Type, desc: 'Textos e exibição de produtos' },
  { id: 'secoes', label: 'Seções', icon: LayoutGrid, desc: 'Vitrines automáticas e personalizadas' },
  { id: 'vendas', label: 'Vendas e entrega', icon: CreditCard, desc: 'Pagamento, retirada e frete' },
  { id: 'clientes', label: 'Clientes', icon: Users, desc: 'Login e checkout' },
  { id: 'rodape', label: 'Rodapé', icon: Building2, desc: 'Dados da empresa e contato' },
]

// Seções automáticas ficam no themeConfig (default: todas ligadas).
const autoSecoes = computed(() => ({
  promocoes: config.themeConfig?.secoesAutomaticas?.promocoes ?? true,
  maisVendidos: config.themeConfig?.secoesAutomaticas?.maisVendidos ?? true,
  novidades: config.themeConfig?.secoesAutomaticas?.novidades ?? true,
}))
function setAutoSecao(key: 'promocoes' | 'maisVendidos' | 'novidades', value: boolean) {
  updateTheme('secoesAutomaticas', { ...autoSecoes.value, [key]: value })
}
const activeSectionMeta = computed(() => sections.find((s) => s.id === activeSection.value)!)

const linkCopied = ref(false)

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
const previewBannerSrc = computed(() => {
  const first = (config.themeConfig?.banners as string[] | undefined)?.[0]
  if (first) return resolveFileUrl(first, { bustCache: true })
  return bannerSrc.value
})
const nomeLoja = computed(() => uiStore.contaInfo.nomeFantasia || uiStore.contaInfo.nome || 'Minha Loja')
const previewHeaderColor = computed(() => String(config.themeConfig?.headerColor || '#ffffff'))
const previewFooterColor = computed(() => String(config.themeConfig?.footerColor || '#ffffff'))
const previewHeaderForeground = computed(() => readableForeground(previewHeaderColor.value))
const previewFooterForeground = computed(() => readableForeground(previewFooterColor.value))

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

async function copiarLink() {
  if (!lojaLink.value) return
  try {
    await navigator.clipboard.writeText(lojaLink.value)
    linkCopied.value = true
    toast.success('Link copiado.')
    setTimeout(() => (linkCopied.value = false), 2000)
  } catch {
    toast.error('Não foi possível copiar o link.')
  }
}

function updateTheme(key: string, value: unknown) {
  config.themeConfig = { ...(config.themeConfig || {}), [key]: value } as any
}
function updateCompany(key: string, value: string) {
  const company = { ...(config.themeConfig?.company || {}), [key]: value }
  updateTheme('company', company)
}

const carrossel = computed<string[]>(() => (config.themeConfig?.banners as string[] | undefined) || [])

async function onLogoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]; input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return toast.warning('Selecione uma imagem de até 5MB.')
  try {
    uploadingLogo.value = true
    const data = await LojaRepository.uploadImage(file, 'logo')
    updateTheme('logoUrl', data.reference)
    toast.success('Logo enviada. Lembre de salvar.')
  } catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível enviar a logo.') }
  finally { uploadingLogo.value = false }
}
function removerLogo() { updateTheme('logoUrl', null) }

async function onCarrosselSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || []); input.value = ''
  if (!files.length) return
  try {
    uploadingCarrossel.value = true
    const atuais = [...carrossel.value]
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { toast.warning(`"${file.name}" ignorada (imagem até 5MB).`); continue }
      if (atuais.length >= 8) { toast.warning('Limite de 8 imagens no carrossel.'); break }
      const data = await LojaRepository.uploadImage(file, 'galeria')
      atuais.push(data.reference)
    }
    updateTheme('banners', atuais)
    toast.success('Imagens adicionadas. Lembre de salvar.')
  } catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível enviar as imagens.') }
  finally { uploadingCarrossel.value = false }
}
function removerImagemCarrossel(index: number) {
  const arr = [...carrossel.value]; arr.splice(index, 1); updateTheme('banners', arr)
}

onMounted(carregar)
</script>

<template>
  <div>
    <!-- Barra superior: endereço da loja + salvar -->
    <div class="mb-4 flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <Label class="text-md text-muted-foreground">Endereço da loja</Label>
        <div class="mt-1 flex items-center gap-1.5">
          <span class="shrink-0 text-sm text-muted-foreground">/lojas/</span>
          <Input v-model="config.slug" class="h-8 max-w-[200px]" placeholder="minha-loja" />
          <Button type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" :disabled="!lojaLink" title="Copiar link" @click="copiarLink">
            <Check v-if="linkCopied" class="h-4 w-4 text-emerald-600" />
            <Copy v-else class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div class="flex shrink-0 gap-2">
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

    <div v-else class="grid gap-4 lg:grid-cols-12">
      <!-- Navegação de seções -->
      <nav class="lg:col-span-3">
        <div class="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          <button
            v-for="sec in sections"
            :key="sec.id"
            type="button"
            class="flex shrink-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition lg:w-full"
            :class="activeSection === sec.id ? 'border-primary bg-primary/5 text-primary' : 'border-transparent hover:bg-muted/60'"
            @click="activeSection = sec.id"
          >
            <component :is="sec.icon" class="h-4 w-4 shrink-0" />
            <span class="min-w-0">
              <span class="block whitespace-nowrap text-sm font-medium lg:whitespace-normal">{{ sec.label }}</span>
              <span class="hidden text-xs text-muted-foreground lg:block">{{ sec.desc }}</span>
            </span>
          </button>
        </div>
      </nav>

      <!-- Conteúdo da seção -->
      <div class="lg:col-span-5">
        <Card>
          <CardContent class="space-y-5 py-5">
            <div class="flex items-center gap-2 border-b pb-3">
              <component :is="activeSectionMeta.icon" class="h-5 w-5 text-primary" />
              <div>
                <h3 class="text-base font-semibold leading-none">{{ activeSectionMeta.label }}</h3>
                <p class="mt-1 text-xs text-muted-foreground">{{ activeSectionMeta.desc }}</p>
              </div>
            </div>

            <!-- APARÊNCIA -->
            <template v-if="activeSection === 'aparencia'">
              <div class="space-y-2">
                <Label class="text-xs font-medium">Modelo da vitrine</Label>
                <div class="grid gap-2 sm:grid-cols-3">
                  <button
                    v-for="preset in [{ id: 'ESSENCIAL', name: 'Essencial', text: 'Minimalista, grade densa.' }, { id: 'EDITORIAL', name: 'Editorial', text: 'Hero amplo, mais respiro.' }, { id: 'IMPACTO', name: 'Impacto', text: 'Contraste alto, cards grandes.' }]"
                    :key="preset.id"
                    type="button"
                    class="rounded-xl border p-3 text-left transition"
                    :class="config.template === preset.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'"
                    @click="config.template = preset.id as any"
                  >
                    <span class="block text-sm font-bold">{{ preset.name }}</span>
                    <span class="mt-1 block text-xs text-muted-foreground">{{ preset.text }}</span>
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-xs font-medium">Cores da marca</Label>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">Primária</Label>
                    <div class="flex items-center gap-2">
                      <input v-model="config.corPrimaria" type="color" class="h-9 w-11 shrink-0 cursor-pointer rounded border bg-transparent" />
                      <Input v-model="config.corPrimaria" class="h-9" />
                    </div>
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">Secundária</Label>
                    <div class="flex items-center gap-2">
                      <input v-model="config.corSecundaria" type="color" class="h-9 w-11 shrink-0 cursor-pointer rounded border bg-transparent" />
                      <Input v-model="config.corSecundaria" class="h-9" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-xs font-medium">Cores de fundo</Label>
                <div class="grid gap-3 sm:grid-cols-3">
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">Loja</Label>
                    <div class="flex items-center gap-2">
                      <input :value="config.themeConfig?.bgColor || '#fafaf9'" type="color" class="h-9 w-11 shrink-0 cursor-pointer rounded border bg-transparent" @input="updateTheme('bgColor', ($event.target as HTMLInputElement).value)" />
                      <Input :model-value="config.themeConfig?.bgColor || ''" placeholder="#fafaf9" class="h-9 min-w-0" @update:model-value="updateTheme('bgColor', String($event).trim() || null)" />
                      <Button v-if="config.themeConfig?.bgColor" type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" title="Restaurar padrão" @click="updateTheme('bgColor', null)"><Trash2 class="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">Cabeçalho</Label>
                    <div class="flex items-center gap-2">
                      <input :value="config.themeConfig?.headerColor || '#ffffff'" type="color" class="h-9 w-11 shrink-0 cursor-pointer rounded border bg-transparent" @input="updateTheme('headerColor', ($event.target as HTMLInputElement).value)" />
                      <Input :model-value="config.themeConfig?.headerColor || ''" placeholder="#ffffff" class="h-9 min-w-0" @update:model-value="updateTheme('headerColor', String($event).trim() || null)" />
                      <Button v-if="config.themeConfig?.headerColor" type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" title="Restaurar padrão" @click="updateTheme('headerColor', null)"><Trash2 class="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">Rodapé</Label>
                    <div class="flex items-center gap-2">
                      <input :value="config.themeConfig?.footerColor || '#ffffff'" type="color" class="h-9 w-11 shrink-0 cursor-pointer rounded border bg-transparent" @input="updateTheme('footerColor', ($event.target as HTMLInputElement).value)" />
                      <Input :model-value="config.themeConfig?.footerColor || ''" placeholder="#ffffff" class="h-9 min-w-0" @update:model-value="updateTheme('footerColor', String($event).trim() || null)" />
                      <Button v-if="config.themeConfig?.footerColor" type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" title="Restaurar padrão" @click="updateTheme('footerColor', null)"><Trash2 class="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground">Defina cores independentes para o conteúdo, o cabeçalho e o rodapé da loja.</p>
              </div>

              <div class="space-y-2">
                <Label class="text-xs font-medium">Cores de destaque</Label>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">Promoções (preço e selo)</Label>
                    <div class="flex items-center gap-2">
                      <input :value="config.themeConfig?.promoColor || '#dc2626'" type="color" class="h-9 w-11 shrink-0 cursor-pointer rounded border bg-transparent" @input="updateTheme('promoColor', ($event.target as HTMLInputElement).value)" />
                      <Input :model-value="config.themeConfig?.promoColor || ''" placeholder="#dc2626" class="h-9" @update:model-value="updateTheme('promoColor', String($event).trim() || null)" />
                      <Button v-if="config.themeConfig?.promoColor" type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" title="Restaurar padrão" @click="updateTheme('promoColor', null)"><Trash2 class="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs text-muted-foreground">Ícones das seções</Label>
                    <div class="flex items-center gap-2">
                      <input :value="config.themeConfig?.sectionIconColor || config.corPrimaria" type="color" class="h-9 w-11 shrink-0 cursor-pointer rounded border bg-transparent" @input="updateTheme('sectionIconColor', ($event.target as HTMLInputElement).value)" />
                      <Input :model-value="config.themeConfig?.sectionIconColor || ''" placeholder="Cor primária" class="h-9" @update:model-value="updateTheme('sectionIconColor', String($event).trim() || null)" />
                      <Button v-if="config.themeConfig?.sectionIconColor" type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" title="Restaurar padrão" @click="updateTheme('sectionIconColor', null)"><Trash2 class="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground">Cor do preço/percentual em promoção e dos ícones dos títulos de seção.</p>
              </div>

              <div class="space-y-2">
                <Label class="text-xs font-medium">Estilo visual</Label>
                <div class="grid grid-cols-2 gap-3">
                  <div><Label class="text-xs text-muted-foreground">Fonte</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" :value="config.themeConfig?.font" @change="updateTheme('font', ($event.target as HTMLSelectElement).value)"><option value="Inter">Inter</option><option value="system">Sistema</option><option value="Georgia">Georgia</option></select></div>
                  <div><Label class="text-xs text-muted-foreground">Arredondamento</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" :value="config.themeConfig?.radius" @change="updateTheme('radius', ($event.target as HTMLSelectElement).value)"><option value="none">Sem arredondamento</option><option value="small">Discreto</option><option value="medio">Médio</option><option value="grande">Grande</option></select></div>
                  <div><Label class="text-xs text-muted-foreground">Densidade da grade</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" :value="config.themeConfig?.gridDensity" @change="updateTheme('gridDensity', ($event.target as HTMLSelectElement).value)"><option value="compacta">Compacta</option><option value="confortavel">Confortável</option><option value="arejada">Arejada</option></select></div>
                  <div><Label class="text-xs text-muted-foreground">Estilo dos cards</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" :value="config.themeConfig?.cardStyle" @change="updateTheme('cardStyle', ($event.target as HTMLSelectElement).value)"><option value="plano">Plano</option><option value="elevado">Elevado</option><option value="contorno">Contorno</option></select></div>
                </div>
              </div>

            </template>

            <!-- CABEÇALHO -->
            <template v-else-if="activeSection === 'cabecalho'">
              <div class="space-y-2">
                <Label class="text-xs font-medium">Logo da loja</Label>
                <div class="flex items-center gap-4">
                  <div class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted/40">
                    <img v-if="config.themeConfig?.logoUrl" :src="resolveFileUrl(config.themeConfig.logoUrl, { bustCache: true })" class="h-full w-full object-cover" />
                    <Store v-else class="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div class="space-y-2">
                    <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="onLogoSelected" />
                    <Button type="button" variant="outline" size="sm" :disabled="uploadingLogo" @click="logoInput?.click()">
                      <LoaderCircle v-if="uploadingLogo" class="mr-1 h-4 w-4 animate-spin" />
                      <ImagePlus v-else class="mr-1 h-4 w-4" />
                      {{ config.themeConfig?.logoUrl ? 'Trocar logo' : 'Enviar logo' }}
                    </Button>
                    <Button v-if="config.themeConfig?.logoUrl" type="button" variant="outline" size="sm" class="ml-2 text-red-600" @click="removerLogo"><Trash2 class="mr-1 h-4 w-4" /> Remover</Button>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground">Ideal quadrada (ex.: 200×200). Sem logo, usamos a inicial da loja.</p>
              </div>

              <div class="space-y-1">
                <Label class="text-xs font-medium">Título do cabeçalho</Label>
                <Input :model-value="config.themeConfig?.headerTitle || ''" :placeholder="nomeLoja" @update:model-value="updateTheme('headerTitle', String($event).trim() || null)" />
              </div>
              <div class="space-y-1">
                <Label class="text-xs font-medium">Subtítulo do cabeçalho</Label>
                <Input :model-value="config.themeConfig?.headerSubtitle || ''" placeholder="Ex.: Loja online" @update:model-value="updateTheme('headerSubtitle', String($event).trim() || null)" />
              </div>

              <div class="space-y-2">
                <Label class="text-xs font-medium">Formato do cabeçalho</Label>
                <div class="grid gap-2 sm:grid-cols-3">
                  <button
                    v-for="op in headerOpcoes"
                    :key="op.valor"
                    type="button"
                    class="rounded-lg border p-3 text-left transition"
                    :class="config.headerEstilo === op.valor ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'"
                    @click="config.headerEstilo = op.valor"
                  >
                    <span class="block text-sm font-medium">{{ op.nome }}</span>
                    <span class="block text-xs text-muted-foreground">{{ op.descricao }}</span>
                  </button>
                </div>
              </div>
            </template>

            <!-- BANNER -->
            <template v-else-if="activeSection === 'banner'">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <Label class="text-xs font-medium">Imagens do banner (desktop)</Label>
                  <span class="text-xs text-muted-foreground">{{ carrossel.length }}/8</span>
                </div>
                <p class="text-xs text-muted-foreground">Uma imagem fica estática; com duas ou mais vira um carrossel automático.</p>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div v-for="(img, i) in carrossel" :key="img + i" class="group relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted/40">
                    <img :src="resolveFileUrl(img, { bustCache: true })" class="h-full w-full object-cover" />
                    <span class="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] font-bold text-white">{{ i + 1 }}</span>
                    <button type="button" class="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-red-600" @click="removerImagemCarrossel(i)"><Trash2 class="h-3.5 w-3.5" /></button>
                  </div>
                  <button v-if="carrossel.length < 8" type="button" class="flex aspect-[16/9] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition hover:border-primary hover:text-primary" :disabled="uploadingCarrossel" @click="carrosselInput?.click()">
                    <LoaderCircle v-if="uploadingCarrossel" class="h-5 w-5 animate-spin" />
                    <Plus v-else class="h-5 w-5" />
                    <span class="text-xs font-medium">Adicionar</span>
                  </button>
                </div>
                <input ref="carrosselInput" type="file" accept="image/*" multiple class="hidden" @change="onCarrosselSelected" />
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Título do banner</Label>
                  <Input :model-value="config.bannerTitulo ?? ''" placeholder="Ex.: Bem-vindo à nossa loja" @update:model-value="config.bannerTitulo = String($event)" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Subtítulo do banner</Label>
                  <Input :model-value="config.bannerSubtitulo ?? ''" placeholder="Ex.: Frete grátis acima de R$ 199" @update:model-value="config.bannerSubtitulo = String($event)" />
                </div>
              </div>

              <div class="space-y-2 border-t pt-4">
                <Label class="text-xs font-medium">Ajuste da imagem</Label>
                <div class="grid gap-3 sm:grid-cols-3">
                  <div><Label class="text-xs text-muted-foreground">Altura</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm" :value="config.themeConfig?.bannerHeight" @change="updateTheme('bannerHeight', ($event.target as HTMLSelectElement).value)"><option value="pequeno">Pequena</option><option value="medio">Média</option><option value="grande">Grande</option></select></div>
                  <div><Label class="text-xs text-muted-foreground">Ponto focal</Label><select class="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm" :value="config.themeConfig?.bannerFocalPoint" @change="updateTheme('bannerFocalPoint', ($event.target as HTMLSelectElement).value)"><option value="center">Centro</option><option value="top">Topo</option><option value="bottom">Base</option><option value="left">Esquerda</option><option value="right">Direita</option></select></div>
                  <div><Label class="text-xs text-muted-foreground">Sobreposição {{ config.themeConfig?.bannerOverlay }}%</Label><input class="mt-3 w-full" type="range" min="0" max="80" :value="Number(config.themeConfig?.bannerOverlay || 0)" @input="updateTheme('bannerOverlay', Number(($event.target as HTMLInputElement).value))" /></div>
                </div>
              </div>

              <div class="space-y-2 border-t pt-4">
                <Label class="text-xs font-medium">Banner (mobile)</Label>
                <div class="flex items-center gap-3">
                  <div class="h-28 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted"><img v-if="bannerMobileSrc" :src="bannerMobileSrc" class="h-full w-full object-cover" /></div>
                  <div class="space-y-2">
                    <input ref="bannerMobileInput" type="file" accept="image/*" class="hidden" @change="onMobileBannerSelected" />
                    <Button type="button" variant="outline" size="sm" :disabled="uploadingMobileBanner" @click="bannerMobileInput?.click()">
                      <LoaderCircle v-if="uploadingMobileBanner" class="mr-1 h-4 w-4 animate-spin" />
                      <ImagePlus v-else class="mr-1 h-4 w-4" />
                      {{ config.bannerMobileUrl ? 'Trocar mobile' : 'Enviar mobile' }}
                    </Button>
                    <Button v-if="config.bannerMobileUrl" type="button" variant="outline" size="sm" class="ml-2 text-red-600" @click="removerBannerMobile"><Trash2 class="mr-1 h-4 w-4" />Remover</Button>
                  </div>
                </div>
              </div>
            </template>

            <!-- CONTEÚDO -->
            <template v-else-if="activeSection === 'conteudo'">
              <div class="space-y-1">
                <Label class="text-xs font-medium">Mensagem de boas-vindas</Label>
                <Textarea :model-value="config.mensagemBoasVindas ?? ''" rows="2" placeholder="Uma frase curta que aparece no topo da loja." @update:model-value="config.mensagemBoasVindas = String($event)" />
              </div>

              <div class="space-y-2">
                <Label class="text-xs font-medium">Exibição de produtos</Label>
                <ToggleRow v-model="config.mostrarPrecos" title="Mostrar preços" description="Exibe o valor dos produtos na vitrine." />
                <ToggleRow v-model="config.mostrarDisponibilidade" title="Mostrar disponibilidade" description="Indica se o produto está em estoque." />
                <ToggleRow v-model="config.ocultarEsgotados" title="Ocultar esgotados" description="Esconde produtos sem estoque." />
                <ToggleRow v-model="config.quickAdd" title="Adicionar rápido" description="Botão de adicionar ao carrinho direto na grade." />
              </div>

              <div class="space-y-2">
                <Label class="text-xs font-medium">Chamadas para ação</Label>
                <ToggleRow v-model="config.pedidoWhatsapp" title="Pedir pelo WhatsApp" description="Exibe o botão de pedido via WhatsApp." />
                <ToggleRow v-model="config.barraAvisoAtiva" title="Barra de aviso promocional" description="Faixa de destaque no topo da loja." />
                <Input v-if="config.barraAvisoAtiva" :model-value="config.barraAvisoTexto ?? ''" placeholder="Ex.: Frete grátis acima de R$ 199" @update:model-value="config.barraAvisoTexto = String($event)" />
              </div>
            </template>

            <!-- SEÇÕES -->
            <template v-else-if="activeSection === 'secoes'">
              <div class="space-y-2">
                <Label class="text-xs font-medium">Seções automáticas</Label>
                <p class="text-xs text-muted-foreground">Vitrines geradas sozinhas a partir dos seus dados. Ative ou desative como quiser.</p>
                <ToggleRow :model-value="autoSecoes.promocoes" title="Promoções" description="Produtos com preço promocional." @update:model-value="setAutoSecao('promocoes', $event)" />
                <ToggleRow :model-value="autoSecoes.maisVendidos" title="Mais vendidos" description="Produtos com mais vendas registradas." @update:model-value="setAutoSecao('maisVendidos', $event)" />
                <ToggleRow :model-value="autoSecoes.novidades" title="Novidades" description="Produtos cadastrados mais recentemente." @update:model-value="setAutoSecao('novidades', $event)" />
                <p class="text-[11px] text-muted-foreground">As opções acima são salvas com o botão “Salvar” no topo.</p>
              </div>

              <div class="space-y-2 border-t pt-4">
                <Label class="text-xs font-medium">Seções personalizadas</Label>
                <SecoesManager />
              </div>
            </template>

            <!-- VENDAS E ENTREGA -->
            <template v-else-if="activeSection === 'vendas'">
              <div class="space-y-2">
                <Label class="text-xs font-medium">Pagamento</Label>
                <ToggleRow v-model="config.pagamentoOnline" title="Pagamento online" description="Receba pagamentos direto na loja." />
                <div v-if="config.pagamentoOnline" class="grid grid-cols-2 gap-2">
                  <button v-for="gateway in ['MERCADOPAGO','ABACATEPAY']" :key="gateway" type="button" class="rounded-lg border p-3 text-sm font-semibold transition" :class="config.gatewayPreferido === gateway ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'" @click="config.gatewayPreferido = gateway as any">{{ gateway === 'MERCADOPAGO' ? 'Mercado Pago' : 'AbacatePay' }}</button>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-xs font-medium">Entrega</Label>
                <ToggleRow v-model="config.retiradaAtiva" title="Retirada no local" description="Cliente retira o pedido no endereço." />
                <ToggleRow v-model="config.entregaLocalAtiva" title="Entrega local" description="Entrega feita pela sua equipe." />
                <div v-if="config.entregaLocalAtiva" class="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
                  <div><Label class="text-xs text-muted-foreground">Taxa fixa</Label><Input v-model.number="config.taxaEntrega" type="number" min="0" class="mt-1" /></div>
                  <div><Label class="text-xs text-muted-foreground">Frete grátis acima de</Label><Input :model-value="config.freteGratisAcima ?? ''" type="number" min="0" class="mt-1" @update:model-value="config.freteGratisAcima = $event === '' ? null : Number($event)" /></div>
                </div>
              </div>
            </template>

            <!-- CLIENTES -->
            <template v-else-if="activeSection === 'clientes'">
              <div class="space-y-2">
                <ToggleRow v-model="config.permitirLogin" title="Permitir login" description="Clientes podem acessar uma conta." />
                <ToggleRow v-model="config.permitirCadastro" title="Permitir cadastro" description="Novos clientes podem criar conta." />
                <ToggleRow v-model="config.permitirCheckoutVisitante" title="Checkout como visitante" description="Finalizar pedido sem criar conta." />
              </div>
            </template>

            <!-- RODAPÉ / EMPRESA -->
            <template v-else-if="activeSection === 'rodape'">
              <p class="text-xs text-muted-foreground">Essas informações aparecem no rodapé da loja para dar mais confiança ao cliente. Todos os campos são opcionais.</p>
              <div class="space-y-1">
                <Label class="text-xs font-medium">Sobre a loja</Label>
                <Textarea :model-value="config.themeConfig?.company?.about || ''" rows="3" placeholder="Uma breve descrição da sua empresa." @update:model-value="updateCompany('about', String($event))" />
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-1"><Label class="text-xs text-muted-foreground">Telefone</Label><Input :model-value="config.themeConfig?.company?.phone || ''" placeholder="(00) 0000-0000" @update:model-value="updateCompany('phone', String($event))" /></div>
                <div class="space-y-1"><Label class="text-xs text-muted-foreground">WhatsApp</Label><Input :model-value="config.themeConfig?.company?.whatsapp || ''" placeholder="Ex.: 5599999999999" @update:model-value="updateCompany('whatsapp', String($event))" /></div>
                <div class="space-y-1"><Label class="text-xs text-muted-foreground">E-mail</Label><Input :model-value="config.themeConfig?.company?.email || ''" type="email" placeholder="contato@sualoja.com" @update:model-value="updateCompany('email', String($event))" /></div>
                <div class="space-y-1"><Label class="text-xs text-muted-foreground">CNPJ</Label><Input :model-value="config.themeConfig?.company?.cnpj || ''" placeholder="00.000.000/0000-00" @update:model-value="updateCompany('cnpj', String($event))" /></div>
                <div class="space-y-1 sm:col-span-2"><Label class="text-xs text-muted-foreground">Endereço</Label><Input :model-value="config.themeConfig?.company?.address || ''" placeholder="Rua, número, bairro, cidade/UF" @update:model-value="updateCompany('address', String($event))" /></div>
                <div class="space-y-1 sm:col-span-2"><Label class="text-xs text-muted-foreground">Horário de atendimento</Label><Input :model-value="config.themeConfig?.company?.hours || ''" placeholder="Ex.: Seg a Sex, 8h às 18h" @update:model-value="updateCompany('hours', String($event))" /></div>
                <div class="space-y-1"><Label class="text-xs text-muted-foreground">Instagram</Label><Input :model-value="config.themeConfig?.company?.instagram || ''" placeholder="@sualoja" @update:model-value="updateCompany('instagram', String($event))" /></div>
                <div class="space-y-1"><Label class="text-xs text-muted-foreground">Facebook</Label><Input :model-value="config.themeConfig?.company?.facebook || ''" placeholder="sualoja" @update:model-value="updateCompany('facebook', String($event))" /></div>
              </div>
            </template>
          </CardContent>
        </Card>
      </div>

      <!-- Pré-visualização -->
      <div class="lg:col-span-4">
        <div class="sticky top-4">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
          <div class="overflow-hidden rounded-xl border bg-background shadow-sm">
            <!-- Header -->
            <div
              v-if="config.headerEstilo !== 'banner'"
              class="flex items-center gap-2 px-4 py-3"
              :class="config.headerEstilo === 'centralizado' ? 'justify-center' : ''"
              :style="{ backgroundColor: previewHeaderColor, color: previewHeaderForeground }"
            >
              <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20">
                <img v-if="config.themeConfig?.logoUrl" :src="resolveFileUrl(config.themeConfig.logoUrl, { bustCache: true })" class="h-full w-full object-cover" />
                <Store v-else class="h-4 w-4" />
              </div>
              <div class="min-w-0 leading-tight">
                <span class="block truncate text-sm font-bold">{{ config.themeConfig?.headerTitle || nomeLoja }}</span>
                <span v-if="config.themeConfig?.headerSubtitle" class="block truncate text-[10px] opacity-75">{{ config.themeConfig.headerSubtitle }}</span>
              </div>
            </div>
            <div
              v-else
              class="relative flex h-28 items-end p-4"
              :style="previewBannerSrc ? { backgroundImage: `url(${previewBannerSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: config.corPrimaria }"
            >
              <div class="absolute inset-0 bg-black/35"></div>
              <div class="relative text-white">
                <p class="text-sm font-bold">{{ config.bannerTitulo || config.themeConfig?.headerTitle || nomeLoja }}</p>
                <p v-if="config.bannerSubtitulo" class="text-xs opacity-90">{{ config.bannerSubtitulo }}</p>
              </div>
            </div>

            <div class="p-4" :style="{ backgroundColor: config.themeConfig?.bgColor || undefined }">
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
            <div class="border-t px-4 py-3 text-center text-[10px]" :style="{ backgroundColor: previewFooterColor, color: previewFooterForeground }">
              © {{ new Date().getFullYear() }} {{ config.themeConfig?.headerTitle || nomeLoja }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
