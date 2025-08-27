<script setup lang="ts">
import ModalView from "@/components/formulario/ModalView.vue";
import Select2Ajax from "@/components/formulario/Select2Ajax.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from "@/components/ui/number-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import http from "@/utils/axios";
import { colorTheme } from "@/utils/theme";
import { id, ptBR } from "date-fns/locale";
import { ref } from "vue";
import { useToast } from "vue-toastification";

const title = ref('Cadastro de venda')
const description = ref('Preencha os campos abaixo')
const toast = useToast()

interface CarrinhoItem {
    id: number;
    produto: string;
    quantidade: number;
    preco: number;
    subtotal: number;
}

const carrinho = ref<CarrinhoItem[]>(localStorage.getItem('gestao_facil:cartVendas') ? JSON.parse(localStorage.getItem('gestao_facil:cartVendas') as string) : [])

const formularioVenda = ref({
    id: null,
    vendedorId: null,
    clienteId: null,
    dataVenda: null,
    tipoDesconto: 'PORCENTAGEM',
    desconto: 0,
    valorTotal: 0,
    garantia: '',
    observacoes: '',
    itens: []
})

const addItemForm = ref<{ id: number | null, preco: number | null, quantidade: number }>({
    id: null,
    preco: null,
    quantidade: 1
})

const propostaPreco = ref<string | null>('')

const open = defineModel({ default: false })

const dataVenda = ref(new Date())


function getValorTotalCarrinho() {
    return carrinho.value.reduce((total, item) => total + item.subtotal, 0);
}

function proporValorVendaCliente(valorProposto: number) {
    if (!valorProposto) return;

    const valorCarrinho = parseFloat(String(getValorTotalCarrinho())) || 0; // subtotal
    const valorPropostoNum = parseFloat(String(valorProposto)) || 0;

    // Se o valor proposto for maior ou igual ao subtotal, desconto = 0
    if (valorPropostoNum >= valorCarrinho) {
        formularioVenda.value.desconto = 0;
        atualizarTabelaCart();
        return;
    }
    formularioVenda.value.tipoDesconto = 'VALOR';

    // Desconto necessário para chegar no valor desejado
    const valorDescontoNovo = valorCarrinho - valorPropostoNum;
    formularioVenda.value.desconto = valorDescontoNovo;
    atualizarTabelaCart();
}

function definirValorProporcionalVenda() {
    const valorTratado = propostaPreco.value ? parseFloat(propostaPreco.value.replace(',', '.')) : 0;
    proporValorVendaCliente(valorTratado);
    propostaPreco.value = null;
}

function setCartFromVendaRealizada(venda: { ItensVendas: any[] }) {
    venda.ItensVendas.forEach(item => {
        const newItem = {
            id: item.id,
            produto: item.produto.nome,
            quantidade: item.quantidade,
            preco: parseFloat(item.valor.replace(',', '.')),
            subtotal: parseFloat(item.valor.replace(',', '.')) * item.quantidade
        };
        carrinho.value.push(newItem);
    })

    localStorage.setItem('gestao_facil:cartVendas', JSON.stringify(carrinho.value));
    atualizarTabelaCart();
}

async function loadVendaEdicao() {
    try {
        if (formularioVenda.value.id) {
            const data = await http.get("/vendas/" + formularioVenda.value.id)
            formularioVenda.value = data.data;
        }
    } catch (error) {
        console.log(error);
    }
}

loadVendaEdicao();

// $("#formulario_cadastro_venda").submit((e) => {
//     e.preventDefault();

//     const cart = localStorage.getItem('gestao_facil:cartVendas');
//     const cartItems = cart ? JSON.parse(cart) : [];

//     if (cartItems.length === 0) {
//         Swal.fire({
//             icon: "error",
//             title: "Erro!",
//             text: "Nenhum item adicionado na venda",
//             confirmButtonText: "Ok",
//         });
//         return;
//     }

