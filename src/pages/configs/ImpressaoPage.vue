<template>
  <div class="grid items-start gap-3 xl:grid-cols-2">
    <Card class="mx-auto w-full rounded-none rounded-b-xl bg-background">
      <CardHeader class="pb-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 space-y-1">
            <CardTitle class="flex items-center gap-2 font-normal">
              <Printer class="h-5 w-5 text-primary" /> Configurar impressão
            </CardTitle>
            <CardDescription>Escolha a impressora usada pelo PDV.</CardDescription>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              :class="isConected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'">
              <component :is="isConected ? Link2 : Link2Off" class="h-3.5 w-3.5" />
              {{ isConected ? 'QZ Tray conectado' : 'QZ Tray desconectado' }}
            </span>
            <Button variant="outline" size="sm" @click="isOpen = true">
              <HelpCircle class="h-4 w-4" /> Instalação
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Sem o QZ Tray rodando nada funciona: o aviso vem antes dos controles -->
        <div v-if="!isConected && !loading"
          class="flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 sm:flex-row sm:items-center">
          <TriangleAlert class="h-5 w-5 shrink-0 text-rose-600" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-foreground">Não foi possível falar com o QZ Tray</p>
            <p class="text-xs text-muted-foreground">
              A impressão direta precisa do QZ Tray instalado e em execução no computador. Instale, abra o programa e
              busque novamente.
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" @click="isOpen = true">
              <Download class="h-4 w-4" /> Instalar
            </Button>
            <Button size="sm" class="text-white" @click="loadPrinters">
              <RefreshCw class="h-4 w-4" /> Tentar de novo
            </Button>
          </div>
        </div>

        <!-- Estado atual: o que já está valendo para o PDV -->
        <div class="rounded-xl border bg-card p-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                :class="saved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'">
                <PrinterCheck class="h-4 w-4" />
              </span>
              <div class="min-w-0">
                <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Impressora em uso</p>
                <p class="truncate text-sm font-semibold" :class="saved ? '' : 'italic text-muted-foreground'">
                  {{ saved || 'Nenhuma impressora salva' }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button v-if="saved && isConected" variant="outline" size="sm" @click="testarImpressao">
                <PrinterCheck class="h-4 w-4 text-emerald-600" /> Testar
              </Button>
              <Button v-if="saved" variant="outline" size="sm" class="text-rose-600 hover:text-rose-700"
                @click="clearSaved">
                <X class="h-4 w-4" /> Limpar
              </Button>
            </div>
          </div>
        </div>

        <!-- Tamanho do papel -->
        <div class="grid gap-2">
          <Label for="paperSize">Tamanho do papel do cupom</Label>
          <Select v-model="paperSize" @update:modelValue="saveSizePaper">
            <SelectTrigger id="paperSize" class="w-full sm:w-60">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="A5">A5</SelectItem>
              <SelectItem value="Letter">Carta (US Letter)</SelectItem>
              <SelectItem value="80mm">Térmica 80mm</SelectItem>
              <SelectItem value="58mm">Térmica 58mm</SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            Usado ao imprimir cupons e comprovantes. Não afeta as etiquetas.
          </p>
        </div>

        <!-- Seleção da impressora -->
        <div class="grid gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <Label for="filtroImpressora">Impressoras disponíveis</Label>
            <span v-if="printers.length" class="text-xs tabular-nums text-muted-foreground">
              {{ filtered.length }} de {{ printers.length }}
            </span>
          </div>
          <div class="flex gap-2">
            <Input id="filtroImpressora" v-model="filter" placeholder="Filtrar impressoras..." class="flex-1"
              @input="filterPrinters" />
            <Button class="text-white" :disabled="loading" @click="loadPrinters">
              <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
              <span class="hidden sm:inline">{{ loading ? 'Buscando...' : 'Buscar' }}</span>
            </Button>
          </div>

          <div v-if="loading" class="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <Printer class="h-8 w-8 animate-bounce text-primary" />
            Buscando impressoras...
          </div>

          <!-- A lista rola dentro de si: 10 impressoras não podem esticar a página -->
          <div v-else-if="filtered.length" class="grid max-h-80 gap-2 overflow-y-auto pr-1">
            <button v-for="p in filtered" :key="p" type="button"
              class="flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/40"
              :class="p === selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''" @click="selectPrinter(p)">
              <span class="flex min-w-0 items-center gap-2">
                <Printer class="h-4 w-4 shrink-0 text-muted-foreground" />
                <span class="truncate text-sm font-medium">{{ p }}</span>
              </span>
              <span class="flex shrink-0 items-center gap-2">
                <span v-if="p === saved"
                  class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Em uso
                </span>
                <Check v-if="p === selected" class="h-4 w-4 text-primary" />
              </span>
            </button>
          </div>

          <div v-else-if="printers.length"
            class="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Inbox class="h-8 w-8 opacity-50" />
            Nenhuma impressora corresponde a "{{ filter }}".
          </div>

          <div v-else-if="isConected"
            class="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <CircleOff class="h-8 w-8 opacity-50" />
            Nenhuma impressora instalada foi encontrada neste computador.
          </div>
        </div>

        <div v-if="isConected" class="flex justify-end border-t pt-3">
          <Button class="text-white" :disabled="!selected || selected === saved" @click="saveSelected">
            <Save class="h-4 w-4" />
            {{ selected === saved ? 'Impressora já salva' : 'Salvar impressora' }}
          </Button>
        </div>
      </CardContent>
      <ModalView v-model:open="isOpen" title="QZ Tray — Instalação"
        description="Siga os passos abaixo para habilitar a impressão direta." :icon="CircleFadingPlus" size="md">
        <div class="px-4 py-2 space-y-4">

          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Para configurar a impressora, instale o QZ Tray e adicione o certificado de segurança.
            Esse processo é rápido e necessário para que a impressão funcione corretamente.
            <strong>(Disponível apenas para Windows)</strong>
          </p>

          <!-- Card de instruções -->
          <div
            class="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <p class="font-medium text-gray-800 dark:text-gray-200 text-sm">
              Passos da instalação:
            </p>

            <ul class="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Baixe e instale o QZ Tray em seu computador.</li>
              <li>Baixe o certificado de impressão.</li>
              <li>Abra o QZ Tray e clique em Advanced -> Site Manager.</li>
              <li>Na tela que abrir, clique no "<strong class="text-info dark:text-cyan-400">+</strong>", depois em
                "Browse..." e adicione o
                certificado baixado.
              </li>
              <li>Concorde com as opções, recarregue a página e pronto, comece a imprimir 🎉.</li>
            </ul>
          </div>

          <!-- Botões -->
          <div class="flex gap-3 pt-2">
            <Button class="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2" @click="baixarPluguin">
              <Download />
              Baixar QZ Tray
            </Button>
            <Button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2" @click="baixarCertificado">
              <Download />
              Baixar Certificado
            </Button>
          </div>
        </div>
      </ModalView>
    </Card>

    <EtiquetasModelosPage />
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConfirm } from '@/composables/useConfirm'
import qzTray from '@/utils/qzTray'
import {
  Check,
  CircleFadingPlus,
  CircleOff,
  Download,
  HelpCircle,
  Inbox,
  Link2,
  Link2Off,
  Printer,
  PrinterCheck,
  RefreshCw,
  Save,
  TriangleAlert,
  X,
} from 'lucide-vue-next'
import { ref, onMounted, computed } from 'vue'
import { POSITION, useToast } from 'vue-toastification'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImpressaoRepository } from '@/repositories/impressao-repository'
import ModalView from '@/components/formulario/ModalView.vue'
import { getTemplateTesteEscPos } from './partials/templateEscpos'
import EtiquetasModelosPage from './EtiquetasModelosPage.vue'

