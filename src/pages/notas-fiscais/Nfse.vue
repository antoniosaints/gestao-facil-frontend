<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ExternalLink, FileText, LoaderCircle, Plus, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { NotasFiscaisRepository, type FiscalConfig, type NfseListItem } from '@/repositories/notas-fiscais-repository'

const router = useRouter()
const toast = useToast()
const loading = ref(true)
const issuing = ref(false)
const config = ref<FiscalConfig | null>(null)
const invoices = ref<NfseListItem[]>([])
const ready = computed(() => Boolean(config.value?.emissaoNfsePronta))
const isD2ti = computed(() => config.value?.modoEmissaoNfse === 'LEGADO_D2TI')
const statusLabel: Record<string, string> = { AUTORIZADA: 'Autorizada', HOMOLOGADA: 'Homologada', REJEITADA: 'Rejeitada', EMITINDO: 'Emitindo', EMISSAO_INCERTA: 'Confirmação pendente', PRONTA_PARA_EMISSAO: 'Pronta para emissão', PENDENTE: 'Pendente' }
const form = reactive({ clienteId: null as number | null, valorTotal: 0, codigoServico: '', codigoMunicipioTomador: '', discriminacao: '' })

async function load() {
  try {
    const [fiscalConfig, response] = await Promise.all([NotasFiscaisRepository.getConfig(), NotasFiscaisRepository.listNfse()])
    config.value = fiscalConfig
    invoices.value = response.data
    form.codigoServico = fiscalConfig.codigoServicoPadrao
    if (fiscalConfig.codigoMunicipioPrestador) form.codigoMunicipioTomador = fiscalConfig.codigoMunicipioPrestador
  } catch { toast.error('Não foi possível carregar as NFS-e.') }
  finally { loading.value = false }
}
onMounted(load)

