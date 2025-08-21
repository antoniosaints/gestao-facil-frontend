<template>
    <div
        class="flex flex-col xl:flex-row gap-4 xl:max-h-[calc(100vh-8rem)] border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-md rounded-lg p-4 border">
        <!-- Área Principal - Produtos -->
        <div class="flex-1 flex flex-col">
            <!-- Header -->
            <div class="mb-6 flex flex-col gap-2">
                <h2 class="text-xl md:text-2xl font-bold text-black dark:text-white"><i
                        class="fa-solid fa-tags text-green-600"></i>
                    Ponto de vendas
                </h2>
                <!-- Barra de Busca -->
                <div class="relative">
                    <input type="text" placeholder="Buscar por nome ou código..."
                        class="w-full p-2 rounded-md border bg-background dark:bg-background-dark border-border dark:border-gray-500 outline-none">
                </div>
            </div>

            <!-- Grid de Produtos -->
            <div class="flex-1 overflow-y-auto scrollbar-thin">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <!-- Produtos serão carregados aqui -->
                </div>
            </div>
        </div>

        <!-- Carrinho Lateral -->
        <div
            class="overflow-auto max-w-md border-border dark:border-border-dark bg-background dark:bg-background-dark shadow-md rounded-lg p-4 border flex flex-col">
            <!-- Header do Carrinho -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold">
                        <i class="fas fa-shopping-cart text-green-600 mr-2"></i>
                        Carrinho
                    </h2>
                    <button
                        class="text-red-500 dark:text-red-300 bg-red-100 px-3 py-1 rounded-md bg-red-10 dark:bg-red-900"
                        title="Limpar carrinho">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>

                <!-- Seleção de Cliente -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        Cliente
                        <a onclick="openModalClientes()" class="text-blue-500 px-2 cursor-pointer">Novo
                            cliente</a>
                    </label>
                    <Select2_example />
                </div>
            </div>

            <!-- Lista de Itens do Carrinho -->
            <div class="flex-1 min-h-48 overflow-y-auto scrollbar-thin p-4">
                <div>
                    <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                        <i class="fas fa-shopping-cart text-4xl mb-3 opacity-50"></i>
                        <p>Carrinho vazio</p>
                        <p class="text-sm">Adicione produtos para começar</p>
                    </div>
                </div>
            </div>

            <!-- Footer do Carrinho -->
            <div class="p-4 border-border dark:border-border-dark bg-background dark:bg-background-dark rounded-lg">
                <!-- Desconto -->
                <div class="mb-4">
                    <div class="flex items-center gap-2 mb-2">
                        <select
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                            <option value="percentage">Desconto %</option>
                            <option value="value">Desconto R$</option>
                        </select>
                        <input type="text" placeholder="0,00"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </div>
                </div>

                <!-- Totais -->
                <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span id="subtotal">R$ 0,00</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span>Desconto:</span>
                        <span id="discount">R$ 0,00</span>
                    </div>
                    <div
                        class="flex justify-between text-lg font-semibold border-t border-border dark:border-border-dark pt-2">
                        <span>Total:</span>
                        <span id="total">R$ 0,00</span>
                    </div>
                </div>

                <!-- Forma de Pagamento -->
                <div class="mb-4 flex flex-col gap-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-white mb-2">Pagamento</label>
                    <Select>
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

                    <!-- Campo de Troco (apenas para dinheiro) -->
                    <div class="space-y-2">
                        <Input id="changeInput" type="text" placeholder="Valor recebido" />
                        <div class="flex justify-between text-sm font-medium">
                            <span>Troco:</span>
                            <span>R$ 0,00</span>
                        </div>
                    </div>
                </div>

                <!-- Botão Finalizar Venda -->
                <button
                    class="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled>
                    <i class="fas fa-check mr-2"></i>
                    Finalizar Venda
                </button>
            </div>
        </div>
    </div>

    <div class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 items-center justify-center min-h-screen">
        <div
            class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center transform scale-90 opacity-0 transition duration-300 ease-out">
            <div
                class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-2xl text-green-600 dark:text-green-300"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">Venda Finalizada!</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">A venda foi processada com sucesso.</p>
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
                Nova Venda
            </button>
        </div>
    </div>

    <nav
        class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark md:hidden flex justify-around pt-4 h-20 shadow-lg z-20">

        <button type="button" onclick="openSideBarMobile()"
            class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
            <i class="fa-solid fa-bars text-lg"></i>
            <span class="text-xs">Menu</span>
        </button>
    </nav>


