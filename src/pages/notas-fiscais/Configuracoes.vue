<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Building2, CheckCircle2, CircleAlert, Cog, FileKey2, LoaderCircle, MapPin, MapPinCheck, Save, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotasFiscaisRepository, type FiscalConfig, type MunicipioIbge } from '@/repositories/notas-fiscais-repository'
import { cepMaskOptions, cpfCnpjMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'
import FiscalSetupGuide from './FiscalSetupGuide.vue'
import GeranetCities from './GeranetCities.vue'

const nfseSettings = [
  { key: 'regimeApuracaoSn', label: 'Regime de apuração do Simples', options: [['1', 'Federais e ISS pelo Simples'], ['2', 'Federais pelo Simples, ISS municipal'], ['3', 'Legislação própria de cada tributo']] },
  { key: 'issRetido', label: 'Retenção do ISS', options: [['1', 'Retido'], ['2', 'Não retido'], ['3', 'Substituição tributária']] },
  { key: 'responsavelRetencao', label: 'Responsável pela retenção', options: [['1', 'Tomador'], ['2', 'Prestador'], ['3', 'Intermediário'], ['4', 'Nenhum']] },
  { key: 'exigibilidadeIss', label: 'Exigibilidade do ISS', options: [['1', 'Exigível'], ['2', 'Não incidência'], ['3', 'Isenção'], ['4', 'Exportação'], ['5', 'Imunidade'], ['6', 'Suspensão judicial'], ['7', 'Suspensão administrativa'], ['8', 'ISS fixo']] },
  { key: 'incentivadorCultural', label: 'Incentivador cultural', options: [['1', 'Sim'], ['2', 'Não']] },
] as const

const toast = useToast()
const router = useRouter()
const activeTab = ref('geral')
const saving = ref(false)
const loading = ref(true)
const searchingMunicipio = ref(false)
const uploadingCredential = ref(false)
const certificateFile = ref<File | null>(null)
const certificatePassword = ref('')
const nfceCscToken = ref('')
const responsavelTecnicoCsrt = ref('')
const municipalitySearch = ref('')
const municipalities = ref<MunicipioIbge[]>([])
const checkingGeranet = ref(false)
const geranetStatus = ref<{ apiKeyValida: boolean; certificadoConfigurado: boolean; nfsePronta: boolean; nfePronta: boolean; nfcePronta: boolean; motivo?: string } | null>(null)

const config = reactive<FiscalConfig>({
  razaoSocial: '', nomeFantasia: '', documento: '', inscricaoEstadual: '', inscricaoMunicipal: '', regimeTributario: 0,
  codigoMunicipioIbge: '', codigoMunicipioPrestador: '', municipioNome: '', uf: '', cep: '', logradouro: '', numero: '', bairro: '', complemento: '',
  email: '', telefone: '', ambiente: 'HOMOLOGACAO', nfseHabilitado: false, nfeHabilitado: false, nfceHabilitado: false, modoEmissaoNfse: 'GERANET', provedorNfse: 'GERANET_NFSE', serieRps: 1, proximoNumeroRps: 1, serieNfe: 1, proximoNumeroNfe: 1, serieNfce: 1, proximoNumeroNfce: 1, nfce: { cscId: '', cscConfigurado: false }, nfse: { codigoServicoNacional: '', codigoTributacaoMunicipio: '', codigoCnae: '', dataOpcaoSimples: '', regimeApuracaoSn: '1', issRetido: '2', responsavelRetencao: '4', naturezaOperacao: '1', incentivadorCultural: '2', exigibilidadeIss: '1', regimeEspecialTributacao: '1' }, nfe: { naturezaOperacao: 'Venda de mercadoria', tipoAtividade: '1', indicadorPresenca: '1', indicativoIntermediador: '0', frete: '9' }, responsavelTecnico: { cnpj: '', contato: '', email: '', telefone: '', csrtId: '', csrtConfigurado: false },
  codigoServicoPadrao: '', descricaoServicoPadrao: '', codigoAtividadePadrao: '', descricaoAtividadePadrao: '', tipoTributacaoPadrao: null, tipoRecolhimentoPadrao: null, notaIntermediadaPadrao: 2, aliquotaIssPadrao: null,
  certificado: { configurado: false, nome: null, atualizadoEm: null }, criptografiaFiscalDisponivel: false, integracao: { tipo: 'CERTIFICADO_A1', configurada: false, atualizadoEm: null }, emissaoNfsePronta: false, emissaoNfePronta: false, emissaoNfcePronta: false,
})

async function navigateToSection(target: string) {
  const tabByTarget: Record<string, string> = {
    'fiscal-guide': 'geral', 'fiscal-documentos': 'geral',
    'fiscal-emissor': 'emissor', 'fiscal-municipio': 'emissor',
    'fiscal-nfse': 'nfse', 'fiscal-nfe': 'nfe', 'fiscal-nfce': 'nfce',
    'fiscal-credencial': 'integracao',
  }
  activeTab.value = tabByTarget[target] || 'geral'
  await nextTick()
  const element = document.getElementById(target)
  if (element) return element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeTab.value = 'geral'
  await nextTick()
  document.getElementById('fiscal-documentos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function assignConfig(data: FiscalConfig) {
  Object.assign(config, data, { modoEmissaoNfse: 'GERANET', provedorNfse: 'GERANET_NFSE',
    emissaoNfsePronta: data.modoEmissaoNfse === 'LEGADO_D2TI' ? false : data.emissaoNfsePronta,
    integracao: { tipo: 'CERTIFICADO_A1', configurada: data.certificado.configurado && data.criptografiaFiscalDisponivel, atualizadoEm: data.certificado.atualizadoEm },
  })
}
function errorMessage(error: any, fallback: string) { return error?.response?.data?.error?.message || error?.response?.data?.message || fallback }

async function load() {
  try { assignConfig(await NotasFiscaisRepository.getConfig()) }
  catch (error: any) { toast.error(errorMessage(error, 'Não foi possível carregar a configuração fiscal.')) }
  finally { loading.value = false }
}

async function save() {
  try {
    saving.value = true
    const { certificado: _certificate, criptografiaFiscalDisponivel: _cryptoReady, integracao: _integration, emissaoNfsePronta: _nfseReady, emissaoNfePronta: _nfeReady, emissaoNfcePronta: _nfceReady, proximoNumeroRps: _nextRps, proximoNumeroNfe: _nextNfe, proximoNumeroNfce: _nextNfce, nfce: _nfce, nfse: _nfse, nfe: _nfe, responsavelTecnico: _responsavel, ...payload } = config
    const fiscalPayload = { ...payload, nfceCscId: config.nfce.cscId, nfceCscToken: nfceCscToken.value || undefined, nfseCodigoServicoNacional: config.nfse.codigoServicoNacional || undefined, nfseCodigoTributacaoMunicipio: config.nfse.codigoTributacaoMunicipio, nfseCodigoCnae: config.nfse.codigoCnae || undefined, nfseDataOpcaoSimples: config.nfse.dataOpcaoSimples || undefined, nfseRegimeApuracaoSn: config.nfse.regimeApuracaoSn, nfseIssRetido: config.nfse.issRetido, nfseResponsavelRetencao: config.nfse.responsavelRetencao, nfseNaturezaOperacao: config.nfse.naturezaOperacao, nfseIncentivadorCultural: config.nfse.incentivadorCultural, nfseExigibilidadeIss: config.nfse.exigibilidadeIss, nfseRegimeEspecialTributacao: config.nfse.regimeEspecialTributacao || undefined, nfeNaturezaOperacao: config.nfe.naturezaOperacao, nfeTipoAtividade: config.nfe.tipoAtividade, nfeIndicadorPresenca: config.nfe.indicadorPresenca, nfeIndicativoIntermediador: config.nfe.indicativoIntermediador, nfeFrete: config.nfe.frete, responsavelTecnicoCnpj: config.responsavelTecnico.cnpj, responsavelTecnicoContato: config.responsavelTecnico.contato, responsavelTecnicoEmail: config.responsavelTecnico.email || undefined, responsavelTecnicoTelefone: config.responsavelTecnico.telefone, responsavelTecnicoCsrtId: config.responsavelTecnico.csrtId, responsavelTecnicoCsrt: responsavelTecnicoCsrt.value || undefined } as any
    assignConfig(await NotasFiscaisRepository.saveConfig(fiscalPayload))
    nfceCscToken.value = ''
    responsavelTecnicoCsrt.value = ''
    toast.success('Configuração fiscal salva.')
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível salvar a configuração fiscal.')) }
  finally { saving.value = false }
}

async function checkGeranet() {
  try { checkingGeranet.value = true; geranetStatus.value = await NotasFiscaisRepository.geranetHomologacao() }
  catch (error: any) { geranetStatus.value = error?.response?.data?.data || { apiKeyValida: false, certificadoConfigurado: config.certificado.configurado, nfsePronta: config.emissaoNfsePronta, nfePronta: config.emissaoNfePronta, nfcePronta: config.emissaoNfcePronta, motivo: errorMessage(error, 'Não foi possível consultar a Geranet.') } }
  finally { checkingGeranet.value = false }
}

async function searchMunicipality() {
  if (!config.uf || municipalitySearch.value.trim().length < 2) return toast.info('Informe a UF e pelo menos duas letras do município.')
  try {
    searchingMunicipio.value = true
    municipalities.value = await NotasFiscaisRepository.buscarMunicipios(config.uf, municipalitySearch.value)
    if (!municipalities.value.length) toast.info('Nenhum município encontrado.')
  } catch (error: any) { toast.error(errorMessage(error, 'A consulta ao IBGE não está disponível agora.')) }
  finally { searchingMunicipio.value = false }
}

function selectMunicipality(item: MunicipioIbge) {
  config.codigoMunicipioIbge = item.codigoIbge
  config.municipioNome = item.nome
  config.uf = item.uf
  municipalities.value = []
  municipalitySearch.value = item.nome
}

async function uploadCertificate() {
  if (!config.criptografiaFiscalDisponivel) return toast.error('A criptografia fiscal precisa ser configurada no servidor antes de salvar o certificado.')
  if (!certificateFile.value || !certificatePassword.value) return toast.info('Selecione o certificado A1 e informe a senha.')
  try {
    uploadingCredential.value = true
    await NotasFiscaisRepository.uploadCertificate(certificateFile.value, certificatePassword.value)
    certificateFile.value = null
    certificatePassword.value = ''
    assignConfig(await NotasFiscaisRepository.getConfig())
    toast.success('Certificado protegido e salvo com sucesso.')
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível salvar o certificado.')) }
  finally { uploadingCredential.value = false }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 pb-10">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Cog class="size-6 text-primary" />Configurações fiscais</h1><p class="mt-1 max-w-2xl text-sm text-muted-foreground">Configure o emissor, os documentos autorizados e as credenciais isoladas por conta.</p></div>
      <Button :disabled="saving || loading" @click="save"><LoaderCircle v-if="saving" class="animate-spin" /><Save v-else />Salvar dados</Button>
    </header>

    <div v-if="loading" class="flex min-h-64 items-center justify-center text-sm text-muted-foreground"><LoaderCircle class="mr-2 size-5 animate-spin" />Carregando configuração fiscal…</div>

    <template v-else>
      <Tabs v-model="activeTab" :unmount-on-hide="false" class="space-y-5">
        <div class="overflow-x-auto"><TabsList class="w-max min-w-full rounded-md">
          <TabsTrigger value="geral" class="whitespace-nowrap">Visão geral</TabsTrigger>
          <TabsTrigger value="emissor" class="whitespace-nowrap">Emissor</TabsTrigger>
          <TabsTrigger value="nfse" class="whitespace-nowrap">NFS-e</TabsTrigger>
          <TabsTrigger value="nfe" class="whitespace-nowrap">NF-e</TabsTrigger>
          <TabsTrigger value="nfce" class="whitespace-nowrap">NFC-e</TabsTrigger>
          <TabsTrigger value="integracao" class="whitespace-nowrap">Integração</TabsTrigger>
        </TabsList></div>

      <TabsContent value="geral" class="space-y-5">
      <FiscalSetupGuide :config="config" :saving="saving" @save="save" @navigate="navigateToSection" />
      <Card id="fiscal-documentos" class="border-primary/20">
        <CardHeader><CardTitle>Documentos habilitados</CardTitle><CardDescription>Ative somente os tipos já credenciados. A emissão fica bloqueada até o checklist estar completo.</CardDescription></CardHeader>
        <CardContent class="grid gap-3 md:grid-cols-3">
          <label class="rounded-xl border p-4" :class="config.nfseHabilitado ? 'border-primary bg-primary/5' : ''"><div class="flex items-center justify-between gap-3"><div><p class="font-semibold">NFS-e</p><p class="text-xs text-muted-foreground">Prestação de serviços</p></div><input v-model="config.nfseHabilitado" type="checkbox" class="size-4 accent-primary" /></div><p class="mt-3 text-xs" :class="config.emissaoNfsePronta ? 'text-emerald-600' : 'text-amber-600'">{{ config.emissaoNfsePronta ? 'Configuração pronta' : 'Complete os requisitos abaixo' }}</p></label>
          <label class="rounded-xl border p-4" :class="config.nfeHabilitado ? 'border-primary bg-primary/5' : ''"><div class="flex items-center justify-between gap-3"><div><p class="font-semibold">NF-e</p><p class="text-xs text-muted-foreground">Produtos e destinatário identificado</p></div><input v-model="config.nfeHabilitado" type="checkbox" class="size-4 accent-primary" /></div><p class="mt-3 text-xs" :class="config.emissaoNfePronta ? 'text-emerald-600' : 'text-amber-600'">{{ config.emissaoNfePronta ? 'Configuração pronta' : 'Exige IE, endereço e certificado' }}</p></label>
          <label class="rounded-xl border p-4" :class="config.nfceHabilitado ? 'border-primary bg-primary/5' : ''"><div class="flex items-center justify-between gap-3"><div><p class="font-semibold">NFC-e</p><p class="text-xs text-muted-foreground">Venda ao consumidor no PDV</p></div><input v-model="config.nfceHabilitado" type="checkbox" class="size-4 accent-primary" /></div><p class="mt-3 text-xs" :class="config.emissaoNfcePronta ? 'text-emerald-600' : 'text-amber-600'">{{ config.emissaoNfcePronta ? 'Configuração pronta' : 'Exige CSC, IE, endereço e certificado' }}</p></label>
        </CardContent>
      </Card>
      <div class="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">Comece pelo assistente, ative os documentos desejados e salve. As outras abas reúnem os dados que serão enviados à Geranet e aos órgãos fiscais.</div>
      </TabsContent>

      <TabsContent value="emissor" class="space-y-5">
      <div class="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><p class="font-semibold">Onde conseguir os dados do emissor?</p><p class="mt-1 text-muted-foreground">Razão social, CNPJ e endereço constam no comprovante da Receita Federal. Consulte a inscrição estadual para NF-e/NFC-e no cadastro da SEFAZ da sua UF, a inscrição municipal para NFS-e na prefeitura e confirme o regime tributário com a contabilidade.</p><div class="mt-2 flex flex-wrap gap-x-4 gap-y-1"><a class="text-primary underline underline-offset-2" href="https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_S.aspx" target="_blank" rel="noopener noreferrer">Consultar CNPJ na Receita Federal</a><a class="text-primary underline underline-offset-2" href="https://www.ibge.gov.br/explica/codigos-dos-municipios.php" target="_blank" rel="noopener noreferrer">Códigos dos municípios no IBGE</a></div></div>
      <div class="grid gap-5 lg:grid-cols-2">
        <Card id="fiscal-emissor">
          <CardHeader><CardTitle class="flex items-center gap-2"><Building2 class="size-5 text-primary" />Emissor</CardTitle><CardDescription>Quem presta o serviço e emite a nota.</CardDescription></CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5 sm:col-span-2"><Label for="razao-social">Razão social</Label><Input id="razao-social" v-model="config.razaoSocial" autocomplete="organization" placeholder="Ex.: Pizzaria Sabor da Casa LTDA" /></div>
            <div class="space-y-1.5"><Label for="fantasia">Nome fantasia</Label><Input id="fantasia" v-model="config.nomeFantasia" placeholder="Ex.: Sabor da Casa" /></div>
            <div class="space-y-1.5"><Label for="documento">CNPJ/CPF</Label><Input id="documento" v-model="config.documento" v-maska="cpfCnpjMaskOptions" inputmode="numeric" placeholder="00.000.000/0001-00" /></div>
            <div class="space-y-1.5"><Label for="ie">Inscrição estadual</Label><Input id="ie" v-model="config.inscricaoEstadual" placeholder="Ex.: 123.456.789.000" /></div>
            <div class="space-y-1.5"><Label for="im">Inscrição municipal</Label><Input id="im" v-model="config.inscricaoMunicipal" placeholder="Ex.: 123456" /></div>
            <div class="space-y-1.5"><Label for="regime">Regime tributário</Label><Select v-model="config.regimeTributario"><SelectTrigger id="regime"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="0">Não informado</SelectItem><SelectItem :value="1">Simples Nacional</SelectItem><SelectItem :value="2">Simples - excesso sublimite</SelectItem><SelectItem :value="3">Regime normal (Presumido/Real)</SelectItem><SelectItem :value="4">MEI</SelectItem></SelectContent></Select></div>
            <div class="space-y-1.5"><Label for="ambiente">Ambiente</Label><Select v-model="config.ambiente"><SelectTrigger id="ambiente"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="HOMOLOGACAO">Homologação</SelectItem><SelectItem value="PRODUCAO">Produção</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>

        <Card id="fiscal-municipio">
          <CardHeader><CardTitle class="flex items-center gap-2"><MapPin class="size-5 text-primary" />Município do prestador</CardTitle><CardDescription>O código IBGE é consultado pela fonte oficial.</CardDescription></CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-[110px_1fr_auto]"><div class="space-y-1.5"><Label for="uf">UF</Label><Input id="uf" v-model="config.uf" maxlength="2" class="uppercase" placeholder="MA" /></div><div class="space-y-1.5"><Label for="buscar-municipio">Consultar IBGE</Label><Input id="buscar-municipio" v-model="municipalitySearch" placeholder="Ex.: São Mateus" @keyup.enter="searchMunicipality" /></div><Button class="mt-auto" variant="outline" :disabled="searchingMunicipio" @click="searchMunicipality"><LoaderCircle v-if="searchingMunicipio" class="animate-spin" /><Search v-else />Buscar</Button></div>
            <div v-if="municipalities.length" class="max-h-44 overflow-y-auto rounded-lg border p-1"><button v-for="item in municipalities" :key="item.codigoIbge" type="button" class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent" @click="selectMunicipality(item)"><span>{{ item.nome }} — {{ item.uf }}</span><span class="font-mono text-xs text-muted-foreground">{{ item.codigoIbge }}</span></button></div>
            <div class="grid gap-4 sm:grid-cols-2"><div class="space-y-1.5"><Label for="municipio">Município</Label><Input id="municipio" v-model="config.municipioNome" placeholder="Ex.: São Mateus do Maranhão" /></div><div class="space-y-1.5"><Label for="codigo-ibge">Código IBGE</Label><Input id="codigo-ibge" v-model="config.codigoMunicipioIbge" inputmode="numeric" placeholder="Ex.: 2111508" /></div></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle class="flex items-center gap-2"><MapPinCheck class="size-5 text-primary" />Endereço e contato</CardTitle><CardDescription>Dados do prestador enviados à prefeitura.</CardDescription></CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="space-y-1.5"><Label for="cep">CEP</Label><Input id="cep" v-model="config.cep" v-maska="cepMaskOptions" inputmode="numeric" placeholder="00000-000" /></div><div class="space-y-1.5 lg:col-span-2"><Label for="logradouro">Logradouro</Label><Input id="logradouro" v-model="config.logradouro" placeholder="Ex.: Rua do Sol" /></div><div class="space-y-1.5"><Label for="numero">Número</Label><Input id="numero" v-model="config.numero" inputmode="numeric" placeholder="Ex.: 143" /></div>
          <div class="space-y-1.5"><Label for="bairro">Bairro</Label><Input id="bairro" v-model="config.bairro" placeholder="Ex.: Centro" /></div><div class="space-y-1.5"><Label for="complemento">Complemento</Label><Input id="complemento" v-model="config.complemento" placeholder="Opcional" /></div><div class="space-y-1.5"><Label for="email">E-mail</Label><Input id="email" v-model="config.email" type="email" placeholder="fiscal@empresa.com.br" /></div><div class="space-y-1.5"><Label for="telefone">Telefone</Label><Input id="telefone" v-model="config.telefone" v-maska="phoneMaskOptions" inputmode="tel" placeholder="(99) 99999-9999" /></div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="nfse" class="space-y-5">
      <div class="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><p class="font-semibold">Onde conseguir os dados da NFS-e?</p><p class="mt-1 text-muted-foreground">A inscrição municipal, o item da lista de serviços, o código de tributação municipal e a alíquota de ISS vêm do cadastro e das regras da prefeitura. O código nacional, quando exigido, é diferente do código municipal. Confirme os códigos e a retenção com a contabilidade. A data de opção pelo Simples pode ser conferida no Portal do Simples Nacional.</p><div class="mt-2 flex flex-wrap gap-x-4 gap-y-1"><a class="text-primary underline underline-offset-2" href="https://nfe.geranet.net/documentacao/nfse" target="_blank" rel="noopener noreferrer">Campos NFS-e na Geranet</a><a class="text-primary underline underline-offset-2" href="https://www.gov.br/nfse/pt-br/municipios/" target="_blank" rel="noopener noreferrer">Municípios no portal NFS-e</a><a class="text-primary underline underline-offset-2" href="https://www8.receita.fazenda.gov.br/SimplesNacional/" target="_blank" rel="noopener noreferrer">Portal do Simples Nacional</a></div></div>
      <GeranetCities selectable @select="selectMunicipality" />

      <div class="grid gap-5">
        <Card id="fiscal-nfse">
          <CardHeader><CardTitle class="flex items-center gap-2"><Cog class="size-5 text-primary" />Parâmetros da NFS-e</CardTitle><CardDescription>Na Geranet, item da lista, código nacional e tributação municipal são códigos diferentes.</CardDescription></CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5"><Label for="serie-rps">Série RPS</Label><Input id="serie-rps" v-model.number="config.serieRps" type="number" min="1" /></div><div class="space-y-1.5"><Label for="codigo-servico">Item da lista de serviços</Label><Input id="codigo-servico" v-model="config.codigoServicoPadrao" inputmode="numeric" placeholder="Ex.: 01.07 — conforme prefeitura" /></div>
            <div class="space-y-1.5"><Label for="codigo-servico-nacional">Código nacional</Label><Input id="codigo-servico-nacional" v-model="config.nfse.codigoServicoNacional" inputmode="numeric" placeholder="Ex.: 010701" /></div><div class="space-y-1.5"><Label for="codigo-tributacao-municipio">Tributação municipal</Label><Input id="codigo-tributacao-municipio" v-model="config.nfse.codigoTributacaoMunicipio" placeholder="Conforme prefeitura" /></div>
            <div class="space-y-1.5"><Label for="codigo-cnae-nfse">CNAE</Label><Input id="codigo-cnae-nfse" v-model="config.nfse.codigoCnae" inputmode="numeric" placeholder="Opcional" /></div><div class="space-y-1.5"><Label for="data-opcao-simples">Opção pelo Simples</Label><Input id="data-opcao-simples" v-model="config.nfse.dataOpcaoSimples" type="date" /></div>
            <div class="space-y-1.5"><Label for="regime-especial-nfse">Regime especial NFS-e</Label><Input id="regime-especial-nfse" v-model="config.nfse.regimeEspecialTributacao" maxlength="2" placeholder="1 - conforme município" /></div>
            <div v-for="setting in nfseSettings" :key="setting.key" class="space-y-1.5"><Label :for="`nfse-${setting.key}`">{{ setting.label }}</Label><Select v-model="config.nfse[setting.key]"><SelectTrigger :id="`nfse-${setting.key}`"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="[value, label] in setting.options" :key="value" :value="value">{{ label }}</SelectItem></SelectContent></Select></div>
            <div class="space-y-1.5"><Label for="natureza-operacao-nfse">Natureza da operação NFS-e</Label><Input id="natureza-operacao-nfse" v-model="config.nfse.naturezaOperacao" inputmode="numeric" maxlength="1" placeholder="Código da prefeitura" /></div>

            <div class="space-y-1.5"><Label for="aliquota-iss">Alíquota ISS (%)</Label><Input id="aliquota-iss" v-model.number="(config.aliquotaIssPadrao as number)" type="number" min="0" max="100" step="0.01" placeholder="Ex.: 5,00" /></div>


          </CardContent>
        </Card>
      </div>
      <div class="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">Série RPS e numeração inicial devem seguir o cadastro fiscal do prestador. Os próximos números são reservados automaticamente a cada tentativa de emissão.</div>
      </TabsContent>

      <TabsContent value="integracao" class="space-y-5">
      <div class="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><p class="font-semibold">Onde conseguir as credenciais?</p><p class="mt-1 text-muted-foreground">O certificado A1 (.pfx/.p12) e a senha vêm da certificadora da empresa credenciada na ICP-Brasil. A API Key da Geranet é gerada no painel da Geranet e configurada pela equipe técnica no servidor; ela não é digitada nesta tela.</p><div class="mt-2 flex flex-wrap gap-x-4 gap-y-1"><a class="text-primary underline underline-offset-2" href="https://www.gov.br/iti/pt-br/assuntos/icp-brasil" target="_blank" rel="noopener noreferrer">Entenda o certificado ICP-Brasil</a><a class="text-primary underline underline-offset-2" href="https://nfe.geranet.net/documentacao/introducao" target="_blank" rel="noopener noreferrer">API Key da Geranet</a></div></div>
      <div v-if="!config.criptografiaFiscalDisponivel" role="alert" class="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100"><CircleAlert class="mt-0.5 size-5 shrink-0" /><div><p class="font-semibold">Criptografia fiscal pendente no servidor</p><p class="mt-1">Peça ao administrador para configurar a chave <code>FISCAL_CERTIFICATE_ENC_KEY</code> no ambiente da API e reiniciá-la. Se já havia certificado ou tokens salvos, é preciso restaurar a mesma chave usada antes. Depois, atualize esta página para continuar.</p></div></div>
      <div class="grid gap-5 lg:grid-cols-2">

        <Card id="fiscal-credencial" class="border-primary/25">
          <CardHeader><CardTitle class="flex items-center gap-2"><FileKey2 class="size-5 text-primary" />Certificado digital A1</CardTitle><CardDescription>O certificado continua por assinante e é usado pela Geranet para assinar NFS-e, NF-e e NFC-e. Arquivos .pfx ou .p12 de até 5 MB são cifrados antes de serem persistidos.</CardDescription></CardHeader>
          <CardContent class="space-y-4"><div v-if="config.certificado.configurado" class="flex items-center gap-2 rounded-lg p-3 text-sm" :class="config.criptografiaFiscalDisponivel ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-900 dark:text-amber-200'"><CheckCircle2 v-if="config.criptografiaFiscalDisponivel" class="size-5" /><CircleAlert v-else class="size-5" /><span>{{ config.criptografiaFiscalDisponivel ? 'Certificado salvo' : 'Certificado salvo, mas indisponível neste servidor' }}: {{ config.certificado.nome }}</span></div><div class="space-y-1.5"><Label for="certificado">Arquivo do certificado</Label><Input id="certificado" type="file" accept=".pfx,.p12,application/x-pkcs12" :disabled="!config.criptografiaFiscalDisponivel" @change="certificateFile = ($event.target as HTMLInputElement).files?.[0] ?? null" /></div><div class="space-y-1.5"><Label for="senha-certificado">Senha do certificado</Label><Input id="senha-certificado" v-model="certificatePassword" type="password" autocomplete="new-password" placeholder="Senha cadastrada no certificado A1" :disabled="!config.criptografiaFiscalDisponivel" /></div><div class="flex flex-wrap gap-2"><Button variant="outline" :disabled="uploadingCredential || !config.criptografiaFiscalDisponivel" @click="uploadCertificate"><LoaderCircle v-if="uploadingCredential" class="animate-spin" /><FileKey2 v-else />{{ config.certificado.configurado ? 'Substituir certificado' : 'Salvar certificado' }}</Button></div></CardContent>
        </Card>
      </div>
      <Card v-if="config.nfseHabilitado || config.nfeHabilitado || config.nfceHabilitado" class="border-sky-500/30">
        <CardHeader><CardTitle>Homologação Geranet</CardTitle><CardDescription>Valide a API Key e depois envie uma nota de teste para confirmar certificado, cadastro e regras fiscais do município ou da SEFAZ.</CardDescription></CardHeader>
        <CardContent class="flex flex-wrap items-center gap-3"><Button variant="outline" :disabled="checkingGeranet" @click="checkGeranet"><LoaderCircle v-if="checkingGeranet" class="animate-spin" /><Search v-else />Validar integração</Button><Button variant="outline" @click="router.push({ name: 'notas-fiscais-homologacao' })">Abrir testes</Button><template v-if="geranetStatus"><span :class="geranetStatus.apiKeyValida ? 'text-emerald-600' : 'text-destructive'">{{ geranetStatus.apiKeyValida ? 'API Key válida' : (geranetStatus.motivo || 'API Key indisponível') }}</span><span class="text-sm text-muted-foreground">A1: {{ geranetStatus.certificadoConfigurado ? 'salvo' : 'pendente' }} · NFS-e: {{ geranetStatus.nfsePronta ? 'pronta' : 'pendente' }} · NF-e: {{ geranetStatus.nfePronta ? 'pronta' : 'pendente' }} · NFC-e: {{ geranetStatus.nfcePronta ? 'pronta' : 'pendente' }}</span></template></CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="nfe" class="space-y-5">
      <div class="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><p class="font-semibold">Onde conseguir os dados da NF-e?</p><p class="mt-1 text-muted-foreground">Peça à contabilidade a natureza da operação, série e regras fiscais dos produtos (como CFOP, NCM e CST/CSOSN). Confira o credenciamento e a inscrição estadual no portal da SEFAZ da sua UF. Os itens fiscais são preenchidos no cadastro de produtos; a nota é gerada a partir de uma venda faturada.</p></div>
      <Card v-if="config.nfeHabilitado || config.nfceHabilitado" id="fiscal-nfe">
        <CardHeader><CardTitle class="flex items-center gap-2"><FileKey2 class="size-5 text-primary" />Parâmetros de produtos</CardTitle><CardDescription>Estes parâmetros são compartilhados por NF-e e NFC-e. A série e o CSC da NFC-e ficam na aba própria.</CardDescription></CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="space-y-1.5"><Label for="serie-nfe">Série NF-e</Label><Input id="serie-nfe" v-model.number="config.serieNfe" type="number" min="1" /></div>
          <div class="space-y-1.5 sm:col-span-2"><Label for="natureza-operacao">Natureza da operação</Label><Input id="natureza-operacao" v-model="config.nfe.naturezaOperacao" placeholder="Ex.: Venda de mercadoria" /></div>
          <div class="space-y-1.5"><Label for="tipo-atividade">Tipo de atividade</Label><Select v-model="config.nfe.tipoAtividade"><SelectTrigger id="tipo-atividade"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Comércio</SelectItem><SelectItem value="2">Serviço</SelectItem><SelectItem value="3">Comércio e serviço</SelectItem><SelectItem value="4">Indústria e comércio</SelectItem><SelectItem value="5">Indústria, comércio e serviço</SelectItem></SelectContent></Select></div>
          <div class="space-y-1.5"><Label for="presenca">Presença</Label><Select v-model="config.nfe.indicadorPresenca"><SelectTrigger id="presenca"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Presencial</SelectItem><SelectItem value="2">Internet</SelectItem><SelectItem value="3">Teleatendimento</SelectItem><SelectItem value="4">Entrega</SelectItem><SelectItem value="5">Fora do estabelecimento</SelectItem><SelectItem value="9">Outros</SelectItem></SelectContent></Select></div>
          <div class="space-y-1.5"><Label for="intermediador">Intermediador</Label><Select v-model="config.nfe.indicativoIntermediador"><SelectTrigger id="intermediador"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Sem intermediador</SelectItem><SelectItem value="1">Marketplace/intermediador</SelectItem></SelectContent></Select></div>
          <div class="space-y-1.5"><Label for="frete">Frete</Label><Select v-model="config.nfe.frete"><SelectTrigger id="frete"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="9">Sem frete</SelectItem><SelectItem value="0">Emitente</SelectItem><SelectItem value="1">Destinatário</SelectItem><SelectItem value="2">Terceiros</SelectItem></SelectContent></Select></div>
        </CardContent>
      </Card>
      <Card v-if="config.nfeHabilitado || config.nfceHabilitado">
        <CardHeader><CardTitle>Responsável técnico e CSRT</CardTitle><CardDescription>Preencha apenas quando a SEFAZ da UF exigir. O CSRT é cifrado e não volta pela API.</CardDescription></CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div class="space-y-1.5"><Label>CNPJ</Label><Input v-model="config.responsavelTecnico.cnpj" inputmode="numeric" /></div><div class="space-y-1.5"><Label>Contato</Label><Input v-model="config.responsavelTecnico.contato" /></div><div class="space-y-1.5"><Label>E-mail</Label><Input v-model="config.responsavelTecnico.email" type="email" /></div><div class="space-y-1.5"><Label>Telefone</Label><Input v-model="config.responsavelTecnico.telefone" inputmode="tel" /></div><div class="space-y-1.5"><Label>ID CSRT</Label><Input v-model="config.responsavelTecnico.csrtId" /></div><div class="space-y-1.5"><Label>CSRT</Label><Input v-model="responsavelTecnicoCsrt" type="password" :placeholder="config.responsavelTecnico.csrtConfigurado ? 'Configurado — informe para substituir' : 'Token fornecido pela SEFAZ'" /></div></CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="nfce" class="space-y-5">
      <div class="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><p class="font-semibold">Onde conseguir os dados da NFC-e?</p><p class="mt-1 text-muted-foreground">Após o credenciamento para NFC-e, gere o CSC e seu ID no portal da SEFAZ da sua UF. Homologação e produção podem ter códigos diferentes: use o CSC do ambiente selecionado. A série da NFC-e também deve ser confirmada com a contabilidade. Natureza da operação e responsável técnico ficam na aba NF-e porque são compartilhados.</p><div class="mt-2 flex flex-wrap gap-x-4 gap-y-1"><a class="text-primary underline underline-offset-2" href="https://www.nfe.fazenda.gov.br/portal/principal.aspx" target="_blank" rel="noopener noreferrer">Portal Nacional da NF-e</a><button type="button" class="text-primary underline underline-offset-2" @click="activeTab = 'nfe'">Abrir regras compartilhadas</button></div></div>
      <Card id="fiscal-nfce" class="border-primary/20">
        <CardHeader><CardTitle>Parâmetros NFC-e</CardTitle><CardDescription>O CSC é protegido e seu token não volta pela API após salvar.</CardDescription></CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="space-y-1.5"><Label for="serie-nfce">Série NFC-e</Label><Input id="serie-nfce" v-model.number="config.serieNfce" type="number" min="1" :disabled="!config.nfceHabilitado" /></div>
          <div class="space-y-1.5"><Label for="csc-id">CSC ID</Label><Input id="csc-id" v-model="config.nfce.cscId" :disabled="!config.nfceHabilitado" /></div>
          <div class="space-y-1.5"><Label for="csc-token">CSC token</Label><Input id="csc-token" v-model="nfceCscToken" :disabled="!config.nfceHabilitado" type="password" autocomplete="new-password" :placeholder="config.nfce.cscConfigurado ? 'Configurado — informe para substituir' : 'Token fornecido pela SEFAZ'" /></div>
        </CardContent>
      </Card>
      <p v-if="!config.nfceHabilitado" class="text-sm text-muted-foreground">Ative a NFC-e na aba Visão geral para preencher estes campos.</p>
      </TabsContent>
      </Tabs>
      <div class="flex justify-end"><Button :disabled="saving" @click="save"><LoaderCircle v-if="saving" class="animate-spin" /><Save v-else />Salvar configurações</Button></div>
    </template>
  </div>
</template>
