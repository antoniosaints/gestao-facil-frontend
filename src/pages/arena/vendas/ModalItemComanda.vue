<script setup lang="ts">
// ... (manteve-se os imports e lógica de script originais, apenas adicionei um ajuste de tratamento de erro e máscara)
import ModalView from "@/components/formulario/ModalView.vue";
import Select2Ajax from "@/components/formulario/Select2Ajax.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from "@/components/ui/number-field";
import { ProdutoRepository } from "@/repositories/produto-repository";
import { useVendasStore } from "@/stores/vendas/useVenda";
import type { FormularioVenda } from "@/types/schemas";
import http from "@/utils/axios";
import { computed, onMounted, ref, watch } from "vue";
import { POSITION, useToast } from "vue-toastification";
import { vMaska } from "maska/vue"
import { moneyMaskOptions } from "@/lib/imaska";
import { Tag, Trash, ShoppingCart, AlertTriangle, Plus, X, Receipt, Percent, DollarSign, UserPlus } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui/uiStore";
import { formatCurrencyBR } from "@/utils/formatters";
import { useClientesStore } from "@/stores/clientes/useClientes";

// ... Lógica (Mantida a mesma do seu script original para não quebrar funcionalidades)
const description = ref('Gerencie os produtos e finalize a venda')
const toast = useToast()
const store = useVendasStore()
const storeUi = useUiStore()
const storeCliente = useClientesStore()

const maxQuantidadeAdd = ref(999999);
const ableAdd = ref(true);

const labelProdutoInsert = ref<string>('')
const addItemForm = ref<{ id: number | null, preco: number | string | null, quantidade: number }>({
    id: null,
    preco: null,
    quantidade: 1
})