</template>

<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Select2_example from '../Home/select2_example.vue';
import { ref, computed, onMounted } from "vue"
import http from "@/utils/axios"
import { Input } from '@/components/ui/input';

interface Product {
    id: number
    name: string
    code: string
    price: number
    stock: number
}

interface CartItem extends Product {
    quantity: number
}

const products = ref<Product[]>([])
const cart = ref<CartItem[]>(JSON.parse(localStorage.getItem("gestao_facil:cartPDV") || "[]"))
const searchTerm = ref("")
const discountType = ref<"percentage" | "value">("percentage")
const discountValue = ref<number>(0)
const paymentMethod = ref("money")
const receivedAmount = ref<number | null>(null)

const subtotal = computed(() =>
    cart.value.reduce((t, item) => t + item.price * item.quantity, 0)
)

const discount = computed(() => {
    if (!discountValue.value) return 0
    return discountType.value === "percentage"
        ? subtotal.value * (discountValue.value / 100)
        : discountValue.value
})

const total = computed(() => Math.max(0, subtotal.value - discount.value))
const change = computed(() => {
    if (paymentMethod.value !== "money") return 0
    return Math.max(0, (receivedAmount.value || 0) - total.value)
})

const showSuccessModal = ref(false)

// ---- API ----
async function fetchProducts() {
    try {
        const { data } = await http.get("/produtos", {
            params: { search: searchTerm.value },
        })
        products.value = data.data.map((p: any) => ({
            id: p.id,
            name: p.nome,
            code: p.codigo || "",
            price: parseFloat(p.preco),
            stock: p.estoque,
        }))
    } catch {
        alert("Erro ao buscar produtos")
    }
}

// ---- Carrinho ----
function saveCart() {
    localStorage.setItem("gestao_facil:cartPDV", JSON.stringify(cart.value))
}

function addToCart(product: Product) {
    const existing = cart.value.find((i) => i.id === product.id)
    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++
        } else {
            alert("Estoque insuficiente!")
        }
    } else {
        cart.value.push({ ...product, quantity: 1 })
    }
    saveCart()
}

function updateQuantity(id: number, qty: number) {
    const item = cart.value.find((i) => i.id === id)
    if (!item) return
    if (qty <= 0) {
        cart.value = cart.value.filter((i) => i.id !== id)
    } else if (qty <= item.stock) {
        item.quantity = qty
    } else {
        alert("Estoque insuficiente!")
    }
    saveCart()
}

function clearCart() {
    cart.value = []
    saveCart()
}

// ---- Venda ----
async function finalizeSale() {
    if (!cart.value.length) {
        alert("Carrinho vazio!")
        return
    }
    if (paymentMethod.value === "money" && (receivedAmount.value || 0) < total.value) {
        alert("Valor recebido insuficiente!")
        return
    }

    const data = {
        clienteId: null, // implementar cliente
        data: new Date().toISOString().split("T")[0],
        desconto: discount.value,
        itens: cart.value.map((i) => ({
            id: i.id,
            quantidade: i.quantity,
            preco: i.price,
        })),
    }

    try {
        await http.post("/vendas/criar", data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("gestao_facil:token")}`,
            },
        })
        showSuccessModal.value = true
        clearCart()
        await fetchProducts()
    } catch (err: any) {
        alert(err.response?.data?.message || "Erro inesperado")
    }
}

function newSale() {
    clearCart()
    discountValue.value = 0
    paymentMethod.value = "money"
    receivedAmount.value = null
    showSuccessModal.value = false
}

onMounted(fetchProducts)
</script>