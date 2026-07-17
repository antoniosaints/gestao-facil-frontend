<template>
  <Card class="w-full bg-background mx-auto rounded-none rounded-b-xl">
    <CardHeader>
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="space-y-2">
          <CardTitle class="font-normal flex items-center gap-2">
            <Tag class="w-5 h-5 text-primary" /> Modelos de etiquetas
          </CardTitle>
          <CardDescription>
            Cadastre o formato do papel adesivo que você usa.
          </CardDescription>
        </div>
        <Button class="text-white shrink-0" @click="novoModelo">
          <Plus class="w-4 h-4" /> Novo modelo
        </Button>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <div v-if="!modelos.length" class="text-center py-8 space-y-2 text-muted-foreground border rounded-lg">
        <Tags class="h-10 w-10 text-primary/70 mx-auto" />
        <p>Nenhum modelo cadastrado ainda.</p>
        <p class="text-xs">Crie um modelo a partir de um preset pronto (ex.: A4 com 65 etiquetas) e ajuste conforme o
          seu papel.</p>
      </div>

      <div v-else class="grid gap-3 md:grid-cols-2">
        <div v-for="m in modelos" :key="m.id"
          class="border rounded-xl p-4 flex items-start justify-between gap-3 bg-card">
          <div class="min-w-0">
            <p class="font-medium truncate">{{ m.nome || 'Sem nome' }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ resumoModelo(m) }}</p>
            <div class="flex flex-wrap gap-1 mt-2">
              <span v-if="m.mostrarNome" class="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">nome</span>
              <span v-if="m.mostrarPreco" class="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">preço</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">{{ m.simbologia }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1 shrink-0">
            <Button variant="ghost" size="icon" title="Editar" @click="editarModelo(m)">
              <Pencil class="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Duplicar" @click="duplicarModelo(m)">
              <Copy class="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" class="text-danger" title="Excluir" @click="excluirModelo(m)">
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </CardContent>

    <!-- Modal criar/editar -->
    <ModalView v-model:open="modalAberto" :title="editando ? 'Editar modelo de etiqueta' : 'Novo modelo de etiqueta'"
      :icon="Tag" size="4xl">
      <div class="grid gap-5 px-4 lg:grid-cols-[1fr_320px]">
        <!-- Formulário -->
        <div class="space-y-5">
          <!-- Presets -->
          <div v-if="!editando" class="space-y-2">
            <Label>Começar a partir de um preset</Label>
            <Select v-model="presetSelecionado" @update:modelValue="aplicarPreset">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Escolha um formato pronto (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in presets" :key="p.chave" :value="p.chave">{{ p.descricao }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="et-nome">Nome do modelo <span class="text-danger">*</span></Label>
            <Input id="et-nome" v-model="form.nome" placeholder="Ex.: A4 - 65 etiquetas" class="bg-card" />
          </div>

          <!-- Papel -->
          <fieldset class="border rounded-lg p-3 space-y-3">
            <legend class="text-xs font-medium px-1 text-muted-foreground">Papel</legend>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-2">
                <Label>Tamanho do papel</Label>
                <Select v-model="form.papel">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="Letter">Carta (US Letter)</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label>Simbologia</Label>
                <Select v-model="form.simbologia">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code128">Code 128 (padrão)</SelectItem>
                    <SelectItem value="ean13">EAN-13</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div v-if="form.papel === 'CUSTOM'" class="grid grid-cols-2 gap-3">
              <NumberField label="Largura do papel (mm)" v-model="form.larguraPapelMm" />
              <NumberField label="Altura do papel (mm)" v-model="form.alturaPapelMm" />
            </div>
          </fieldset>

          <!-- Grade + margens -->
          <fieldset class="border rounded-lg p-3 space-y-3">
            <legend class="text-xs font-medium px-1 text-muted-foreground">Grade e margens da folha</legend>
            <div class="grid grid-cols-2 gap-3">
              <NumberField label="Colunas" v-model="form.colunas" :step="1" />
              <NumberField label="Linhas" v-model="form.linhas" :step="1" />
              <NumberField label="Margem superior (mm)" v-model="form.margemTopoMm" />
              <NumberField label="Margem esquerda (mm)" v-model="form.margemEsquerdaMm" />
            </div>
          </fieldset>

          <!-- Etiqueta -->
          <fieldset class="border rounded-lg p-3 space-y-3">
            <legend class="text-xs font-medium px-1 text-muted-foreground">Etiqueta</legend>
            <div class="grid grid-cols-2 gap-3">
              <NumberField label="Largura (mm)" v-model="form.larguraEtiquetaMm" />
              <NumberField label="Altura (mm)" v-model="form.alturaEtiquetaMm" />
              <NumberField label="Espaço horizontal (mm)" v-model="form.espacamentoHorizontalMm" />
              <NumberField label="Espaço vertical (mm)" v-model="form.espacamentoVerticalMm" />
              <NumberField label="Margem interna (mm)" v-model="form.paddingMm" />
            </div>
          </fieldset>

          <!-- Conteúdo -->
          <fieldset class="border rounded-lg p-3 space-y-3">
            <legend class="text-xs font-medium px-1 text-muted-foreground">Conteúdo da etiqueta</legend>
            <div class="flex items-center justify-between gap-2">
              <Label for="et-nome-sw">Mostrar nome do produto</Label>
              <Switch id="et-nome-sw" v-model="form.mostrarNome" />
            </div>
            <div class="flex items-center justify-between gap-2">
              <Label for="et-preco-sw">Mostrar preço</Label>
              <Switch id="et-preco-sw" v-model="form.mostrarPreco" />
            </div>
            <div class="flex items-center justify-between gap-2">
              <Label for="et-cod-sw">Mostrar números do código de barras</Label>
              <Switch id="et-cod-sw" v-model="form.mostrarCodigoTexto" />
            </div>
            <div class="flex items-center justify-between gap-2">
              <Label for="et-borda-sw">Mostrar borda de corte (pontilhada)</Label>
              <Switch id="et-borda-sw" v-model="form.mostrarBorda" />
            </div>
            <div class="grid grid-cols-2 gap-3 pt-1">
              <NumberField label="Fonte do nome (pt)" v-model="form.fonteNomePt" />
              <NumberField label="Fonte do preço (pt)" v-model="form.fontePrecoPt" />
            </div>
          </fieldset>
        </div>

        <!-- Preview -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label class="text-muted-foreground">Pré-visualização</Label>
            <span class="text-xs text-muted-foreground">{{ totalEtiquetas }} por folha</span>
          </div>
          <div class="border rounded-lg p-3 bg-muted/30 flex justify-center">
            <div class="relative bg-white shadow-sm border" :style="previewFolhaStyle">
              <div v-for="cell in celulasPreview" :key="cell.i" class="absolute border border-primary/40 bg-primary/5 overflow-hidden flex flex-col items-center justify-center gap-[2px]"
                :style="cell.style">
                <div v-if="form.mostrarNome" class="h-[3px] w-3/4 rounded-full bg-foreground/40" />
                <div class="flex items-end gap-[1px] h-1/2">
                  <span v-for="n in 9" :key="n" class="w-[1.5px] bg-foreground/70" :style="{ height: (30 + (n * 37) % 60) + '%' }" />
                </div>
                <div v-if="form.mostrarPreco" class="h-[3px] w-1/2 rounded-full bg-foreground/40" />
              </div>
            </div>
          </div>
          <p v-if="excedeLimitePreview" class="text-[11px] text-muted-foreground">
            Grade grande — mostrando apenas a estrutura.
          </p>
          <div v-if="alertaTransbordo" class="text-xs text-danger flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 shrink-0 mt-0.5" />
            <span>As etiquetas ultrapassam o tamanho do papel. Reduza colunas/linhas, o tamanho da etiqueta, os espaços ou as margens.</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4 px-4">
        <Button type="button" variant="secondary" @click="modalAberto = false">Cancelar</Button>
        <Button type="button" class="text-white" :disabled="salvando" @click="salvarModelo">
          <LoaderCircle v-if="salvando" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ salvando ? 'Salvando...' : 'Salvar modelo' }}
        </Button>
      </div>
    </ModalView>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ModalView from '@/components/formulario/ModalView.vue'
