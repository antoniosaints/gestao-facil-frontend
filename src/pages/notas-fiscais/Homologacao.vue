<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { CheckCircle2, FileCheck2, LoaderCircle, RefreshCw, Send, Settings2, TriangleAlert } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { NotasFiscaisRepository, type FiscalConfig, type UninvoicedSale } from '@/repositories/notas-fiscais-repository'

type TomadorFiscal = { id: number; nome: string; documento?: string | null; documentoValido?: boolean; endereco?: string | null; numero?: string | null; bairro?: string | null; cep?: string | null; cidade?: string | null; estado?: string | null }

const router = useRouter()
const toast = useToast()
const loading = ref(true)
const checking = ref(false)
const emitting = ref<'NFSE' | 'NFE' | 'NFCE' | null>(null)
const config = ref<FiscalConfig | null>(null)
const saleId = ref<number | null>(null)
const selectedSale = ref<UninvoicedSale | null>(null)
const saleCustomerId = ref<number | null>(null)
const loadingSale = ref(false)
const linkingCustomer = ref(false)
const saleError = ref('')
let saleRequest = 0
const connection = ref<{ apiKeyValida: boolean; motivo?: string } | null>(null)
const result = ref<{ tipo: string; id: number; status: string; message: string } | null>(null)
const nfse = reactive({ clienteId: null as number | null, valorTotal: 0, codigoServico: '', codigoMunicipioTomador: '', discriminacao: '' })
const nfseDialogOpen = ref(false)
const showNfseErrors = ref(false)
const nfseServerError = ref('')
const tomador = ref<TomadorFiscal | null>(null)
const loadingTomador = ref(false)
const tomadorLoadError = ref('')
let tomadorRequest = 0
const homologation = computed(() => config.value?.ambiente === 'HOMOLOGACAO')
const isD2ti = computed(() => config.value?.modoEmissaoNfse === 'LEGADO_D2TI')
const ready = (tipo: 'NFSE' | 'NFE' | 'NFCE') => tipo === 'NFSE' ? config.value?.emissaoNfsePronta : tipo === 'NFE' ? config.value?.emissaoNfePronta : config.value?.emissaoNfcePronta

const nfseFieldErrors = computed(() => ({
  clienteId: nfse.clienteId ? '' : 'Selecione o tomador.',
  valorTotal: Number.isFinite(Number(nfse.valorTotal)) && nfse.valorTotal > 0 && nfse.valorTotal <= 99_999_999 ? '' : 'Informe um valor maior que zero.',
  codigoServico: nfse.codigoServico.trim().length <= (isD2ti.value ? 5 : 32) ? '' : `Use no máximo ${isD2ti.value ? 5 : 32} caracteres.`,
  codigoMunicipioTomador: !isD2ti.value || /^\d{3,6}$/.test(nfse.codigoMunicipioTomador.trim()) ? '' : 'Informe de 3 a 6 dígitos do código TOM.',
  discriminacao: nfse.discriminacao.trim().length >= 3 && nfse.discriminacao.trim().length <= 8_000 ? '' : 'Descreva o serviço com pelo menos 3 caracteres.',
}))

const tomadorMissing = computed(() => {
  if (!tomador.value) return []
  const required: Array<[keyof TomadorFiscal, string]> = [
    ['documento', 'CPF/CNPJ'], ['endereco', 'endereço'],
    ...(!isD2ti.value ? [['numero', 'número'] as [keyof TomadorFiscal, string]] : []),
    ['bairro', 'bairro'], ['cep', 'CEP'], ['cidade', 'cidade'], ['estado', 'UF'],
  ]
  const missing = required.filter(([key]) => !String(tomador.value?.[key] ?? '').trim()).map(([, label]) => label)
  if (tomador.value.documento && tomador.value.documentoValido === false) missing.push('CPF/CNPJ válido (corrija o número)')
  return missing
})

