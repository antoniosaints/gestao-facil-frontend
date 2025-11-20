<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BadgeCheck, BadgeDollarSign, Check, CircleDollarSign, Component, Edit, ExternalLink, FileClock, HandCoins, Link2, MoreVertical, PenLine, Plus, RotateCw, ToggleLeft, Trash, Trash2, TrendingDown, TrendingUp, Undo2 } from "lucide-vue-next"
import BadgeCell from "@/components/tabela/BadgeCell.vue"
import { useRoute } from "vue-router"
import type { CategoriaFinanceiro, ClientesFornecedores, LancamentoFinanceiro, ParcelaFinanceiro } from "@/types/schemas"
import http from "@/utils/axios"
import { useToast } from "vue-toastification"
import { formatDate } from "date-fns"
import { formatCurrencyBR, formatDateToPtBR } from "@/utils/formatters"
import { Separator } from "@/components/ui/separator"
import { LancamentosRepository } from "@/repositories/lancamento-repository"
import { useConfirm } from "@/composables/useConfirm"
import { useLancamentosStore } from "@/stores/lancamentos/useLancamentos"
import router from "@/router"
import GerarCobranca from "./modais/GerarCobranca.vue"
import ClientesModal from "@/pages/clientes/modais/ClientesModal.vue"
import FormularioEfertivar from "./modais/FormularioEfertivar.vue"
import { useUiStore } from "@/stores/ui/uiStore"
import { goBack } from "@/hooks/links"
import { useCobrancasFinanceirasStore } from "@/stores/lancamentos/useCobrancas"
import ModalParcela from "./modais/ModalParcela.vue"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const route = useRoute()
const toast = useToast()
const lancamento = ref<LancamentoFinanceiro & { categoria?: CategoriaFinanceiro, cliente?: ClientesFornecedores, parcelas: Array<ParcelaFinanceiro> }>()
const store = useLancamentosStore()
const storeCobranca = useCobrancasFinanceirasStore()
const uiStore = useUiStore()
const loading = ref(false)

interface DataLancamento {
    data: LancamentoFinanceiro & { parcelas: Array<ParcelaFinanceiro> }
}
async function getLancamento(id: number) {
    try {
        loading.value = true
        const [res] = await Promise.all([
            http.get<DataLancamento>(`/lancamentos/${id}`)
        ]);
        lancamento.value = res.data.data;
        loading.value = false
    } catch (error) {
        loading.value = false
        console.error(error);
        toast.error("Erro ao buscar o lançamento");
    }
}

const totalPago = computed(() => {
    return lancamento.value?.parcelas.filter((parcela) => parcela.pago).reduce((acc, parcela) => acc + Number(parcela.valor), 0);
})

const totalPendente = computed(() => {
    return lancamento.value?.parcelas.filter((parcela) => !parcela.pago).reduce((acc, parcela) => acc + Number(parcela.valor), 0);
})

function editarParcela(parcela: ParcelaFinanceiro) {
    store.idMutation = parcela.id!
    store.formParcela = {
        valor: parcela.valor,
        vencimento: new Date(parcela.vencimento)
    }
    store.openModalParcela = true
}

function gerarCobrancaFatura() {
    const id = Number(route.query.id);
    if (!id || isNaN(id)) {
        toast.error("ID de produto inválido");
        return;
    }
    storeCobranca.openSave()
}
function gerarCobrancaParcela(idParcela: number, valor?: number) {
    const id = Number(route.query.id);
    if (!id || isNaN(id)) {
        toast.error("ID de lançamento inválido");
        return;
    }
    storeCobranca.openSave({
        id: idParcela,
        tipo: 'parcela',
        valor
    })
}
function openLinkCobranca(link: string) {
    window.open(link, '_blank')
}

function copiarUid() {
    navigator.clipboard.writeText(lancamento.value?.Uid ?? "");
    toast.success("UID copiado para clipboard");
}

