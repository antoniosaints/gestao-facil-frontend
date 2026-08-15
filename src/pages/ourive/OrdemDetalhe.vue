<template>
  <div>
  <section v-if="order" class="space-y-6">
    <div class="mb-4 flex flex-col justify-between gap-3 md:flex-row">
      <div>
        <Button
          variant="ghost"
          size="sm"
          class="mb-2 -ml-2"
          @click="router.push({ name: 'ourive-ordens' })"
          ><ArrowLeft class="mr-2 h-4 w-4" />Voltar para ordens</Button
        >
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ClipboardList class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />{{
            order.ordemServico?.descricao
          }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ order.codigoRastreio }} · {{ order.ordemServico?.Cliente?.nome }} ·
          {{ order.ordemServico?.Cliente?.telefone || 'Sem telefone' }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{{ label(order.status) }}</Badge
        ><Button v-if="can('PRODUCAO') && order.status === 'ORCAMENTO' && currentBudgetApproved" @click="start"
          >Iniciar produção</Button
        ><Button v-if="can('ENTREGAR') && order.status === 'REVISAO' && currentBudgetApproved" @click="deliver"
          >Entregar e faturar</Button
        ><Button v-if="can('ORCAMENTO') && !closed" variant="destructive" @click="cancel"
          >Cancelar</Button
        >
        <Button
          v-if="can('CONFIGURAR') && !order.faturadaEm"
          variant="outline"
          class="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          @click="deleteOrder"
          >Apagar ordem</Button
        >
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="space-y-6">
        <Card
          ><CardHeader
            ><CardTitle>Peças sob custódia</CardTitle
            ><CardDescription
              >Fotos, checklist de recebimento e rastreio individual.</CardDescription
            ></CardHeader
          ><CardContent class="space-y-5"
            ><div v-for="piece in order.pecas" :key="piece.id" class="rounded-xl border p-4">
              <div class="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <p class="font-semibold">{{ piece.codigoRastreio }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ piece.descricao }}<span v-if="piece.metal"> · {{ piece.metal }}</span
                    ><span v-if="piece.pedras"> · {{ piece.pedras }}</span>
                  </p>
                </div>
                <label
                  v-if="can('RECEBER')"
                  class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary"
                  ><Upload class="h-4 w-4" />Adicionar foto<input
                    class="hidden"
                    type="file"
                    accept="image/*"
                    @change="uploadPhoto(piece, $event)"
                /></label>
              </div>
              <p v-if="piece.estadoConservacao" class="mt-3 text-sm">
                <span class="font-medium">Estado:</span> {{ piece.estadoConservacao }}
              </p>
              <div v-if="checklist(piece).length" class="mt-3 flex flex-wrap gap-2">
                <Badge v-for="item in checklist(piece)" :key="item" variant="outline">{{
                  item
                }}</Badge>
              </div>
              <div v-if="piece.fotos?.length" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div
                  v-for="photo in piece.fotos"
                  :key="photo.id"
                  class="group relative overflow-hidden rounded-lg border bg-muted"
                >
                  <button type="button" class="block w-full" @click="photoPreview = photo.url"
                    ><img
                      :src="photo.url"
                      :alt="photo.descricao || `Foto da peça ${piece.codigoRastreio}`"
                      class="aspect-square h-full w-full object-cover transition group-hover:scale-105" /></button
                  ><Button
                    v-if="can('RECEBER')"
                    type="button"
                    size="icon"
                    variant="destructive"
                    class="absolute right-2 top-2 h-8 w-8 opacity-100 shadow-sm sm:opacity-0 sm:group-hover:opacity-100"
                    :disabled="removingPhotoId === photo.id"
                    :aria-label="`Excluir foto da peça ${piece.codigoRastreio}`"
                    @click="removePhoto(photo)"
                    ><Trash2 class="h-4 w-4"
                  /></Button>
                </div>
              </div>
              <p
                v-else
                class="mt-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground"
              >
                Nenhuma foto registrada para esta peça.
              </p>
            </div></CardContent
          ></Card
        >

        <Card
          ><CardHeader
            ><CardTitle>Orçamento versionado</CardTitle
            ><CardDescription
              >Serviços, desconto, prazo e materiais planejados antes da baixa.</CardDescription
            ></CardHeader
          ><CardContent class="space-y-5"
            ><div v-if="can('ORCAMENTO') && !budgetLocked" class="space-y-3">
              <div
                v-for="(service, index) in budget.servicos"
                :key="index"
                class="grid gap-2 sm:grid-cols-[1fr_6rem_9rem_auto]"
              >
                <Input v-model="service.descricao" placeholder="Serviço" /><Input
                  v-model.number="service.quantidade"
                  type="number"
                  min="1"
                /><Input v-model.number="service.valor" type="number" min="0" step="0.01" /><Button
                  variant="ghost"
                  size="icon"
                  @click="budget.servicos.splice(index, 1)"
                  ><Trash2 class="h-4 w-4"
                /></Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                @click="budget.servicos.push({ descricao: '', quantidade: 1, valor: 0 })"
                ><Plus class="mr-2 h-4 w-4" />Serviço</Button
              >
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-sm font-medium"
                  >Desconto
                  <Input
                    v-model.number="budget.desconto"
                    type="number"
                    min="0"
                    step="0.01" /></label
                ><label class="grid gap-1 text-sm font-medium"
                  >Prazo previsto <Calendarpicker v-model="budget.prazoPrevisto" :teleport="true"
                /></label>
              </div>
              <div class="space-y-2 rounded-lg border p-3">
                <p class="text-sm font-semibold">Materiais planejados</p>
                <p class="text-xs text-muted-foreground">
                  Materiais da empresa baixam do estoque e entram no orçamento. Materiais do cliente
                  ficam apenas registrados na OS.
                </p>
                <div
                  v-for="(material, index) in budget.materiais"
                  :key="index"
                  class="grid gap-3 rounded-lg border bg-muted/20 p-3 lg:grid-cols-12"
                >
                  <label class="grid gap-1 text-xs font-medium lg:col-span-6"
                    >Material
                    <Select2Ajax
                      v-model="material.produtoId"
                      url="/produtos/select2"
                      placeholder="Selecione o material"
                      @update:model-value="updateMaterialCost(material, $event)"
                    />
                  </label>
                  <label class="grid gap-1 text-xs font-medium lg:col-span-3"
                    >Origem
                    <select
                      v-model="material.fornecidoPeloCliente"
                      class="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                      <option :value="false">Estoque da empresa</option>
                      <option :value="true">Fornecido pelo cliente</option>
                    </select>
                  </label>
                  <label class="grid gap-1 text-xs font-medium lg:col-span-3"
                    >Peça vinculada
                    <select
                      v-model.number="material.pecaId"
                      class="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                      <option :value="undefined">Todas as peças</option>
                      <option v-for="piece in order.pecas" :key="piece.id" :value="piece.id">
                        {{ piece.codigoRastreio }}
                      </option>
                    </select>
                  </label>
                  <label class="grid gap-1 text-xs font-medium lg:col-span-3"
                    >Custo interno un.
                    <Input v-model.number="material.custoUnitario" type="number" min="0" step="0.01" />
                  </label>
                  <label class="grid gap-1 text-xs font-medium lg:col-span-4"
                    >Valor cobrado un.
                    <Input
                      v-model.number="material.valorUnitario"
                      type="number"
                      min="0"
                      step="0.01"
                      :disabled="material.fornecidoPeloCliente"
                    />
                  </label>
                  <label class="grid gap-1 text-xs font-medium lg:col-span-2"
                    >Quantidade
                    <Input v-model.number="material.quantidade" type="number" min="1" />
                  </label>
                  <div class="flex items-end lg:col-span-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      class="text-destructive hover:text-destructive"
                      @click="budget.materiais.splice(index, 1)"
                    >
                      <Trash2 class="mr-2 h-4 w-4" />Remover
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  @click="
                    budget.materiais.push({
                      produtoId: undefined,
                      pecaId: undefined,
                      fornecidoPeloCliente: false,
                      custoUnitario: 0,
                      valorUnitario: 0,
                      quantidade: 1,
                    })
                  "
                  ><Plus class="mr-2 h-4 w-4" />Material</Button
                >
                <p class="text-xs text-muted-foreground">
                  Salve a nova versão antes de gerar o link para que o cliente veja os materiais e valores atualizados.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <Button @click="saveBudget">Salvar nova versão</Button
                ><Button v-if="currentBudget" variant="outline" @click="sendBudget"
                  >Gerar link de aprovação</Button
                ><div class="ml-auto text-right text-sm">
                  <p class="text-muted-foreground">Serviços: {{ money(subtotalBudget) }}</p>
                  <p v-if="materialCompanyValue" class="text-muted-foreground">
                    Materiais da empresa: {{ money(materialCompanyValue) }}
                  </p>
                  <p v-if="Number(budget.desconto)" class="font-medium text-destructive">
                    Desconto: − {{ money(budget.desconto) }}
                  </p>
                  <p class="font-semibold">Total: {{ money(totalBudget) }}</p>
                </div>
              </div>
              <div v-if="budgetLink" class="flex items-center gap-2 rounded-lg bg-muted p-3">
                <p class="min-w-0 flex-1 break-all text-xs">{{ budgetLink }}</p>
                <Button type="button" size="sm" variant="outline" class="shrink-0" @click="copyBudgetLink"><Copy class="mr-2 h-4 w-4" />Copiar link</Button>
              </div>
            </div>
            <div v-else-if="currentBudget" class="rounded-lg border p-4">
              <p class="font-semibold">
                Versão {{ currentBudget.versao }} · {{ money(currentBudget.valorFinal) }}
              </p>
              <div
                v-if="can('ORCAMENTO') && currentBudget.enviadoEm && !currentBudget.aprovadoEm && !currentBudget.recusadoEm"
                class="mt-3 flex flex-wrap items-center gap-2"
              >
                <Button size="sm" variant="outline" @click="sendBudget">Gerar novo link de aprovação</Button>
                <Button v-if="budgetLink" type="button" size="sm" @click="copyBudgetLink"><Copy class="mr-2 h-4 w-4" />Copiar link</Button>
              </div>
              <p v-if="budgetLink" class="mt-3 break-all rounded-lg bg-muted p-3 text-xs">{{ budgetLink }}</p>
              <p class="mt-1 text-sm text-muted-foreground">
                {{
                  currentBudget.aprovadoEm
                    ? 'Aprovado'
                    : currentBudget.recusadoEm
                      ? 'Recusado'
                      : currentBudget.enviadoEm
                        ? 'Aguardando cliente'
                        : 'Rascunho'
                }}
              </p>
            </div>
            <p v-else class="text-sm text-muted-foreground">
              Nenhum orçamento criado.
            </p></CardContent
          ></Card
        >
      </div>
      <div class="space-y-6">
        <Card
          ><CardHeader
            ><CardTitle>Materiais e custos</CardTitle
            ><CardDescription
              >Consumo, devolução e custo histórico por OS.</CardDescription
            ></CardHeader
          ><CardContent class="max-h-80 space-y-3 overflow-y-auto pr-2"
            ><div
              v-for="material in order.materiais"
              :key="material.id"
              class="rounded-lg border p-3"
            >
              <p class="font-medium">
                {{ material.produto?.nome || `Produto #${material.produtoId}` }}
              </p>
              <p class="text-xs text-muted-foreground">
                Planejado: {{ material.quantidadePlanejada }} · Consumido:
                {{ material.quantidadeConsumida }} · Devolvido: {{ material.quantidadeDevolvida }} ·
                {{ material.fornecidoPeloCliente ? 'Fornecido pelo cliente' : `Valor no orçamento: ${money(material.valorUnitario)}` }} ·
                Custo interno: {{ money(material.custoSnapshot) }}
              </p>
              <div
                v-if="
                  can('PRODUCAO') && !material.fornecidoPeloCliente && material.quantidadeConsumida > material.quantidadeDevolvida
                "
                class="mt-2 flex gap-2"
              >
                <Input
                  v-model.number="returnQty[material.id]"
                  type="number"
                  min="1"
                  :max="material.quantidadeConsumida - material.quantidadeDevolvida"
                /><Button size="sm" variant="outline" @click="returnMaterial(material)"
                  >Devolver</Button
                >
              </div>
            </div>
            <p v-if="!order.materiais?.length" class="text-sm text-muted-foreground">
              Sem materiais planejados.
            </p>
            <div class="border-t pt-4">
              <p class="mb-2 text-sm font-semibold">Custo extra</p>
              <div v-if="can('PRODUCAO') && !closed" class="flex gap-2">
                <Input v-model="extra.descricao" placeholder="Descrição" /><Input
                  v-model.number="extra.valor"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-28"
                /><Button size="sm" @click="addCost">Adicionar</Button>
              </div>
              <p class="mt-2 text-sm">
                Acumulado: <strong>{{ money(order.custoExtra) }}</strong>
              </p>
            </div></CardContent
          ></Card
        >
        <Card
          ><CardHeader><CardTitle>Movimentações de estoque</CardTitle></CardHeader
          ><CardContent class="space-y-2"
            ><div
              v-for="movement in order.movimentacoes || []"
              :key="movement.id"
              class="rounded-lg border p-3 text-sm"
            >
              <p class="font-medium">
                {{ movement.tipo }} ·
                {{ movement.Produto?.nome || `Produto #${movement.produtoId}` }}
              </p>
              <p class="text-muted-foreground">
                {{ movement.quantidade }} un. ·
                {{ new Date(movement.data).toLocaleString('pt-BR') }}
              </p>
            </div>
            <p v-if="!(order.movimentacoes || []).length" class="text-sm text-muted-foreground">
              Ainda não houve movimentação.
            </p></CardContent
          ></Card
        >
        <Card
          ><CardHeader><CardTitle>Rastreabilidade</CardTitle></CardHeader
          ><CardContent class="max-h-80 space-y-3 overflow-y-auto pr-2"
            ><div
              v-for="event in order.eventos"
              :key="event.id"
              class="border-l-2 border-primary/60 pl-3"
            >
              <p class="text-sm">{{ event.descricao }}</p>
              <p class="text-xs text-muted-foreground">
                {{ new Date(event.createdAt).toLocaleString('pt-BR') }}
              </p>
            </div></CardContent
          ></Card
        >
      </div>
    </div>
  </section>
  <div v-else class="p-10 text-center text-sm text-muted-foreground">Carregando ordem…</div>
  <Teleport to="body">
    <div
      v-if="photoPreview"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      @click="photoPreview = ''"
    >
      <img
        :src="photoPreview"
        alt="Visualização da foto da peça"
        class="max-h-[95vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
        @click.stop
      />
      <button
        type="button"
        class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Fechar visualização"
        @click="photoPreview = ''"
      ><X class="h-5 w-5" /></button>
    </div>
  </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ArrowLeft, ClipboardList, Copy, Plus, Trash2, Upload, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { OuriveRepository, type OuriveCapability } from '@/repositories/ourive-repository'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { SiteRepository } from '@/repositories/site-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useConfirm } from '@/composables/useConfirm'
import { useSocketEvent } from '@/composables/useSocketEvent'
const route = useRoute()
const router = useRouter()
const toast = useToast()
const ui = useUiStore()
const order = ref<any>()
const budgetLink = ref('')
const photoPreview = ref('')
const removingPhotoId = ref<number | null>(null)
const returnQty = reactive<Record<number, number>>({})
const extra = reactive({ descricao: '', valor: 0 })
const emptyBudget = () => ({
  servicos: [{ descricao: '', quantidade: 1, valor: 0 }],
  desconto: 0,
  prazoPrevisto: null as Date | null,
  materiais: [] as Array<any>,
})
const budget = reactive<any>(emptyBudget())
const can = (capability: OuriveCapability) => ui.hasOuriveCapability(capability)
const closed = computed(() => ['ENTREGUE', 'RECUSADA', 'CANCELADA'].includes(order.value?.status))
const budgetLocked = computed(() =>
  ['PRODUCAO', 'REVISAO', 'ENTREGUE', 'RECUSADA', 'CANCELADA'].includes(order.value?.status),
)
const currentBudget = computed(() => order.value?.orcamentos?.[0])
const currentBudgetApproved = computed(() => Boolean(currentBudget.value?.aprovadoEm))
const subtotalBudget = computed(() =>
  budget.servicos.reduce(
    (total: number, item: any) => total + Number(item.quantidade || 0) * Number(item.valor || 0),
    0,
  ),
)
const materialCompanyValue = computed(() =>
  budget.materiais.reduce(
    (total: number, item: any) =>
      item.fornecidoPeloCliente
        ? total
        : total + Number(item.quantidade || 0) * Number(item.valorUnitario || 0),
    0,
  ),
)
const totalBudget = computed(() =>
  Math.max(
    0,
    subtotalBudget.value + materialCompanyValue.value - Number(budget.desconto || 0),
  ),
)
const money = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const label = (status: string) =>
  (
    ({
      RECEBIDA: 'Recebida',
      ORCAMENTO: 'Orçamento',
      PRODUCAO: 'Produção',
      REVISAO: 'Revisão',
      ENTREGUE: 'Entregue',
      RECUSADA: 'Recusada',
      CANCELADA: 'Cancelada',
    }) as Record<string, string>
  )[status] || status
const checklist = (piece: any) =>
  Array.isArray(piece.checklistRecebimento) ? piece.checklistRecebimento : []
function hydrateBudget() {
  const current = currentBudget.value
  const next = current
    ? {
        servicos: current.servicos || [],
        desconto: Number(current.desconto || 0),
        prazoPrevisto: current.prazoPrevisto ? new Date(current.prazoPrevisto) : null,
        materiais:
          order.value.materiais
            ?.filter((material: any) => !material.quantidadeConsumida)
            .map((material: any) => ({
              produtoId: material.produtoId,
              pecaId: material.pecaId || undefined,
              fornecidoPeloCliente: Boolean(material.fornecidoPeloCliente),
              custoUnitario: Number(material.custoSnapshot || 0),
              valorUnitario: Number(material.valorUnitario ?? material.custoSnapshot ?? 0),
              quantidade: material.quantidadePlanejada,
            })) || [],
      }
    : emptyBudget()
  Object.assign(budget, next)
}
async function updateMaterialCost(material: any, produtoId: number | string | null) {
  const id = Number(produtoId)
  material.produtoId = id || undefined
  if (!id) {
    material.custoUnitario = 0
    return
  }
  try {
    const response = await ProdutoVarianteRepository.get(id)
    // O select lista variantes; o custo precisa vir da mesma variante escolhida.
    if (Number(material.produtoId) !== id) return
    const produto = response?.data || response
    const custo = Number(produto?.custoMedioProducao ?? produto?.precoCompra ?? 0)
    material.custoUnitario = custo
    // O custo é interno; o orçamento parte do preço de venda da variante e pode ser
    // ajustado para a negociação específica desta OS.
    material.valorUnitario = Number(produto?.preco ?? custo)
  } catch {
    if (Number(material.produtoId) === id) {
      material.custoUnitario = 0
      material.valorUnitario = 0
    }
    toast.error('Não foi possível carregar o custo do material.')
  }
}
async function load() {
  try {
    order.value = await OuriveRepository.ordem(Number(route.params.id))
    hydrateBudget()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar a ordem.')
  }
}
useSocketEvent<{
  ordemId: number
  status: 'APROVADO' | 'RECUSADO'
  versao: number
}>('ourive:ordem-atualizada', async (event) => {
  if (event.ordemId !== Number(route.params.id)) return
  await load()
  toast.success(
    event.status === 'APROVADO'
      ? `Orçamento versão ${event.versao} aprovado pelo cliente.`
      : `Orçamento versão ${event.versao} recusado pelo cliente.`,
  )
})
async function uploadPhoto(piece: any, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const uploaded = await SiteRepository.uploadSiteImage(file)
    await OuriveRepository.adicionarFoto(piece.id, {
      url: uploaded.publicUrl || uploaded.url,
      descricao: `Foto da peça ${piece.codigoRastreio}`,
    })
    await load()
    toast.success('Foto adicionada à galeria.')
  } catch {
    toast.error('Não foi possível enviar a foto.')
  } finally {
    input.value = ''
  }
}
async function removePhoto(photo: any) {
  const confirmed = await useConfirm().confirm({
    title: 'Excluir foto',
    message: 'A foto será removida da galeria desta peça. Esta ação não pode ser desfeita.',
    confirmText: 'Excluir foto',
    colorButton: 'danger',
  })
  if (!confirmed) return
  removingPhotoId.value = photo.id
  try {
    await OuriveRepository.excluirFoto(photo.id)
    await load()
    toast.success('Foto excluída da galeria.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível excluir a foto.')
  } finally {
    removingPhotoId.value = null
  }
}
async function saveBudget() {
  if (
    !budget.servicos.length ||
    budget.servicos.some((item: any) => !item.descricao || Number(item.quantidade) < 1) ||
    budget.materiais.some((item: any) => !item.produtoId || Number(item.quantidade) < 1)
  )
    return toast.info('Complete os serviços e materiais planejados.')
  try {
    await OuriveRepository.salvarOrcamento(order.value.id, {
      ...budget,
      prazoPrevisto: budget.prazoPrevisto || undefined,
      desconto: Number(budget.desconto || 0),
      materiais: budget.materiais.map((item: any) => ({
        produtoId: Number(item.produtoId),
        pecaId: item.pecaId || undefined,
        fornecidoPeloCliente: Boolean(item.fornecidoPeloCliente),
        custoUnitario: Number(item.custoUnitario || 0),
        valorUnitario: Number(item.valorUnitario || 0),
        quantidade: Number(item.quantidade),
      })),
    })
    await load()
    toast.success('Nova versão do orçamento salva.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar o orçamento.')
  }
}
async function sendBudget() {
  try {
    const result = await OuriveRepository.enviarOrcamento(order.value.id)
    budgetLink.value = `${window.location.origin}${result.url}`
    await load()
    toast.success('Link seguro gerado.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível gerar o link.')
  }
}
async function copyBudgetLink() {
  if (!budgetLink.value) return
  try {
    await navigator.clipboard.writeText(budgetLink.value)
    toast.success('Link de aprovação copiado.')
  } catch {
    toast.error('Não foi possível copiar o link. Selecione e copie manualmente.')
  }
}
async function start() {
  try {
    await OuriveRepository.iniciarProducao(order.value.id)
    await load()
    toast.success('Produção iniciada e materiais baixados.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível iniciar a produção.')
  }
}
async function deliver() {
  try {
    await OuriveRepository.entregar(order.value.id)
    await load()
    toast.success('Entrega faturada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível faturar a entrega.')
  }
}
async function returnMaterial(material: any) {
  const quantity = Number(returnQty[material.id] || 0)
  if (!quantity) return
  try {
    await OuriveRepository.devolverMaterial(material.id, quantity)
    await load()
    toast.success('Material devolvido ao estoque.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível devolver o material.')
  }
}
async function addCost() {
  if (!extra.descricao || !extra.valor) return
  try {
    await OuriveRepository.adicionarCustoExtra(order.value.id, {
      descricao: extra.descricao,
      valor: Number(extra.valor),
    })
    extra.descricao = ''
    extra.valor = 0
    await load()
    toast.success('Custo extra registrado.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível registrar o custo.')
  }
}
async function cancel() {
  const motivo = window.prompt('Informe o motivo do cancelamento:')
  if (!motivo) return
  try {
    await OuriveRepository.cancelar(order.value.id, motivo)
    await load()
    toast.success('Ordem cancelada.')
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message ||
        'Devolva integralmente os materiais antes de cancelar.',
    )
  }
}
async function deleteOrder() {
  const confirmed = await useConfirm().confirm({
    title: 'Apagar ordem de serviço',
    message:
      'A OS, suas peças, orçamento, etapas e histórico serão apagados definitivamente. Ordens faturadas ou com estoque movimentado não podem ser apagadas.',
    confirmText: 'Apagar definitivamente',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    await OuriveRepository.excluirOrdem(order.value.id)
    toast.success('Ordem apagada com sucesso.')
    await router.push({ name: 'ourive-ordens' })
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível apagar a ordem.')
  }
}
onMounted(load)
</script>
