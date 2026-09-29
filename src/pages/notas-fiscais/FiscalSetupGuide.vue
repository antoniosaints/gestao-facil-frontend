<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CheckCircle2, CircleAlert, ClipboardList, LoaderCircle, Save } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { FiscalConfig } from '@/repositories/notas-fiscais-repository'

const props = defineProps<{ config: FiscalConfig; saving: boolean }>()
const emit = defineEmits<{ save: []; navigate: [target: string] }>()
const router = useRouter()
type FiscalType = 'NFSE' | 'NFE' | 'NFCE'
type Requirement = { label: string; done: boolean }
const selectedType = ref<FiscalType>('NFSE')
const selectedStep = ref(0)
const typeLabels: Record<FiscalType, string> = { NFSE: 'NFS-e', NFE: 'NF-e', NFCE: 'NFC-e' }
const d2ti = computed(() => selectedType.value === 'NFSE' && props.config.modoEmissaoNfse === 'LEGADO_D2TI')
const filled = (value: unknown) => Boolean(String(value ?? '').trim())

const steps = computed(() => {
  const c = props.config
  const type = selectedType.value
  const identification: Requirement[] = [
    { label: `Ativar ${typeLabels[type]}`, done: type === 'NFSE' ? c.nfseHabilitado : type === 'NFE' ? c.nfeHabilitado : c.nfceHabilitado },
    { label: 'Razão social e CPF/CNPJ do emissor', done: filled(c.razaoSocial) && filled(c.documento) },
    { label: type === 'NFSE' ? 'Inscrição municipal' : 'Inscrição estadual', done: filled(type === 'NFSE' ? c.inscricaoMunicipal : c.inscricaoEstadual) },
  ]
  if (type !== 'NFSE') identification.push({ label: 'Regime tributário', done: c.regimeTributario >= 1 })
  const address: Requirement[] = [
    { label: 'Município e código IBGE', done: filled(c.codigoMunicipioIbge) && (d2ti.value || filled(c.municipioNome)) },
  ]
  if (!d2ti.value) address.push(
    { label: 'UF e CEP', done: filled(c.uf) && filled(c.cep) },
    { label: 'Logradouro, número e bairro', done: filled(c.logradouro) && filled(c.numero) && filled(c.bairro) },
  )
  const credentials: Requirement[] = [{ label: d2ti.value ? 'Token D2TI protegido' : 'Certificado A1 e senha salvos', done: c.integracao.configurada }]
  const parameters: Requirement[] = type === 'NFSE'
    ? d2ti.value
      ? [
          { label: 'Código e descrição do serviço', done: filled(c.codigoServicoPadrao) && filled(c.descricaoServicoPadrao) },
          { label: 'Atividade e descrição', done: filled(c.codigoAtividadePadrao) && filled(c.descricaoAtividadePadrao) },
          { label: 'Tributação, recolhimento e alíquota ISS', done: c.tipoTributacaoPadrao != null && c.tipoRecolhimentoPadrao != null && c.aliquotaIssPadrao != null },
        ]
      : [
          { label: 'Código do serviço e tributação municipal', done: filled(c.codigoServicoPadrao) && filled(c.nfse.codigoTributacaoMunicipio) },
          { label: 'Alíquota ISS', done: c.aliquotaIssPadrao != null },
          ...([1, 4].includes(c.regimeTributario) ? [{ label: 'Data de opção pelo Simples', done: filled(c.nfse.dataOpcaoSimples) }] : []),
        ]
    : [
        { label: 'Natureza da operação', done: filled(c.nfe.naturezaOperacao) },
        ...(type === 'NFCE' ? [{ label: 'ID e token CSC da SEFAZ', done: filled(c.nfce.cscId) && c.nfce.cscConfigurado }] : []),
      ]
  const savedReady = type === 'NFSE' ? c.emissaoNfsePronta : type === 'NFE' ? c.emissaoNfePronta : c.emissaoNfcePronta
  return [
    { title: '1. Identificação', description: 'Dados legais e credenciamento do emissor.', target: 'fiscal-emissor', items: identification },
    { title: '2. Localização', description: 'Município IBGE e endereço usados na transmissão.', target: 'fiscal-municipio', items: address },
    { title: '3. Credencial', description: d2ti.value ? 'Token municipal protegido por conta.' : 'Certificado digital A1 protegido por conta.', target: 'fiscal-credencial', items: credentials },
    { title: '4. Parâmetros', description: 'Códigos e regras do documento selecionado.', target: type === 'NFSE' ? 'fiscal-nfse' : type === 'NFCE' && filled(c.nfe.naturezaOperacao) ? 'fiscal-nfce' : 'fiscal-nfe', items: parameters },
    { title: '5. Homologação', description: 'Salve os dados e valide uma emissão de teste.', target: 'fiscal-guide', items: [
      { label: 'Configuração salva e pronta no servidor', done: savedReady },
      { label: 'Ambiente de homologação selecionado', done: c.ambiente === 'HOMOLOGACAO' },
    ] },
  ]
})
const completed = computed(() => steps.value.filter((step) => step.items.every((item) => item.done)).length)
function goToFields() {
  const target = steps.value[selectedStep.value].target
  emit('navigate', target)
}
</script>

