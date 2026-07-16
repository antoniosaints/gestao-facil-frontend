<template>
    <ModalView v-model:open="store.openModalDetalhes" title="Detalhes da venda" description="Informações da venda"
        size="2xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 overflow-auto">
            <div>
                <label class="block text-sm font-medium">ID Venda</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.Uid || '-' }}
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium">Valor Total</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.valor ? formatCurrencyBR(Number(store.venda?.valor)) : '-' }}
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium">Cliente</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.cliente ? store.venda.cliente.nome : '-' }}
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium">Vendedor</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.vendedor ? store.venda.vendedor.nome : '-' }}
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium">Forma de Pagamento</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.PagamentoVendas ? store.venda.PagamentoVendas.metodo : '-' }}
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium">Situação</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.status || '-' }}
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium">Garantia</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.garantia }} dias - {{ addDays(store.venda?.data!,
                        store.venda?.garantia!).toLocaleDateString('pt-BR') }}
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium">Data da venda</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.data ? new Date(store.venda?.data).toLocaleDateString('pt-BR') : '-' }}
                </p>
            </div>
            <div class="col-span-2">
                <label class="block text-sm font-medium">Observações</label>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ store.venda?.observacoes || '-' }}
                </p>
            </div>
            <div v-if="!store.venda?.CobrancasFinanceiras?.length" class="col-span-2 flex flex-col gap-2">
                <hr class="col-span-2">
                <label class="text-md">Cobranças</label>
                <div
                    class="grid grid-cols-1 gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 px-4 rounded-lg shadow-sm col-span-2">
                    <div class="flex gap-2 items-center justify-between">
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Nenhuma cobrança
                            encontrada</span>
                        <p v-if="uiStore.canCreateCharge" @click="storeCobranca.openSave({
                            id: store.venda?.id!,
                            tipo: 'venda',
                            valor: store.venda?.valor
                        })"
                            class="text-sm font-medium cursor-pointer bg-green-100 rounded-md border dark:bg-green-900 px-3 py-1 text-green-800 dark:text-green-200">
                            Gerar cobrança
                        </p>
                    </div>
                </div>
            </div>
            <div v-if="store.venda?.CobrancasFinanceiras?.length" class="col-span-2 flex flex-col gap-2">
                <hr class="col-span-2">
                <label class="text-md">Cobranças</label>
                <div
                    class="grid grid-cols-1 gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 px-4 rounded-lg shadow-sm col-span-2">
                    <div class="grid grid-cols-4 gap-2">
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Valor</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Gateway</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Status</span>
                        </div>
                        <div class="flex flex-col text-right">
                            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Ação</span>
                        </div>
                    </div>
                    <div v-for="row in store.venda?.CobrancasFinanceiras"
                        class="grid grid-cols-4 gap-2 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex flex-col">
                            <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                {{ formatCurrencyBR(row.valor!) }}
                            </span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                {{ row.gateway }}
                            </span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                {{ row.status }}
                            </span>
                        </div>
                        <div class="flex flex-col text-right">
                            <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                <a :href="row.externalLink!" target="_blank"
                                    class="text-blue-600 dark:text-blue-400">Visualizar</a>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="lancamentosFinanceiros.length" class="col-span-2 flex flex-col gap-2">
                <hr class="col-span-2">
                <label class="text-md">Lançamentos financeiros</label>
                <div
                    class="grid grid-cols-1 gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 p-2 px-4 rounded-lg shadow-sm col-span-2">
                    <div v-for="lancamento in lancamentosFinanceiros" :key="lancamento.id"
                        class="border-b border-orange-200/70 pb-2 last:border-b-0 last:pb-0">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {{ lancamento.descricao || `Lançamento #${lancamento.id}` }}
                            </span>
                            <span class="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                {{ formatCurrencyBR(Number(lancamento.valorTotal || 0)) }}
                            </span>
                            <Button type="button" size="sm" variant="destructive"
                                @click="excluirLancamentoFinanceiro(lancamento.id)">
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                        <div class="mt-1 grid gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <div v-for="parcela in getParcelasPendentes(lancamento)" :key="parcela.id"
                                class="flex justify-between gap-2">
                                <span>Parcela {{ parcela.numero }} - vence {{ formatDate(parcela.vencimento) }}</span>
                                <span>{{ formatCurrencyBR(Number(parcela.valor || 0)) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="store.venda?.ItensVendas.length" class="col-span-2 flex flex-col gap-2">
                <hr class="col-span-2">
                <label class="text-md">Itens da venda</label>
                <div class="space-y-2">
                    <div
                        class="grid grid-cols-1 gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 px-4 rounded-lg shadow-sm">
                        <div class="grid grid-cols-4 gap-2">
                            <div class="flex flex-col col-span-2">
                                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Produto</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Resumo</span>
                            </div>
                            <div class="flex flex-col text-right">
                                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Total</span>
                            </div>
                        </div>
                        <div v-for="item in store.venda?.ItensVendas"
                            class="grid grid-cols-4 gap-2 border-t pt-0.5 border-gray-300 dark:border-gray-600">
                            <div class="flex flex-col col-span-2">
                                <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                    {{ item.produto?.nome || item.servico?.nome || item.itemName || 'Item' }}
                                </span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                    {{ item.quantidade }} X {{ formatCurrencyBR(Number(item.valor)) }}
                                </span>
                            </div>
                            <div class="flex flex-col text-right">
                                <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                    {{ formatCurrencyBR(item.quantidade * Number(item.valor)) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <div
                        class="grid grid-cols-4 gap-2 bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-2 px-4 rounded-lg shadow-sm">
                        <div class="flex flex-col col-span-2">
                            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Subtotal</span>
                            <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                {{ formatCurrencyBR(subtotal!) }}
                            </span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Desconto</span>
                            <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                {{ formatCurrencyBR(store.venda?.desconto || 0) }}
                            </span>
                        </div>
                        <div class="flex flex-col text-right">
                            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Total</span>
                            <span class="text-gray-600 text-xs md:text-sm dark:text-gray-400">
                                {{ formatCurrencyBR(total || 0) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex justify-end gap-2 px-4 mt-2">
            <Button type="button" variant="secondary" class="text-white bg-orange-500 hover:bg-orange-600"
                @click.prevent="gerarCupomVenda(store.idMutation!)">
                <FileText />
                Cupom
            </Button>
            <Button type="button" variant="secondary" @click="store.openModalDetalhes = false">
                Fechar
            </Button>
        </div>
    </ModalView>
</template>

<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import { useVendasStore } from '@/stores/vendas/useVenda';
import { formatCurrencyBR } from '@/utils/formatters';
import { addDays } from 'date-fns';
import { FileText, Trash2 } from 'lucide-vue-next';
import { computed, watch } from 'vue';
import { gerarCupomVenda } from '../ActionsVendas';
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas';
import { useUiStore } from '@/stores/ui/uiStore';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from 'vue-toastification';
const store = useVendasStore()
const storeCobranca = useCobrancasFinanceirasStore()
const uiStore = useUiStore()
const toast = useToast()
const subtotal = computed(() => {
    return store.venda?.ItensVendas.reduce((acc, item) => acc + item.quantidade * item.valor, 0)
})

const lancamentosFinanceiros = computed(() => store.venda?.LancamentoFinanceiro || [])

function getParcelasPendentes(lancamento: any) {
    const parcelas = Array.isArray(lancamento.parcelas) ? lancamento.parcelas : []
    const pendentes = parcelas.filter((parcela: any) => !parcela.pago)
    return pendentes.length ? pendentes : parcelas
}

function formatDate(value: Date | string | null | undefined) {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR')
}

async function excluirLancamentoFinanceiro(id?: number) {
    if (!id) return

    const confirm = await useConfirm().confirm({
        title: 'Excluir lançamento financeiro',
        message: 'Deseja excluir o lançamento financeiro vinculado a esta venda?',
        confirmText: 'Sim, excluir',
    })

    if (!confirm) return

    try {
        await LancamentosRepository.remove(id)
        toast.success('Lançamento financeiro excluí­do com sucesso')
        store.updateTable()
        if (store.idMutation) {
            await store.openDetalhes(store.idMutation)
        }
    } catch (error: any) {
        console.error(error)
        toast.error(error?.response?.data?.message || 'Erro ao excluir o lançamento financeiro')
    }
}

const total = computed(() => {
    return subtotal.value! - store.venda?.desconto!
})

watch(() => storeCobranca.filters.update, () => store.openDetalhes(store.idMutation!));

</script>
