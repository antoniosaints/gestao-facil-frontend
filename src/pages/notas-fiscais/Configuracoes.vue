<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Building2, CheckCircle2, Cog, FileKey2, LoaderCircle, MapPin, MapPinCheck, Save, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NotasFiscaisRepository, type FiscalConfig, type MunicipioIbge } from '@/repositories/notas-fiscais-repository'
import { cepMaskOptions, cpfCnpjMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'

const toast = useToast()
const saving = ref(false)
const loading = ref(true)
const searchingMunicipio = ref(false)
const uploadingCredential = ref(false)
const certificateFile = ref<File | null>(null)
const certificatePassword = ref('')
const d2tiToken = ref('')
const municipalitySearch = ref('')
const municipalities = ref<MunicipioIbge[]>([])

const config = reactive<FiscalConfig>({
  razaoSocial: '', nomeFantasia: '', documento: '', inscricaoEstadual: '', inscricaoMunicipal: '', regimeTributario: 0,
  codigoMunicipioIbge: '', codigoMunicipioPrestador: '', municipioNome: '', uf: '', cep: '', logradouro: '', numero: '', bairro: '', complemento: '',
  email: '', telefone: '', ambiente: 'HOMOLOGACAO', provedorNfse: 'NACIONAL', serieRps: 1, proximoNumeroRps: 1,
  codigoServicoPadrao: '', descricaoServicoPadrao: '', codigoAtividadePadrao: '', descricaoAtividadePadrao: '', tipoTributacaoPadrao: null, tipoRecolhimentoPadrao: null, notaIntermediadaPadrao: 2, aliquotaIssPadrao: null,
  certificado: { configurado: false, nome: null, atualizadoEm: null }, integracao: { tipo: 'CERTIFICADO_A1', configurada: false, atualizadoEm: null }, emissaoNfsePronta: false,
})

function assignConfig(data: FiscalConfig) { Object.assign(config, data) }
function errorMessage(error: any, fallback: string) { return error?.response?.data?.error?.message || error?.response?.data?.message || fallback }

async function load() {
  try { assignConfig(await NotasFiscaisRepository.getConfig()) }
  catch (error: any) { toast.error(errorMessage(error, 'Não foi possível carregar a configuração fiscal.')) }
  finally { loading.value = false }
}

async function save() {
  try {
    saving.value = true
    const { certificado: _certificate, integracao: _integration, emissaoNfsePronta: _ready, proximoNumeroRps: _next, ...payload } = config
    assignConfig(await NotasFiscaisRepository.saveConfig(payload))
    toast.success('Configuração fiscal salva.')
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível salvar a configuração fiscal.')) }
  finally { saving.value = false }
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

async function saveD2tiToken() {
  if (!/^[a-fA-F0-9]{32}$/.test(d2tiToken.value.trim())) return toast.info('Informe o token D2TI de 32 caracteres gerado no portal da prefeitura.')
  try {
    uploadingCredential.value = true
    await NotasFiscaisRepository.saveD2tiToken(d2tiToken.value)
    d2tiToken.value = ''
    assignConfig(await NotasFiscaisRepository.getConfig())
    toast.success('Token D2TI protegido e salvo com sucesso.')
  } catch (error: any) { toast.error(errorMessage(error, 'Não foi possível salvar o token D2TI.')) }
  finally { uploadingCredential.value = false }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 pb-10">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">Notas fiscais</p><h1 class="mt-1 text-2xl font-bold tracking-tight">Configuração NFS-e</h1><p class="mt-1 max-w-2xl text-sm text-muted-foreground">Os dados e as credenciais fiscais são isolados por conta.</p></div>
      <Button :disabled="saving || loading" @click="save"><LoaderCircle v-if="saving" class="animate-spin" /><Save v-else />Salvar dados</Button>
    </header>

    <div v-if="loading" class="flex min-h-64 items-center justify-center text-sm text-muted-foreground"><LoaderCircle class="mr-2 size-5 animate-spin" />Carregando configuração fiscal…</div>

    <template v-else>
      <div class="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle class="flex items-center gap-2"><Building2 class="size-5 text-primary" />Emissor</CardTitle><CardDescription>Quem presta o serviço e emite a nota.</CardDescription></CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5 sm:col-span-2"><Label for="razao-social">Razão social</Label><Input id="razao-social" v-model="config.razaoSocial" autocomplete="organization" placeholder="Ex.: Pizzaria Sabor da Casa LTDA" /></div>
            <div class="space-y-1.5"><Label for="fantasia">Nome fantasia</Label><Input id="fantasia" v-model="config.nomeFantasia" placeholder="Ex.: Sabor da Casa" /></div>
            <div class="space-y-1.5"><Label for="documento">CNPJ/CPF</Label><Input id="documento" v-model="config.documento" v-maska="cpfCnpjMaskOptions" inputmode="numeric" placeholder="00.000.000/0001-00" /></div>
            <div class="space-y-1.5"><Label for="ie">Inscrição estadual</Label><Input id="ie" v-model="config.inscricaoEstadual" placeholder="Ex.: 123.456.789.000" /></div>
            <div class="space-y-1.5"><Label for="im">Inscrição municipal</Label><Input id="im" v-model="config.inscricaoMunicipal" placeholder="Ex.: 123456" /></div>
            <div class="space-y-1.5"><Label for="regime">Regime tributário</Label><Select v-model="config.regimeTributario"><SelectTrigger id="regime"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="0">Não informado</SelectItem><SelectItem :value="1">Simples Nacional</SelectItem><SelectItem :value="2">Simples - excesso sublimite</SelectItem><SelectItem :value="3">Regime normal</SelectItem></SelectContent></Select></div>
            <div class="space-y-1.5"><Label for="ambiente">Ambiente</Label><Select v-model="config.ambiente"><SelectTrigger id="ambiente"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="HOMOLOGACAO">Homologação</SelectItem><SelectItem value="PRODUCAO">Produção</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle class="flex items-center gap-2"><MapPin class="size-5 text-primary" />Município do prestador</CardTitle><CardDescription>O código IBGE é consultado pela fonte oficial.</CardDescription></CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-[110px_1fr_auto]"><div class="space-y-1.5"><Label for="uf">UF</Label><Input id="uf" v-model="config.uf" maxlength="2" class="uppercase" placeholder="MA" /></div><div class="space-y-1.5"><Label for="buscar-municipio">Consultar IBGE</Label><Input id="buscar-municipio" v-model="municipalitySearch" placeholder="Ex.: São Mateus" @keyup.enter="searchMunicipality" /></div><Button class="mt-auto" variant="outline" :disabled="searchingMunicipio" @click="searchMunicipality"><LoaderCircle v-if="searchingMunicipio" class="animate-spin" /><Search v-else />Buscar</Button></div>
            <div v-if="municipalities.length" class="max-h-44 overflow-y-auto rounded-lg border p-1"><button v-for="item in municipalities" :key="item.codigoIbge" type="button" class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent" @click="selectMunicipality(item)"><span>{{ item.nome }} — {{ item.uf }}</span><span class="font-mono text-xs text-muted-foreground">{{ item.codigoIbge }}</span></button></div>
            <div class="grid gap-4 sm:grid-cols-2"><div class="space-y-1.5"><Label for="municipio">Município</Label><Input id="municipio" v-model="config.municipioNome" placeholder="Ex.: São Mateus do Maranhão" /></div><div class="space-y-1.5"><Label for="codigo-ibge">Código IBGE</Label><Input id="codigo-ibge" v-model="config.codigoMunicipioIbge" inputmode="numeric" placeholder="Ex.: 2111508" /></div><div class="space-y-1.5 sm:col-span-2"><Label for="codigo-prefeitura">Código do provedor</Label><Input id="codigo-prefeitura" v-model="config.codigoMunicipioPrestador" readonly placeholder="Preenchido automaticamente quando disponível" /></div></div>
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

      <div class="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle class="flex items-center gap-2"><Cog class="size-5 text-primary" />Parâmetros da NFS-e</CardTitle><CardDescription>Use exatamente os códigos habilitados para o seu cadastro no portal municipal.</CardDescription></CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5"><Label for="serie-rps">Série RPS</Label><Input id="serie-rps" v-model.number="config.serieRps" type="number" min="1" /></div><div class="space-y-1.5"><Label for="codigo-servico">Código de serviço</Label><Input id="codigo-servico" v-model="config.codigoServicoPadrao" inputmode="numeric" placeholder="Ex.: 1005" /></div>
            <div class="space-y-1.5 sm:col-span-2"><Label for="descricao-servico">Descrição do serviço</Label><Input id="descricao-servico" v-model="config.descricaoServicoPadrao" placeholder="Ex.: Serviços de alimentação" /></div>
            <div class="space-y-1.5"><Label for="codigo-atividade">CNAE / atividade</Label><Input id="codigo-atividade" v-model="config.codigoAtividadePadrao" inputmode="numeric" placeholder="Ex.: 5611203" /></div><div class="space-y-1.5"><Label for="aliquota-iss">Alíquota ISS (%)</Label><Input id="aliquota-iss" v-model.number="(config.aliquotaIssPadrao as number)" type="number" min="0" max="100" step="0.01" placeholder="Ex.: 5,00" /></div>
            <div class="space-y-1.5 sm:col-span-2"><Label for="descricao-atividade">Descrição da atividade</Label><Input id="descricao-atividade" v-model="config.descricaoAtividadePadrao" placeholder="Ex.: Restaurantes e similares" /></div>
            <div class="space-y-1.5"><Label for="tributacao">Tipo de tributação</Label><Input id="tributacao" v-model.number="(config.tipoTributacaoPadrao as number)" type="number" min="1" max="9" placeholder="Conforme portal" /></div><div class="space-y-1.5"><Label for="recolhimento">Tipo de recolhimento</Label><Input id="recolhimento" v-model.number="(config.tipoRecolhimentoPadrao as number)" type="number" min="1" max="9" placeholder="Conforme portal" /></div>
          </CardContent>
        </Card>

        <Card v-if="config.integracao.tipo === 'TOKEN_D2TI'" class="border-primary/25">
          <CardHeader><CardTitle class="flex items-center gap-2"><FileKey2 class="size-5 text-primary" />Integração D2TI</CardTitle><CardDescription>São Mateus do Maranhão usa token de emissor RPS. Ele é cifrado antes de ser salvo.</CardDescription></CardHeader>
          <CardContent class="space-y-4"><div v-if="config.integracao.configurada" class="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 class="size-5" /><span>Token D2TI configurado.</span></div><div class="space-y-1.5"><Label for="d2ti-token">Token do portal municipal</Label><Input id="d2ti-token" v-model="d2tiToken" maxlength="32" autocomplete="off" placeholder="32 caracteres da Configuração da Nota" /></div><Button variant="outline" :disabled="uploadingCredential" @click="saveD2tiToken"><LoaderCircle v-if="uploadingCredential" class="animate-spin" /><FileKey2 v-else />{{ config.integracao.configurada ? 'Substituir token' : 'Salvar token' }}</Button></CardContent>
        </Card>

        <Card v-else class="border-primary/25">
          <CardHeader><CardTitle class="flex items-center gap-2"><FileKey2 class="size-5 text-primary" />Certificado digital A1</CardTitle><CardDescription>Arquivos .pfx ou .p12 de até 5 MB. O arquivo e a senha são cifrados antes de serem persistidos.</CardDescription></CardHeader>
          <CardContent class="space-y-4"><div v-if="config.certificado.configurado" class="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 class="size-5" /><span>Certificado configurado: {{ config.certificado.nome }}</span></div><div class="space-y-1.5"><Label for="certificado">Arquivo do certificado</Label><Input id="certificado" type="file" accept=".pfx,.p12,application/x-pkcs12" @change="certificateFile = ($event.target as HTMLInputElement).files?.[0] ?? null" /></div><div class="space-y-1.5"><Label for="senha-certificado">Senha do certificado</Label><Input id="senha-certificado" v-model="certificatePassword" type="password" autocomplete="new-password" placeholder="Senha cadastrada no certificado A1" /></div><Button variant="outline" :disabled="uploadingCredential" @click="uploadCertificate"><LoaderCircle v-if="uploadingCredential" class="animate-spin" /><FileKey2 v-else />{{ config.certificado.configurado ? 'Substituir certificado' : 'Salvar certificado' }}</Button></CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
