<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  FileText,
  LoaderCircle,
  MapPinCheck,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings2,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ModalView from '@/components/formulario/ModalView.vue'
import FiscalHistoryTable from './FiscalHistoryTable.vue'
import GeranetCities from './GeranetCities.vue'
import NfseConsult from './NfseConsult.vue'
import NfseAdditionalFields from './NfseAdditionalFields.vue'
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
const ready = computed(
  () => Boolean(config.value?.emissaoNfsePronta) && config.value?.modoEmissaoNfse !== 'LEGADO_D2TI',
)
const citiesOpen = ref(false)
const consultOpen = ref(false)
const emissionKey = ref<string | null>(null)
const form = reactive({
  clienteId: null as number | null,
  valorTotal: 0,
  codigoServico: '',
  dataCompetencia: '',
  codigoNbs: '',
  codigoAnexoCnae: '',
  percentualTributosSimplesNacional: null as number | null,
  municipioIncidencia: '',
  substitutoTributario: '2' as '1' | '2',
  valorIssRetido: null as number | null,
  discriminacao: '',
})

async function load() {
  try {
    const fiscalConfig = await NotasFiscaisRepository.getConfig()
    config.value = fiscalConfig
    form.codigoServico = fiscalConfig.codigoServicoPadrao
  } catch {
    toast.error('Não foi possível carregar as NFS-e.')
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function emit() {
  if (issuing.value || !ready.value) return
  if (!form.clienteId || form.valorTotal <= 0 || form.discriminacao.trim().length < 3) {
    toast.info('Selecione o tomador, informe o valor e a descrição do serviço.')
    return
  }
  try {
    issuing.value = true
    const invoice = await NotasFiscaisRepository.emitNfse(
      { ...form, clienteId: form.clienteId },
      (emissionKey.value ||= crypto.randomUUID()),
    )
    historyVersion.value += 1
    Object.assign(form, {
      clienteId: null,
      valorTotal: 0,
      codigoServico: config.value?.codigoServicoPadrao || '',
      dataCompetencia: '',
      codigoNbs: '',
      codigoAnexoCnae: '',
      percentualTributosSimplesNacional: null,
      municipioIncidencia: '',
      substitutoTributario: '2',
      valorIssRetido: null,
      discriminacao: '',
      codigoClassificacaoTributaria: '',
      ibscbs: undefined,
    })
    emissionOpen.value = false
    emissionKey.value = null
    if (invoice.status === 'AUTORIZADA') toast.success('NFS-e autorizada pela Geranet.')
    else toast.info('Emissão registrada. Acompanhe o status no histórico.')
  } catch (error: any) {
    const data = error?.response?.data?.error
    toast.error(data?.message || 'Não foi possível emitir a NFS-e.')
    if (
      error?.response?.status === 422 &&
      error?.response?.data?.error?.code !== 'emission_uncertain'
    )
      emissionKey.value = null
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
        <DropdownMenu>
          <DropdownMenuTrigger as-child
            ><Button variant="outline"><MoreHorizontal />Mais ações</Button></DropdownMenuTrigger
          >
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="citiesOpen = true"
              ><MapPinCheck />Cidades atendidas</DropdownMenuItem
            >
            <DropdownMenuItem @select="consultOpen = true"
              ><Search />Consultar notas</DropdownMenuItem
            >
            <DropdownMenuSeparator />
            <DropdownMenuItem @select="router.push({ name: 'notas-fiscais-homologacao' })"
              >Testar em homologação</DropdownMenuItem
            >
            <DropdownMenuItem @select="router.push({ name: 'notas-fiscais-configuracoes' })"
              ><Settings2 />Configurar emissor</DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenu>
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
      <FiscalHistoryTable
        tipo="NFSE"
        :refresh-token="historyVersion"
        :show-header="false"
        :emitting="issuing"
      />
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
        <div class="space-y-4 sm:col-span-2">
          <NfseAdditionalFields :form="form" :config="config" :disabled="issuing" />
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
    <ModalView
      v-model:open="citiesOpen"
      size="2xl"
      title="Cidades atendidas"
      description="Disponibilidade de emissão NFS-e na Geranet."
      ><div class="px-4 pb-4"><GeranetCities /></div
    ></ModalView>
    <ModalView
      v-model:open="consultOpen"
      size="4xl"
      title="Consultar NFS-e recebidas"
      description="Notas disponíveis para sua conta no portal nacional."
      ><div class="px-4 pb-4"><NfseConsult /></div
    ></ModalView>
  </div>
</template>
