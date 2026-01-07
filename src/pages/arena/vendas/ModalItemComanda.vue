<script setup lang="ts">
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
import { Tag, Trash, ShoppingCart, AlertTriangle, Plus, X } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui/uiStore";
import { formatCurrencyBR } from "@/utils/formatters";
import { useClientesStore } from "@/stores/clientes/useClientes";
import { hasPermission } from "@/hooks/authorize";

const description = ref('Preencha os campos abaixo')
const toast = useToast()
const store = useVendasStore()
const storeUi = useUiStore()
const storeCliente = useClientesStore()

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
        toast.error('O valor total dos ítens deve ser maior que zero', { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
        return;
    }

    try {
        const data: FormularioVenda & { itens: { id: number, quantidade: number, tipo: 'SERVICO' | 'PRODUTO', preco: number }[] } = {
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

        if (hasId) {
            toast.success('Ítens atualizados!');
        } else {
            toast.success('Ítens adicionados!');
        }

        store.updateTable();
        store.openModal = false;
    } catch (error: any) {
        console.log(error);
        const msg = error?.response?.data?.message || 'Ocorreu um erro ao registrar os ítens';
        toast.error(msg, { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
    }
}

function clearCart() {
    store.carrinho = [];
    localStorage.setItem('gestao_facil:cartVendas', JSON.stringify(store.carrinho));
}

function clearFormularioAddItem() {
    addItemForm.value.id = null;
    addItemForm.value.preco = null;
    addItemForm.value.quantidade = 1;
}

function addToCartVendas() {
    if (!addItemForm.value.id || !addItemForm.value.quantidade || !addItemForm.value.preco) {
        return toast.error('Preencha todos os campos (Produto, Quantidade e Preço)');
    }

    // Verifica se o produto já foi adicionado
    const exists = store.carrinho.some(item => item.id === addItemForm.value.id);
    if (exists) {
        return toast.error('Este produto já está na lista.');
    }

    const newItem = {
        id: addItemForm.value.id,
        produto: labelProdutoInsert.value,
        quantidade: addItemForm.value.quantidade,
        preco: parseFloat(String(addItemForm.value.preco).replace(',', '.')),
        subtotal: +(parseFloat(String(addItemForm.value.preco).replace(',', '.')) * addItemForm.value.quantidade)
    };

    store.carrinho.push(newItem);
    localStorage.setItem('gestao_facil:cartVendas', JSON.stringify(store.carrinho));

    clearFormularioAddItem();
}


function removeFromCartVendas(produtoId: number) {
    const novoCarrinho = store.carrinho.filter(item => Number(item.id) !== Number(produtoId));

    store.carrinho = novoCarrinho;
    localStorage.setItem('gestao_facil:cartVendas', JSON.stringify(novoCarrinho));
}

function calculateTotalCartVendas() {
    const total = store.carrinho.reduce((sum, item) => {
        return sum + item.subtotal;
    }, 0);

    return total.toFixed(2);
}

function clearCartVendas() {
    localStorage.removeItem('gestao_facil:cartVendas');
    store.carrinho = [];
}

const getValorDesconto = computed(() => {
    if (store.carrinho.length === 0) return 0;

    const subtotalValue = store.carrinho.reduce((total, item) => {
        // substitui vírgula por ponto para parseFloat funcionar corretamente
        const preco = item.preco;
        return total + preco * item.quantidade;
    }, 0);

    const descontoRaw = parseFloat(String(store.form.desconto).replace(',', '.')) || 0;

    if (store.tipoDesconto === 'PORCENTAGEM') {
        return subtotalValue * (descontoRaw / 100);
    } else {
        return descontoRaw;
    }
});

const maxQuantidadeAdd = ref(999999999999999);
const ableAdd = ref(true);
async function getValorProduto(id: number) {
    try {
        ableAdd.value = true
        const { data } = await ProdutoRepository.get(id);
        if (data.estoque <= 0) {
            addItemForm.value.preco = null;
            addItemForm.value.id = null;
            maxQuantidadeAdd.value = 1
            ableAdd.value = false
            return toast.error('Produto sem estoque disponível', {
                timeout: 3000,
                position: POSITION.BOTTOM_RIGHT
            });
        }

        if (data.estoque <= data.minimo) {
            toast.warning('Produto com estoque baixo, por favor, verificar o estoque antes de adicionar ao carrinho', { timeout: 3000 });
        }

        addItemForm.value.quantidade = 1
        maxQuantidadeAdd.value = data.estoque

        addItemForm.value.preco = data.preco;
    } catch (error) {
        addItemForm.value.preco = null;
        toast.warning('Erro ao buscar o produto, informe o preço manualmente', {
            timeout: 3000
        });
    }
}

watch(() => addItemForm.value.id, (id) => {
    if (id) {
        getValorProduto(id);
    } else {
        addItemForm.value.preco = null
    }
})

const resumoCarrinho = computed(() => {
    const subtotal = store.carrinho.reduce((total, item) => total + item.subtotal, 0);
    const desconto = getValorDesconto.value;
    return {
        subtotal,
        desconto,
        total: (subtotal - desconto)
    };
});

clearCartVendas();
onMounted(() => {
    store.form.vendedorId = storeUi.usuarioLogged.id || null
})
</script>

<template>
    <ModalView v-model:open="store.openModal" :icon="Tag" :title="store.form.id ? 'Editar comanda' : 'Nova comanda'"
        :description="description" size="5xl">
        <form @submit.prevent="submitFormularioVenda" class="h-full flex flex-col">
            <div class="flex-1 overflow-y-auto px-4 pb-4">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <!-- Coluna Principal: Formulário e Produtos -->
                    <div class="lg:col-span-2 space-y-4">
                        <!-- Seção Cliente -->
                        <div
                            class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 rounded-xl p-5 border border-blue-200 dark:border-gray-700 shadow-sm">
                            <h3
                                class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Informações do Cliente
                            </h3>
                            <div class="flex items-end gap-3">
                                <div class="flex-1">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cliente <span class="text-red-500">*</span>
                                    </label>
                                    <Select2Ajax v-model="store.form.clienteId" class="w-full" url="/clientes/select2"
                                        :allow-clear="true" />
                                </div>
                                <button type="button" @click="storeCliente.openSave"
                                    class="hover:bg-blue-700 text-blue-700 hover:text-white transition-colors px-4 py-2 rounded-lg border border-blue-700 shadow-sm flex items-center gap-2 font-medium">
                                    <Plus class="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <!-- Seção Adicionar Produto -->
                        <div
                            class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3
                                class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <ShoppingCart class="w-4 h-4 text-emerald-600" />
                                Adicionar Produto
                            </h3>

                            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div class="md:col-span-12">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Produto <span class="text-red-500">*</span>
                                    </label>
                                    <Select2Ajax v-model="addItemForm.id" v-model:label="labelProdutoInsert"
                                        class="w-full" url="/produtos/select2"
                                        :params="[{ key: 'withStock', value: true }]" :allow-clear="true" />
                                </div>

                                <div class="md:col-span-4">
                                    <label for="quantidade_carrinho_adicionar"
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Quantidade <span class="text-red-500">*</span>
                                    </label>
                                    <NumberField v-model="addItemForm.quantidade" class="bg-card dark:bg-card-dark"
                                        id="quantidade_carrinho_adicionar" :default-value="1" :min="1"
                                        :max="maxQuantidadeAdd">
                                        <NumberFieldContent>
                                            <NumberFieldDecrement />
                                            <NumberFieldInput />
                                            <NumberFieldIncrement />
                                        </NumberFieldContent>
                                    </NumberField>
                                </div>

                                <div class="md:col-span-5">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Preço Unitário <span class="text-red-500">*</span>
                                    </label>
                                    <Input v-model="(addItemForm.preco as number)" :disabled="!ableAdd" type="text"
                                        placeholder="R$ 0,00" v-maska="moneyMaskOptions"
                                        id="input_preco_venda_formulario" class="w-full" />
                                </div>

                                <div class="md:col-span-3 flex items-end">
                                    <Button type="button" :disabled="!ableAdd" @click="addToCartVendas"
                                        class="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                        <Plus class="w-4 h-4" />
                                        Incluir
                                    </Button>
                                </div>
                            </div>

                            <div v-if="!ableAdd"
                                class="mt-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                                <AlertTriangle class="w-4 h-4 flex-shrink-0" />
                                <span>Produto sem estoque disponível</span>
                            </div>
                        </div>

                        <!-- Lista de Produtos -->
                        <div
                            class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div
                                class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3
                                    class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    Itens da Comanda
                                    <span
                                        class="ml-2 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">
                                        {{ store.carrinho.length }}
                                    </span>
                                </h3>
                                <button v-if="store.carrinho.length > 0" :disabled="store.carrinho.length === 0"
                                    @click="clearCart" type="button"
                                    class="text-xs text-red-600 border hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-900/20 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium">
                                    <Trash class="w-3.5 h-3.5" />
                                    Limpar Tudo
                                </button>
                            </div>

                            <div class="p-4 max-h-96 overflow-y-auto">
                                <div v-if="store.carrinho.length === 0"
                                    class="py-12 text-center text-gray-500 dark:text-gray-400">
                                    <ShoppingCart class="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p class="text-sm font-medium">Nenhum item adicionado</p>
                                    <p class="text-xs mt-1">Comece selecionando um produto acima</p>
                                </div>

                                <div v-else class="space-y-2">
                                    <div v-for="(item, index) in store.carrinho" :key="item.id"
                                        class="group flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all duration-200 hover:shadow-md"
                                        :style="{ animationDelay: `${index * 50}ms` }">
                                        <div class="flex-1 min-w-0">
                                            <p class="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                                {{ item.produto }}
                                            </p>
                                            <div class="flex items-center gap-3 mt-1">
                                                <span
                                                    class="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-0.5 rounded">
                                                    Qtd: {{ item.quantidade }}
                                                </span>
                                                <span class="text-xs text-gray-600 dark:text-gray-400">
                                                    {{ formatCurrencyBR(item.preco) }} un.
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-3 ml-4">
                                            <span
                                                class="text-base font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                {{ formatCurrencyBR(item.subtotal) }}
                                            </span>
                                            <button type="button" @click="removeFromCartVendas(item.id)"
                                                class="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50">
                                                <X class="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coluna Lateral: Resumo -->
                    <div class="lg:col-span-1">
                        <div class="sticky">
                            <div
                                class="border-2 bg-card border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
                                <div class="p-5">
                                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        Resumo da Venda
                                    </h3>

                                    <div class="mb-4">
                                        <div class="flex justify-between items-center/90">
                                            <span class="text-sm">Subtotal</span>
                                            <span class="text-base font-semibold">
                                                {{ formatCurrencyBR(resumoCarrinho.subtotal || 0) }}
                                            </span>
                                        </div>

                                        <div class="border-t border-white/20 pt-3">
                                            <div class="flex justify-between items-center">
                                                <span class="text-base font-semibold">Total</span>
                                                <span class="text-2xl font-bold">
                                                    {{ formatCurrencyBR(resumoCarrinho.total || 0) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="bg-muted backdrop-blur-sm rounded-lg p-3 mt-4">
                                        <div class="flex items-center justify-between text-xs mb-1">
                                            <span>Itens no carrinho</span>
                                            <span class="font-semibold">{{ store.carrinho.length }}</span>
                                        </div>
                                        <div class="flex items-center justify-between text-xs">
                                            <span>Produtos</span>
                                            <span class="font-semibold">{{store.carrinho.reduce((acc, item) => acc +
                                                item.quantidade, 0)}}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="border-t px-6 py-4 flex justify-end gap-3">
                <Button type="button" variant="secondary" @click="store.openModal = false" class="min-w-24">
                    Cancelar
                </Button>
                <Button :disabled="store.carrinho.length === 0"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32 gap-2 font-semibold" type="submit">
                    <Tag class="w-4 h-4" />
                    Registrar Venda
                </Button>
            </div>
        </form>
    </ModalView>
</template>

<style scoped>
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.space-y-2>div {
    animation: slideIn 0.3s ease-out forwards;
    opacity: 0;
}
</style>