<template>
  <Card id="fiscal-guide" class="border-primary/30">
    <CardHeader><CardTitle class="flex items-center gap-2"><ClipboardList class="size-5 text-primary" />Assistente de configuração fiscal</CardTitle><CardDescription>Escolha o documento e avance pelas etapas obrigatórias. O progresso dos dados só é confirmado depois de salvar.</CardDescription></CardHeader>
    <CardContent class="space-y-5">
      <div class="flex flex-wrap gap-2" aria-label="Tipo de nota"><Button v-for="type in (['NFSE', 'NFE', 'NFCE'] as const)" :key="type" size="sm" :variant="selectedType === type ? 'default' : 'outline'" :aria-pressed="selectedType === type" @click="selectedType = type; selectedStep = 0">{{ typeLabels[type] }}</Button></div>
      <div class="flex flex-wrap items-center justify-between gap-2 text-sm"><span class="font-medium">{{ completed }} de {{ steps.length }} etapas concluídas para {{ typeLabels[selectedType] }}</span><span class="text-muted-foreground">{{ config.ambiente === 'HOMOLOGACAO' ? 'Ambiente de homologação' : 'Ambiente de produção' }}</span></div>
      <div class="grid gap-2 sm:grid-cols-5" aria-label="Etapas da configuração"><button v-for="(step, index) in steps" :key="step.title" type="button" class="rounded-lg border p-3 text-left text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :class="selectedStep === index ? 'border-primary bg-primary/5' : ''" :aria-current="selectedStep === index ? 'step' : undefined" @click="selectedStep = index"><span class="flex items-center gap-1 font-semibold"><CheckCircle2 v-if="step.items.every((item) => item.done)" class="size-4 text-emerald-600" /><CircleAlert v-else class="size-4 text-amber-600" />{{ step.title }}</span></button></div>
      <div class="rounded-xl border bg-muted/30 p-4"><h2 class="font-semibold">{{ steps[selectedStep].title }}</h2><p class="mt-1 text-sm text-muted-foreground">{{ steps[selectedStep].description }}</p><ul class="mt-3 grid gap-2 sm:grid-cols-2"><li v-for="item in steps[selectedStep].items" :key="item.label" class="flex items-start gap-2 text-sm"><CheckCircle2 v-if="item.done" class="mt-0.5 size-4 shrink-0 text-emerald-600" /><CircleAlert v-else class="mt-0.5 size-4 shrink-0 text-amber-600" />{{ item.label }}</li></ul></div>
      <div class="flex flex-wrap gap-2"><Button variant="outline" @click="goToFields">Ir para os campos <ArrowRight /></Button><Button variant="outline" :disabled="saving" @click="emit('save')"><LoaderCircle v-if="saving" class="animate-spin" /><Save v-else />Salvar progresso</Button><Button v-if="selectedStep < steps.length - 1" @click="selectedStep++">Próxima etapa <ArrowRight /></Button><Button v-else :disabled="!steps[4].items.every((item) => item.done)" @click="router.push({ name: 'notas-fiscais-homologacao' })">Abrir testes de homologação <ArrowRight /></Button></div>
    </CardContent>
  </Card>
</template>
