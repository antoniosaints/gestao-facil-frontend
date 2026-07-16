<template>
  <CollapsibleSection v-model:open="aberto" title="Fiscal (NF-e)" :icon="ReceiptText">
    <p class="mb-3 text-xs text-muted-foreground">
      Preencha apenas se emite nota fiscal. Todos os campos são opcionais.
    </p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">NCM</label>
        <Input v-model="form.ncm" type="text" placeholder="Ex: 6109.10.00" class="bg-background dark:bg-background/60" />
      </div>
      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">CEST</label>
        <Input v-model="form.cest" type="text" placeholder="Ex: 28.038.00" class="bg-background dark:bg-background/60" />
      </div>
      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">CFOP</label>
        <Input v-model="form.cfop" type="text" placeholder="Ex: 5102" class="bg-background dark:bg-background/60" />
      </div>
      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">Código fiscal</label>
        <Input v-model="form.codigoProduto" type="text" placeholder="Código do produto (NF)"
          class="bg-background dark:bg-background/60" />
      </div>

      <div class="md:col-span-12">
        <label class="mb-1.5 block text-sm font-medium text-foreground">Origem da mercadoria</label>
        <Select v-model="form.origem">
          <SelectTrigger class="w-full bg-background dark:bg-background/60">
            <SelectValue placeholder="Selecione a origem (SEFAZ)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in ORIGENS" :key="opt.value" :value="opt.value">
              {{ opt.value }} - {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">Alíquota ICMS (%)</label>
        <Input v-model="form.aliquotaIcms" type="number" min="0" step="0.01" placeholder="0,00"
          class="bg-background dark:bg-background/60" />
      </div>
      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">Alíquota IPI (%)</label>
        <Input v-model="form.aliquotaIpi" type="number" min="0" step="0.01" placeholder="0,00"
          class="bg-background dark:bg-background/60" />
      </div>
      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">Alíquota PIS (%)</label>
        <Input v-model="form.aliquotaPis" type="number" min="0" step="0.01" placeholder="0,00"
          class="bg-background dark:bg-background/60" />
      </div>
      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">Alíquota COFINS (%)</label>
        <Input v-model="form.aliquotaCofins" type="number" min="0" step="0.01" placeholder="0,00"
          class="bg-background dark:bg-background/60" />
      </div>
      <div class="md:col-span-3">
        <label class="mb-1.5 block text-sm font-medium text-foreground">Alíquota ISS (%)</label>
        <Input v-model="form.issAliquota" type="number" min="0" step="0.01" placeholder="0,00"
          class="bg-background dark:bg-background/60" />
      </div>
    </div>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReceiptText } from 'lucide-vue-next'
import CollapsibleSection from './CollapsibleSection.vue'

// Recebe o form reativo da store (store.form ou store.varianteForm) e edita direto.
defineProps<{ form: Record<string, any> }>()

const aberto = ref(false)

// Origem da mercadoria conforme tabela SEFAZ (0 a 8).
const ORIGENS = [
  { value: 0, label: 'Nacional' },
  { value: 1, label: 'Estrangeira - Importação direta' },
  { value: 2, label: 'Estrangeira - Adquirida no mercado interno' },
  { value: 3, label: 'Nacional, Conteúdo de Importação entre 40% e 70%' },
  { value: 4, label: 'Nacional, produção conforme processos produtivos básicos' },
  { value: 5, label: 'Nacional, Conteúdo de Importação até 40%' },
  { value: 6, label: 'Estrangeira - Importação direta, sem similar nacional' },
  { value: 7, label: 'Estrangeira - Mercado interno, sem similar nacional' },
  { value: 8, label: 'Nacional, Conteúdo de Importação superior a 70%' },
]
</script>
