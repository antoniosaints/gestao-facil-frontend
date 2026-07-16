<template>
  <div class="min-h-screen bg-muted/30 p-4 md:p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
            <Globe2 class="h-4 w-4" />
            Site público
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Gerenciador do site</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Configure imagem, plano, apps, textos das seções e perguntas frequentes exibidos no /site.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <RouterLink to="/site" target="_blank">
            <Button variant="outline">
              <Eye class="mr-2 h-4 w-4" />
              Ver site
            </Button>
          </RouterLink>
          <Button variant="outline" :disabled="loading || saving" @click="restoreDefaults">
            <RotateCcw class="mr-2 h-4 w-4" />
            Restaurar padrão
          </Button>
          <Button :disabled="loading || saving" class="text-white dark:text-white" @click="save">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            <Save v-else class="mr-2 h-4 w-4" />
            Salvar site
          </Button>
        </div>
      </div>

      <div v-if="loading" class="flex min-h-[320px] items-center justify-center rounded-2xl border bg-card">
        <LoaderCircle class="h-8 w-8 animate-spin text-primary" />
      </div>

      <Tabs v-else default-value="hero" orientation="vertical" class="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
        <aside class="sticky top-4 rounded-2xl border bg-card p-2 shadow-sm">
          <TabsList class="!flex !h-auto !w-full !flex-col !items-stretch !justify-start !gap-1 !overflow-visible !rounded-none !bg-transparent !p-0">
            <TabsTrigger value="hero" class="!h-11 !justify-start rounded-xl px-4 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Hero e plano
            </TabsTrigger>
            <TabsTrigger value="features" class="!h-11 !justify-start rounded-xl px-4 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Funcionalidades
            </TabsTrigger>
            <TabsTrigger value="apps" class="!h-11 !justify-start rounded-xl px-4 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Apps e valores
            </TabsTrigger>
            <TabsTrigger value="sections" class="!h-11 !justify-start rounded-xl px-4 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Seções do site
            </TabsTrigger>
            <TabsTrigger value="faq" class="!h-11 !justify-start rounded-xl px-4 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Perguntas frequentes
            </TabsTrigger>
          </TabsList>
        </aside>

        <div class="min-w-0">
          <TabsContent value="hero" class="mt-0">
            <Card>
          <CardHeader>
            <CardTitle>Imagem, chamada e valor do plano</CardTitle>
            <CardDescription>Essas informações alimentam o topo do site e o bloco de preços.</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2 md:col-span-2">
                <Label>Texto pequeno do topo</Label>
                <Input v-model="config.hero.badge" maxlength="120" placeholder="7 dias grátis · sem cartão de crédito" />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label>Título principal</Label>
                <Input v-model="config.hero.title" maxlength="180" placeholder="O sistema completo para gerir seu negócio" />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label>Parte destacada do título</Label>
                <Input v-model="config.hero.highlight" maxlength="120" placeholder="gerir seu negócio" />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label>Subtítulo</Label>
                <Textarea v-model="config.hero.subtitle" class="min-h-24" maxlength="500" />
              </div>
              <div class="space-y-2">
                <Label>Valor mensal do plano</Label>
                <Input v-model.number="config.hero.monthlyPrice" type="number" min="0" step="0.01" />
              </div>
              <div class="space-y-2">
                <Label>Dias grátis</Label>
                <Input v-model.number="config.hero.trialDays" type="number" min="0" step="1" />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label>Texto alternativo da imagem</Label>
                <Input v-model="config.hero.imageAlt" maxlength="180" />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label>URL/referência da imagem</Label>
                <div class="flex gap-2">
                  <Input v-model="config.hero.imageUrl" placeholder="/imgs/dashboard.png ou referência do upload" />
                  <Button type="button" variant="outline" :disabled="uploadingImage" @click="imageInput?.click()">
                    <LoaderCircle v-if="uploadingImage" class="mr-2 h-4 w-4 animate-spin" />
                    <ImagePlus v-else class="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
                <input ref="imageInput" class="hidden" type="file" accept="image/*" @change="uploadHeroImage" />
              </div>
            </div>

            <div class="rounded-2xl border bg-background p-4">
              <div class="mb-3 flex items-center justify-between">
                <Badge variant="secondary">Prévia da imagem</Badge>
                <span class="text-xs text-muted-foreground">{{ pricePreview }}/mês</span>
              </div>
              <div class="overflow-hidden rounded-xl border bg-muted">
                <img :src="previewImage" :alt="config.hero.imageAlt || 'Imagem do sistema'" class="aspect-video w-full object-cover" />
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <div v-for="(stat, index) in config.hero.stats" :key="index" class="rounded-xl border bg-card p-3">
                  <Input v-model="stat.value" class="h-8 text-sm font-semibold" maxlength="30" />
                  <Input v-model="stat.label" class="mt-2 h-8 text-xs" maxlength="60" />
                  <Button variant="ghost" size="sm" class="mt-2 h-7 px-2 text-destructive" @click="removeStat(index)">
                    Remover
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" class="mt-3" @click="addStat">
                <Plus class="mr-2 h-4 w-4" />
                Adicionar métrica
              </Button>
            </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" class="mt-0">
            <Card>
            <CardHeader>
              <CardTitle>Funcionalidades</CardTitle>
              <CardDescription>Cards da seção "Tudo incluso no plano base".</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-for="(feature, index) in config.features" :key="index" class="rounded-2xl border bg-background p-4">
                <div class="mb-3 flex items-center justify-between gap-2">
                  <Badge variant="outline">Funcionalidade {{ index + 1 }}</Badge>
                  <Button variant="ghost" size="sm" class="text-destructive" @click="removeFeature(index)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
                <div class="grid gap-3 md:grid-cols-[1fr_150px]">
                  <div class="space-y-2">
                    <Label>Título</Label>
                    <Input v-model="feature.title" maxlength="100" />
                  </div>
                  <div class="space-y-2">
                    <Label>Ícone</Label>
                    <select v-model="feature.icon" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option v-for="icon in iconOptions" :key="icon" :value="icon">{{ icon }}</option>
                    </select>
                  </div>
                  <div class="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea v-model="feature.description" maxlength="400" />
                  </div>
                </div>
              </div>
              <Button variant="outline" @click="addFeature">
                <Plus class="mr-2 h-4 w-4" />
                Adicionar funcionalidade
              </Button>
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apps" class="mt-0">
            <Card>
            <CardHeader>
              <CardTitle>Apps e valores</CardTitle>
              <CardDescription>Lista exibida na seção App Store e no resumo de preços.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-for="(app, index) in config.apps" :key="index" class="rounded-2xl border bg-background p-4">
                <div class="mb-3 flex items-center justify-between gap-2">
                  <Badge :variant="Number(app.price || 0) === 0 ? 'secondary' : 'outline'">
                    {{ Number(app.price || 0) === 0 ? 'Grátis' : formatBRL(Number(app.price || 0)) }}
                  </Badge>
                  <Button variant="ghost" size="sm" class="text-destructive" @click="removeApp(index)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
                <div class="grid gap-3 md:grid-cols-2">
                  <div class="space-y-2">
                    <Label>Nome</Label>
                    <Input v-model="app.title" maxlength="100" />
                  </div>
                  <div class="space-y-2">
                    <Label>Categoria</Label>
                    <Input v-model="app.category" maxlength="80" />
                  </div>
                  <div class="space-y-2">
                    <Label>Valor mensal</Label>
                    <Input v-model.number="app.price" type="number" min="0" step="0.01" />
                  </div>
                  <div class="space-y-2">
                    <Label>Ícone</Label>
                    <select v-model="app.icon" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option v-for="icon in iconOptions" :key="icon" :value="icon">{{ icon }}</option>
                    </select>
                  </div>
                  <div class="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea v-model="app.description" maxlength="400" />
                  </div>
                </div>
              </div>
              <Button variant="outline" @click="addApp">
                <Plus class="mr-2 h-4 w-4" />
                Adicionar app
              </Button>
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" class="mt-0">
            <div class="grid gap-6 xl:grid-cols-3">
              <TextListCard title="Benefícios do dashboard" description="Lista ao lado da imagem de relatórios." :items="config.benefits" @add="addTextItem('benefits')" @remove="removeTextItem('benefits', $event)" />
              <TextListCard title="Benefícios de adaptação" description="Lista da seção de nichos." :items="config.adaptBenefits" @add="addTextItem('adaptBenefits')" @remove="removeTextItem('adaptBenefits', $event)" />
              <TextListCard title="Itens inclusos no plano" description="Lista do card de preço." :items="config.included" @add="addTextItem('included')" @remove="removeTextItem('included', $event)" />
            </div>
          </TabsContent>

          <TabsContent value="faq" class="mt-0">
            <Card>
          <CardHeader>
            <CardTitle>Perguntas frequentes</CardTitle>
            <CardDescription>Itens exibidos no final do site.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-for="(faq, index) in config.faqs" :key="index" class="rounded-2xl border bg-background p-4">
              <div class="mb-3 flex items-center justify-between gap-2">
                <Badge variant="outline">Pergunta {{ index + 1 }}</Badge>
                <Button variant="ghost" size="sm" class="text-destructive" @click="removeFaq(index)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
              <div class="space-y-3">
                <div class="space-y-2">
                  <Label>Pergunta</Label>
                  <Input v-model="faq.q" maxlength="180" />
                </div>
                <div class="space-y-2">
                  <Label>Resposta</Label>
                  <Textarea v-model="faq.a" class="min-h-24" maxlength="700" />
                </div>
              </div>
            </div>
            <Button variant="outline" @click="addFaq">
              <Plus class="mr-2 h-4 w-4" />
              Adicionar pergunta
            </Button>
          </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, type PropType } from 'vue'
