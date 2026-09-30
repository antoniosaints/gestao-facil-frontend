<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { FileText, LoaderCircle, Plus, RefreshCw, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ModalView from '@/components/formulario/ModalView.vue'
import FiscalHistoryTable from './FiscalHistoryTable.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { NotasFiscaisRepository, type FiscalConfig } from '@/repositories/notas-fiscais-repository'

const router = useRouter()
const toast = useToast()
const loading = ref(true)
const issuing = ref(false)
const emissionOpen = ref(false)
const config = ref<FiscalConfig | null>(null)
const historyVersion = ref(0)
const ready = computed(() => Boolean(config.value?.emissaoNfsePronta))
const isD2ti = computed(() => config.value?.modoEmissaoNfse === 'LEGADO_D2TI')
const form = reactive({
  clienteId: null as number | null,
  valorTotal: 0,
  codigoServico: '',
  codigoMunicipioTomador: '',
  discriminacao: '',
})

async function load() {
  try {
    const fiscalConfig = await NotasFiscaisRepository.getConfig()
    config.value = fiscalConfig
    form.codigoServico = fiscalConfig.codigoServicoPadrao
    if (fiscalConfig.codigoMunicipioPrestador)
      form.codigoMunicipioTomador = fiscalConfig.codigoMunicipioPrestador
  } catch {
    toast.error('Não foi possível carregar as NFS-e.')
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function emit() {
  if (issuing.value || !ready.value) return
  if (
    !form.clienteId ||
    form.valorTotal <= 0 ||
    (isD2ti.value && !form.codigoMunicipioTomador) ||
    form.discriminacao.trim().length < 3
  ) {
    toast.info(
      isD2ti.value
        ? 'Selecione o tomador, informe valor, código TOM do município e a descrição do serviço.'
        : 'Selecione o tomador, informe valor e a descrição do serviço para gerar a DPS.',
    )
    return
  }
  try {
    issuing.value = true
    const invoice = await NotasFiscaisRepository.emitNfse(
      { ...form, clienteId: form.clienteId },
      crypto.randomUUID(),
    )
    historyVersion.value += 1
    Object.assign(form, {
      clienteId: null,
      valorTotal: 0,
      codigoServico: config.value?.codigoServicoPadrao || '',
      codigoMunicipioTomador: config.value?.codigoMunicipioPrestador || '',
      discriminacao: '',
    })
    emissionOpen.value = false
    toast.success(
      isD2ti.value
        ? invoice.status === 'HOMOLOGADA'
          ? 'XML validado em homologação.'
          : 'NFS-e autorizada pela prefeitura.'
        : 'NFS-e autorizada pela Geranet.',
    )
  } catch (error: any) {
    const data = error?.response?.data?.error
    toast.error(data?.message || 'Não foi possível emitir a NFS-e.')
    historyVersion.value += 1
  } finally {
    issuing.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 pb-10">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <FileText class="size-6 text-primary" />NFS-e
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Notas de serviços emitidas e processadas pelo emissor fiscal.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" @click="router.push({ name: 'notas-fiscais-homologacao' })"
          >Testar em homologação</Button
        >
        <Button variant="outline" @click="router.push({ name: 'notas-fiscais-configuracoes' })"
          ><Settings2 />Configurar emissor</Button
        >
        <Button :disabled="loading || issuing || !ready" @click="emissionOpen = true"
          ><Plus />Nova NFS-e</Button
        >
        <Button
          variant="outline"
          :disabled="loading"
          aria-label="Atualizar emissões"
          @click="historyVersion++"
          ><RefreshCw
        /></Button>
      </div>
    </header>
    <div v-if="loading" class="flex min-h-60 items-center justify-center text-muted-foreground">
      <LoaderCircle class="mr-2 animate-spin" />Carregando documentos...
    </div>
    <template v-else>
      <Card v-if="!ready" class="border-amber-500/35">
        <CardHeader>
          <CardTitle>Configuração da NFS-e pendente</CardTitle>
          <CardDescription
            >Preencha os dados fiscais, parâmetros da atividade e a credencial do
            emissor.</CardDescription
          >
        </CardHeader>
        <CardContent
          ><Button @click="router.push({ name: 'notas-fiscais-configuracoes' })"
            ><Settings2 />Abrir configurações</Button
          ></CardContent
        >
      </Card>
      <FiscalHistoryTable tipo="NFSE" :refresh-token="historyVersion" :show-header="false" />
    </template>

    <ModalView
      v-model:open="emissionOpen"
      size="2xl"
      title="Emitir NFS-e"
      description="Informe o tomador e os dados do serviço para emitir a nota fiscal."
    >
      <form class="grid gap-4 px-4 pb-4 sm:grid-cols-2" @submit.prevent="emit">
        <div class="space-y-1.5">
          <Label for="nfse-cliente">Tomador</Label>
          <Select2Ajax
            id="nfse-cliente"
            v-model="form.clienteId"
            url="/clientes/select2"
            placeholder="Selecione o cliente"
            :disabled="issuing"
          />
        </div>
        <div class="space-y-1.5">
          <Label for="nfse-valor">Valor do serviço</Label>
          <Input
            id="nfse-valor"
            v-model.number="form.valorTotal"
            type="number"
            min="0.01"
            step="0.01"
            :disabled="issuing"
          />
        </div>
        <div class="space-y-1.5">
          <Label for="nfse-codigo-servico">Código de serviço</Label>
          <Input
            id="nfse-codigo-servico"
            v-model="form.codigoServico"
            inputmode="numeric"
            :disabled="issuing"
          />
        </div>
        <div v-if="isD2ti" class="space-y-1.5">
          <Label for="nfse-codigo-tom">Código TOM do município do tomador</Label>
          <Input
            id="nfse-codigo-tom"
            v-model="form.codigoMunicipioTomador"
            inputmode="numeric"
            placeholder="Ex.: 0923 para São Mateus"
            :disabled="issuing"
          />
        </div>
        <div class="space-y-1.5 sm:col-span-2">
          <Label for="nfse-discriminacao">Discriminação do serviço</Label>
          <Textarea
            id="nfse-discriminacao"
            v-model="form.discriminacao"
            class="min-h-24"
            placeholder="Descreva o serviço prestado…"
            :disabled="issuing"
          />
        </div>
        <div class="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="outline" :disabled="issuing" @click="emissionOpen = false"
            >Voltar</Button
          >
          <Button type="submit" :disabled="issuing || !ready"
            ><LoaderCircle v-if="issuing" class="animate-spin" /><Plus v-else />{{
              issuing ? 'Emitindo...' : 'Emitir NFS-e'
            }}</Button
          >
        </div>
      </form>
    </ModalView>
  </div>
</template>
