<template>
  <Card class="overflow-hidden rounded-t-none bg-background">
    <form @submit.prevent="salvarTema">
      <CardHeader class="border-b bg-card/70">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle class="flex items-center gap-2 font-normal">
              <Palette class="h-5 w-5 text-primary" />
              Aparência do sistema
            </CardTitle>
            <CardDescription class="mt-1 max-w-2xl text-pretty">
              Personalize as cores principais nos modos claro e escuro. Contrastes, textos, cartões, bordas e estados suaves são calculados automaticamente.
            </CardDescription>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" class="min-h-10 active:scale-[0.96]" @click="restaurarSalvo">
              <RotateCcw class="h-4 w-4" /> Visual salvo
            </Button>
            <Button type="button" variant="outline" class="min-h-10 active:scale-[0.96]" @click="usarPadrao">
              <Paintbrush class="h-4 w-4" /> Padrão do sistema
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent class="space-y-7 p-5 lg:p-6">
        <section class="space-y-3">
          <div>
            <h3 class="font-medium">Paletas rápidas</h3>
            <p class="text-sm text-muted-foreground">Escolha um ponto de partida e ajuste cada cor se desejar.</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button v-for="preset in presets" :key="preset.nome" type="button"
              class="group flex min-h-16 items-center gap-3 rounded-xl bg-card p-3 text-left shadow-[var(--shadow-theme-card)] transition-[box-shadow,transform] duration-150 active:scale-[0.96]"
              @click="aplicarPreset(preset.tema)">
              <span class="flex -space-x-2">
                <i v-for="cor in [preset.tema.primariaLight, preset.tema.sidebarLight, preset.tema.fundoLight]" :key="cor"
                  class="h-9 w-9 rounded-full outline outline-2 -outline-offset-1 outline-background"
                  :style="{ backgroundColor: cor }" />
              </span>
              <span>
                <strong class="block text-sm">{{ preset.nome }}</strong>
                <small class="text-muted-foreground">Aplicar paleta</small>
              </span>
            </button>
          </div>
        </section>

        <Separator />

        <div class="grid gap-6 xl:grid-cols-2">
          <section v-for="grupo in colorGroups" :key="grupo.mode" class="rounded-2xl bg-card p-2 shadow-[var(--shadow-theme-card)]">
            <div class="rounded-xl bg-background p-4">
              <div class="mb-5 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <component :is="grupo.icon" class="h-5 w-5 text-primary" />
                  <div>
                    <h3 class="font-semibold">{{ grupo.title }}</h3>
                    <p class="text-xs text-muted-foreground">{{ grupo.description }}</p>
                  </div>
                </div>
                <span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{{ grupo.badge }}</span>
              </div>

              <div class="grid gap-4 sm:grid-cols-3">
                <label v-for="field in grupo.fields" :key="field.key" class="space-y-2">
                  <span class="text-xs font-medium">{{ field.label }}</span>
                  <span class="flex min-h-11 items-center gap-2 rounded-lg border bg-card p-1.5 focus-within:ring-2 focus-within:ring-ring">
                    <input v-model="form[field.key]" type="color" class="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
                      :aria-label="field.label" @input="aplicarPreview" />
                    <input v-model="form[field.key]" type="text" maxlength="7" pattern="#[0-9A-Fa-f]{6}"
                      class="min-w-0 flex-1 bg-transparent font-mono text-xs uppercase outline-none"
                      @input="aplicarPreview" />
                  </span>
                  <small class="block text-pretty text-[11px] leading-4 text-muted-foreground">{{ field.help }}</small>
                </label>
              </div>
            </div>
          </section>
        </div>

        <Separator />

        <section class="space-y-4">
          <div>
            <h3 class="font-medium">Fonte e cantos</h3>
            <p class="text-sm text-muted-foreground">Escolha a fonte do sistema e o arredondamento dos cartões. A mudança é aplicada em toda a interface.</p>
          </div>
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="space-y-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-theme-card)]">
              <div class="flex items-center gap-2">
                <Type class="h-4 w-4 text-primary" />
                <span class="text-sm font-semibold">Fonte do sistema</span>
              </div>
              <div class="grid gap-2 sm:grid-cols-2">
                <button v-for="fonte in FONT_OPTIONS" :key="fonte.value" type="button"
                  @click="selecionarFonte(fonte.value)"
                  class="flex items-center justify-between rounded-lg border bg-background p-3 text-left transition active:scale-[0.98]"
                  :class="form.fonte === fonte.value ? 'border-primary ring-2 ring-primary/30' : 'hover:bg-muted/40'"
                  :style="{ fontFamily: fonte.value }">
                  <span class="text-sm font-semibold">{{ fonte.label }}</span>
                  <span class="text-xs text-muted-foreground">Aa Bb 123</span>
                </button>
              </div>
            </div>

            <div class="space-y-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-theme-card)]">
              <div class="flex items-center gap-2">
                <Squircle class="h-4 w-4 text-primary" />
                <span class="text-sm font-semibold">Arredondamento dos cartões</span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="raio in RADIUS_OPTIONS" :key="raio.value" type="button"
                  @click="selecionarRadius(raio.value)"
                  class="flex flex-col items-center gap-2 border bg-background p-3 transition active:scale-[0.98]"
                  :style="{ borderRadius: raio.value }"
                  :class="form.radius === raio.value ? 'border-primary ring-2 ring-primary/30' : 'hover:bg-muted/40'">
                  <span class="h-8 w-full border border-primary/40 bg-primary/15" :style="{ borderRadius: raio.value }" />
                  <span class="text-[11px] font-medium">{{ raio.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        <section class="space-y-3">
          <div>
            <h3 class="font-medium">Pré-visualização completa</h3>
            <p class="text-sm text-muted-foreground">Confira simultaneamente como sua identidade funciona nos dois modos.</p>
          </div>
          <div class="grid gap-4 xl:grid-cols-2">
            <article v-for="mode in previewModes" :key="mode"
              class="overflow-hidden rounded-2xl shadow-[var(--shadow-theme-preview)]"
              :style="previewContainerStyle(mode)">
              <div class="flex min-h-64">
                <aside class="w-32 shrink-0 p-3" :style="previewSidebarStyle(mode)">
                  <div class="mb-5 flex items-center gap-2">
                    <span class="grid h-8 w-8 place-items-center rounded-lg bg-black/10 text-xs font-black">GF</span>
                    <span class="text-xs font-semibold">Gestão Fácil</span>
                  </div>
                  <div class="space-y-2 text-[11px]">
                    <p class="rounded-lg bg-black/10 px-2 py-2">Dashboard</p>
                    <p class="px-2 py-2 opacity-80">Vendas</p>
                    <p class="px-2 py-2 opacity-80">Produtos</p>
                  </div>
                </aside>
                <div class="min-w-0 flex-1 p-4">
                  <div class="mb-4 flex items-center justify-between">
                    <div>
                      <p class="text-xs opacity-60">{{ mode === 'light' ? 'Modo claro' : 'Modo escuro' }}</p>
                      <strong class="text-sm">Resumo da operação</strong>
                    </div>
                    <span class="rounded-lg px-3 py-2 text-xs font-semibold" :style="previewPrimaryStyle(mode)">Nova venda</span>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div v-for="(label, index) in ['Vendas hoje', 'Ticket médio']" :key="label"
                      class="rounded-xl p-3" :style="previewCardStyle(mode)">
                      <p class="text-[11px] opacity-60">{{ label }}</p>
                      <strong class="mt-2 block font-mono text-base tabular-nums">{{ index ? 'R$ 86,40' : '24' }}</strong>
                    </div>
                  </div>
                  <div class="mt-3 rounded-xl p-3" :style="previewCardStyle(mode)">
                    <div class="mb-3 flex items-center justify-between text-xs">
                      <span>Meta mensal</span><strong>72%</strong>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-black/10">
                      <div class="h-full w-[72%] rounded-full" :style="{ backgroundColor: palette(mode).primary }" />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </CardContent>

      <CardFooter class="flex-col gap-3 border-t bg-card/70 px-5 py-4 sm:flex-row sm:justify-between">
        <p class="flex items-center gap-2 text-xs text-muted-foreground">
          <Check class="h-4 w-4 text-success" /> Contraste de texto ajustado automaticamente conforme WCAG.
        </p>
        <Button type="submit" class="min-h-10 text-primary-foreground active:scale-[0.96]" :disabled="loading">
          <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
          {{ loading ? 'Salvando...' : 'Salvar aparência' }}
        </Button>
      </CardFooter>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Check, LoaderCircle, Moon, Paintbrush, Palette, RotateCcw, Save, Squircle, Sun, Type } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ContaRepository } from '@/repositories/conta-repository'