//     const data = {
//         clienteId: $('#select_cliente_venda_formulario').val(),
//         data: $('#input_data_venda_formulario').val(),
//         vendedorId: $('#select_vendedor_venda_formulario').val(),
//         status: $('#select_status_venda_formulario').val(),
//         garantia: $('#input_garantia_venda_formulario').val(),
//         observacoes: $('#input_observacoes_venda_formulario').val(),
//         desconto: getValorDesconto(),
//         id: $("#input_id_venda_formulario").val(),
//         itens: cartItems.map(item => (
//             {
//                 id: item.id,
//                 quantidade: item.quantidade,
//                 preco: item.preco
//             }
//         ))
//     };
//     const hasId = $("#input_id_venda_formulario").val();
//     $.ajax({
//         url: `/api/vendas/criar${hasId ? `?id=${hasId}` : ''}`,
//         method: 'POST',
//         data: data,
//         dataType: 'json',
//         headers: {
//             'Authorization': `Bearer ${localStorage.getItem('gestao_facil:token')}`
//         },
//         success: function (data) {
//             showNotification('Venda salva com sucesso!', 'success');
//             loadPage('/vendas/resumo');
//         },
//         error: function (xhr, status, error) {
//             console.log(xhr);
//             const mensagem =
//                 xhr.responseJSON?.message || "Erro inesperado na requisição";
//             showNotification(mensagem, 'error');
//         }
//     });
// });


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
    const exists = carrinho.value.some(item => item.id === addItemForm.value.id);
    if (exists) {
        return toast.error('Este produto já está na lista.');
    }

    const newItem = {
        id: addItemForm.value.id,
        produto: "Produto " + addItemForm.value.id,
        quantidade: addItemForm.value.quantidade,
        preco: addItemForm.value.preco,
        subtotal: +(addItemForm.value.preco * addItemForm.value.quantidade)
    };

    carrinho.value.push(newItem);
    localStorage.setItem('gestao_facil:cartVendas', JSON.stringify(carrinho.value));

    atualizarTabelaCart();
    clearFormularioAddItem();
}


function removeFromCartVendas(produtoId: number) {
    const novoCarrinho = carrinho.value.filter(item => Number(item.id) !== Number(produtoId));

    carrinho.value = novoCarrinho;
    localStorage.setItem('gestao_facil:cartVendas', JSON.stringify(novoCarrinho));
    atualizarTabelaCart();
}

function calculateTotalCartVendas() {
    const cart = localStorage.getItem('gestao_facil:cartVendas');
    const cartItems: CarrinhoItem[] = cart ? JSON.parse(cart) : [];

    const total = cartItems.reduce((sum, item) => {
        return sum + item.subtotal;
    }, 0);

    return total.toFixed(2);
}

function clearCartVendas() {
    localStorage.removeItem('gestao_facil:cartVendas');
    atualizarTabelaCart();
}

function getValorDesconto() {
    let descontoTotal = 0;

    if (carrinho.value.length === 0) {
        return descontoTotal;
    }

    const subtotalValue = carrinho.value.reduce((total, item) => total + (item.preco * item.quantidade), 0);

    if (formularioVenda.value.desconto && !isNaN(formularioVenda.value.desconto)) {
        if (formularioVenda.value.tipoDesconto === 'PORCENTAGEM') {
            descontoTotal = subtotalValue * (formularioVenda.value.desconto / 100);
        } else {
            descontoTotal = formularioVenda.value.desconto;
        }
    } else {
        descontoTotal = 0;
    }

    return descontoTotal;
}

function atualizarTabelaCart() {
    // const cartList = $('#lista-carrinho-vendas');
    // const resumoCarrinho = $('#resumo-carrinho-vendas');
    // const subtotalCarrinho = $('#subtotal-carrinho-vendas');
    // const totalCarrinho = $('#total-carrinho-vendas');
    // const descontoCarrinho = $('#desconto-total-carrinho');

    // cartList.empty();

    // if (cartItems.length === 0) {
    //     cartList.append(`
    //         <div class="p-3 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-md">
    //             Nenhum item adicionado
    //         </div>
    //     `);
    //     descontoCarrinho.text(`R$ 0,00`);
    //     subtotalCarrinho.text(`R$ 0,00`);
    //     totalCarrinho.text(`R$ 0,00`);
    //     return;
    // }

    // let total = 0;

    // cartItems.forEach(item => {
    //     total += item.subtotal;
    // });

    // // Exibe total no resumo
    // descontoCarrinho.text(`R$ ${getValorDesconto().toFixed(2).replace('.', ',')}`);
    // subtotalCarrinho.text(`R$ ${total.toFixed(2).replace('.', ',')}`);
    // totalCarrinho.text(`R$ ${(total - getValorDesconto()).toFixed(2).replace('.', ',')}`);
}

