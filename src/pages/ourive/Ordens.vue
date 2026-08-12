<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent p-6 sm:flex-row sm:items-center">
      <div><p class="text-xs font-semibold tracking-[0.18em] text-amber-700 dark:text-amber-300">ATELIÊ</p><h1 class="mt-1 text-3xl font-bold">Ordens de serviço</h1><p class="mt-1 text-sm text-muted-foreground">Recebimento, peças sob custódia e histórico por cliente.</p></div>
      <Button v-if="canReceive" @click="open = true"><Plus class="mr-2 h-4 w-4" />Nova ordem</Button>
    </div>

    <Card><CardContent class="p-0"><div v-if="loading" class="p-10 text-center text-sm text-muted-foreground">Carregando ordens…</div><div v-else-if="orders.length" class="divide-y"><RouterLink v-for="order in orders" :key="order.id" :to="{ name: 'ourive-ordem', params: { id: order.id } }" class="flex items-center justify-between gap-4 p-5 transition hover:bg-muted/50"><div><p class="font-semibold">{{ order.codigoRastreio }}</p><p class="mt-1 text-sm text-muted-foreground">{{ order.ordemServico?.Cliente?.nome || 'Cliente' }} · {{ order.ordemServico?.descricao }}</p></div><Badge :variant="order.status === 'ENTREGUE' ? 'default' : 'secondary'">{{ label(order.status) }}</Badge></RouterLink></div><div v-else class="p-10 text-center text-sm text-muted-foreground">Nenhuma ordem cadastrada.</div></CardContent></Card>

    <Dialog v-model:open="open"><DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Receber peças</DialogTitle><DialogDescription>Uma OS pode agrupar várias peças do mesmo cliente.</DialogDescription></DialogHeader><div class="grid gap-4 py-2"><label class="grid gap-1 text-sm font-medium">Cliente <Select2Ajax v-model="draft.clienteId" url="/clientes/select2" placeholder="Busque o cliente" /></label><label class="grid gap-1 text-sm font-medium">Solicitação <textarea v-model="draft.descricao" class="min-h-20 rounded-md border bg-background p-3" placeholder="Descreva o serviço solicitado" /></label><label class="grid gap-1 text-sm font-medium">Garantia <Input v-model="draft.garantia" /></label><div v-for="(piece, index) in draft.pecas" :key="index" class="space-y-3 rounded-xl border bg-muted/20 p-4"><div class="flex items-center justify-between"><p class="font-semibold">Peça {{ index + 1 }}</p><Button v-if="draft.pecas.length > 1" size="sm" variant="ghost" @click="draft.pecas.splice(index, 1)"><Trash2 class="h-4 w-4" /></Button></div><div class="grid gap-3 sm:grid-cols-2"><Input v-model="piece.descricao" placeholder="Descrição da peça" /><Input v-model="piece.metal" placeholder="Metal (ex.: ouro 18k)" /><Input v-model="piece.pedras" placeholder="Pedras" /><Input v-model.number="piece.pesoInformado" type="number" min="0" step="0.001" placeholder="Peso informado (g)" /></div><textarea v-model="piece.estadoConservacao" class="min-h-16 w-full rounded-md border bg-background p-3 text-sm" placeholder="Estado de conservação" /><textarea v-model="piece.checklist" class="min-h-16 w-full rounded-md border bg-background p-3 text-sm" placeholder="Checklist de recebimento (um item por linha)" /></div><Button type="button" variant="outline" class="w-fit" @click="addPiece"><Plus class="mr-2 h-4 w-4" />Adicionar peça</Button></div><DialogFooter><Button variant="outline" @click="open = false">Cancelar</Button><Button :disabled="saving" @click="save">Registrar recebimento</Button></DialogFooter></DialogContent></Dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { useUiStore } from '@/stores/ui/uiStore'

const toast = useToast(); const router = useRouter(); const ui = useUiStore(); const loading = ref(true); const saving = ref(false); const open = ref(false); const orders = ref<any[]>([])
const emptyPiece = () => ({ descricao: '', metal: '', pedras: '', pesoInformado: undefined as number | undefined, estadoConservacao: '', checklist: '' })
const draft = ref({ clienteId: undefined as number | undefined, descricao: '', garantia: 'Sem garantia informada', pecas: [emptyPiece()] })
const canReceive = ui.hasOuriveCapability('RECEBER')
const label = (status: string) => ({ RECEBIDA: 'Recebida', ORCAMENTO: 'Orçamento', PRODUCAO: 'Produção', REVISAO: 'Revisão', ENTREGUE: 'Entregue', RECUSADA: 'Recusada', CANCELADA: 'Cancelada' } as Record<string, string>)[status] || status
function addPiece() { draft.value.pecas.push(emptyPiece()) }
async function load() { loading.value = true; try { orders.value = (await OuriveRepository.ordens()).items } catch { toast.error('Não foi possível carregar as ordens.') } finally { loading.value = false } }
async function save() { if (!draft.value.clienteId || draft.value.descricao.trim().length < 3 || draft.value.pecas.some((piece) => piece.descricao.trim().length < 2)) return toast.info('Informe cliente, solicitação e a descrição de cada peça.'); saving.value = true; try { const created = await OuriveRepository.criarOrdem({ clienteId: draft.value.clienteId, descricao: draft.value.descricao, garantia: draft.value.garantia, pecas: draft.value.pecas.map((piece) => ({ ...piece, checklistRecebimento: piece.checklist.split('\n').map((item) => item.trim()).filter(Boolean) })) }); toast.success('Recebimento registrado.'); await router.push({ name: 'ourive-ordem', params: { id: created.id } }) } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível registrar o recebimento.') } finally { saving.value = false } }
onMounted(load)
</script>