import NumberField from './partials/EtiquetaNumberField.vue'
import { Copy, LoaderCircle, Pencil, Plus, Save, Tag, Tags, Trash2, TriangleAlert } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { ContaRepository } from '@/repositories/conta-repository'
import {
  ETIQUETA_PRESETS,
  dimensoesPapel,
  modeloEmBranco,
  type EtiquetaModelo,
} from './partials/etiquetaPresets'

const toast = useToast()
const presets = ETIQUETA_PRESETS

const modelos = ref<EtiquetaModelo[]>([])
const modalAberto = ref(false)
const editando = ref(false)
const salvando = ref(false)
const presetSelecionado = ref<string | undefined>(undefined)
const editandoId = ref<string | null>(null)

const form = reactive<Omit<EtiquetaModelo, 'id'>>(modeloEmBranco())

function resetForm(base: Omit<EtiquetaModelo, 'id'> = modeloEmBranco()) {
  Object.assign(form, base)
}

function novoModelo() {
  editando.value = false
  editandoId.value = null
  presetSelecionado.value = undefined
  resetForm()
  modalAberto.value = true
}

function aplicarPreset(chave: unknown) {
  const preset = presets.find((p) => p.chave === String(chave))
  if (preset) resetForm({ ...preset.modelo })
}