import type { ThemeCustomization } from '@/types/schemas'
import { setThemeCustomization } from '@/utils/theme'
import {
  DEFAULT_THEME_CUSTOMIZATION,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  getThemePalette,
  normalizeThemeCustomization,
  type ThemeMode,
} from '@/utils/themeCustomization'

type ThemeField = keyof ThemeCustomization

const toast = useToast()
const loading = ref(false)
const previewModes: ThemeMode[] = ['light', 'dark']
const savedTheme = ref<ThemeCustomization>({ ...DEFAULT_THEME_CUSTOMIZATION })
const form = reactive<ThemeCustomization>({ ...DEFAULT_THEME_CUSTOMIZATION })

const colorGroups = [
  {
    mode: 'light', title: 'Modo claro', description: 'Superfícies luminosas e nítidas.', badge: 'LIGHT', icon: Sun,
    fields: [
      { key: 'primariaLight' as ThemeField, label: 'Cor primária', help: 'Botões, links, foco e destaques.' },
      { key: 'sidebarLight' as ThemeField, label: 'Sidebar', help: 'Navegação lateral no modo claro.' },
      { key: 'fundoLight' as ThemeField, label: 'Fundo', help: 'Base usada para derivar cartões e bordas.' },
    ],
  },
  {
    mode: 'dark', title: 'Modo escuro', description: 'Contraste confortável em baixa luz.', badge: 'DARK', icon: Moon,
    fields: [
      { key: 'primariaDark' as ThemeField, label: 'Cor primária', help: 'Destaques com luminosidade controlada.' },
      { key: 'sidebarDark' as ThemeField, label: 'Sidebar', help: 'Navegação lateral no modo escuro.' },
      { key: 'fundoDark' as ThemeField, label: 'Fundo', help: 'Base escura para superfícies e modais.' },
    ],
  },
]

