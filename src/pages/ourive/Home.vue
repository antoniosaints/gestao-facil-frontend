<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-background to-background p-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p class="text-sm font-medium text-amber-700 dark:text-amber-300">ATELIÊ · OPERAÇÃO CONTROLADA</p>
          <h1 class="mt-1 text-3xl font-bold tracking-tight">{{ pageTitle }}</h1>
          <p class="mt-2 max-w-2xl text-sm text-muted-foreground">Peças sob custódia, orçamento versionado, produção, revisão e faturamento no mesmo fluxo.</p>
        </div>
        <Button v-if="can('RECEBER')" @click="createOpen = true"><Plus class="mr-2 h-4 w-4" />Nova ordem</Button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card v-for="card in statusCards" :key="card.label"><CardHeader class="pb-2"><CardDescription>{{ card.label }}</CardDescription><CardTitle class="text-3xl">{{ card.value }}</CardTitle></CardHeader></Card>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader class="flex-row items-center justify-between space-y-0"><div><CardTitle>Ordens do ateliê</CardTitle><CardDescription>Rastreabilidade da peça do recebimento à entrega.</CardDescription></div><Button variant="outline" size="sm" @click="load"><RefreshCw class="mr-2 h-4 w-4" />Atualizar</Button></CardHeader>
        <CardContent>
          <div v-if="loading" class="py-10 text-center text-sm text-muted-foreground">Carregando ordens…</div>
          <div v-else-if="orders.length" class="divide-y">
            <button v-for="order in orders" :key="order.id" class="flex w-full items-center justify-between gap-3 py-4 text-left transition hover:bg-muted/50" @click="selectOrder(order.id)">
              <div><p class="font-semibold">{{ order.codigoRastreio }}</p><p class="text-sm text-muted-foreground">{{ order.ordemServico?.Cliente?.nome || 'Cliente' }} · {{ order.ordemServico?.descricao }}</p></div>
              <Badge :variant="order.status === 'ENTREGUE' ? 'default' : 'secondary'">{{ statusLabel(order.status) }}</Badge>
            </button>
          </div>
          <div v-else class="py-10 text-center text-sm text-muted-foreground">Nenhuma ordem cadastrada.</div>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Fila de produção</CardTitle><CardDescription>Etapas pendentes e em revisão.</CardDescription></CardHeader><CardContent class="space-y-3"><div v-for="stage in panel?.filaEtapas || []" :key="stage.id" class="rounded-lg border p-3"><p class="font-medium">{{ stage.nome }}</p><p class="text-xs text-muted-foreground">{{ statusLabel(stage.status) }}</p></div><p v-if="!(panel?.filaEtapas || []).length" class="text-sm text-muted-foreground">Fila em dia.</p></CardContent></Card>
    </div>

    <Card v-if="section === 'equipe'">
      <CardHeader><CardTitle>Equipe e especialidades</CardTitle><CardDescription>Os papéis definem o que cada usuário pode acessar no ateliê.</CardDescription></CardHeader>
      <CardContent class="space-y-5"><div class="flex gap-2"><Input v-model="newSpecialty" placeholder="Nova especialidade" /><Button @click="saveSpecialty">Adicionar</Button></div><div class="flex flex-wrap gap-2"><Badge v-for="specialty in specialties" :key="specialty.id" variant="secondary">{{ specialty.nome }}</Badge></div><div v-for="member in team" :key="member.id" class="rounded-xl border p-4"><div class="flex flex-col justify-between gap-3 md:flex-row"><div><p class="font-semibold">{{ member.nome }}</p><p class="text-sm text-muted-foreground">{{ member.email }}</p></div><div class="flex flex-wrap gap-2"><label v-for="role in roleOptions" :key="role" class="flex items-center gap-1 text-sm"><input type="checkbox" :checked="member.papeis.includes(role)" @change="toggleRole(member, role)" /> {{ roleLabel(role) }}</label></div><Button size="sm" variant="outline" @click="saveMember(member)">Salvar</Button></div></div></CardContent>
    </Card>

    <Card v-else-if="section === 'comissoes'">
      <CardHeader><CardTitle>Comissões</CardTitle><CardDescription>Valores consolidados apenas após aprovação da revisão.</CardDescription></CardHeader>
      <CardContent><div v-for="commission in commissions" :key="commission.id" class="flex items-center justify-between border-b py-3"><div><p class="font-medium">{{ commission.usuario?.nome || 'Ourive' }}</p><p class="text-xs text-muted-foreground">Etapa #{{ commission.etapaId }} · {{ commission.tipo === 'PERCENTUAL' ? `${commission.referencia}%` : 'Valor fixo' }}</p></div><Badge :variant="commission.valorConsolidado ? 'default' : 'secondary'">{{ commission.valorConsolidado ? `R$ ${commission.valorConsolidado}` : 'Aguardando revisão' }}</Badge></div><p v-if="!commissions.length" class="py-8 text-center text-sm text-muted-foreground">Nenhuma comissão para este perfil.</p></CardContent>
    </Card>

    <Card v-else-if="section === 'relatorios'">
      <CardHeader><CardTitle>Relatórios e lucratividade</CardTitle><CardDescription>Consolidação histórica por ordens faturadas, materiais e comissões.</CardDescription></CardHeader>
      <CardContent v-if="reportData" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><div v-for="item in reportCards" :key="item.label" class="rounded-xl border p-4"><p class="text-xs text-muted-foreground">{{ item.label }}</p><p class="mt-1 text-xl font-bold">{{ item.value }}</p></div></CardContent>
    </Card>

    <Card v-else-if="section === 'configuracoes'">
      <CardHeader><CardTitle>Configuração financeira</CardTitle><CardDescription>Use IDs das categorias e contas financeiras existentes. A entrega só é faturada após esta configuração.</CardDescription></CardHeader>
      <CardContent class="grid gap-4 sm:grid-cols-2"><label class="grid gap-1 text-sm font-medium">Categoria de receita <Input v-model.number="config.receitaCategoriaId" type="number" min="1" /></label><label class="grid gap-1 text-sm font-medium">Conta de receita <Input v-model.number="config.receitaContaFinanceiraId" type="number" min="1" /></label><label class="grid gap-1 text-sm font-medium">Categoria de comissão <Input v-model.number="config.comissaoCategoriaId" type="number" min="1" /></label><label class="grid gap-1 text-sm font-medium">Conta de comissão <Input v-model.number="config.comissaoContaFinanceiraId" type="number" min="1" /></label><label class="grid gap-1 text-sm font-medium">Validade do orçamento (dias) <Input v-model.number="config.prazoAprovacaoDias" type="number" min="1" max="30" /></label><div class="flex items-end"><Button @click="saveConfig">Salvar configuração</Button></div></CardContent>
    </Card>

    <Dialog v-model:open="createOpen"><DialogContent class="max-w-xl"><DialogHeader><DialogTitle>Receber peça</DialogTitle><DialogDescription>Cria a OS de Ourive e registra a peça sob custódia.</DialogDescription></DialogHeader><div class="grid gap-4 py-2"><label class="grid gap-1 text-sm font-medium">Cliente <select v-model.number="draft.clienteId" class="h-10 rounded-md border bg-background px-3"><option :value="0">Selecione</option><option v-for="client in clients" :key="client.id" :value="client.id">{{ client.label }}</option></select></label><label class="grid gap-1 text-sm font-medium">Solicitação <textarea v-model="draft.descricao" class="min-h-20 rounded-md border bg-background p-3" /></label><label class="grid gap-1 text-sm font-medium">Descrição da peça <textarea v-model="draft.peca" class="min-h-20 rounded-md border bg-background p-3" /></label><div class="grid gap-4 sm:grid-cols-2"><label class="grid gap-1 text-sm font-medium">Metal <Input v-model="draft.metal" placeholder="Ex.: ouro 18k" /></label><label class="grid gap-1 text-sm font-medium">Peso informado (g) <Input v-model.number="draft.peso" type="number" min="0" step="0.001" /></label></div></div><DialogFooter><Button variant="outline" @click="createOpen = false">Cancelar</Button><Button :disabled="saving" @click="createOrder">Registrar recebimento</Button></DialogFooter></DialogContent></Dialog>

    <Dialog v-model:open="detailOpen"><DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{{ selected?.codigoRastreio }}</DialogTitle><DialogDescription>{{ selected?.ordemServico?.Cliente?.nome }} · {{ statusLabel(selected?.status) }}</DialogDescription></DialogHeader><div v-if="selected" class="space-y-5"><div class="grid gap-3 sm:grid-cols-2"><div class="rounded-lg border p-3"><p class="text-xs text-muted-foreground">Peças sob custódia</p><p v-for="piece in selected.pecas" :key="piece.id" class="mt-1 font-medium">{{ piece.codigoRastreio }} — {{ piece.descricao }}</p></div><div class="rounded-lg border p-3"><p class="text-xs text-muted-foreground">Orçamento atual</p><p v-if="selected.orcamentos?.[0]" class="mt-1 font-medium">Versão {{ selected.orcamentos[0].versao }} · R$ {{ selected.orcamentos[0].valorFinal }}</p><p v-else class="mt-1 text-sm text-muted-foreground">Ainda não criado</p></div></div><div v-if="can('ORCAMENTO') && ['RECEBIDA', 'ORCAMENTO'].includes(selected.status)" class="rounded-xl border p-4"><p class="font-semibold">Orçamento simplificado</p><div class="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem_auto]"><Input v-model="budgetDraft.descricao" placeholder="Serviço" /><Input v-model.number="budgetDraft.valor" type="number" min="0" step="0.01" placeholder="Valor" /><Button @click="saveBudget">Salvar orçamento</Button></div><Button v-if="selected.orcamentos?.[0]" class="mt-3" variant="outline" size="sm" @click="sendBudget">Gerar link de aprovação</Button><p v-if="budgetLink" class="mt-2 break-all text-xs text-muted-foreground">Link gerado: {{ budgetLink }}</p></div><div><h3 class="font-semibold">Linha do tempo</h3><div class="mt-2 space-y-2"><div v-for="event in selected.eventos" :key="event.id" class="border-l-2 border-amber-500/50 pl-3 text-sm"><p>{{ event.descricao }}</p><p class="text-xs text-muted-foreground">{{ new Date(event.createdAt).toLocaleString('pt-BR') }}</p></div></div></div></div><DialogFooter><Button v-if="can('PRODUCAO') && selected?.status === 'ORCAMENTO'" @click="startProduction">Iniciar produção</Button><Button v-if="can('ENTREGAR') && selected?.status === 'REVISAO'" @click="deliver">Entregar e faturar</Button><Button variant="outline" @click="detailOpen = false">Fechar</Button></DialogFooter></DialogContent></Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { OuriveRepository, type OuriveCapability } from '@/repositories/ourive-repository'