function loadLancamento() {
    const id = Number(route.query.id);
    if (!id || isNaN(id)) {
        toast.error("ID de produto inválido");
        return;
    }
    getLancamento(id);
}
async function deletar(id: number) {
    if (!id) return toast.error('ID não informado!')
    const confirm = await useConfirm().confirm({
        title: 'Excluir lançamento',
        message: 'Tem certeza que deseja excluir este lançamento?',
        confirmText: 'Sim, excluir!',
    })
    if (!confirm) return
    try {
        await LancamentosRepository.remove(id)
        store.updateTable()
        toast.success('Lançamento deletado com sucesso')
        router.back()
    } catch (error) {
        console.log(error)
        toast.error('Erro ao deletar o lançamento')
    }
}
async function efetivarParcela(id: number) {
    store.idMutation = id
    store.openModalEfetivar = true
}
async function estornarParcela(id: number) {
    try {
        await LancamentosRepository.estornarParcela(id);
        toast.success("Parcela estornada com sucesso");
        loadLancamento();
    } catch (error) {
        console.error(error);
        toast.error("Erro ao estornar a parcela");
    }
}

onMounted(loadLancamento);
watch(() => storeCobranca.filters.update, loadLancamento);
watch(() => store.filters.update, loadLancamento);

const valorTotal = computed(() => {
    return lancamento.value?.parcelas.reduce((acc, parcela) => acc + Number(parcela.valor), 0);
})
</script>