const presets: Array<{ nome: string; tema: Partial<ThemeCustomization> }> = [
  { nome: 'Azul original', tema: { ...DEFAULT_THEME_CUSTOMIZATION } },
  { nome: 'Esmeralda', tema: { primariaLight: '#059669', primariaDark: '#10B981', sidebarLight: '#065F46', sidebarDark: '#022C22', fundoLight: '#F8FAFC', fundoDark: '#02140F' } },
  { nome: 'Violeta', tema: { primariaLight: '#7C3AED', primariaDark: '#8B5CF6', sidebarLight: '#5B21B6', sidebarDark: '#2E1065', fundoLight: '#FAF9FF', fundoDark: '#0C0618' } },
  { nome: 'Âmbar', tema: { primariaLight: '#D97706', primariaDark: '#F59E0B', sidebarLight: '#92400E', sidebarDark: '#451A03', fundoLight: '#FFFBEB', fundoDark: '#180D02' } },
]

const themeSnapshot = computed(() => normalizeThemeCustomization(form))
const palette = (mode: ThemeMode) => getThemePalette(themeSnapshot.value, mode)
const previewContainerStyle = (mode: ThemeMode) => ({ backgroundColor: palette(mode).background, color: palette(mode).foreground })
const previewSidebarStyle = (mode: ThemeMode) => ({ backgroundColor: palette(mode).sidebar, color: palette(mode).sidebarForeground })
const previewPrimaryStyle = (mode: ThemeMode) => ({ backgroundColor: palette(mode).primary, color: palette(mode).primaryForeground })
const previewCardStyle = (mode: ThemeMode) => ({ backgroundColor: palette(mode).card, boxShadow: `0 0 0 1px ${palette(mode).border}` })

function assignTheme(theme: Partial<ThemeCustomization>) {
  Object.assign(form, normalizeThemeCustomization(theme))
  aplicarPreview()
}

function aplicarPreview() {
  setThemeCustomization(themeSnapshot.value)
}

function aplicarPreset(theme: Partial<ThemeCustomization>) {
  // Mantém a fonte e o arredondamento escolhidos ao trocar apenas a paleta de cores.
  assignTheme({ ...theme, radius: form.radius, fonte: form.fonte })
}

function selecionarFonte(fonte: string) {
  form.fonte = fonte
  aplicarPreview()
}

function selecionarRadius(radius: string) {
  form.radius = radius
  aplicarPreview()
}

function usarPadrao() {
  assignTheme(DEFAULT_THEME_CUSTOMIZATION)
}

function restaurarSalvo() {
  assignTheme(savedTheme.value)
}

async function salvarTema() {
  try {
    loading.value = true
    const normalized = themeSnapshot.value
    await ContaRepository.parametros({ temaPersonalizado: normalized })
    savedTheme.value = { ...normalized }
    setThemeCustomization(normalized)
    toast.success('Aparência salva com sucesso')
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar a aparência')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const response = await ContaRepository.getParametros()
    const theme = normalizeThemeCustomization(response.data?.temaPersonalizado)
    savedTheme.value = { ...theme }
    assignTheme(theme)
  } catch (error) {
    console.error(error)
    assignTheme(DEFAULT_THEME_CUSTOMIZATION)
  }
})
</script>

<style scoped>
:global(:root) {
  --shadow-theme-card: 0 0 0 1px rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06), 0 5px 16px rgb(15 23 42 / 0.04);
  --shadow-theme-preview: 0 0 0 1px rgb(15 23 42 / 0.08), 0 18px 45px rgb(15 23 42 / 0.1);
}
:global(.dark) {
  --shadow-theme-card: 0 0 0 1px rgb(255 255 255 / 0.09);
  --shadow-theme-preview: 0 0 0 1px rgb(255 255 255 / 0.1), 0 18px 45px rgb(0 0 0 / 0.3);
}
input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
input[type='color']::-webkit-color-swatch { border: 0; border-radius: .375rem; }
</style>