clearCartVendas();
</script>

<template>
    <ModalView v-model:open="open" :title="title" :description="description" size="5xl">
        <form id="formulario_cadastro_venda" class="space-y-4 px-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-6">
                    <label class="block text-sm mb-1">Cliente</label>
                    <div class="flex items-center justify-center gap-2">
                        <Select2Ajax class="w-full" url="/clientes/select2" :allow-clear="true" />
                        <button type="button" onclick="openModalClientes()"
                            class="bg-primary px-4 py-1.5 text-white rounded-md border border-border dark:border-border-dark flex justify-center items-center">+</button>
                    </div>
                </div>

                <div class="md:col-span-3">
                    <label class="block text-sm mb-1">Data da Venda <span class="text-red-500">*</span></label>
                    <DatePicker placeholder="Data da venda" required v-model="dataVenda" :dark="(colorTheme === 'dark')"
                        cancelText="Cancelar" selectText="Selecionar" :format-locale="ptBR" :format="'dd/MM/yyyy'"
                        :enable-time-picker="false" auto-apply />
                </div>

                <div class="md:col-span-3">
                    <label class="block text-sm mb-1">Status <span class="text-red-500">*</span></label>
                    <Select default-value="ORCAMENTO">
                        <SelectTrigger class="w-full bg-card dark:bg-card-dark">
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ORCAMENTO">
                                Orçamento
                            </SelectItem>
                            <SelectItem value="ANDAMENTO">
                                Em andamento
                            </SelectItem>
                            <SelectItem value="FINALIZADO">
                                Finalizado
                            </SelectItem>
                            <SelectItem value="PENDENTE">
                                Pendente
                            </SelectItem>
                            <SelectItem value="CANCELADO">
                                Cancelado
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div class="md:col-span-6">
                    <label class="block text-sm mb-1">Vendedor <span class="text-red-500">*</span></label>
                    <Select2Ajax v-model="formularioVenda.vendedorId" class="w-full" url="/usuarios/select2" />
                </div>


                <div class="md:col-span-2">
                    <label for="garantia" class="block text-sm mb-1">Garantia (dias)</label>
                    <NumberField class="bg-card dark:bg-card-dark" id="garantia" :default-value="0" :min="0">
                        <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput />
                            <NumberFieldIncrement />
                        </NumberFieldContent>
                    </NumberField>
                </div>

                <div class="md:col-span-2">
                    <label for="tipo_desconto" class="block text-sm mb-1">Tipo <span
                            class="text-red-500">*</span></label>
                    <Select required default-value="PORCENTAGEM">
                        <SelectTrigger class="w-full bg-card dark:bg-card-dark">
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PORCENTAGEM">
                                Porcentagem
                            </SelectItem>
                            <SelectItem value="VALOR">
                                Valor
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="md:col-span-2">
                    <label for="input_desconto_venda_formulario" class="block text-sm mb-1">Desconto</label>
                    <Input type="text" id="input_desconto_venda_formulario" name="desconto"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark"
                        placeholder="Ex: 1,99" />
                </div>
            </div>

            <!-- Observações -->
            <div>
                <label class="block text-sm mb-1">Observações</label>
                <textarea name="observacoes" id="input_observacoes_venda_formulario"
                    class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark"
                    rows="3" placeholder="Observações da venda..."></textarea>
            </div>

            <hr class="border-border dark:border-border-dark">

            <!-- Adição de produtos -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div class="md:col-span-6">
                    <label class="block text-sm mb-1">Produto <span class="text-red-500">*</span></label>
                    <Select2Ajax v-model="addItemForm.id" class="w-full" url="/produtos/select2" :allow-clear="true" />
                </div>

                <div class="md:col-span-2">
                    <label for="quantidade_carrinho_adicionar" class="block text-sm mb-1">Quantidade <span
                            class="text-red-500">*</span></label>
                    <NumberField v-model="addItemForm.quantidade" class="bg-card dark:bg-card-dark"
                        id="quantidade_carrinho_adicionar" :default-value="1" :min="1">
                        <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput />
                            <NumberFieldIncrement />
                        </NumberFieldContent>
                    </NumberField>
                </div>

                <div class="md:col-span-2">
                    <label class="block text-sm mb-1">Preço <span class="text-red-500">*</span></label>
                    <Input v-model="(addItemForm.preco as number)" type="text" placeholder="R$ 0,00"
                        id="input_preco_venda_formulario"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
                </div>

                <div class="md:col-span-2">
                    <Button type="button" @click="addToCartVendas" class="text-white w-full">
                        <i class="fa-solid fa-cart-plus"></i>
                        Adicionar
                    </Button>
                </div>
            </div>

            <!-- Tabela de itens -->
            <div>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium mb-2">Itens da Venda</h3>
                    <div class="flex gap-2">
                        <button onclick="informarValorPropostoCliente()" type="button"
                            class="text-sm text-white py-1 px-2 mb-2 rounded bg-emerald-500 dark:bg-emerald-800 dark:text-gray-200"><i
                                class="fa-solid fa-money-bill"></i> Propor</button>
                        <button id="btn_limpar_carrinho" type="button"
                            class="text-sm text-white py-1 px-2 mb-2 rounded bg-red-500 dark:bg-red-800 dark:text-gray-200"><i
                                class="fa-solid fa-cart-shopping"></i> Limpar</button>
                    </div>
                </div>
                <div class="relative overflow-x-auto sm:rounded-lg">
                    <div class="grid grid-cols-12 gap-4">
                        <!-- Lista do carrinho -->
                        <div id="lista-carrinho-vendas" class="col-span-12 lg:col-span-8 space-y-2">
                            <div v-if="carrinho.length === 0"
                                class="p-3 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-md">
                                Nenhum item adicionado
                            </div>
                            <div v-else v-for="item in carrinho" :key="item.id"
                                class="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-2 shadow-sm">
                                <div class="flex flex-col text-sm">
                                    <span class="font-medium text-gray-800 dark:text-gray-200">{{ item.produto }}</span>
                                    <span class="text-gray-500 dark:text-gray-400">Qtd: {{ item.quantidade }}</span>
                                </div>
                                <div class="flex flex-col text-right text-sm">
                                    <span class="font-medium text-gray-800 dark:text-gray-200">R$ {{ item.preco
                                    }}</span>
                                    <span class="text-gray-500 dark:text-gray-400">Subtotal: R$ {{ item.subtotal
                                    }}</span>
                                </div>
                                <button type="button" @click="removeFromCartVendas(item.id)"
                                    class="ml-3 text-red-900 bg-red-200 dark:text-red-100 dark:bg-red-800 py-1 px-2 rounded-sm">
                                    Remover
                                </button>
                            </div>
                        </div>

                        <!-- Total do carrinho -->
                        <div id="resumo-carrinho-vendas"
                            class="col-span-12 lg:col-span-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4 shadow-sm">
                            <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Resumo</h3>
                            <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>Desconto:</span>
                                <span id="desconto-total-carrinho">R$ 0,00</span>
                            </div>
                            <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>Subtotal:</span>
                                <span id="subtotal-carrinho-vendas">R$ 0,00</span>
                            </div>
                            <div class="flex justify-between text-bold text-md text-gray-700 dark:text-gray-300">
                                <span>Total:</span>
                                <span id="total-carrinho-vendas">R$ 0,00</span>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
            <input type="hidden" name="id" id="input_id_venda_formulario" value="{{venda.id}}">
            <div class="flex justify-end gap-2">
                <Button type="button" variant="secondary" @click="open = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>