import { useToast } from 'vue-toastification'
import { Eye, Globe2, ImagePlus, LoaderCircle, Plus, RotateCcw, Save, Trash2 } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_SITE_CONFIG, cloneSiteConfig, type SitePublicConfig } from '@/pages/site/siteContent'
import { SiteRepository } from '@/repositories/site-repository'
import { resolveFileUrl } from '@/utils/fileUrl'

type TextListKey = 'benefits' | 'adaptBenefits' | 'included'

const TextListCard = defineComponent({
  name: 'TextListCard',
  props: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    items: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['add', 'remove'],
  setup(props, { emit }) {
    return () => h(Card, null, {
      default: () => [
        h(CardHeader, null, {
          default: () => [
            h(CardTitle, null, { default: () => props.title }),
            h(CardDescription, null, { default: () => props.description }),
          ],
        }),
        h(CardContent, { class: 'space-y-3' }, {
          default: () => [
            ...props.items.map((_, index) => h('div', { class: 'flex gap-2', key: index }, [
              h(Input, {
                modelValue: props.items[index],
                'onUpdate:modelValue': (value: string | number) => { props.items[index] = String(value ?? '') },
                maxlength: 160,
              }),
              h(Button, {
                variant: 'ghost',
                size: 'icon',
                class: 'text-destructive',
                onClick: () => emit('remove', index),
              }, { default: () => h(Trash2, { class: 'h-4 w-4' }) }),
            ])),
            h(Button, {
              variant: 'outline',
              onClick: () => emit('add'),
            }, { default: () => [h(Plus, { class: 'mr-2 h-4 w-4' }), 'Adicionar item'] }),
          ],
        }),
      ],
    })
  },
})

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const uploadingImage = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const config = ref<SitePublicConfig>(cloneSiteConfig())