<template>
    <div class="mx-auto space-y-4">
        <!-- Card do Lançamento -->
        <div class="flex items-center justify-between flex-col md:flex-row bg-card shadow-md border rounded-md p-4">
            <h1 class="text-md md:text-lg flex items-center gap-2">
                <BadgeCell class="text-sm" :color="'green'" :label="lancamento?.tipo || 'N/A'" :capitalize="false" />
                <BadgeDollarSign class="w-6 h-6 text-emerald-600" />
                #{{ lancamento?.Uid }}
                <p class="text-sm text-muted-foreground">{{ lancamento?.vendaId ? ' (Lançamento automático)' : '' }}</p>
            </h1>
            <div class="hidden md:flex gap-2">
                <Button class="rounded-lg" @click="goBack" variant="outline">
                    <ArrowLeft class="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button :disabled="false" @click="gerarCobrancaFatura" variant="default"
                    class="text-white bg-success hover:bg-success/80 rounded-lg">
                    <CircleDollarSign /> Gerar cobrança
                </Button>
                <Button class="rounded-lg" @click="deletar(lancamento?.id!)" variant="destructive">
                    <Trash2 class="w-4 h-4" />
                </Button>
                <Button class="rounded-lg" @click="loadLancamento" variant="outline">
                    <RotateCw :class="{ 'animate-spin': loading }" />
                </Button>
            </div>
        </div>
        <Card class="rounded-md">
            <CardHeader>
                <CardTitle class="flex items-center gap-2 font-normal">
                    <BadgeDollarSign class="w-5 h-5" /> Informações do lançamento
                </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col md:grid md:grid-cols-2 gap-2">
                <div class="flex items-center gap-2"><span class="text-muted-foreground">Código:</span>
                    <div class="flex items-center gap-2">
                        {{ lancamento?.Uid || 'N/A' }}
                        <Button @click="copiarUid" variant="outline" size="xs"><i
                                class="fa-solid fa-copy fa-xs"></i></Button>
                    </div>
                </div>
                <div><span class="text-muted-foreground">Recorrência:</span>
                    <BadgeCell :color="lancamento?.recorrente ? 'purple' : 'green'" :icon="Component"
                        :label="lancamento?.recorrente ? 'Recorrente' : 'Único'" class="ml-2 text-xs"
                        :capitalize="false" />
                </div>
                <div><span class="text-muted-foreground">Categoria:</span>
                    {{ lancamento?.categoria?.nome || 'N/A' }}
                </div>
                <div><span class="text-muted-foreground">Cliente:</span>
                    {{ lancamento?.cliente?.nome || 'N/A' }}
                </div>
                <div><span class="text-muted-foreground">Valor Total:</span>
                    {{ formatCurrencyBR(valorTotal || 0) }}
                </div>
                <div><span class="text-muted-foreground">Desconto:</span>
                    {{ formatCurrencyBR(lancamento?.desconto || 0) }}
                </div>
                <div><span class="text-muted-foreground">Total pago:</span>
                    {{ formatCurrencyBR(totalPago!) }}
                </div>
                <div><span class="text-muted-foreground">Total pendente:</span>
                    {{ formatCurrencyBR(totalPendente!) }}
                </div>
                <div><span class="text-muted-foreground">Data cadastro:</span>
                    {{ lancamento?.dataLancamento ?
                        formatDateToPtBR(lancamento?.dataLancamento,
                            false) :
                        'N/A'
                    }}
                </div>
                <div><span class="text-muted-foreground">Parcelas:</span>
                    {{lancamento?.parcelas.length === 1 && !lancamento.recorrente ? 'À vista' :
                        `${lancamento?.parcelas.filter((p) => p.numero != 0).length} parcelas`}}
                </div>
                <Separator class="col-span-2" />
                <div class="col-span-2"><span class="text-muted-foreground">Descrição:</span>
                    {{ lancamento?.descricao || 'N/A' }}
                </div>
            </CardContent>
        </Card>
        <!-- Tabela de Parcelas -->
        <Card class="shadow-md rounded-md" v-if="lancamento?.parcelas.length">
            <CardHeader>
                <CardTitle class="flex items-center gap-2 font-normal justify-between">
                    <div class="flex items-center gap-2">
                        <HandCoins class="w-5 h-5" /> Fatura da lançamento
                    </div>
                    <Button disabled size="xs" class="rounded-md">
                        <Plus class="w-5 h-5 text-white" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="relative overflow-x-auto shadow-none md:shadow-md sm:rounded-lg">
                    <Table v-if="!uiStore.isMobile">
                        <TableHeader class="text-sm bg-body">
                            <TableRow>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Pagamento</TableHead>
                                <TableHead>Forma Pg.</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead class="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody class="bg-body/30">
                            <TableRow v-for="p in lancamento?.parcelas" :key="p.numero">
                                <TableCell>
                                    <span
                                        class="font-normal px-2 py-1.5 text-nowrap bg-primary text-sm text-white rounded-lg">
                                        {{ p.numero === 1 && lancamento.parcelas.length === 1 ? "À vista" : p.numero ===
                                            0 ? "Entrada" : `Parcela ${p.numero}` }}
                                    </span>
                                </TableCell>
                                <TableCell>{{ p.vencimento ? formatDate(p.vencimento, "dd/MM/yyyy") : "-" }}</TableCell>
                                <TableCell>{{ formatCurrencyBR(p.valor) }}</TableCell>
                                <TableCell>{{ p.dataPagamento ? formatDate(p.dataPagamento, "dd/MM/yyyy") : "-" }}
                                </TableCell>
                                <TableCell>
                                    <BadgeCell color="gray" :label="p.formaPagamento || '-'" class="text-sm" />
                                </TableCell>
                                <TableCell>
                                    <Badge class="text-white px-2 py-1 rounded-lg text-sm font-normal"
                                        :variant="p.pago ? 'default' : 'destructive'">
                                        <ToggleLeft class="w-4 h-4 mr-1" />
                                        {{ p.pago ? "Pago" : "Pendente" }}
                                    </Badge>
                                </TableCell>
                                <TableCell class="flex justify-end">
                                    <div class="flex items-center gap-2">
                                        <Button @click="editarParcela(p)" variant="outline"
                                            class="h-8 p-0 px-2 bg-secondary hover:bg-secondary/80">
                                            <PenLine class="w-4 h-4" />
                                        </Button>
                                        <Button v-if="!p.pago && !p.CobrancasFinanceiras?.length"
                                            @click="gerarCobrancaParcela(p.id!, p.valor)" variant="default"
                                            class="h-8 p-0 px-2 bg-success hover:bg-success/80 text-white">
                                            <CircleDollarSign class="w-4 h-4" />
                                        </Button>
                                        <Button v-if="p.CobrancasFinanceiras?.length"
                                            @click="openLinkCobranca(p.CobrancasFinanceiras[0].externalLink!)"
                                            variant="outline" class="h-8 p-0 text-white px-2 bg-info hover:bg-info/80">
                                            <ExternalLink class="w-4 h-4" />
                                        </Button>
                                        <Button v-if="!p.pago" :disabled="lancamento.vendaId"
                                            @click="efetivarParcela(p.id!)" variant="default"
                                            class="w-8 h-8 p-0 text-white">
                                            <BadgeCheck class="w-4 h-4" />
                                        </Button>
                                        <Button v-if="p.pago" :disabled="lancamento.vendaId"
                                            @click="estornarParcela(p.id!)" variant="default"
                                            class="w-8 h-8 p-0 bg-warning hover:bg-warning/80 text-white">
                                            <Undo2 class="w-4 h-4" />
                                        </Button>
                                        <Button v-if="!p.pago" disabled @click="estornarParcela(p.id!)"
                                            variant="default"
                                            class="w-8 h-8 p-0 bg-danger hover:bg-danger/80 text-white">
                                            <Trash class="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <div v-else class="grid gap-1 pl-0 md:pl-14">
                        <div v-for="item in lancamento.parcelas" :key="item.id"
                            class="group relative bg-white dark:bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between overflow-hidden">

                            <!-- Left Border Indicator -->
                            <div :class="[
                                'absolute left-0 top-0 bottom-0 w-1',
                                lancamento.tipo === 'RECEITA' ? 'bg-emerald-500' : 'bg-rose-500'
                            ]"></div>

                            <div class="flex items-center gap-4 overflow-hidden">
                                <!-- Icon/Category -->
                                <div :class="[
                                    'flex-shrink-0 w-10 h-10 rounded-full items-center justify-center hidden md:flex',
                                    lancamento.tipo === 'RECEITA' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'
                                ]">
                                    <TrendingUp v-if="lancamento.tipo === 'RECEITA'" class="w-5 h-5" />
                                    <TrendingDown v-else class="w-5 h-5" />
                                </div>

                                <!-- Details -->
                                <div class="flex flex-col min-w-0">
                                    <span class="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                                        {{ item.numero === 1 && lancamento.parcelas.length === 1 ? "À vista" :
                                            item.numero ===
                                                0 ? "Entrada" : `Parcela ${item.numero}` }}
                                    </span>
                                    <span class="text-xs text-muted-foreground truncate">
                                        {{ item.vencimento ? formatDate(item.vencimento, "dd/MM/yyyy") : "-" }}
                                    </span>
                                </div>
                            </div>

                            <!-- Right Side -->
                            <div class="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-4">
                                <div class="flex flex-col items-end">
                                    <span :class="[
                                        'text-xs',
                                        lancamento.tipo === 'RECEITA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    ]">
                                        {{ lancamento.tipo === 'DESPESA' ? '-' : '+' }}{{ formatCurrencyBR(item.valor)
                                        }}
                                    </span>
                                    <Badge :variant="lancamento.status === 'PAGO' ? 'default' : 'outline'" :class="[
                                        'text-[10px] px-1.5 py-0 h-5 text-normal border-none',
                                        item.pago
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                                            : 'text-yellow-600 border-yellow-200 dark:text-yellow-500'
                                    ]">
                                        {{ item.pago ? 'Pago' : 'Pendente' }}
                                    </Badge>
                                </div>

                                <!-- Actions Menu -->
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="outline" size="icon"
                                            class="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <MoreVertical class="w-4 h-4 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" class="w-40">
                                        <DropdownMenuItem @click="editarParcela(item)">
                                            <Edit class="w-4 h-4 mr-2" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-if="!item.pago" @click="efetivarParcela(item.id!)">
                                            <Check class="w-4 h-4 mr-2" />
                                            {{ lancamento.tipo === 'RECEITA' ? 'Receber' : 'Pagar' }}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-if="item.pago" :disabled="lancamento.vendaId != undefined"
                                            @click="estornarParcela(item.id!)">
                                            <Undo2 class="w-4 h-4 mr-2" />
                                            Estornar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-if="!item.pago && !item.CobrancasFinanceiras?.length"
                                            @click="gerarCobrancaParcela(item.id!, item.valor)">
                                            <CircleDollarSign class="w-4 h-4 mr-2" />
                                            Gerar cobrança
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-if="item.CobrancasFinanceiras?.length"
                                            @click="openLinkCobranca(item.CobrancasFinanceiras[0].externalLink!)">
                                            <Link2 class="w-4 h-4 mr-2" />
                                            Abrir cobrança
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        <nav v-if="uiStore.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <button type="button" @click="gerarCobrancaFatura"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <CircleDollarSign />
                <span class="text-xs">Cobrança</span>
            </button>
            <button type="button" @click="goBack"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Undo2 />
                <span class="text-xs">Voltar</span>
            </button>
        </nav>
        <GerarCobranca />
        <ClientesModal />
        <ModalParcela />
        <FormularioEfertivar @success="loadLancamento" />
    </div>
</template>
