<template>
    <div>
        <div class="flex flex-col xl:flex-row gap-4 xl:max-h-[calc(100vh-8rem)] rounded-lg">
            <!-- Área Principal - Produtos -->
            <div class="flex-1 flex flex-col">
                <!-- Header -->
                <div class="mb-6 flex flex-col">
                    <h2 class="text-xl md:text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                        <ShoppingCart class="w-6 h-6 inline-flex" :stroke-width="2.5" />
                        Ponto de vendas
                    </h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Caixa PDV - <span
                            class="text-green-600 dark:text-green-400">Aberto</span></p>
                    <!-- Barra de Busca -->
                    <div class="relative">
                        <input ref="searchInputField" v-model="searchTerm" @keyup.enter="quickAddCard" type="text"
                            placeholder="Buscar por nome ou código..."
                            class="w-full px-3 py-2 mt-2 rounded-lg border bg-background focus:outline outline-primary" />
                    </div>
                </div>

                <!-- Grid de Produtos -->
                <div class="flex-1 overflow-y-auto scrollbar-thin">
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div v-for="p in products" :key="p.id"
                            class="border border-border bg-background shadow-md rounded-lg p-4 card-hover cursor-pointer product-card flex flex-col justify-between"
                            data-product-id="${product.id}">
                            <div class="text-center mb-3">
                                <h3 class="text-gray-800 dark:text-white text-xs mb-1">{{ p.nome }}</h3>
                                <p class="text-gray-500 dark:text-gray-400 text-xs mb-2">Cód: {{ p.codigo }}</p>
                                <p class="text-md font-bold text-green-600 dark:text-green-400">
                                    {{ formatCurrencyBR(p.preco) }}
                                </p>
                                <p v-if="p.controlaEstoque" class="text-xs text-gray-500 dark:text-gray-400">Estoque: {{
                                    p.estoque }}</p>
                                <p v-else class="text-xs text-gray-500 dark:text-gray-400">
                                    Estoque:
                                    <Infinity class="w-4 inline-flex" />
                                </p>
                            </div>
                            <button @click="addToCart(p)"
                                class="w-full bg-primary hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                                <i class="fas fa-plus mr-1"></i>
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Carrinho Lateral -->
            <div
                class="overflow-auto max-w-full md:mt-4 xl:max-w-md min-w-md w-full border-border bg-background shadow-md rounded-lg p-4 border flex flex-col">
                <!-- Header do Carrinho -->
                <div class="md:p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-semibold flex items-center gap-2">
                            <ShoppingCart class="w-6 h-6 inline-flex" />
                            Carrinho
                        </h2>
                        <button @click="clearCart" :title="cart.length ? 'Limpar carrinho' : 'Carrinho vazio'"
                            class="text-red-500 dark:text-red-300 bg-red-100 px-3 py-1 rounded-md bg-red-10 dark:bg-red-900">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>

                    <!-- Seleção de Cliente -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                            Cliente
                            <a @click="storeCliente.openSave" class="text-blue-500 px-2 cursor-pointer">+ Novo</a>
                        </label>
                        <Select2Ajax :url="'/clientes/select2'" v-model:model-value="cliente" :allowClear="true" />
                    </div>
                </div>

                <!-- Lista de Itens do Carrinho -->
                <div class="min-h-52 overflow-y-auto scrollbar-thin p-4">
                    <div>
                        <div v-if="!cart.length" class="text-center text-gray-500 dark:text-gray-400 py-8">
                            <i class="fas fa-shopping-cart text-4xl mb-3 opacity-50"></i>
                            <p>Carrinho vazio</p>
                            <p class="text-sm">Adicione produtos para começar</p>
                        </div>
                        <div v-for="item in cart" :key="item.id"
                            class="border bg-card dark:bg-gray-800 shadow-md rounded-lg p-3 mb-3">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="text-xs text-gray-800 dark:text-white truncate">{{ item.nome }}</h4>
                                <button type="button" title="Remover item" @click="updateQuantity(item.id!, 0)"
                                    class="text-red-500 hover:text-red-700 text-sm">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <button type="button" title="Diminuir quantidade"
                                        @click="updateQuantity(item.id!, item.quantity - 1)"
                                        class="w-6 h-6 bg-red-100 dark:bg-red-900 border rounded text-xs">-</button>
                                    <span class="text-sm font-medium">{{ item.quantity }}</span>
                                    <button type="button" title="Aumentar quantidade"
                                        @click="updateQuantity(item.id!, item.quantity + 1)"
                                        class="w-6 h-6 bg-green-100 dark:bg-green-900 border rounded text-xs">+</button>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs text-gray-500">{{ formatCurrencyBR(item.preco) }}
                                    </p>
                                    <p class="font-bold text-sm">
                                        {{ formatCurrencyBR(Number(item.preco) * item.quantity) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer do Carrinho -->
                <div
                    class="p-4 border-border dark:border-border-dark bg-background dark:bg-background-dark rounded-lg border-t">
                    <!-- Totais -->
                    <div class="space-y-2 mb-4">
                        <div class="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span id="subtotal">R$ {{ resumoVenda.subtotal.toFixed(2).replace('.', ',') }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Desconto:</span>
                            <span id="discount">R$ {{ resumoVenda.discount.toFixed(2).replace('.', ',') }}</span>
                        </div>
                        <div class="flex justify-between text-lg font-semibold">
                            <span>Total:</span>
                            <span id="total">R$ {{ total.toFixed(2).replace('.', ',') }}</span>
                        </div>
                    </div>

                    <!-- Forma de Pagamento -->
                    <div class="mb-4 flex flex-col gap-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-white mb-2">Pagamento</label>
                        <div class="grid grid-cols-6 md:grid-cols-6 gap-4">
                            <div class="col-span-5">
                                <Select v-model="paymentMethod">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pagamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DINHEIRO">
                                            Dinheiro
                                        </SelectItem>
                                        <SelectItem value="CARTAO">
                                            Cartão
                                        </SelectItem>
                                        <SelectItem value="PIX">
                                            PIX
                                        </SelectItem>
                                        <SelectItem value="BOLETO">
                                            Boleto
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" class="text-white" @click="openModalDesconto = true">
                                <CirclePercent />
                            </Button>
                        </div>

                        <div class="space-y-2" v-if="paymentMethod === 'DINHEIRO'">
                            <Input :required="paymentMethod === 'DINHEIRO'" v-model="(receivedAmount as string)"
                                type="text" placeholder="Valor recebido" />
                            <div class="flex justify-between text-sm font-medium">
                                <span>Troco:</span>
                                <span>R$ {{ change.toFixed(2).replace('.', ',') }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Botão Finalizar Venda -->
                    <Button @click="finalizeSale"
                        class="w-full text-white py-3 px-4 h-12 text-lg rounded-lg transition-colors"
                        :disabled="!canFinalizeSale">
                        <ShoppingBasket />
                        Finalizar Venda
                    </Button>
                </div>
            </div>
        </div>
        <ModalView v-model:open="openModalVendaFinalizada" title="Venda finalizada"
            description="Venda finalizada com sucesso" size="sm">
            <div class="p-4 flex flex-col items-center">
                <div
                    class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-2xl text-green-600 dark:text-green-300"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">Você finalizou a venda!</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6 text-center">clique em "Nova Venda" para lançar outra.
                </p>
                <button @click="openModalVendaFinalizada = false"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
                    Nova Venda
                </button>
            </div>
        </ModalView>
        <ModalView v-model:open="openModalDesconto" title="Aplicar desconto"
            description="Informe o desconto a ser aplicado" size="sm">
            <!-- Desconto -->
            <div class="px-4 gap-4 flex flex-col">
                <div class="flex items-center gap-2 mb-2">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-white">Tipo</label>
                        <Select v-model="discountType">
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo de desconto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">
                                    Desconto %
                                </SelectItem>
                                <SelectItem value="value">
                                    Desconto R$
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-white">Valor</label>
                        <Input type="text" v-maska="moneyMaskOptions" v-model="discountValue!" placeholder="0,00"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
                    </div>
                </div>
                <Button type="button" @click="aplicarDesconto" class="w-full text-white">Aplicar desconto</Button>
            </div>
        </ModalView>
        <ClientesModal />
        <nav
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark md:hidden flex justify-around pt-4 h-20 shadow-lg z-20">

            <button type="button" @click="uiStore.openSidebar = true"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <i class="fa-solid fa-bars text-lg"></i>
                <span class="text-xs">Menu</span>
            </button>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ref, computed, onMounted, watch } from "vue"
import http from "@/utils/axios"
import { Input } from '@/components/ui/input';
import Select2Ajax from '@/components/formulario/Select2Ajax.vue';
import { POSITION, useToast } from 'vue-toastification';
import { useUiStore } from '@/stores/ui/uiStore';
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue';
import { useClientesStore } from '@/stores/clientes/useClientes';
import { CirclePercent, Infinity, ShoppingBasket, ShoppingCart } from 'lucide-vue-next';
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import type { Produto } from '@/types/schemas';
import { formatCurrencyBR } from '@/utils/formatters';
import { moneyMaskOptions } from '@/lib/imaska';
import { vMaska } from "maska/vue"

const toast = useToast()
const uiStore = useUiStore()
const storeCliente = useClientesStore()
const canFinalizeSale = ref(false)
const openModalDesconto = ref(false)
const openModalVendaFinalizada = ref(false)
const searchInputField = ref<HTMLInputElement | null>(null)
function aplicarDesconto() {
    if (discountValue.value === null) return toast.error('Informe o desconto a ser aplicado')
    openModalDesconto.value = false
    toast.success('Desconto aplicado com sucesso')
}
const descontoLabel = computed(() => discountType.value === "percentage" ? `${discountValue.value}%` : `R$ ${discountValue.value}`)

interface CartItem extends Produto {
    quantity: number
}

const products = ref<Produto[]>([])
const cart = ref<CartItem[]>(JSON.parse(localStorage.getItem("gestao_facil:cartPDV") || "[]"))
const searchTerm = ref("")
const discountType = ref<"percentage" | "value">("percentage")
const discountValue = ref<number | null>(null)
const paymentMethod = ref("PIX")
const receivedAmount = ref<string | null>(null)
const cliente = ref(null)

const subtotal = computed(() =>
    cart.value.reduce((t, item) => t + Number(item.preco) * item.quantity, 0)
)

watch(() => searchTerm.value, () => {
    fetchProducts()
})

watch(() => cart.value, () => {
    searchTerm.value = ""
}, { deep: true })

function quickAddCard() {
    const search = searchTerm.value.toLowerCase();
    if (!search) return toast.error('Informe o produto a ser adicionado')
    const itemProduto = products.value.find(item => item.nome.toLowerCase().includes(search) || item.Uid!.toLowerCase().includes(search))
    if (itemProduto?.nome) {
        addToCart(itemProduto)
        searchInputField.value?.focus()
    }
}

const discount = computed(() => {
    const value = parseFloat(String(discountValue.value).replace(",", ".")) || 0
    if (!value) return 0
    return discountType.value === "percentage"
        ? subtotal.value * (value / 100)
        : value
})


const total = computed(() => Math.max(0, subtotal.value - discount.value))

const change = computed(() => {
    if (paymentMethod.value !== "DINHEIRO") return 0
    return Math.max(0, (receivedAmount.value ? parseFloat(receivedAmount.value?.replace(",", ".")) : 0) - total.value)
})

async function fetchProducts() {
    try {
        const { data } = await http.get("/produtos/lista/geral", {
            params: { search: searchTerm.value, limit: 12 },
        })
        products.value = data.data
        if (cart.value.length > 0) {
            canFinalizeSale.value = true
        }
    } catch {
        alert("Erro ao buscar produtos")
    }
}

// ---- Carrinho ----
function saveCart() {
    localStorage.setItem("gestao_facil:cartPDV", JSON.stringify(cart.value))
    if (cart.value.length > 0) canFinalizeSale.value = true
}

function addToCart(product: Produto) {
    const existing = cart.value.find((i) => i.id === product.id)
    if (existing) {
        if (existing.quantity < product.estoque) {
            existing.quantity++
        } else {
            toast.error("Estoque insuficiente!")
        }
    } else {
        if (!product.estoque) return toast.error("Produto sem estoque!", { timeout: 3000, position: POSITION.BOTTOM_RIGHT })
        cart.value.push({ ...product, quantity: 1 })
    }
    saveCart()
}

function updateQuantity(id: number, qty: number) {
    const item = cart.value.find((i) => i.id === id)
    if (!item) return
    if (qty <= 0) {
        cart.value = cart.value.filter((i) => i.id !== id)
    } else if (qty <= item.estoque) {
        item.quantity = qty
    } else {
        toast.error("Estoque insuficiente!")
    }
    saveCart()
}

function clearCart() {
    cart.value = []
    canFinalizeSale.value = false
    saveCart()
}

// ---- Venda ----
async function finalizeSale() {
    if (!cart.value.length) {
        toast.error("Carrinho vazio!")
        return
    }
    if (paymentMethod.value === "DINHEIRO" && (receivedAmount.value ? parseFloat(receivedAmount.value?.replace(",", ".")) : 0) < total.value) {
        toast.error("Valor recebido insuficiente!")
        return
    }

    const data = {
        clienteId: cliente.value,
        data: new Date().toISOString().split("T")[0],
        desconto: discount.value,
        itens: cart.value.map((i) => ({
            id: i.id,
            quantidade: i.quantity,
            preco: Number(i.preco),
        })),
    }

    try {
        await http.post("/vendas/criar", data)
        clearCart()
        await fetchProducts()
        toast.success("Venda realizada com sucesso!")
        openModalVendaFinalizada.value = true
        searchInputField.value?.focus()
    } catch (err: any) {
        toast.error(err.response?.data?.message || "Erro inesperado")
    }
}

const resumoVenda = computed(() => ({
    subtotal: subtotal.value,
    discount: discount.value,
    total: total.value,
    change: change.value,
}))

onMounted(() => {
    fetchProducts()
    cart.value = [];
    saveCart();
    uiStore.openSidebar = false
    searchInputField.value?.focus()
})
</script>