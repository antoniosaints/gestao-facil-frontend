<template>
  <Card class="w-full mx-auto rounded-none rounded-b-xl">
    <CardHeader>
      <div class="flex items-center justify-between gap-4">
        <div>
          <CardTitle>Selecionar impressora</CardTitle>
          <p class="text-sm text-muted-foreground">Escolha a impressora usada pelo PDV, verifique se o QZTray está
            instalado corretamente.</p>
        </div>

        <div class="flex items-center gap-2">
          <Badge v-if="connected" class="px-3 py-1 text-white">Conectado</Badge>
          <Badge v-else variant="destructive" class="px-3 py-1 text-white">Desconectado</Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="flex gap-2">
        <Input v-model="filter" placeholder="Filtrar impressoras..." @input="filterPrinters" class="flex-1" />
        <Button class="text-white" :loading="loading" @click="loadPrinters">Buscar</Button>
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
        <div class="text-sm text-muted-foreground">
          Impressora salva:
          <span class="font-medium" v-if="saved">{{ saved }}</span>
          <span v-else class="italic">Nenhuma</span>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" @click="clearSaved" v-if="saved">Limpar</Button>
          <Button variant="secondary" @click="testarImpressao" v-if="saved">Testar</Button>
          <Button class="text-white" :disabled="!selected" @click="saveSelected">Salvar</Button>
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
import { ref, onMounted } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

const printers = ref<string[]>([]);
const filtered = ref<string[]>([]);
const selected = ref<string>('');
const toast = useToast();
const saved = ref<string | null>(qzTray.getSavedPrinter());
const filter = ref('');
const loading = ref(false);
const connected = ref(false);

onMounted(loadPrinters);

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
      title: 'Testar impressão',
      message: 'Tem certeza que deseja testar a impressão?',
      confirmText: 'Sim, testar!',
      cancelText: 'Cancelar',
      colorButton: 'primary'
    })
    if (!await cfn) return
    await qzTray.printNormal("<h2>TESTE DE IMPRESSÃO</h2><p>Operação concluída</p>");
    toast.info('Impressão enviada para a fila.');
  } catch (err) {
    console.error(err);
    toast.error('Erro ao testar impressão.');
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

// tenta recuperar lista salva ao montar
onMounted(() => {
  if (saved.value) selected.value = saved.value;
  // opcional: autoload
  // loadPrinters();
});
</script>