import { useUiStore } from '@/stores/ui/uiStore'

const route = useRoute(); const toast = useToast(); const ui = useUiStore(); const loading = ref(false); const saving = ref(false); const panel = ref<any>(); const orders = ref<any[]>([]); const clients = ref<Array<{ id: number; label: string }>>([]); const createOpen = ref(false); const detailOpen = ref(false); const selected = ref<any>(); const team = ref<any[]>([]); const specialties = ref<any[]>([]); const commissions = ref<any[]>([]); const reportData = ref<any>(); const newSpecialty = ref(''); const budgetLink = ref(''); const budgetDraft = ref({ descricao: '', valor: 0 }); const roleOptions: Array<'GESTOR' | 'ATENDIMENTO' | 'OURIVE' | 'REVISAO'> = ['GESTOR', 'ATENDIMENTO', 'OURIVE', 'REVISAO']; const config = ref<any>({ prazoAprovacaoDias: 7 });
const draft = ref({ clienteId: 0, descricao: '', peca: '', metal: '', peso: undefined as number | undefined })
const pageTitle = computed(() => ({ '/ourive/equipe': 'Equipe e especialidades', '/ourive/relatorios': 'Relatórios do ateliê', '/ourive/configuracoes': 'Configurações do ateliê' }[route.path] || 'Painel Ourive'))
const section = computed(() => ({ '/ourive/equipe': 'equipe', '/ourive/comissoes': 'comissoes', '/ourive/relatorios': 'relatorios', '/ourive/configuracoes': 'configuracoes' }[route.path] || 'painel'))
const statusCards = computed(() => ['RECEBIDA', 'ORCAMENTO', 'PRODUCAO', 'REVISAO'].map((status) => ({ label: statusLabel(status), value: panel.value?.porStatus?.find((item: any) => item.status === status)?._count?._all || 0 })))
const reportCards = computed(() => reportData.value ? [{ label: 'Ordens', value: reportData.value.totalOrdens }, { label: 'Receita', value: `R$ ${Number(reportData.value.receita).toFixed(2)}` }, { label: 'Materiais', value: `R$ ${Number(reportData.value.materiais).toFixed(2)}` }, { label: 'Comissões', value: `R$ ${Number(reportData.value.comissoes).toFixed(2)}` }, { label: 'Lucro líquido', value: `R$ ${Number(reportData.value.lucroLiquido).toFixed(2)}` }] : [])
function can(capability: OuriveCapability) { return ui.hasOuriveCapability(capability) }
function statusLabel(status?: string) { return ({ RECEBIDA: 'Recebida', ORCAMENTO: 'Orçamento', PRODUCAO: 'Produção', REVISAO: 'Revisão', ENTREGUE: 'Entregue', RECUSADA: 'Recusada', CANCELADA: 'Cancelada', PENDENTE: 'Pendente', EM_EXECUCAO: 'Em execução', AGUARDANDO_REVISAO: 'Aguardando revisão', APROVADA: 'Aprovada', REPROVADA: 'Reprovada' } as Record<string, string>)[status || ''] || status || '' }
function roleLabel(role: string) { return ({ GESTOR: 'Gestor', ATENDIMENTO: 'Atendimento', OURIVE: 'Ourive', REVISAO: 'Revisão' } as Record<string, string>)[role] || role }
function toggleRole(member: any, role: string) { member.papeis = member.papeis.includes(role) ? member.papeis.filter((item: string) => item !== role) : [...member.papeis, role] }
async function load() { loading.value = true; try { [panel.value, orders.value] = await Promise.all([OuriveRepository.painel(), OuriveRepository.ordens().then((data) => data.items)]); clients.value = await ClienteRepository.select2(); if (section.value === 'equipe') [team.value, specialties.value] = await Promise.all([OuriveRepository.equipe(), OuriveRepository.especialidades()]); if (section.value === 'comissoes') commissions.value = await OuriveRepository.comissoes(); if (section.value === 'relatorios') reportData.value = await OuriveRepository.relatorios(); if (section.value === 'configuracoes') config.value = await OuriveRepository.configuracao() } catch { toast.error('Não foi possível carregar o módulo Ourive.') } finally { loading.value = false } }
async function saveSpecialty() { if (!newSpecialty.value.trim()) return; try { await OuriveRepository.salvarEspecialidade({ nome: newSpecialty.value.trim() }); newSpecialty.value = ''; specialties.value = await OuriveRepository.especialidades(); toast.success('Especialidade adicionada.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a especialidade.') } }
async function saveMember(member: any) { try { await OuriveRepository.salvarEquipe(member.id, { papeis: member.papeis, especialidadeIds: member.especialidadeIds || [] }); toast.success('Equipe atualizada.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar a equipe.') } }
async function saveConfig() { try { await OuriveRepository.salvarConfiguracao(config.value); toast.success('Configuração salva.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a configuração.') } }
async function createOrder() { if (!draft.value.clienteId || !draft.value.descricao || !draft.value.peca) return toast.info('Informe cliente, solicitação e peça.'); saving.value = true; try { const order = await OuriveRepository.criarOrdem({ clienteId: draft.value.clienteId, descricao: draft.value.descricao, pecas: [{ descricao: draft.value.peca, metal: draft.value.metal || undefined, pesoInformado: draft.value.peso }] }); createOpen.value = false; draft.value = { clienteId: 0, descricao: '', peca: '', metal: '', peso: undefined }; await load(); await selectOrder(order.id); toast.success('Recebimento registrado.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível criar a ordem.') } finally { saving.value = false } }
async function selectOrder(id: number) { try { selected.value = await OuriveRepository.ordem(id); const latest = selected.value.orcamentos?.[0]; budgetDraft.value = { descricao: latest?.servicos?.[0]?.descricao || '', valor: Number(latest?.servicos?.[0]?.valor || latest?.valorFinal || 0) }; budgetLink.value = ''; detailOpen.value = true } catch { toast.error('Não foi possível abrir a ordem.') } }
async function saveBudget() { if (!selected.value || !budgetDraft.value.descricao || Number(budgetDraft.value.valor) < 0) return toast.info('Informe serviço e valor.'); try { await OuriveRepository.salvarOrcamento(selected.value.id, { servicos: [{ descricao: budgetDraft.value.descricao, quantidade: 1, valor: Number(budgetDraft.value.valor) }], desconto: 0, materiais: [] }); await selectOrder(selected.value.id); await load(); toast.success('Orçamento salvo.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar o orçamento.') } }
async function sendBudget() { if (!selected.value) return; try { const result = await OuriveRepository.enviarOrcamento(selected.value.id); await selectOrder(selected.value.id); budgetLink.value = `${window.location.origin}${result.url}`; toast.success('Link seguro de aprovação gerado.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível gerar o link.') } }
async function startProduction() { if (!selected.value) return; try { await OuriveRepository.iniciarProducao(selected.value.id); await selectOrder(selected.value.id); await load(); toast.success('Produção iniciada e materiais baixados.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível iniciar a produção.') } }
async function deliver() { if (!selected.value) return; try { await OuriveRepository.entregar(selected.value.id); await selectOrder(selected.value.id); await load(); toast.success('Entrega faturada com sucesso.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível entregar a ordem.') } }
onMounted(load)
watch(() => route.path, () => { void load() })
</script>