const iconOptions = [
  'ScanLine',
  'Box',
  'Wallet',
  'Repeat',
  'UsersRound',
  'FileBarChart',
  'Wrench',
  'Store',
  'Bot',
  'MessageCircle',
  'CreditCard',
  'Headset',
]

const previewImage = computed(() => resolveFileUrl(config.value.hero.imageUrl, { fallback: '/imgs/dashboard.png' }))
const pricePreview = computed(() => formatBRL(Number(config.value.hero.monthlyPrice || 0)))

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function normalizeConfig(): SitePublicConfig {
  return {
    ...cloneSiteConfig(config.value),
    hero: {
      ...config.value.hero,
      monthlyPrice: Number(config.value.hero.monthlyPrice || 0),
      trialDays: Number(config.value.hero.trialDays || 0),
    },
    apps: config.value.apps.map((app) => ({
      ...app,
      price: Number(app.price || 0),
    })),
  }
}

async function loadConfig() {
  try {
    loading.value = true
    config.value = cloneSiteConfig(await SiteRepository.getAdminConfig())
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao carregar configurações do site')
  } finally {
    loading.value = false
  }
}

async function save() {
  try {
    saving.value = true
    config.value = cloneSiteConfig(await SiteRepository.saveAdminConfig(normalizeConfig()))
    toast.success('Site atualizado com sucesso')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao salvar configurações do site')
  } finally {
    saving.value = false
  }
}

function restoreDefaults() {
  config.value = cloneSiteConfig(DEFAULT_SITE_CONFIG)
  toast.info('Configuração padrão restaurada. Clique em salvar para aplicar.')
}

async function uploadHeroImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    uploadingImage.value = true
    const uploaded = await SiteRepository.uploadSiteImage(file)
    config.value.hero.imageUrl = uploaded.url || uploaded.reference || uploaded.publicUrl
    toast.success('Imagem enviada. Clique em salvar para publicar.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao enviar imagem')
  } finally {
    uploadingImage.value = false
    input.value = ''
  }
}

function addStat() {
  config.value.hero.stats.push({ value: 'Novo dado', label: 'descrição' })
}

function removeStat(index: number) {
  config.value.hero.stats.splice(index, 1)
}

function addFeature() {
  config.value.features.push({ title: 'Nova funcionalidade', description: 'Descreva a funcionalidade.', icon: 'Box' })
}

function removeFeature(index: number) {
  config.value.features.splice(index, 1)
}

function addApp() {
  config.value.apps.push({ title: 'Novo app', category: 'Categoria', description: 'Descreva o app.', price: 0, icon: 'Store' })
}

function removeApp(index: number) {
  config.value.apps.splice(index, 1)
}

function addTextItem(key: TextListKey) {
  config.value[key].push('Novo item')
}

function removeTextItem(key: TextListKey, index: number) {
  config.value[key].splice(index, 1)
}

function addFaq() {
  config.value.faqs.push({ q: 'Nova pergunta', a: 'Resposta da pergunta.' })
}

function removeFaq(index: number) {
  config.value.faqs.splice(index, 1)
}

onMounted(loadConfig)
</script>
