<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import http from "@/utils/axios"
import Input from "@/components/ui/input/Input.vue"

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

<template>
    <div class="flex flex-col xl:flex-row gap-4 p-4 border rounded-lg shadow-md">
        <!-- Produtos -->
        <div class="flex-1 flex flex-col">
            <div class="mb-4">
                <h2 class="text-2xl font-bold">
                    <i class="fa-solid fa-tags text-green-600"></i> Ponto de Vendas
                </h2>
                <Input class="mt-2" v-model="searchTerm" @input="fetchProducts"
                    placeholder="Buscar por nome ou código..." />
            </div>

            <div class="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <div v-for="p in products" :key="p.id"
                    class="border rounded-lg p-4 shadow-md flex flex-col justify-between">
                    <div>
                        <h3 class="text-sm font-medium">{{ p.name }}</h3>
                        <p class="text-xs text-gray-500">Cód: {{ p.code }}</p>
                        <p class="text-green-600 font-bold">R$ {{ p.price.toFixed(2) }}</p>
                        <p class="text-xs">Estoque: {{ p.stock }}</p>
                    </div>
                    <button @click="addToCart(p)" class="mt-3 bg-blue-600 text-white rounded-md py-1">
                        Adicionar
                    </button>
                </div>
            </div>
        </div>

        <!-- Carrinho -->
        <div class="w-full xl:w-96 border rounded-lg p-4 flex flex-col">
            <div class="flex justify-between mb-4">
                <h2 class="text-xl font-semibold">
                    <i class="fas fa-shopping-cart text-green-600"></i> Carrinho
                </h2>
                <button @click="clearCart" class="text-red-500">
                    <i class="fas fa-trash"></i>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto">
                <div v-if="!cart.length" class="text-center text-gray-500 py-6">
                    <p>Carrinho vazio</p>
                </div>
                <div v-for="item in cart" :key="item.id" class="border p-2 mb-2 rounded">
                    <div class="flex justify-between items-center">
                        <span class="text-sm">{{ item.name }}</span>
                        <button @click="updateQuantity(item.id, 0)" class="text-red-500">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <div class="flex gap-2">
                            <button @click="updateQuantity(item.id, item.quantity - 1)">-</button>
                            <span>{{ item.quantity }}</span>
                            <button @click="updateQuantity(item.id, item.quantity + 1)">+</button>
                        </div>
                        <span class="font-bold">
                            R$ {{ (item.price * item.quantity).toFixed(2) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Totais -->
            <div class="mt-4 space-y-2 text-sm">
                <div class="flex justify-between"><span>Subtotal:</span><span>R$ {{ subtotal.toFixed(2) }}</span></div>
                <div class="flex justify-between"><span>Desconto:</span><span>R$ {{ discount.toFixed(2) }}</span></div>
                <div class="flex justify-between font-bold text-lg">
                    <span>Total:</span><span>R$ {{ total.toFixed(2) }}</span>
                </div>
            </div>

            <!-- Pagamento -->
            <div class="mt-4">
                <select v-model="paymentMethod" class="w-full border p-2 rounded-md">
                    <option value="money">Dinheiro</option>
                    <option value="card">Cartão</option>
                    <option value="pix">PIX</option>
                </select>

                <div v-if="paymentMethod === 'money'" class="mt-2">
                    <Input v-model="(receivedAmount as number)" type="number" placeholder="Valor recebido"
                        class="w-full border p-2 rounded-md" />
                    <div class="flex justify-between text-sm font-medium mt-1">
                        <span>Troco:</span><span>R$ {{ change.toFixed(2) }}</span>
                    </div>
                </div>
            </div>

            <!-- Botão -->
            <button @click="finalizeSale" :disabled="!cart.length"
                class="w-full mt-4 bg-blue-600 text-white py-2 rounded-md disabled:bg-gray-400">
                Finalizar Venda
            </button>
        </div>

        <!-- Modal -->
        <div v-if="showSuccessModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white p-6 rounded-md text-center">
                <h3 class="text-lg font-bold mb-2">Venda Finalizada!</h3>
                <p class="mb-4">A venda foi processada com sucesso.</p>
                <button @click="newSale" class="bg-blue-600 text-white px-4 py-2 rounded-md">
                    Nova Venda
                </button>
            </div>
        </div>
    </div>
</template>
