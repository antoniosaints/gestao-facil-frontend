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
import { Trash } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui/uiStore";
import { formatCurrencyBR } from "@/utils/formatters";

const description = ref('Preencha os campos abaixo')
const toast = useToast()
const store = useVendasStore()
const storeUi = useUiStore()

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
    <ModalView v-model:open="store.openModal" :title="store.form.id ? 'Editar item' : 'Adicionar itens'"
        :description="description" size="lg">
        <form @submit.prevent="submitFormularioVenda" class="space-y-4 px-4">
            <!-- <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6">
                    <label class="block text-sm mb-1">Cliente</label>
                    <div class="flex items-center justify-center gap-2">
                        <Select2Ajax v-model="store.form.clienteId" class="w-full" url="/clientes/select2"
                            :allow-clear="true" />
                        <button type="button" @click="storeCliente.openSave"
                            class="bg-primary px-4 py-1.5 text-white rounded-md border border-border dark:border-border-dark flex justify-center items-center">+</button>
                    </div>
                </div>

                <div class="col-span-6">
                    <label class="block text-sm mb-1">Vendedor <span class="text-red-500">*</span></label>
                    <Select2Ajax :disabled="(hasPermission(storeUi.usuarioLogged, 3) ? false : true)" required
                        v-model="store.form.vendedorId" class="w-full" url="/usuarios/select2" />
                </div>
            </div>

            <hr class="border-border dark:border-border-dark"> -->

            <!-- Adição de produtos -->
            <div class="grid grid-cols-12 gap-4 items-end">
                <div class="col-span-8 md:col-span-12">
                    <label class="block text-sm mb-1">Produto <span class="text-red-500">*</span></label>
                    <Select2Ajax v-model="addItemForm.id" v-model:label="labelProdutoInsert" class="w-full"
                        url="/produtos/select2" :params="[{ key: 'withStock', value: true }]" :allow-clear="true" />
                </div>

                <div class="col-span-4 md:col-span-4">
                    <label for="quantidade_carrinho_adicionar" class="block text-sm mb-1">Quantidade <span
                            class="text-red-500">*</span></label>
                    <NumberField v-model="addItemForm.quantidade" class="bg-card dark:bg-card-dark"
                        id="quantidade_carrinho_adicionar" :default-value="1" :min="1" :max="maxQuantidadeAdd">
                        <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput />
                            <NumberFieldIncrement />
                        </NumberFieldContent>
                    </NumberField>
                </div>

                <div class="col-span-8 md:col-span-5">
                    <label class="block text-sm mb-1">Preço <span class="text-red-500">*</span></label>
                    <Input v-model="(addItemForm.preco as number)" :disabled="!ableAdd" type="text"
                        placeholder="R$ 0,00" v-maska="moneyMaskOptions" id="input_preco_venda_formulario"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
                </div>

                <div class="col-span-4 md:col-span-3">
                    <Button type="button" :disabled="!ableAdd" @click="addToCartVendas" class="text-white w-full">
                        <i class="fa-solid fa-cart-plus"></i>
                        incluir
                    </Button>
                </div>
            </div>

            <!-- Tabela de itens -->
            <div>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium mb-2">Itens da Venda</h3>
                    <div class="flex gap-2">
                        <!-- <button :disabled="store.carrinho.length === 0" @click="store.openModalPropor = true"
                            type="button"
                            class="text-sm text-white py-1 px-2 mb-2 rounded bg-emerald-500 dark:bg-emerald-800 dark:text-gray-200 disabled:opacity-50 flex items-center">
                            <HandCoins class="mr-1 w-4 h-4" /> Propor
                        </button> -->
                        <button :disabled="store.carrinho.length === 0" @click="clearCart" type="button"
                            class="text-sm text-white py-1 px-2 mb-2 rounded bg-red-500 dark:bg-red-800 disabled:opacity-50 dark:text-gray-200 flex items-center">
                            <Trash class="mr-1 w-4 h-4" /> Limpar
                        </button>
                    </div>
                </div>
                <div class="relative overflow-x-auto rounded-sm">
                    <div class="grid grid-cols-12 gap-4">
                        <!-- Lista do carrinho -->
                        <div id="lista-carrinho-vendas" class="col-span-12 lg:col-span-12 space-y-2">
                            <div v-if="store.carrinho.length === 0"
                                class="p-3 text-center border text-gray-500 bg-white dark:bg-gray-900 rounded-md">
                                Nenhum item adicionado
                            </div>
                            <div v-else v-for="item in store.carrinho" :key="item.id"
                                class="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-2 shadow-sm">
                                <div class="flex flex-col text-sm">
                                    <span class="font-medium text-gray-800 dark:text-gray-200">{{ item.produto }}</span>
                                    <span class="text-gray-500 dark:text-gray-400">Qtd: {{ item.quantidade }}</span>
                                </div>
                                <div class="flex items-center">
                                    <div class="flex flex-col text-right text-sm">
                                        <span class="text-gray-800 text-md dark:text-gray-200">
                                            {{ formatCurrencyBR(item.subtotal) }}</span>
                                        <span class="font-medium text-xs text-gray-600 dark:text-gray-400">
                                            {{ formatCurrencyBR(item.preco) }}</span>
                                    </div>
                                    <button type="button" @click="removeFromCartVendas(item.id)"
                                        class="ml-3 text-red-900 bg-red-200 dark:text-red-100 dark:bg-red-800 p-2 rounded-sm">
                                        <Trash class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Total do carrinho -->
                        <!-- <div id="resumo-carrinho-vendas"
                            class="col-span-12 lg:col-span-4 bg-white dark:bg-gray-900 border rounded-md p-4 shadow-sm">
                            <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Resumo do pedido
                            </h3>
                            <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>Subtotal:</span>
                                <span id="subtotal-carrinho-vendas">
                                    {{ formatCurrencyBR(resumoCarrinho.subtotal || 0) }}
                                </span>
                            </div>
                            <div class="flex justify-between font-semibold text-md text-gray-700 dark:text-gray-300">
                                <span>Total:</span>
                                <span id="total-carrinho-vendas">
                                    {{ formatCurrencyBR(resumoCarrinho.total || 0) }}
                                </span>
                            </div>
                        </div> -->
                    </div>
                </div>
            </div>
            <div class="flex justify-end gap-2">
                <Button type="button" variant="secondary" @click="store.openModal = false">
                    Fechar
                </Button>
                <Button :disabled="store.carrinho.length === 0" class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>
