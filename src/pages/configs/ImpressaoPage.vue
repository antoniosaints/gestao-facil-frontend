<template>
  <Card class="w-full mx-auto rounded-none rounded-b-xl">
    <CardHeader>
      <div class="flex items-center justify-between gap-4">
        <div>
          <CardTitle>Configurar impressora</CardTitle>
          <p class="text-sm text-muted-foreground">Escolha a impressora usada pelo PDV, verifique se o QZTray está
            instalado corretamente.</p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-blue-500 dark:text-blue-400 px-2 py-1.5 border rounded-lg cursor-pointer"
            @click="baixarCeriticado">Baixar Certificado</span>
          <Badge v-if="isConected" class="px-3 py-1 text-white bg-success hover:bg-success/80">
            <Link2 class="mr-2 w-5 h-5" /> Conectado
          </Badge>
          <Badge v-else variant="destructive" class="px-3 py-1 text-white">
            <Link2Off class="mr-2 w-5 h-5" /> Desconectado
          </Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="flex gap-2">
        <Select v-model="paperSize" @update:modelValue="saveSizePaper">
          <SelectTrigger class="max-w-36">
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
          <Search /> Buscar
        </Button>
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

      <p v-else class="text-sm text-muted-foreground">Nenhuma impressora encontrada. Tente buscar.</p>

      <div class="flex items-center justify-between gap-2">
        <div class="text-sm text-foreground border p-3 rounded-lg">
          Impressora salva:
          <span class="font-medium text-primary dark:text-blue-400" v-if="saved">{{ saved }}</span>
          <span v-else class="italic">Nenhuma</span>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" @click="clearSaved" v-if="saved">Limpar</Button>
          <Button variant="outline" class="bg-success hover:bg-success/80 text-white hover:text-white"
            @click="testarImpressao" v-if="saved">
            <PrinterCheck /> Testar conexão
          </Button>
          <Button class="text-white" :disabled="!selected" @click="saveSelected">
            <Save /> Salvar
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useConfirm } from '@/composables/useConfirm';
import qzTray from '@/utils/qzTray';
import { Link2, Link2Off, PrinterCheck, Save, Search } from 'lucide-vue-next';
import { ref, onMounted, computed } from 'vue';
import { POSITION, useToast } from 'vue-toastification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImpressaoRepository } from '@/repositories/impressao-repository';
import { getTemplateTesteImpressao } from './partials/templateTesteImpressao';

const printers = ref<string[]>([]);
const filtered = ref<string[]>([]);
const selected = ref<string>('');
const toast = useToast();
const saved = ref<string | null>(qzTray.getSavedPrinter());
const filter = ref('');
const loading = ref(false);
const connected = ref(false);

const paperSize = ref("A4");

const isConected = computed(() => connected.value);

function saveSizePaper() {
  localStorage.setItem("qz_size_paper", paperSize.value);
}

async function baixarCeriticado() {
  try {
    const cfn = useConfirm().confirm({
      title: 'Certificado QzTray',
      message: 'Após o download, faça a instalação do certificado no pluguin QzTray.',
      confirmText: 'Baixar!',
      cancelText: 'Cancelar',
      colorButton: 'primary'
    })
    if (!await cfn) return
    await ImpressaoRepository.downloadCertificado();
    toast.success('Certificado baixado, instale no QzTray.');
  } catch (err: any) {
    console.error(err);
    toast.error('Erro ao baixar certificado');
  }
}
function shortName(name: string) {
  // versão curta para visual
  if (name.length > 36) return name.slice(0, 33) + '...';
  return name;
}

function buttonClass(p: string) {
  return p === selected.value
    ? 'bg-primary text-gray-200 border-primary'
    : '';
}

async function testarImpressao() {
  try {
    const cfn = useConfirm().confirm({
      title: `Testar impressão ${saved.value}`,
      message: 'Tem certeza que deseja testar a impressão? O documento será enviado para a fila.',
      confirmText: 'Sim, testar!',
      cancelText: 'Cancelar',
      colorButton: 'primary'
    })
    if (!await cfn) return
    const example = getTemplateTesteImpressao(qzTray.getSavedSize(), qzTray.getSavedPrinter());
    await qzTray.printNormal(example);
    toast.info('Impressão enviada para a fila.');
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || 'Erro ao testar impressão.');
  }
}


async function loadPrinters() {
  loading.value = true;
  try {
    await qzTray.connect();
    connected.value = true;
    const list = await qzTray.getPrinters();
    printers.value = Array.isArray(list) ? list : [];
    filtered.value = printers.value;
  } catch (err) {
    console.error('Erro QZ:', err);
    connected.value = false;
    printers.value = [];
    filtered.value = [];
    toast.error('Erro ao carregar impressoras, verifique se o QzTray está rodando.', {
      timeout: 5000,
      position: POSITION.BOTTOM_CENTER
    });
  } finally {
    loading.value = false;
  }
}

function selectPrinter(p: string) {
  selected.value = p;
}

function filterPrinters() {
  const q = filter.value.trim().toLowerCase();
  filtered.value = q ? printers.value.filter(p => p.toLowerCase().includes(q)) : [...printers.value];
}

function saveSelected() {
  if (!selected.value) return;
  qzTray.savePrinter(selected.value);
  saved.value = selected.value;
  toast.success('Impressora salva!');
}

function clearSaved() {
  localStorage.removeItem('qz_printer');
  saved.value = null;
  toast.success('Impressora removida!');
}

onMounted(() => {
  loadPrinters();
  if (saved.value) selected.value = saved.value;
  paperSize.value = localStorage.getItem("qz_size_paper") || "A4";
});
</script>