function editarModelo(m: EtiquetaModelo) {
  editando.value = true
  editandoId.value = m.id
  const { id, ...rest } = m
  resetForm({ ...modeloEmBranco(), ...rest })
  modalAberto.value = true
}

function duplicarModelo(m: EtiquetaModelo) {
  editando.value = false
  editandoId.value = null
  presetSelecionado.value = undefined
  const { id, ...rest } = m
  resetForm({ ...modeloEmBranco(), ...rest, nome: `${m.nome} (cópia)` })
  modalAberto.value = true
}

async function excluirModelo(m: EtiquetaModelo) {
  const ok = await useConfirm().confirm({
    title: 'Excluir modelo',
    message: `Deseja excluir o modelo "${m.nome}"?`,
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    colorButton: 'danger',
  })
  if (!ok) return
  const novos = modelos.value.filter((x) => x.id !== m.id)
  await persistir(novos)
}

async function salvarModelo() {
  if (!form.nome.trim()) {
    toast.error('Informe o nome do modelo.')
    return
  }
  if (alertaTransbordo.value) {
    toast.error('As etiquetas ultrapassam o papel. Ajuste as medidas.')
    return
  }
  const dados: EtiquetaModelo = { ...form, id: editandoId.value ?? gerarId() }
  const novos =
    editando.value && editandoId.value
      ? modelos.value.map((m) => (m.id === editandoId.value ? dados : m))
      : [...modelos.value, dados]
  await persistir(novos)
  modalAberto.value = false
}

async function persistir(novos: EtiquetaModelo[]) {
  try {
    salvando.value = true
    await ContaRepository.parametros({ etiquetaModelos: novos } as any)
    modelos.value = novos
    toast.success('Modelos de etiqueta salvos.')
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar os modelos.')
  } finally {
    salvando.value = false
  }
}

function gerarId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `et_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function resumoModelo(m: EtiquetaModelo) {
  const papel = m.papel === 'CUSTOM' ? `${m.larguraPapelMm}×${m.alturaPapelMm}mm` : m.papel
  return `${papel} · ${m.colunas}×${m.linhas} · ${m.larguraEtiquetaMm}×${m.alturaEtiquetaMm}mm`
}

const totalEtiquetas = computed(() => (form.colunas || 0) * (form.linhas || 0))

// ---- Preview ----
const PREVIEW_MAX_W = 240 // px
const LIMITE_CELULAS = 300

const previewScale = computed(() => {
  const dims = dimensoesPapel(form)
  return PREVIEW_MAX_W / (dims.largura || 210)
})

const previewFolhaStyle = computed(() => {
  const dims = dimensoesPapel(form)
  const scale = previewScale.value
  return {
    width: `${dims.largura * scale}px`,
    height: `${dims.altura * scale}px`,
  }
})

const excedeLimitePreview = computed(() => totalEtiquetas.value > LIMITE_CELULAS)

const celulasPreview = computed(() => {
  const scale = previewScale.value
  const total = Math.min(totalEtiquetas.value, LIMITE_CELULAS)
  const cells: { i: number; style: Record<string, string> }[] = []
  for (let p = 0; p < total; p++) {
    const col = p % form.colunas
    const row = Math.floor(p / form.colunas)
    const left = (form.margemEsquerdaMm + col * (form.larguraEtiquetaMm + form.espacamentoHorizontalMm)) * scale
    const top = (form.margemTopoMm + row * (form.alturaEtiquetaMm + form.espacamentoVerticalMm)) * scale
    cells.push({
      i: p,
      style: {
        left: `${left}px`,
        top: `${top}px`,
        width: `${form.larguraEtiquetaMm * scale}px`,
        height: `${form.alturaEtiquetaMm * scale}px`,
      },
    })
  }
  return cells
})

const alertaTransbordo = computed(() => {
  const dims = dimensoesPapel(form)
  const larguraUsada =
    form.margemEsquerdaMm +
    form.colunas * form.larguraEtiquetaMm +
    Math.max(0, form.colunas - 1) * form.espacamentoHorizontalMm
  const alturaUsada =
    form.margemTopoMm +
    form.linhas * form.alturaEtiquetaMm +
    Math.max(0, form.linhas - 1) * form.espacamentoVerticalMm
  // pequena folga de 0.5mm para arredondamentos
  return larguraUsada > dims.largura + 0.5 || alturaUsada > dims.altura + 0.5
})

onMounted(async () => {
  try {
    const response = await ContaRepository.getParametros()
    const salvos = response?.data?.etiquetaModelos
    modelos.value = Array.isArray(salvos) ? salvos : []
  } catch (error) {
    console.error(error)
    modelos.value = []
  }
})
</script>
