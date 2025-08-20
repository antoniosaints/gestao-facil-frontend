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
                    <input type="text" id="searchProductosInput" placeholder="Buscar por nome ou código..."
                        class="w-full p-2 rounded-md border bg-background dark:bg-background-dark border-border dark:border-gray-500 outline-none">
                </div>
            </div>

            <!-- Grid de Produtos -->
            <div class="flex-1 overflow-y-auto scrollbar-thin">
                <div id="productsGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <!-- Produtos serão carregados aqui -->
                </div>
            </div>
        </div>

        <!-- Carrinho Lateral -->
        <div
            class="overflow-auto border-border dark:border-border-dark bg-background dark:bg-background-dark shadow-md rounded-lg p-4 border flex flex-col">
            <!-- Header do Carrinho -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold">
                        <i class="fas fa-shopping-cart text-green-600 mr-2"></i>
                        Carrinho
                    </h2>
                    <button id="clearCartBtn"
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
                    <select id="clientPdvVenda"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">

                    </select>
                </div>
            </div>

            <!-- Lista de Itens do Carrinho -->
            <div class="flex-1 min-h-48 overflow-y-auto scrollbar-thin p-4">
                <div id="cartItems">
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
                        <select id="discountType"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                            <option value="percentage">Desconto %</option>
                            <option value="value">Desconto R$</option>
                        </select>
                        <input type="text" id="discountValue" placeholder="0,00"
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
                    <select id="paymentMethod"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                        <option value="money">Dinheiro</option>
                        <option value="card">Cartão</option>
                        <option value="pix">PIX</option>
                    </select>

                    <!-- Campo de Troco (apenas para dinheiro) -->
                    <div id="changeSection" class="space-y-2">
                        <input type="text" id="receivedAmount" placeholder="Valor recebido"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                        <div class="flex justify-between text-sm font-medium">
                            <span>Troco:</span>
                            <span id="changeAmount">R$ 0,00</span>
                        </div>
                    </div>
                </div>

                <!-- Botão Finalizar Venda -->
                <button id="finalizeSaleBtn"
                    class="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled>
                    <i class="fas fa-check mr-2"></i>
                    Finalizar Venda
                </button>
            </div>
        </div>
    </div>

    <div id="successModal"
        class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 items-center justify-center min-h-screen">
        <div id="modalContent"
            class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center transform scale-90 opacity-0 transition duration-300 ease-out">
            <div
                class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-2xl text-green-600 dark:text-green-300"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">Venda Finalizada!</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">A venda foi processada com sucesso.</p>
            <button id="newSaleBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
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