async function emit() {
  if (!form.clienteId || form.valorTotal <= 0 || (isD2ti.value && !form.codigoMunicipioTomador) || form.discriminacao.trim().length < 3) {
    toast.info(isD2ti.value ? 'Selecione o tomador, informe valor, código TOM do município e a descrição do serviço.' : 'Selecione o tomador, informe valor e a descrição do serviço para gerar a DPS.')
    return
  }
  try {
    issuing.value = true
    const invoice = await NotasFiscaisRepository.emitNfse({ ...form, clienteId: form.clienteId }, crypto.randomUUID())
    invoices.value.unshift(invoice)
    Object.assign(form, { clienteId: null, valorTotal: 0, codigoServico: config.value?.codigoServicoPadrao || '', codigoMunicipioTomador: config.value?.codigoMunicipioPrestador || '', discriminacao: '' })
    toast.success(isD2ti.value ? (invoice.status === 'HOMOLOGADA' ? 'XML validado em homologação.' : 'NFS-e autorizada pela prefeitura.') : 'DPS nacional gerada e registrada para emissão.')
  } catch (error: any) {
    const data = error?.response?.data?.error
    toast.error(data?.message || 'Não foi possível emitir a NFS-e.')
    await load()
  } finally { issuing.value = false }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 pb-10">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">Notas fiscais</p><h1 class="mt-1 text-2xl font-bold">NFS-e</h1><p class="mt-1 text-sm text-muted-foreground">Emissão, retorno municipal e histórico isolados por conta.</p></div><Button variant="outline" @click="router.push({ name: 'notas-fiscais-configuracoes' })"><Settings2 />Configurar emissor</Button></header>
    <div v-if="loading" class="flex min-h-60 items-center justify-center text-muted-foreground"><LoaderCircle class="mr-2 animate-spin" />Carregando NFS-e…</div>
    <template v-else>
      <Card :class="ready ? 'border-emerald-500/35' : 'border-amber-500/35'"><CardHeader><CardTitle>{{ ready ? 'Emissor configurado' : 'Conclua a configuração fiscal' }}</CardTitle><CardDescription>{{ ready ? (isD2ti ? 'Integração D2TI de São Mateus do Maranhão pronta para homologação ou produção.' : 'Emissor Nacional selecionado: a DPS usa o código IBGE e as regras municipais do padrão SEFIN Nacional.') : 'Preencha os dados fiscais, parâmetros da atividade e a credencial do emissor.' }}</CardDescription></CardHeader><CardContent><Button v-if="!ready" @click="router.push({ name: 'notas-fiscais-configuracoes' })"><Settings2 />Abrir configuração</Button></CardContent></Card>

      <Card v-if="ready" class="border-primary/25">
        <CardHeader><CardTitle class="flex items-center gap-2"><Plus class="size-5 text-primary" />{{ isD2ti ? 'Emitir NFS-e' : 'Gerar DPS nacional' }}</CardTitle><CardDescription>{{ isD2ti ? 'A emissão é síncrona. Em caso de falha de conexão, a tentativa fica bloqueada para evitar uma nota duplicada no município.' : 'A DPS recebe numeração sequencial, código IBGE do prestador e os dados necessários para o fluxo do Emissor Nacional.' }}</CardDescription></CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5"><Label for="nfse-cliente">Tomador</Label><Select2Ajax id="nfse-cliente" v-model="form.clienteId" url="/clientes/select2" placeholder="Selecione o cliente" /></div>
          <div class="space-y-1.5"><Label for="nfse-valor">Valor do serviço</Label><Input id="nfse-valor" v-model.number="form.valorTotal" type="number" min="0.01" step="0.01" /></div>
          <div class="space-y-1.5"><Label for="nfse-codigo-servico">Código de serviço</Label><Input id="nfse-codigo-servico" v-model="form.codigoServico" inputmode="numeric" /></div>
          <div v-if="isD2ti" class="space-y-1.5"><Label for="nfse-codigo-tom">Código TOM do município do tomador</Label><Input id="nfse-codigo-tom" v-model="form.codigoMunicipioTomador" inputmode="numeric" placeholder="Ex.: 0923 para São Mateus" /></div>
          <div class="space-y-1.5 sm:col-span-2"><Label for="nfse-discriminacao">Discriminação do serviço</Label><Textarea id="nfse-discriminacao" v-model="form.discriminacao" class="min-h-24" placeholder="Descreva o serviço prestado…" /></div>
          <div class="sm:col-span-2"><Button :disabled="issuing" @click="emit"><LoaderCircle v-if="issuing" class="animate-spin" /><Plus v-else />{{ isD2ti ? 'Emitir NFS-e' : 'Gerar DPS nacional' }}</Button></div>
        </CardContent>
      </Card>


      <Card><CardHeader><CardTitle>Histórico de NFS-e</CardTitle><CardDescription>Documentos emitidos por esta conta.</CardDescription></CardHeader><CardContent><div v-if="!invoices.length" class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground"><FileText class="size-7" />Nenhuma NFS-e emitida ainda.</div><div v-else class="divide-y rounded-xl border"><div v-for="invoice in invoices" :key="invoice.id" class="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-semibold">{{ invoice.cliente?.nome || 'Consumidor final' }}</p><p class="text-xs text-muted-foreground">{{ invoice.numero ? `NFS-e ${invoice.numero}` : 'Emissão sem número' }} · {{ new Date(invoice.criadoEm).toLocaleString('pt-BR') }}</p></div><div class="flex items-center gap-3"><strong>R$ {{ invoice.valorTotal.toFixed(2).replace('.', ',') }}</strong><a v-if="invoice.pdfPath" :href="invoice.pdfPath" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-sm text-primary hover:underline">PDF <ExternalLink class="size-3.5" /></a><Badge variant="secondary">{{ statusLabel[invoice.status] || invoice.status }}</Badge></div></div></div></CardContent></Card>
    </template>
  </div>
</template>