const nfseMissing = computed(() => {
  const missing = Object.values(nfseFieldErrors.value).filter(Boolean)
  if (nfse.clienteId && loadingTomador.value) missing.push('Aguarde a conferência do cadastro do tomador.')
  else if (nfse.clienteId && tomadorLoadError.value) missing.push(tomadorLoadError.value)
  else if (nfse.clienteId && tomadorMissing.value.length) missing.push(`Complete no cadastro do tomador: ${tomadorMissing.value.join(', ')}.`)
  if (!homologation.value) missing.push('Selecione e salve o ambiente de homologação nas configurações.')
  if (!ready('NFSE')) missing.push('Complete a configuração do emissor NFS-e.')
  return missing
})

async function loadTomador(id: number | null) {
  const request = ++tomadorRequest
  tomador.value = null
  tomadorLoadError.value = ''
  if (!id) { loadingTomador.value = false; return }
  loadingTomador.value = true
  try {
    const response = await ClienteRepository.get(Number(id))
    if (request !== tomadorRequest) return
    if (!response?.data) throw new Error('Tomador não encontrado nesta conta.')
    tomador.value = response.data as TomadorFiscal
  } catch (error: any) {
    if (request === tomadorRequest) tomadorLoadError.value = error?.response?.data?.message || error?.message || 'Não foi possível conferir o cadastro do tomador.'
  } finally {
    if (request === tomadorRequest) loadingTomador.value = false
  }
}

watch(() => nfse.clienteId, (id) => { void loadTomador(id) })

async function loadSelectedSale(id: number | null) {
  const request = ++saleRequest
  selectedSale.value = null
  saleCustomerId.value = null
  saleError.value = ''
  if (!id) { loadingSale.value = false; return }
  loadingSale.value = true
  try {
    const sale = await NotasFiscaisRepository.getFiscalSaleCustomer(Number(id))
    if (request !== saleRequest) return
    selectedSale.value = sale
    saleCustomerId.value = sale.cliente?.id || null
  } catch (error: any) {
    if (request === saleRequest) saleError.value = error?.response?.data?.error?.message || 'Não foi possível conferir o cliente da venda.'
  } finally {
    if (request === saleRequest) loadingSale.value = false
  }
}

watch(saleId, (id) => { void loadSelectedSale(id) })

async function linkSaleCustomer() {
  if (!saleId.value || !saleCustomerId.value || linkingCustomer.value) return
  linkingCustomer.value = true
  saleError.value = ''
  const vendaId = Number(saleId.value)
  try {
    const updated = await NotasFiscaisRepository.linkFiscalSaleCustomer(vendaId, Number(saleCustomerId.value))
    if (Number(saleId.value) === vendaId) {
      selectedSale.value = updated
      toast.success('Cliente vinculado à venda. Confira os dados antes de emitir.')
    }
  } catch (error: any) {
    if (Number(saleId.value) === vendaId) saleError.value = error?.response?.data?.error?.message || 'Não foi possível vincular o cliente.'
  } finally { linkingCustomer.value = false }
}

function openNfseDialog() {
  showNfseErrors.value = false
  nfseServerError.value = ''
  nfseDialogOpen.value = true
}

