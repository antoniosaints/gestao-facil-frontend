<script setup lang="ts">
import { ref } from 'vue'
import { Download, LoaderCircle, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  NotasFiscaisRepository,
  type NfseConsultRecord,
  type NfseConsultResult,
} from '@/repositories/notas-fiscais-repository'
import { formatFiscalDate } from './fiscalPresentation'
const lastNsu = ref('0')
const key = ref('')
const busy = ref(false)
const error = ref('')
const result = ref<NfseConsultResult | null>(null)
const queriedNsu = ref('')
async function search(nsu = lastNsu.value) {
  if (busy.value) return
  if (!/^\d{1,20}$/.test(nsu) || (key.value && !/^\d{50}$/.test(key.value.trim()))) {
    error.value = 'Informe um NSU válido e, se preencher a chave, use 50 dígitos.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    result.value = await NotasFiscaisRepository.consultarNfse({
      ultimoNsu: nsu,
      ...(key.value.trim() ? { chaveNfse: key.value.trim() } : {}),
    })
    lastNsu.value = nsu
    queriedNsu.value = nsu
  } catch (cause: any) {
    error.value =
      cause?.response?.data?.error?.message || 'Não foi possível consultar as notas na Geranet.'
  } finally {
    busy.value = false
  }
}
function downloadXml(record: NfseConsultRecord) {
  if (!record.xml) return
  const content = record.xml.trim()
  const bytes = /^(?:[\da-f]{2})+$/i.test(content)
    ? Uint8Array.from(content.match(/.{2}/g)!, (value) => parseInt(value, 16))
    : new TextEncoder().encode(content)
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/xml' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `NFS-e-${record.numeroNota || record.nsu}.xml`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>
<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">
      Consulte NFS-e recebidas pelo CNPJ da sua conta no portal nacional. Estas notas são separadas
      das emissões realizadas pelo sistema.
    </p>
    <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="search()">
      <div class="space-y-1.5">
        <Label for="nfse-nsu">Último NSU</Label
        ><Input
          id="nfse-nsu"
          v-model="lastNsu"
          inputmode="numeric"
          maxlength="20"
          :disabled="busy"
        />
        <p class="text-xs text-muted-foreground">Use 0 para a primeira consulta.</p>
      </div>
      <div class="space-y-1.5">
        <Label for="nfse-query-key">Chave nacional da NFS-e (opcional)</Label
        ><Input
          id="nfse-query-key"
          v-model="key"
          inputmode="numeric"
          maxlength="50"
          :disabled="busy"
        />
      </div>
      <div class="sm:col-span-2">
        <Button type="submit" :disabled="busy"
          ><LoaderCircle v-if="busy" class="size-4 animate-spin" /><Search
            v-else
            class="size-4"
          />Consultar notas</Button
        >
      </div>
    </form>
    <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
    <template v-if="result">
      <p class="text-xs text-muted-foreground">
        {{ result.registros.length }} nota(s) retornada(s) · Último NSU {{ result.ultimoNsu }} ·
        Máximo {{ result.maximoNsu }}
      </p>
      <div class="overflow-x-auto rounded-lg border">
        <Table
          ><TableHeader
            ><TableRow
              ><TableHead>Nota / NSU</TableHead><TableHead>Prestador</TableHead
              ><TableHead>Status</TableHead><TableHead>Data</TableHead
              ><TableHead>Arquivo</TableHead></TableRow
            ></TableHeader
          ><TableBody
            ><TableRow v-for="record in result.registros" :key="`${record.nsu}-${record.chaveDfe}`"
              ><TableCell
                ><p class="font-medium">{{ record.numeroNota || 'Sem número' }}</p>
                <p class="text-xs text-muted-foreground">NSU {{ record.nsu }}</p></TableCell
              ><TableCell>{{
                record.dadosNota?.prestador?.razaoSocial || 'Não informado'
              }}</TableCell
              ><TableCell>{{ record.descricaoSituacao || 'Não informado' }}</TableCell
              ><TableCell class="whitespace-nowrap">{{ formatFiscalDate(record.data) }}</TableCell
              ><TableCell
                ><Button v-if="record.xml" size="sm" variant="outline" @click="downloadXml(record)"
                  ><Download class="size-4" />XML</Button
                ><span v-else class="text-xs text-muted-foreground"
                  >XML não retornado</span
                ></TableCell
              ></TableRow
            ><TableRow v-if="!result.registros.length"
              ><TableCell :colspan="5" class="py-6 text-center text-muted-foreground"
                >Nenhuma nota recebida nesta consulta.</TableCell
              ></TableRow
            ></TableBody
          ></Table
        >
      </div>
      <Button
        v-if="
          !key &&
          result.temMais &&
          result.proximoNsuSugerido &&
          result.proximoNsuSugerido !== queriedNsu
        "
        variant="outline"
        :disabled="busy"
        @click="search(result.proximoNsuSugerido!)"
        >Próximas notas</Button
      >
    </template>
  </div>
</template>
