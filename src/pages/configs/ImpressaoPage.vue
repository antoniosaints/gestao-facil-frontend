<template>
  <Card class="w-full bg-background mx-auto rounded-none rounded-b-xl">
    <CardHeader>
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Configurar impressora</CardTitle>
          <p class="text-sm text-muted-foreground">
            Escolha a impressora usada pelo PDV, verifique se o QZTray está instalado corretamente.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <Badge class="px-3 py-1 font-normal cursor-pointer text-white bg-primary hover:bg-primary/80"
            @click="isOpen = true">
            <Download class="w-5 h-5 mr-2 inline-flex" />
            Dowloads
          </Badge>
          <Badge v-if="isConected" class="px-3 py-1 text-white font-normal bg-success hover:bg-success/80">
            <Link2 class="mr-2 w-5 h-5" /> Conectado
          </Badge>
          <Badge v-else variant="destructive" class="px-3 py-1 text-white font-normal">
            <Link2Off class="mr-2 w-5 h-5" /> Desconectado
          </Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="flex gap-2">
        <Select v-model="paperSize" @update:modelValue="saveSizePaper">
          <SelectTrigger class="w-16 md:w-36 max-w-36">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="A5">A5</SelectItem>
            <SelectItem value="Letter">Carta (US Letter)</SelectItem>
            <SelectItem value="80mm">Térmica 80mm</SelectItem>
          </SelectContent>
        </Select>
        <Input v-model="filter" placeholder="Filtrar impressoras..." @input="filterPrinters" class="flex-1" />
        <Button class="text-white" :loading="loading" @click="loadPrinters">
          <Search /> <span class="hidden md:inline">Buscar</span>
        </Button>
      </div>

      <div v-if="loading" class="text-center py-4 space-y-2 text-muted-foreground">
        <Printer class="h-10 w-10 text-primary dark:text-blue-500 animate-bounce mx-auto" />
        Buscando impressoras...
      </div>

      <div v-if="printers.length" class="grid gap-2">
        <label class="text-sm font-medium text-muted-foreground">Impressoras encontradas</label>

        <div class="grid gap-2">
          <button v-for="p in filtered" :key="p" @click="selectPrinter(p)" :class="buttonClass(p)"
            class="text-left p-3 rounded-lg border hover:shadow-sm transition">
            <div class="flex items-center justify-between">
              <div class="truncate">
                <div class="font-semibold">{{ p }}</div>
                <div class="text-xs truncate">{{ shortName(p) }}</div>
              </div>
              <div class="ml-3">
                <svg v-if="p === selected" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                  fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414L8.414 15 5 11.586a1 1 0 011.414-1.414L8.414 12.172 15.293 5.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      <p v-if="!printers.length && !loading" class="text-center py-4 space-y-2 text-muted-foreground">
        <CircleOff class="h-10 w-10 text-danger text-red-500 animate-fade-in mx-auto" />
        Nenhuma impressora encontrada. Tente buscar.
      </p>

      <div class="flex flex-col md:flex-row items-center justify-between gap-2">
        <div class="text-sm text-foreground border p-3 rounded-lg">
          Impressora salva:
          <span class="font-medium text-primary dark:text-blue-400" v-if="saved">{{ saved }}</span>
          <span v-else class="italic">Nenhuma</span>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" @click="clearSaved" v-if="saved">Limpar</Button>
          <Button variant="outline" class="bg-success hover:bg-success/80 text-white hover:text-white"
            @click="testarImpressao" v-if="saved && isConected">
            <PrinterCheck /> <span class="hidden md:inline">Testar conexão</span>
          </Button>
          <Button class="text-white" v-if="isConected" :disabled="!selected" @click="saveSelected">
            <Save /> Salvar
          </Button>
        </div>
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
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/composables/useConfirm'
import qzTray from '@/utils/qzTray'
import { CircleFadingPlus, CircleOff, Download, Link2, Link2Off, Printer, PrinterCheck, Save, Search } from 'lucide-vue-next'
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
function shortName(name: string) {
  // versão curta para visual
  if (name.length > 36) return name.slice(0, 33) + '...'
  return name
}

function buttonClass(p: string) {
  return p === selected.value ? 'bg-primary text-gray-200 border-primary' : ''
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