async function submitFormularioVenda() {
    if (store.carrinho.length === 0) {
        toast.error('Adicione pelo menos um item ao carrinho', { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
        return;
    }

    if (!store.form.clienteId) {
        toast.error('Selecione um cliente', { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
        return;
    }

    const hasId = store.form.id;

    if (resumoCarrinho.value.total <= 0) {
        toast.error('O valor total deve ser maior que zero', { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
        return;
    }

    try {
        const data = {
            id: store.form.id,
            data: new Date(),
            desconto: store.form.desconto ? getValorDesconto.value : 0,
            status: 'FINALIZADO',
            clienteId: store.form.clienteId,
            vendedorId: store.form.vendedorId || storeUi.usuarioLogged.id!,
            garantia: 0,
            observacoes: store.form.observacoes,
            itens: store.carrinho.map(item => ({ id: item.id, quantidade: item.quantidade, tipo: 'PRODUTO', preco: item.preco }))
        };
        await http.post(`vendas/criar${hasId ? `?id=${hasId}` : ''}`, data);

        toast.success(hasId ? 'Venda atualizada!' : 'Venda realizada com sucesso!');
        store.updateTable();
        store.openModal = false;
    } catch (error: any) {
        const msg = error?.response?.data?.message || 'Erro ao registrar venda';
        toast.error(msg);
    }
}

function clearCart() {
    store.carrinho = [];
}

function clearFormularioAddItem() {
    addItemForm.value.id = null;
    addItemForm.value.preco = null;
    addItemForm.value.quantidade = 1;
    labelProdutoInsert.value = '';
}

function addToCartVendas() {
    if (!addItemForm.value.id || !addItemForm.value.quantidade || !addItemForm.value.preco) {
        return toast.error('Preencha Produto, Quantidade e Preço');
    }

    const exists = store.carrinho.some(item => item.id === addItemForm.value.id);
    if (exists) return toast.error('Produto já está no carrinho.');

    const precoNumerico = typeof addItemForm.value.preco === 'string'
        ? parseFloat(addItemForm.value.preco.replace('.', '').replace(',', '.'))
        : addItemForm.value.preco;

    store.carrinho.push({
        id: addItemForm.value.id!,
        produto: labelProdutoInsert.value,
        quantidade: addItemForm.value.quantidade,
        preco: precoNumerico!,
        subtotal: +(precoNumerico! * addItemForm.value.quantidade)
    });

    maxQuantidadeAdd.value = 0;
    clearFormularioAddItem();
}

function removeFromCartVendas(produtoId: number) {
    store.carrinho = store.carrinho.filter(item => item.id !== produtoId);
}

const getValorDesconto = computed(() => {
    const subtotal = store.carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    const descontoRaw = typeof store.form.desconto === 'string'
        ? parseFloat(store.form.desconto.replace('.', '').replace(',', '.'))
        : (store.form.desconto || 0);

    return store.tipoDesconto === 'PORCENTAGEM' ? (subtotal * (descontoRaw / 100)) : descontoRaw;
});


async function getValorProduto(id: number) {
    try {
        ableAdd.value = true
        const { data } = await ProdutoRepository.get(id);
        if (data.estoque <= 0) {
            ableAdd.value = false;
            return toast.error('Sem estoque disponível');
        }
        maxQuantidadeAdd.value = data.estoque;
        addItemForm.value.preco = data.preco;
    } catch (error) {
        toast.warning('Informe o preço manualmente');
    }
}

watch(() => addItemForm.value.id, (id) => id ? getValorProduto(id) : addItemForm.value.preco = null);

const resumoCarrinho = computed(() => {
    const subtotal = store.carrinho.reduce((total, item) => total + item.subtotal, 0);
    const desconto = getValorDesconto.value;
    return { subtotal, desconto, total: Math.max(0, subtotal - desconto) };
});

onMounted(() => { store.form.vendedorId = storeUi.usuarioLogged.id || null });
</script>

<template>
    <ModalView v-model:open="store.openModal" :icon="Receipt" :title="store.form.id ? 'Editar Venda' : 'Nova Venda'"
        :description="description" size="5xl">
        <form @submit.prevent="submitFormularioVenda" class="flex flex-col h-[80vh]">

            <div class="flex-1 overflow-hidden p-4">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">

                    <!-- LADO ESQUERDO: INPUTS E LISTA (8 COLUNAS) -->
                    <div class="lg:col-span-8 flex flex-col gap-4 overflow-y-auto pr-2">

                        <!-- Card Cliente -->
                        <div
                            class="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm group transition-all hover:border-blue-400">
                            <div class="flex items-center justify-between mb-3">
                                <label
                                    class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <UserPlus class="w-4 h-4" /> Cliente Responsável
                                </label>
                            </div>
                            <div class="flex gap-2">
                                <div class="flex-1">
                                    <Select2Ajax v-model="store.form.clienteId" url="/clientes/select2"
                                        :allow-clear="true" placeholder="Pesquisar cliente..." />
                                </div>
                                <Button type="button" variant="outline" size="icon" @click="storeCliente.openSave"
                                    class="shrink-0">
                                    <Plus class="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <!-- Card Adição de Produto -->
                        <div class="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm">
                            <label
                                class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-4">
                                <ShoppingCart class="w-4 h-4" /> Adicionar Itens
                            </label>

                            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div class="md:col-span-6">
                                    <label class="text-[11px] font-semibold mb-1 block">Produto/Serviço</label>
                                    <Select2Ajax v-model="addItemForm.id" v-model:label="labelProdutoInsert"
                                        url="/produtos/select2" :params="[{ key: 'withStock', value: true }]" />
                                </div>
                                <div class="md:col-span-3">
                                    <label class="text-[11px] font-semibold mb-1 block">Quantidade</label>
                                    <NumberField v-model="addItemForm.quantidade" :min="1" :max="maxQuantidadeAdd">
                                        <NumberFieldContent>
                                            <NumberFieldDecrement />
                                            <NumberFieldInput />
                                            <NumberFieldIncrement />
                                        </NumberFieldContent>
                                    </NumberField>
                                </div>
                                <div class="md:col-span-3">
                                    <label class="text-[11px] font-semibold mb-1 block">Preço Unit.</label>
                                    <Input v-model="(addItemForm.preco as number)" :disabled="!ableAdd"
                                        v-maska="moneyMaskOptions" placeholder="R$ 0,00" />
                                </div>
                            </div>

                            <div class="mt-4 flex items-center justify-between">
                                <div v-if="!ableAdd" class="flex items-center gap-2 text-red-500 text-xs animate-pulse">
                                    <AlertTriangle class="w-4 h-4" /> Sem estoque disponível
                                </div>
                                <div v-else class="text-xs text-slate-400 italic">
                                    Máximo disponível: {{ maxQuantidadeAdd }} un.
                                </div>
                                <Button type="button" :disabled="!ableAdd || !addItemForm.id" @click="addToCartVendas"
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                    <Plus class="w-4 h-4 mr-2" /> Incluir Item
                                </Button>
                            </div>
                        </div>

                        <!-- Lista de Itens -->
                        <div
                            class="flex-1 border rounded-xl bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden flex flex-col">
                            <div class="p-3 border-b bg-white dark:bg-slate-900 flex justify-between items-center">
                                <span class="text-xs font-bold uppercase text-slate-500">Carrinho ({{
                                    store.carrinho.length }})</span>
                                <Button v-if="store.carrinho.length > 0" variant="ghost" size="sm" @click="clearCart"
                                    class="text-red-500 hover:text-red-600 h-7 text-[11px]">
                                    <Trash class="w-3 h-3 mr-1" /> Limpar Carrinho
                                </Button>
                            </div>

                            <div class="flex-1 overflow-y-auto p-4 space-y-3">
                                <div v-if="store.carrinho.length === 0"
                                    class="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 py-10">
                                    <ShoppingCart class="w-12 h-12 mb-2 stroke-[1]" />
                                    <p class="text-sm">Nenhum produto adicionado</p>
                                </div>

                                <div v-for="(item, index) in store.carrinho" :key="item.id"
                                    class="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-left-2"
                                    :style="{ animationDelay: `${index * 50}ms` }">
                                    <div class="flex-1">
                                        <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{
                                            item.produto }}</h4>
                                        <div class="flex gap-3 mt-1 text-xs text-slate-500">
                                            <span>Qtd: <b>{{ item.quantidade }}</b></span>
                                            <span>Preço: <b>{{ formatCurrencyBR(item.preco) }}</b></span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <span class="text-sm font-bold text-slate-900 dark:text-white">
                                            {{ formatCurrencyBR(item.subtotal) }}
                                        </span>
                                        <button type="button" @click="removeFromCartVendas(item.id)"
                                            class="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                                            <X class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- LADO DIREITO: RESUMO (4 COLUNAS) -->
                    <div class="lg:col-span-4 space-y-4">
                        <!-- Card Totais -->
                        <div
                            class="bg-white dark:bg-slate-900 border-2 border-slate-700 dark:border-slate-700 rounded-2xl p-4 shadow-xl relative overflow-hidden">
                            <div class="absolute top-0 right-0 p-2 opacity-5">
                                <Receipt class="w-20 h-20 rotate-12" />
                            </div>

                            <h3 class="text-sm font-black uppercase tracking-widest mb-6 pb-2 border-b">Resumo Final
                            </h3>

                            <div class="space-y-3 mb-6">
                                <div class="flex justify-between text-slate-500">
                                    <span class="text-sm font-medium">Subtotal</span>
                                    <span class="font-bold">{{ formatCurrencyBR(resumoCarrinho.subtotal) }}</span>
                                </div>

                                <!-- Input Desconto -->
                                <div class="space-y-2 pt-2">
                                    <div class="flex items-center justify-between">
                                        <label
                                            class="text-xs font-bold text-slate-500 uppercase italic">Desconto</label>
                                        <div class="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                                            <button type="button" @click="store.tipoDesconto = 'PORCENTAGEM'"
                                                :class="['px-2 py-1 text-[10px] rounded', store.tipoDesconto === 'PORCENTAGEM' ? 'bg-white dark:bg-slate-600 shadow-sm font-bold' : '']">
                                                %
                                            </button>
                                            <button type="button" @click="store.tipoDesconto = 'VALOR'"
                                                :class="['px-2 py-1 text-[10px] rounded', store.tipoDesconto === 'VALOR' ? 'bg-white dark:bg-slate-600 shadow-sm font-bold' : '']">
                                                R$
                                            </button>
                                        </div>
                                    </div>
                                    <div class="relative">
                                        <Input v-model="(store.form.desconto as string)" v-maska="moneyMaskOptions"
                                            class="h-9 pl-8 font-bold text-emerald-600 focus-visible:ring-emerald-500"
                                            placeholder="0,00" />
                                        <div class="absolute left-2.5 top-2">
                                            <Percent v-if="store.tipoDesconto === 'PORCENTAGEM'"
                                                class="w-3.5 h-3.5 text-slate-400" />
                                            <DollarSign v-else class="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                                <div class="flex justify-between items-center mb-1 text-slate-500">
                                    <span class="text-xs">Valor do Desconto</span>
                                    <span class="text-sm font-medium text-red-500">- {{
                                        formatCurrencyBR(resumoCarrinho.desconto) }}</span>
                                </div>
                                <div class="flex justify-between items-center pt-2 mt-2 border-t">
                                    <span class="text-base font-bold uppercase">Total</span>
                                    <span class="text-2xl font-black text-blue-600 dark:text-blue-400">
                                        {{ formatCurrencyBR(resumoCarrinho.total) }}
                                    </span>
                                </div>
                            </div>

                            <div class="mt-6 space-y-2">
                                <label class="text-[11px] font-bold uppercase text-slate-400 block">Observações
                                    Internas</label>
                                <textarea v-model="store.form.observacoes" rows="3"
                                    class="w-full text-sm rounded-lg border-slate-200 border-2 border-dashed dark:bg-slate-800 dark:border-slate-700 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Cliente solicitou entrega rápida..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Fixo -->
            <div class="border-t bg-slate-50 dark:bg-slate-900/50 px-6 py-4 flex justify-between items-center">
                <Button type="button" variant="secondary" @click="store.openModal = false">
                    Cancelar
                </Button>
                <div class="flex gap-3">
                    <Button :disabled="store.carrinho.length === 0" type="submit"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white text-base shadow-emerald-500/20 gap-2">
                        <Tag class="w-5 h-5" />
                        Finalizar e Registrar
                    </Button>
                </div>
            </div>
        </form>
    </ModalView>
</template>

<style scoped>
/* Transições de lista */
.animate-in {
    animation-duration: 0.3s;
    animation-fill-mode: both;
}

::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}

.dark ::-webkit-scrollbar-thumb {
    background: #1e293b;
}
</style>