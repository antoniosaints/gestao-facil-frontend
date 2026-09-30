<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FiscalConfig, NfseEmission } from '@/repositories/notas-fiscais-repository'
const props = defineProps<{
  form: Omit<Partial<NfseEmission>, 'clienteId'> & { clienteId?: number | null }
  config: FiscalConfig | null
  disabled?: boolean
}>()
const simples = computed(() => [1, 4].includes(props.config?.regimeTributario || 0))
const ibsFields = [
  { key: 'finNFSe', label: 'Finalidade NFS-e', maxlength: 1 },
  { key: 'cst', label: 'CST IBS/CBS', maxlength: 3 },
  { key: 'cIndOp', label: 'Código de indicação da operação', maxlength: 6 },
] as const
const ibsIndicators = [
  { key: 'indFinal', label: 'Consumidor final' },
  { key: 'indDest', label: 'Destinatário' },
  { key: 'indOpeOne', label: 'Tipo da operação' },
] as const
const ibsRates = [
  { key: 'ibsEstadual', label: 'IBS estadual' },
  { key: 'ibsMunicipal', label: 'IBS municipal' },
  { key: 'cbsFederal', label: 'CBS federal' },
] as const
function toggleIbs(enabled: boolean) {
  props.form.ibscbs = enabled
    ? {
        finNFSe: '0',
        cst: '',
        cIndOp: '',
        indFinal: '0',
        indDest: '0',
        indOpeOne: '0',
        ibsEstadual: { aliquota: 0, reducaoAliquota: 0 },
        ibsMunicipal: { aliquota: 0, reducaoAliquota: 0 },
        cbsFederal: { aliquota: 0, reducaoAliquota: 0 },
      }
    : undefined
}
</script>
<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="space-y-1.5">
      <Label for="nfse-competencia">Data de competência</Label
      ><Input
        id="nfse-competencia"
        v-model="form.dataCompetencia"
        type="date"
        :disabled="disabled"
      />
      <p class="text-xs text-muted-foreground">Se não preencher, será usada a data atual.</p>
    </div>
    <div v-if="simples" class="space-y-1.5">
      <Label for="nfse-total-simples">Percentual total de tributos do Simples (%)</Label
      ><Input
        id="nfse-total-simples"
        :model-value="form.percentualTributosSimplesNacional ?? undefined"
        @update:model-value="
          form.percentualTributosSimplesNacional = $event === '' ? null : Number($event)
        "
        type="number"
        min="0"
        max="100"
        step="0.01"
        :disabled="disabled"
      />
      <p class="text-xs text-muted-foreground">
        Informe o percentual total aplicável à operação. É diferente da alíquota de ISS e é exigido
        no padrão nacional.
      </p>
    </div>
    <div v-if="config?.nfse?.issRetido === '1'" class="space-y-1.5">
      <Label for="nfse-iss-retido">Valor do ISS retido</Label
      ><Input
        id="nfse-iss-retido"
        :model-value="form.valorIssRetido ?? undefined"
        @update:model-value="form.valorIssRetido = $event === '' ? null : Number($event)"
        type="number"
        min="0"
        step="0.01"
        :disabled="disabled"
      />
      <p class="text-xs text-muted-foreground">
        Se não preencher, será calculado pela alíquota ISS configurada.
      </p>
    </div>
  </div>
  <details class="rounded-lg border p-3">
    <summary class="cursor-pointer text-sm font-medium">Dados complementares do serviço</summary>
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <div class="space-y-1.5">
        <Label for="nfse-classificacao">Classificação tributária</Label
        ><Input
          id="nfse-classificacao"
          v-model="form.codigoClassificacaoTributaria"
          maxlength="16"
          :disabled="disabled"
        />
      </div>
      <div class="space-y-1.5">
        <Label for="nfse-nbs">Código NBS</Label
        ><Input id="nfse-nbs" v-model="form.codigoNbs" maxlength="16" :disabled="disabled" />
        <p class="text-xs text-muted-foreground">
          Preencha quando exigido e aceito pelo município.
        </p>
      </div>
      <div class="space-y-1.5">
        <Label for="nfse-anexo-cnae">Anexo do CNAE</Label
        ><Input
          id="nfse-anexo-cnae"
          v-model="form.codigoAnexoCnae"
          maxlength="16"
          placeholder="Ex.: III"
          :disabled="disabled"
        />
      </div>
      <div class="space-y-1.5">
        <Label for="nfse-incidencia">Município de incidência do ISS (IBGE)</Label
        ><Input
          id="nfse-incidencia"
          v-model="form.municipioIncidencia"
          maxlength="7"
          inputmode="numeric"
          :disabled="disabled"
        />
        <p class="text-xs text-muted-foreground">
          Se não preencher, será usado o município do prestador.
        </p>
      </div>
      <div class="space-y-1.5">
        <Label for="nfse-substituto">Tomador é substituto tributário?</Label
        ><Select v-model="form.substitutoTributario" :disabled="disabled"
          ><SelectTrigger id="nfse-substituto"><SelectValue /></SelectTrigger
          ><SelectContent
            ><SelectItem value="2">Não</SelectItem
            ><SelectItem value="1">Sim</SelectItem></SelectContent
          ></Select
        >
      </div>
    </div>
  </details>
  <details class="rounded-lg border p-3">
    <summary class="cursor-pointer text-sm font-medium">
      IBS/CBS, quando exigido pela operação
    </summary>
    <label class="mt-3 flex items-center gap-2 text-sm"
      ><input
        type="checkbox"
        :checked="!!form.ibscbs"
        :disabled="disabled"
        @change="toggleIbs(($event.target as HTMLInputElement).checked)"
      />Informar IBS/CBS nesta nota</label
    >
    <div v-if="form.ibscbs" class="mt-4 grid gap-4 sm:grid-cols-2">
      <div v-for="field in ibsFields" :key="field.key" class="space-y-1.5">
        <Label :for="`nfse-ibs-${field.key}`">{{ field.label }}</Label
        ><Input
          :id="`nfse-ibs-${field.key}`"
          v-model="form.ibscbs[field.key]"
          :maxlength="field.maxlength"
          inputmode="numeric"
          required
          :disabled="disabled"
        />
      </div>
      <div class="space-y-1.5">
        <Label for="nfse-tp-oper">Tipo de operação (opcional)</Label
        ><Select v-model="form.ibscbs.tpOper" :disabled="disabled"
          ><SelectTrigger id="nfse-tp-oper"
            ><SelectValue placeholder="Selecione o código aplicável" /></SelectTrigger
          ><SelectContent
            ><SelectItem
              v-for="value in ['1', '2', '3', '4', '5'] as const"
              :key="value"
              :value="value"
              >{{ value }}</SelectItem
            ></SelectContent
          ></Select
        >
      </div>
      <div v-for="field in ibsIndicators" :key="field.key" class="space-y-1.5">
        <Label :for="`nfse-ibs-${field.key}`">{{ field.label }}</Label
        ><Select v-model="form.ibscbs[field.key]" :disabled="disabled"
          ><SelectTrigger :id="`nfse-ibs-${field.key}`"><SelectValue /></SelectTrigger
          ><SelectContent
            ><SelectItem value="0">{{
              field.key === 'indDest'
                ? 'Tomador, adquirente e destinatário iguais'
                : field.key === 'indOpeOne'
                  ? 'Onerosa'
                  : 'Não'
            }}</SelectItem
            ><SelectItem value="1">{{
              field.key === 'indDest'
                ? 'Tomador e adquirente iguais'
                : field.key === 'indOpeOne'
                  ? 'Não onerosa'
                  : 'Sim'
            }}</SelectItem></SelectContent
          ></Select
        >
      </div>
      <div v-for="field in ibsRates" :key="field.key" class="space-y-1.5">
        <Label :for="`nfse-ibs-${field.key}`">{{ field.label }} (%)</Label
        ><Input
          :id="`nfse-ibs-${field.key}`"
          v-model.number="form.ibscbs[field.key].aliquota"
          type="number"
          min="0"
          max="100"
          step="0.0001"
          required
          :disabled="disabled"
        /><Label :for="`nfse-ibs-reducao-${field.key}`">Redução da alíquota (%)</Label
        ><Input
          :id="`nfse-ibs-reducao-${field.key}`"
          v-model.number="form.ibscbs[field.key].reducaoAliquota"
          type="number"
          min="0"
          max="100"
          step="0.0001"
          required
          :disabled="disabled"
        />
      </div>
    </div>
  </details>
</template>