const printers = ref<string[]>([])
const filtered = ref<string[]>([])
const selected = ref<string>('')
const isOpen = ref(false)
const toast = useToast()
const saved = ref<string | null>(localStorage.getItem('qz_printer'))
const filter = ref('')
const loading = ref(false)
const connected = ref(false)

const paperSize = ref('A4')

const isConected = computed(() => connected.value)

function saveSizePaper() {
  localStorage.setItem('qz_size_paper', paperSize.value)
}

async function baixarCertificado() {
  try {
    // const cfn = useConfirm().confirm({
    //   title: 'Certificado QzTray',
    //   message: 'Após o download, faça a instalação do certificado no pluguin QzTray.',
    //   confirmText: 'Baixar!',
    //   cancelText: 'Cancelar',
    //   colorButton: 'primary',
    // })
    // if (!(await cfn)) return
    toast.info('Iniciando download.')
    await ImpressaoRepository.downloadCertificado()
    toast.success('Certificado baixado, instale no QzTray.')
  } catch (err: any) {
    console.error(err)
    toast.error('Erro ao baixar certificado')
  }
}
async function baixarPluguin() {
  try {
    // const cfn = useConfirm().confirm({
    //   title: 'Download QzTray',
    //   message: 'Após o download, faça a instalação do pluguin QzTray.',
    //   confirmText: 'Baixar!',
    //   cancelText: 'Cancelar',
    //   colorButton: 'primary',
    // })
    // if (!(await cfn)) return
    toast.info('Download inciado, aguarde...')
    await ImpressaoRepository.downloadPluguin()
    toast.success('Download concluído, instale no QzTray.')
  } catch (err: any) {
    console.error(err)
    toast.error('Erro ao baixar o qztray')
  }
}
async function testarImpressao() {
  try {
    const cfn = useConfirm().confirm({
      title: `Testar impressão ${saved.value}`,
      message: 'Tem certeza que deseja testar a impressão? O documento será enviado para a fila.',
      confirmText: 'Sim, testar!',
      cancelText: 'Cancelar',
      colorButton: 'primary',
    })
    if (!(await cfn)) return
    const example = getTemplateTesteEscPos(qzTray.getSavedSize(), qzTray.getSavedPrinter())
    await qzTray.printTermal(example)
    toast.info('Impressão enviada para a fila.')
  } catch (err: any) {
    console.error(err)
    toast.error(err.message || 'Erro ao testar impressão.')
  }
}

async function loadPrinters() {
  loading.value = true
  try {
    await qzTray.connect()
    connected.value = true
    const list = await qzTray.getPrinters()
    printers.value = Array.isArray(list) ? list : []
    filtered.value = printers.value
  } catch (err) {
    console.error('Erro QZ:', err)
    connected.value = false
    printers.value = []
    filtered.value = []
    toast.error('Erro ao carregar impressoras, verifique se o QzTray está rodando.', {
      timeout: 5000,
      position: POSITION.BOTTOM_CENTER,
    })
  } finally {
    loading.value = false
  }
}

function selectPrinter(p: string) {
  selected.value = p
}

function filterPrinters() {
  const q = filter.value.trim().toLowerCase()
  filtered.value = q
    ? printers.value.filter((p) => p.toLowerCase().includes(q))
    : [...printers.value]
}

function saveSelected() {
  if (!selected.value) return
  qzTray.savePrinter(selected.value)
  saved.value = selected.value
  toast.success('Impressora salva!')
}

function clearSaved() {
  localStorage.removeItem('qz_printer')
  saved.value = null
  toast.success('Impressora removida!')
}

onMounted(() => {
  loadPrinters();
  if (saved.value) selected.value = saved.value;
  paperSize.value = localStorage.getItem("qz_size_paper") || "A4";
});
</script>