async function load() {
  try {
    const fiscalConfig = await NotasFiscaisRepository.getConfig()
    config.value = fiscalConfig
    nfse.codigoServico = fiscalConfig.codigoServicoPadrao
    nfse.codigoMunicipioTomador = fiscalConfig.codigoMunicipioPrestador || ''
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar a homologação fiscal.') }
  finally { loading.value = false }
}

async function checkConnection() {
  try {
    checking.value = true
    connection.value = await NotasFiscaisRepository.geranetHomologacao()
    toast.success('Credencial Geranet validada.')
  } catch (error: any) {
    connection.value = error?.response?.data?.data || { apiKeyValida: false, motivo: error?.response?.data?.error?.message || 'Não foi possível acessar a Geranet.' }
  } finally { checking.value = false }
}

async function emitNfseTest() {
  showNfseErrors.value = true
  nfseServerError.value = ''
  if (nfseMissing.value.length || !nfse.clienteId || emitting.value) return
  try {
    emitting.value = 'NFSE'
    result.value = null
    const invoice = await NotasFiscaisRepository.emitNfseHomologacao({ ...nfse, clienteId: nfse.clienteId }, crypto.randomUUID())
    result.value = { tipo: 'NFS-e', id: invoice.id, status: invoice.status, message: 'Retorno recebido do provedor em homologação.' }
    nfseDialogOpen.value = false
    toast.success('Teste de NFS-e concluído. Consulte o histórico para baixar XML e PDF.')
  } catch (error: any) {
    result.value = { tipo: 'NFS-e', id: error?.response?.data?.error?.details?.notaFiscalId || 0, status: 'FALHA', message: error?.response?.data?.error?.message || 'Não foi possível confirmar a emissão.' }
    nfseServerError.value = result.value.message
    toast.error(result.value.message)
  } finally { emitting.value = null }
}

async function emitSaleTest(tipo: 'NFE' | 'NFCE') {
  if (!homologation.value || !ready(tipo) || !saleId.value) return
  if (tipo === 'NFE' && !selectedSale.value?.cliente?.documentoValido) {
    saleError.value = 'Vincule um cliente com CPF/CNPJ válido à venda antes de emitir NF-e.'
    return
  }
  try {
    emitting.value = tipo
    result.value = null
    const document = await NotasFiscaisRepository.emitSaleHomologacao(Number(saleId.value), tipo)
    result.value = { tipo: tipo === 'NFE' ? 'NF-e' : 'NFC-e', id: document.id, status: document.status, message: 'Documento enfileirado. Acompanhe autorização ou rejeição no histórico.' }
    toast.success(result.value.message)
    saleId.value = null
    await load()
  } catch (error: any) {
    result.value = { tipo: tipo === 'NFE' ? 'NF-e' : 'NFC-e', id: 0, status: 'FALHA', message: error?.response?.data?.error?.message || 'Não foi possível iniciar o teste.' }
    toast.error(result.value.message)
  } finally { emitting.value = null }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 pb-10">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight"><FileCheck2 class="size-6 text-primary" />Testes de homologação</h1><p class="mt-1 max-w-3xl text-sm text-muted-foreground">Valide a conexão e envie documentos reais de teste para o ambiente de homologação do provedor. Cada envio usa os dados fiscais da sua conta.</p></div>
      <Button variant="outline" @click="router.push({ name: 'notas-fiscais-configuracoes' })"><Settings2 />Configurar emissor</Button>
    </header>

    <div v-if="loading" class="flex min-h-60 items-center justify-center text-sm text-muted-foreground"><LoaderCircle class="mr-2 size-5 animate-spin" />Carregando testes fiscais…</div>
    <template v-else>
      <Card :class="homologation ? 'border-emerald-500/35' : 'border-amber-500/35'">
        <CardHeader><CardTitle class="flex items-center gap-2"><CheckCircle2 v-if="homologation" class="size-5 text-emerald-600" /><TriangleAlert v-else class="size-5 text-amber-600" />{{ homologation ? 'Ambiente de homologação ativo' : 'Ambiente de produção ativo' }}</CardTitle><CardDescription>{{ homologation ? 'Os envios desta página usam ambiente 2. O teste de conexão não emite nota; cada botão de emissão abaixo transmite um documento de teste.' : 'Mude para Homologação e salve a configuração antes de transmitir testes. Os botões desta página ficam bloqueados em produção.' }}</CardDescription></CardHeader>
        <CardContent class="flex flex-wrap items-center gap-3"><Button variant="outline" :disabled="checking" @click="checkConnection"><LoaderCircle v-if="checking" class="animate-spin" /><RefreshCw v-else />Validar API Key</Button><span v-if="connection" class="text-sm" :class="connection.apiKeyValida ? 'text-emerald-600' : 'text-destructive'">{{ connection.apiKeyValida ? 'Geranet acessível e API Key válida' : connection.motivo }}</span><a class="text-sm text-primary underline underline-offset-2" href="https://nfe.geranet.net/documentacao" target="_blank" rel="noopener noreferrer">Documentação Geranet</a></CardContent>
      </Card>

      <div v-if="result" class="rounded-xl border p-4 text-sm" role="status"><strong>{{ result.tipo }} · {{ result.status }}<span v-if="result.id"> · #{{ result.id }}</span></strong><p class="mt-1 text-muted-foreground">{{ result.message }}</p></div>

      <Card>
        <CardHeader><CardTitle>NFS-e · serviço avulso</CardTitle><CardDescription>Selecione um tomador cadastrado e informe um serviço prestado. O tomador precisa ter CPF/CNPJ e endereço completos. Confira a cobertura do município na Geranet antes do primeiro teste; não reenvie se o resultado for incerto.</CardDescription></CardHeader>
        <CardContent class="space-y-4">
          <div class="flex flex-wrap items-center gap-2"><Badge variant="secondary">{{ ready('NFSE') ? 'Configuração pronta' : 'Configuração pendente' }}</Badge><span v-if="isD2ti" class="text-xs text-muted-foreground">Provedor municipal legado D2TI</span><a v-else class="text-xs text-primary underline underline-offset-2" href="https://nfe.geranet.net/" target="_blank" rel="noopener noreferrer">Consultar municípios atendidos</a></div>
          <p class="text-sm text-muted-foreground">O formulário de teste reúne tomador, valor e descrição do serviço. Antes do envio, ele confere o endereço do tomador e mostra exatamente o que falta.</p>
          <div class="flex flex-wrap gap-2"><Button :disabled="!!emitting" @click="openNfseDialog"><Send />Preencher dados e emitir teste</Button><Button variant="outline" @click="router.push({ name: 'notas-fiscais-nfse' })">Ver histórico NFS-e</Button></div>
        </CardContent>
      </Card>

      <Dialog v-model:open="nfseDialogOpen">
        <DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emitir NFS-e de teste</DialogTitle>
            <DialogDescription>Confira os dados abaixo antes de transmitir ao ambiente de homologação. Campos com * são obrigatórios.</DialogDescription>
          </DialogHeader>
          <form class="space-y-4" @submit.prevent="emitNfseTest">
            <div class="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <p><strong class="text-foreground">Tomador:</strong> CPF/CNPJ, endereço, bairro, CEP, cidade e UF{{ isD2ti ? '' : ', além do número' }} no cadastro do cliente.</p>
              <p class="mt-1"><strong class="text-foreground">Serviço:</strong> valor maior que zero e descrição com pelo menos 3 caracteres. O código de serviço vem da configuração fiscal e pode ser ajustado aqui.</p>
              <p v-if="isD2ti" class="mt-1"><strong class="text-foreground">D2TI:</strong> informe também o código TOM do município do tomador.</p>
            </div>

            <div class="space-y-1.5">
              <Label>Tomador *</Label>
              <Select2Ajax v-model="nfse.clienteId" url="/clientes/select2" placeholder="Buscar cliente pelo nome ou CPF/CNPJ" allow-clear />
              <p v-if="showNfseErrors && nfseFieldErrors.clienteId" class="text-xs text-destructive">{{ nfseFieldErrors.clienteId }}</p>
              <div v-if="nfse.clienteId" class="rounded-lg border p-3 text-xs" :class="tomadorMissing.length || tomadorLoadError ? 'border-amber-500/40 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'">
                <p v-if="loadingTomador">Conferindo cadastro do tomador…</p>
                <p v-else-if="tomadorLoadError" class="text-destructive">{{ tomadorLoadError }} <Button type="button" size="sm" variant="link" @click="loadTomador(nfse.clienteId)">Tentar novamente</Button></p>
                <p v-else-if="tomadorMissing.length">Faltam no cadastro de {{ tomador?.nome }}: <strong>{{ tomadorMissing.join(', ') }}</strong>. <Button type="button" size="sm" variant="link" @click="router.push({ name: 'clientes-detalhes', params: { id: nfse.clienteId } })">Abrir cliente</Button></p>
                <p v-else-if="tomador">Cadastro de {{ tomador.nome }} com os dados exigidos para este provedor.</p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-1.5"><Label for="teste-valor">Valor do serviço *</Label><Input id="teste-valor" v-model.number="nfse.valorTotal" type="number" min="0.01" max="99999999" step="0.01" :aria-invalid="showNfseErrors && !!nfseFieldErrors.valorTotal" /><p v-if="showNfseErrors && nfseFieldErrors.valorTotal" class="text-xs text-destructive">{{ nfseFieldErrors.valorTotal }}</p></div>
              <div class="space-y-1.5"><Label for="teste-servico">Código do serviço</Label><Input id="teste-servico" v-model="nfse.codigoServico" :maxlength="isD2ti ? 5 : 32" :aria-invalid="showNfseErrors && !!nfseFieldErrors.codigoServico" /><p class="text-xs text-muted-foreground">Padrão configurado: {{ config?.codigoServicoPadrao || 'não informado' }}</p><p v-if="showNfseErrors && nfseFieldErrors.codigoServico" class="text-xs text-destructive">{{ nfseFieldErrors.codigoServico }}</p></div>
              <div v-if="isD2ti" class="space-y-1.5 sm:col-span-2"><Label for="teste-tom">Código TOM do município *</Label><Input id="teste-tom" v-model="nfse.codigoMunicipioTomador" inputmode="numeric" maxlength="6" :aria-invalid="showNfseErrors && !!nfseFieldErrors.codigoMunicipioTomador" /><p v-if="showNfseErrors && nfseFieldErrors.codigoMunicipioTomador" class="text-xs text-destructive">{{ nfseFieldErrors.codigoMunicipioTomador }}</p></div>
              <div class="space-y-1.5 sm:col-span-2"><Label for="teste-descricao">Descrição do serviço *</Label><Textarea id="teste-descricao" v-model="nfse.discriminacao" class="min-h-24" maxlength="8000" placeholder="Descreva o serviço prestado ao tomador" :aria-invalid="showNfseErrors && !!nfseFieldErrors.discriminacao" /><p v-if="showNfseErrors && nfseFieldErrors.discriminacao" class="text-xs text-destructive">{{ nfseFieldErrors.discriminacao }}</p></div>
            </div>

            <div class="rounded-lg border p-3 text-sm" :class="nfseMissing.length ? 'border-amber-500/40 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'" role="status">
              <p class="font-semibold">{{ nfseMissing.length ? `${nfseMissing.length} pendência(s) antes do envio` : 'Dados prontos para envio' }}</p>
              <ul v-if="nfseMissing.length" class="mt-2 list-disc space-y-1 pl-5"><li v-for="item in nfseMissing" :key="item">{{ item }}</li></ul>
            </div>
            <p v-if="nfseServerError" class="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{{ nfseServerError }}</p>
            <DialogFooter><Button type="button" variant="outline" :disabled="emitting === 'NFSE'" @click="nfseDialogOpen = false">Voltar</Button><Button type="submit" :disabled="!!emitting"><LoaderCircle v-if="emitting === 'NFSE'" class="animate-spin" /><Send v-else />Emitir NFS-e de teste</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>NF-e e NFC-e · vendas faturadas</CardTitle><CardDescription>Escolha uma venda já faturada e com itens fiscais completos. Cada venda aceita uma emissão; após o envio, acompanhe o processamento pelo histórico do tipo escolhido.</CardDescription></CardHeader>
        <CardContent class="space-y-4">
          <div class="max-w-2xl space-y-1.5"><Label>Venda sem documento fiscal</Label><Select2Ajax v-model="saleId" url="/v1/notas-fiscais/vendas/sem-documento/select2" placeholder="Busque venda, cliente ou CPF/CNPJ" allow-clear /><p class="text-xs text-muted-foreground">O resultado informa o cliente vinculado e se o CPF/CNPJ dele é válido. São exibidas apenas vendas faturadas disponíveis para emissão.</p></div>
          <div v-if="saleId" class="space-y-3 rounded-xl border p-4 text-sm">
            <p v-if="loadingSale" class="text-muted-foreground">Conferindo cliente da venda...</p>
            <template v-else-if="selectedSale">
              <p><strong>Cliente da venda:</strong> {{ selectedSale.cliente?.nome || 'Nenhum cliente vinculado (consumidor final)' }} · {{ selectedSale.cliente?.documentoValido ? 'CPF/CNPJ válido' : selectedSale.cliente?.documento ? 'CPF/CNPJ inválido' : 'Sem CPF/CNPJ' }}</p>
              <p v-if="!selectedSale.cliente?.documentoValido" class="text-amber-700 dark:text-amber-300">Para NF-e, selecione abaixo um cliente com CPF/CNPJ válido e vincule-o a esta venda. Ter o cliente cadastrado não vincula automaticamente a venda.</p>
              <div class="max-w-xl space-y-2"><Label>Vincular ou trocar cliente desta venda</Label><Select2Ajax v-model="saleCustomerId" url="/clientes/select2" placeholder="Buscar cliente por nome ou CPF/CNPJ" allow-clear /><Button size="sm" variant="outline" :disabled="!saleCustomerId || linkingCustomer || !!emitting" @click="linkSaleCustomer">{{ linkingCustomer ? 'Vinculando...' : 'Vincular cliente' }}</Button></div>
              <Button v-if="selectedSale.cliente && !selectedSale.cliente.documentoValido" size="sm" variant="link" @click="router.push({ name: 'clientes-detalhes', params: { id: selectedSale.cliente.id } })">Abrir cadastro do cliente</Button>
            </template>
            <p v-if="saleError" class="text-destructive" role="alert">{{ saleError }}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2"><div class="rounded-xl border p-4"><p class="font-semibold">NF-e</p><p class="mt-1 text-xs text-muted-foreground">{{ ready('NFE') ? 'Configuração pronta' : 'Complete o emissor, IE, certificado e parâmetros fiscais.' }}</p><Button class="mt-3" size="sm" :disabled="!homologation || !ready('NFE') || !selectedSale?.cliente?.documentoValido || !!emitting || loadingSale" @click="emitSaleTest('NFE')"><LoaderCircle v-if="emitting === 'NFE'" class="animate-spin" /><Send v-else />Emitir NF-e de teste</Button><Button class="mt-3" size="sm" variant="link" @click="router.push({ name: 'notas-fiscais-nfe' })">Ver histórico</Button></div><div class="rounded-xl border p-4"><p class="font-semibold">NFC-e</p><p class="mt-1 text-xs text-muted-foreground">{{ ready('NFCE') ? 'Configuração pronta' : 'Complete também o CSC da SEFAZ.' }}</p><Button class="mt-3" size="sm" :disabled="!homologation || !ready('NFCE') || !selectedSale || !!emitting || loadingSale || !!(selectedSale?.cliente?.documento && !selectedSale?.cliente?.documentoValido)" @click="emitSaleTest('NFCE')"><LoaderCircle v-if="emitting === 'NFCE'" class="animate-spin" /><Send v-else />Emitir NFC-e de teste</Button><Button class="mt-3" size="sm" variant="link" @click="router.push({ name: 'notas-fiscais-nfce' })">Ver histórico</Button></div></div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
