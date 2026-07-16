<template>
    <div :class="{ 'pdv-basic-pro': proMode }">
        <div class="flex flex-col xl:flex-row gap-4 xl:max-h-[calc(100vh-8rem)] rounded">
            <!-- Área Principal - Produtos -->
            <div class="flex-1 flex flex-col">
                <!-- Header -->
                <div class="mb-6 flex flex-col">
                    <div class="flex items-center justify-between">
                        <h2 v-if="!proMode"
                            class="text-xl md:text-2xl font-bold text-black dark:text-white flex items-center justify-between gap-2">
                            <div class="flex items-center">
                                <MonitorDown class="w-6 h-6 mr-2 inline-flex" :stroke-width="2.5" />
                                <span class="uppercase">
                                    PONTO DE VENDA
                                </span>
                                <span class="text-xs ml-2 bg-card rounded-xl px-2 flex items-center uppercase">
                                    {{ caixaStore.caixaAtivo?.codigo || 'Sem caixa' }}
                                    <Dot class="w-8 h-7 inline-flex"
                                        :class="[caixaStore.caixaAtivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']" />
                                    <span>
                                        {{ caixaStore.caixaAtivo?.status || 'FECHADO' }}
                                    </span>
                                </span>
                            </div>
                        </h2>
                        <!-- <div class="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger class="rounded-xl" as-child>
                                    <Button variant="outline" class="h-8 px-4 text-blue-600 dark:text-blue-200">
                                        <span class="hidden md:inline">Opções</span>
                                        <Menu class="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        v-show="mock.mockCaixas.find(caixa => caixa.id === Number(caixaId))?.status === 'ABERTO'"
                                        @click="fecharCaixa">
                                        <MonitorX />
                                        Fechar o caixa
                                    </DropdownMenuItem>
                                    <RouterLink
                                        :to="`/vendas/pontos?caixa=${HashGenerator.encodeHash(Number(caixaId))}`">
                                        <DropdownMenuItem>
                                            <ArrowLeftRight />
                                            Mudar o PDV
                                        </DropdownMenuItem>
                                    </RouterLink>
                                    <DropdownMenuItem>
                                        <TrendingUp />
                                        Movimentações
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="sairCaixa">
                                        <LogOut />
                                        Sair
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div> -->
                    </div>
                    <!-- Barra de Busca -->
                    <div class="relative">
                        <input ref="searchInputField" v-model="searchTerm" @keyup.enter="quickAddCard" type="text"
                            placeholder="Buscar por nome ou código..."
                            class="w-full px-3 py-2 mt-2 rounded border bg-background focus:outline outline-primary" />
                    </div>
                </div>

                <!-- Grid de Produtos -->
                <div class="flex-1 overflow-y-auto scrollbar-thin">
                    <!-- <div v-if="!Number(pdvId)"
                        class="text-center text-gray-500 dark:text-gray-400 h-[calc(100vh-24rem)] py-8 gap-2 flex flex-col justify-center items-center">
                        <MonitorCog class="w-16 h-16 inline-flex" />
                        <h1>Selecione um PDV para listar os produtos</h1>
                        <RouterLink :to="`/vendas/pontos`">
                            <span
                                class="text-sm text-blue-600 dark:text-blue-200 cursor-pointer p-2 bg-blue-100 dark:bg-blue-900 rounded border">
                                <Pointer class="w-4 inline-flex" />
                                Escolher
                                PDV
                            </span>
                        </RouterLink>
                    </div> -->
                    <!-- <div v-if="!Number(caixaId)"
                        class="text-center text-gray-500 dark:text-gray-400 h-[calc(100vh-24rem)] py-8 gap-2 flex flex-col justify-center items-center">
                        <MonitorCog class="w-16 h-16 inline-flex" />
                        <h1>Selecione um caixa para listar os produtos</h1>
                        <RouterLink :to="`/vendas/pontos/caixas?pdv=${HashGenerator.encodeHash(Number(pdvId))}`">
                            <span
                                class="text-sm text-blue-600 dark:text-blue-200 cursor-pointer p-2 bg-blue-100 dark:bg-blue-900 rounded border">
                                <Pointer class="w-4 inline-flex" />
                                Escolher
                                caixa
                            </span>
                        </RouterLink>
                    </div>
                    <div v-if="caixaId && mock.mockCaixas.find(caixa => caixa.id === Number(caixaId))?.status === 'FECHADO'"
                        class="text-center text-gray-500 dark:text-gray-400 h-[calc(100vh-24rem)] py-8 gap-2 flex flex-col justify-center items-center">
                        <MonitorCog class="w-16 h-16 inline-flex" />
                        <h1>Abra o caixa para começar a vender</h1>
                        <RouterLink :to="`/vendas/pontos/caixas?pdv=${HashGenerator.encodeHash(Number(pdvId))}`">
                            <span
                                class="text-sm flex items-center gap-2 text-blue-600 dark:text-blue-200 cursor-pointer px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded border">
                                <MonitorPlay class="w-4 inline-flex" />
                                Abrir Caixa
                            </span>
                        </RouterLink>
                    </div> -->
                    <div v-if="products.length"
                        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <div v-for="p in products" :key="p.id"
                            class="border border-border bg-background shadow-md rounded p-3 card-hover cursor-pointer product-card flex flex-col justify-between"
                            data-product-id="${product.id}">
                            <div class="text-center">
                                <div
                                    class="w-16 h-16 mx-auto mb-2 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground overflow-hidden">
                                    <img v-if="p.imagem" :src="resolveFileUrl(p.imagem)" :alt="p.nome"
                                        class="w-full h-full object-cover" loading="lazy" />
                                    <Package v-else class="w-8 h-8" />
                                </div>
                                <div class="text-center flex flex-col">
                                    <h3 class="text-gray-800 dark:text-white text-xs">
                                        {{ `${p.nome}${p.nomeVariante ? ` / ${p.nomeVariante}` : ''}` }}
                                    </h3>
                                    <!-- <p class="text-gray-500 dark:text-gray-400 text-xs">Cód: {{ p.code }}</p> -->
                                    <p v-if="p.controlaEstoque" class="text-xs"
                                        :class="[p.estoque === 0 ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400']">
                                        Estoque: {{ p.estoque }} {{ p.unidade }}</p>
                                    <p v-else class="text-xs text-gray-500 dark:text-gray-400">Estoque livre
                                    </p>
                                    <p class="text-md font-bold text-green-600 dark:text-green-400">
                                        {{ formatCurrencyBR(p.preco) }}
                                    </p>
                                </div>
                            </div>
                            <button @click="adicionarAoCarrinho(p)"
                                class="w-full bg-primary hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors">
                                <i class="fas fa-plus mr-1"></i>
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Carrinho Lateral -->
            <div
                class="overflow-auto max-w-full md:mt-0 xl:max-w-md min-w-md w-full justify-between border-border bg-background shadow-md rounded p-4 border flex flex-col">
                <!-- Header do Carrinho -->
                <div>
                    <div class="md:p-2 md:border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-xl font-semibold flex items-center gap-2">
                                <ShoppingCart class="w-6 h-6 inline-flex" />
                                Carrinho
                            </h2>
                            <button @click="limparCarrinho" :title="cart.length ? 'Limpar carrinho' : 'Carrinho vazio'"
                                class="text-red-500 dark:text-red-300 bg-red-100 px-3 py-1 rounded-md bg-red-10 dark:bg-red-900">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>

                        <!-- Seleção de Cliente -->
                        <div class="grid grid-cols-7 gap-2">
                            <Select2Ajax ref="clienteSelectRef" class="col-span-6" placeholder="Selecione o cliente"
                                :url="'/clientes/select2'" v-model:model-value="cliente" :allowClear="true" />
                            <button type="button" @click="storeCliente.openSave"
                                class="bg-primary px-2 text-white rounded border border-border dark:border-border-dark flex justify-center items-center">
                                <UserPlus class="w-5 inline-flex" />
                            </button>
                        </div>
                    </div>

                    <!-- Lista de Itens do Carrinho -->
                    <div class="min-h-52 max-h-[calc(100vh-31rem)] overflow-y-auto scrollbar-thin md:p-2">
                        <div class="mt-1">
                            <div v-if="!cart.length" class="text-center text-gray-500 dark:text-gray-400 py-8">
                                <i class="fas fa-shopping-cart text-4xl mb-3 opacity-50"></i>
                                <p>Carrinho vazio</p>
                                <p class="text-sm">Adicione produtos para começar</p>
                            </div>
                            <div v-for="item in cart" :key="item.id"
                                class="border bg-card dark:bg-gray-800 shadow-md rounded p-1 mb-3">
                                <div class="flex justify-between items-start">
                                    <h4 class="text-xs text-gray-800 dark:text-white p-1 truncate">
                                        {{ `${item.nome}${item.nomeVariante ? ` / ${item.nomeVariante}` : ''}` }}
                                    </h4>
                                    <button type="button" title="Remover item" @click="atualizarQuantidade(item.id!, 0)"
                                        class="text-red-500 hover:text-red-700 text-sm">
                                        <SquareX />
                                    </button>
                                </div>
                                <div class="flex items-center justify-between px-2">
                                    <div class="flex items-center space-x-2">
                                        <button type="button" title="Diminuir quantidade"
                                            @click="atualizarQuantidade(item.id!, item.quantity - 1)"
                                            class="w-6 h-6 bg-gray-300 dark:bg-gray-900 rounded text-xs">-</button>
                                        <span class="text-sm font-medium">{{ item.quantity }}</span>
                                        <button type="button" title="Aumentar quantidade"
                                            @click="atualizarQuantidade(item.id!, item.quantity + 1)"
                                            class="w-6 h-6 bg-gray-300 dark:bg-gray-900 rounded text-xs">+</button>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-xs text-gray-500">
                                            {{ formatCurrencyBR(item.preco) }}
                                        </p>
                                        <p class="font-bold text-sm">
                                            {{ formatCurrencyBR((Number(item.preco) * item.quantity)) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer do Carrinho -->
                <div class="px-4 py-2 border-border dark:border-border-dark bg-background border-t">
                    <!-- Totais -->
                    <div class="mb-2">
                        <div class="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span id="subtotal">R$ {{ resumoVenda.subtotal.toFixed(2).replace('.', ',') }}</span>
                        </div>
                        <div class="flex justify-between text-sm text-muted-foreground">
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
                        <label class="block text-sm font-medium text-gray-700 dark:text-white">Pagamento</label>
                        <div class="grid grid-cols-8 md:grid-cols-8 gap-2">
                            <div class="col-span-6">
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
                                        <SelectItem value="CREDIARIO">
                                            Crediário
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
                            <Button type="button" variant="outline"
                                class="bg-success hover:bg-success text-white hover:text-white"
                                @click="openModalAcoes = true">
                                <HandCoins />
                            </Button>
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
                        <div class="space-y-2" v-if="paymentMethod === 'CREDIARIO'">
                            <p class="text-xs text-muted-foreground">
                                Ao finalizar, escolha as parcelas e a data da primeira parcela.
                            </p>
                            <p class="hidden">
                                Será criado um financeiro pendente em {{ crediarioParcelas }}x vinculado à venda.
                            </p>
                        </div>
                    </div>

                    <!-- Botões de finalização -->
                    <div class="flex flex-col gap-2 sm:flex-row">
                        <Button @click="finalizarVendaPDV()"
                            class="w-full text-white py-3 px-4 h-10 text-sm rounded-lg transition-colors"
                            :disabled="!podeFinalizarPDV">
                            <ShoppingBasket />
                            Finalizar Venda
                        </Button>
                        <Button type="button" variant="outline"
                            class="w-full sm:w-auto flex items-center justify-center rounded-lg gap-2 h-10"
                            :disabled="!podeFinalizarPDV"
                            @click="finalizarVendaPDV({ print: true })">
                            <Printer class="w-4 h-4" />
                            <span class="text-sm">Finalizar e imprimir</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        <ModalView v-model:open="openModalCrediario" title="Configurar crediário"
            description="Defina as condições do financeiro pendente antes de finalizar a venda." size="md">
            <div class="space-y-4 p-4">
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div class="space-y-1">
                        <label class="text-sm font-medium">Quantidade de parcelas</label>
                        <Input v-model.number="crediarioParcelas" type="number" min="1" max="36" />
                    </div>
                    <div class="space-y-1">
                        <label class="text-sm font-medium">Data da primeira parcela</label>
                        <Calendarpicker v-model="crediarioPrimeiroVencimento" :teleport="true" />
                    </div>
                </div>
                <div class="rounded-lg border border-border bg-card p-3 text-sm">
                    <div class="flex justify-between">
                        <span>Total da venda</span>
                        <strong>{{ formatCurrencyBR(total) }}</strong>
                    </div>
                    <div class="mt-1 flex justify-between text-muted-foreground">
                        <span>Valor aproximado por parcela</span>
                        <span>{{ formatCurrencyBR(valorParcelaCrediario) }}</span>
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <Button type="button" variant="outline" @click="openModalCrediario = false">
                        Cancelar
                    </Button>
                    <Button type="button" class="text-white" @click="confirmarCrediarioEFinalizar">
                        Finalizar no crediário
                    </Button>
                </div>
            </div>
        </ModalView>

        <ModalView v-model:open="openModalVendaFinalizada" title="Comprovante da venda"
            description="Ticket da venda pronto para imprimir, baixar ou enviar." size="xl">
            <div class="p-4 space-y-4">
                
                <div class="mx-auto w-full rounded-3xl border border-dashed border-border bg-card px-6 py-5 shadow-sm">
                    <div class="flex flex-col items-center text-center space-y-2">
                        <div
                            class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                            <i class="fas fa-check text-2xl text-green-600 dark:text-green-300"></i>
                        </div>
                    </div>
                    <div class="text-center font-mono text-xs text-muted-foreground">
                        <p class="text-sm font-semibold tracking-[0.25em] text-foreground">COMPROVANTE</p>
                        <p class="mt-1">Venda finalizada com sucesso</p>
                        <p>{{ vendaRecibo?.createdAt ? new Date(vendaRecibo.createdAt).toLocaleString('pt-BR') : '—' }}</p>
                    </div>

                    <div class="my-4 border-t border-dashed border-border"></div>

                    <div class="space-y-1 font-mono text-xs text-foreground">
                        <div class="flex items-center justify-between gap-3">
                            <span>Venda</span>
                            <span class="font-semibold">{{ vendaRecibo?.uid || `#${vendaRecibo?.id}` }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3">
                            <span>Pagamento</span>
                            <span>{{ getPaymentMethodLabel(vendaRecibo?.paymentMethod) }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3">
                            <span>Itens</span>
                            <span>{{ vendaRecibo?.itemCount || 0 }}</span>
                        </div>
                    </div>

                    <div class="my-4 border-t border-dashed border-border"></div>

                    <div class="space-y-3 font-mono text-xs text-foreground">
                        <div v-if="vendaRecibo?.items?.length" class="space-y-2">
                            <div v-for="item in vendaRecibo.items" :key="item.id" class="space-y-1">
                                <div class="truncate font-medium max-w-[25rem]">{{ item.label }}</div>
                                <div class="flex items-center justify-between gap-3 text-muted-foreground">
                                    <span>{{ item.quantity }}x {{ formatCurrencyBR(item.unitPrice) }}</span>
                                    <span>{{ formatCurrencyBR(item.total) }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center text-muted-foreground">
                            Nenhum item disponível para o comprovante.
                        </div>
                    </div>

                    <div class="my-4 border-t border-dashed border-border"></div>

                    <div class="space-y-1 font-mono text-xs text-foreground">
                        <div class="flex items-center justify-between gap-3">
                            <span>Subtotal</span>
                            <span>{{ formatCurrencyBR(vendaRecibo?.subtotal || 0) }}</span>
                        </div>
                        <div v-if="(vendaRecibo?.discount || 0) > 0" class="flex items-center justify-between gap-3">
                            <span>Desconto</span>
                            <span>- {{ formatCurrencyBR(vendaRecibo?.discount || 0) }}</span>
                        </div>
                        <div v-if="vendaRecibo?.paymentMethod === 'DINHEIRO'" class="flex items-center justify-between gap-3">
                            <span>Recebido</span>
                            <span>{{ formatCurrencyBR(vendaRecibo?.receivedAmount || 0) }}</span>
                        </div>
                        <div v-if="(vendaRecibo?.change || 0) > 0" class="flex items-center justify-between gap-3">
                            <span>Troco</span>
                            <span>{{ formatCurrencyBR(vendaRecibo?.change || 0) }}</span>
                        </div>
                        <div class="mt-2 flex items-center justify-between gap-3 border-t border-dashed border-border pt-2 text-sm font-semibold">
                            <span>Total</span>
                            <span class="text-emerald-600 dark:text-emerald-400">{{ formatCurrencyBR(vendaRecibo?.total || 0) }}</span>
                        </div>
                    </div>
                </div>

                <Card class="border-border/70 shadow-sm rounded-xl">
                    <CardHeader class="py-2 -mb-2">
                        <CardTitle class="text-base">Destino do envio</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-1 px-6 py-3">
                        <div class="grid grid-cols-7 gap-2">
                            <Select2Ajax class="col-span-6" placeholder="Selecione o cliente" :url="'/clientes/select2'"
                                v-model:model-value="clienteEnvio" :allowClear="true" />
                            <button type="button" @click="storeCliente.openSave"
                                class="bg-primary px-2 text-white rounded border border-border dark:border-border-dark flex justify-center items-center">
                                <UserPlus class="w-5 inline-flex" />
                            </button>
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Número para envio:
                            <span class="font-mono text-foreground">
                                {{ numeroPreview || 'Selecione um cliente com telefone/WhatsApp' }}
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button type="button" variant="outline" class="h-9" @click="imprimirComprovante"
                        :disabled="!vendaRecibo?.id || printingCupom">
                        <Printer class="w-4 h-4 mr-2" />
                        {{ printingCupom ? 'Imprimindo...' : 'Imprimir' }}
                    </Button>
                    <Button type="button" variant="outline" class="h-9" @click="baixarComprovantePdf"
                        :disabled="!vendaRecibo?.id || downloadingCupom">
                        <Download class="w-4 h-4 mr-2" />
                        {{ downloadingCupom ? 'Gerando...' : 'Baixar PDF' }}
                    </Button>
                    <Button type="button" class="h-9 text-white" @click="openModalSelecionarEnvio"
                        :disabled="!vendaRecibo?.id">
                        <Send class="w-4 h-4 mr-2" />
                        Enviar
                    </Button>
                </div>

                <div class="flex justify-end pt-2">
                    <Button type="button" class="text-white" @click="openModalVendaFinalizada = false">
                        <Plus class="w-4 h-4 mr-2" />
                        Nova venda
                    </Button>
                </div>
            </div>
        </ModalView>
        <ModalView v-model:open="openModalEnvioComprovante" title="Enviar comprovante"
            description="Escolha como deseja compartilhar o comprovante com o cliente." size="sm">
            <div class="p-4 space-y-4">
                <div class="rounded-xl border border-border bg-background p-3 text-sm">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <div class="font-medium text-foreground">Destino selecionado</div>
                            <div class="text-xs text-muted-foreground">
                                {{ numeroPreview || 'Selecione um cliente com telefone ou WhatsApp' }}
                            </div>
                        </div>
                        <BadgeCell :label="numeroPreview ? 'Pronto para envio' : 'Destino pendente'"
                            :color="numeroPreview ? 'green' : 'orange'" :icon="MessageCircleMore" :capitalize="false"
                            size="sm" />
                    </div>
                </div>

                <div class="grid gap-3">
                    <button type="button" @click="enviarComprovanteViaLink"
                        class="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-muted/40"
                        :disabled="!numeroPreview">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="font-medium text-foreground flex items-center gap-2">
                                    <Link2 class="w-4 h-4 text-primary" />
                                    Enviar via link
                                </div>
                                <p class="mt-1 text-xs text-muted-foreground">
                                    Abre o WhatsApp com a mensagem pronta para você concluir o envio.
                                </p>
                            </div>
                            <BadgeCell label="Disponível" color="green" :icon="Send" :capitalize="false"
                                size="sm" />
                        </div>
                    </button>

                    <button type="button" @click="enviarComprovanteViaApi"
                        class="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-muted/30"
                        :disabled="!numeroPreview || sendingCupomWhatsapp">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="font-medium text-foreground flex items-center gap-2">
                                    <Send class="w-4 h-4 text-primary" />
                                    Enviar via API
                                </div>
                                <p class="mt-1 text-xs text-muted-foreground">
                                    Envia o comprovante direto pela instancia principal configurada.
                                </p>
                            </div>
                            <BadgeCell :label="sendingCupomWhatsapp ? 'Enviando' : 'Disponivel'" color="green" :icon="Send"
                                :capitalize="false" size="sm" />
                        </div>
                    </button>
                </div>

                <Separator />

                <div class="flex justify-end gap-2">
                    <Button type="button" variant="secondary" @click="openModalEnvioComprovante = false">
                        Fechar
                    </Button>
                </div>
            </div>
        </ModalView>
        <ModalView v-model:open="openModalDesconto" title="Aplicar desconto"
            description="Informe o desconto a ser aplicado" size="sm">
            <!-- Desconto (PDV PRO): otimizado para uso apenas com o teclado -->
            <div v-if="proMode" class="px-4 gap-4 flex flex-col" @keydown.enter.prevent="aplicarDesconto">
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" @click="definirTipoDesconto('percentage')"
                        class="flex flex-col items-center gap-1 rounded-lg border py-3 transition"
                        :class="discountType === 'percentage'
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border hover:bg-secondary/60'">
                        <CirclePercent class="w-5 h-5" />
                        <span class="text-sm">Percentual (%)</span>
                    </button>
                    <button type="button" @click="definirTipoDesconto('value')"
                        class="flex flex-col items-center gap-1 rounded-lg border py-3 transition"
                        :class="discountType === 'value'
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border hover:bg-secondary/60'">
                        <HandCoins class="w-5 h-5" />
                        <span class="text-sm">Valor (R$)</span>
                    </button>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        {{ discountType === 'percentage' ? 'Percentual do desconto' : 'Valor do desconto' }}
                    </label>
                    <div class="relative">
                        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {{ discountType === 'percentage' ? '%' : 'R$' }}
                        </span>
                        <Input ref="discountInputRef" type="text" inputmode="decimal" v-model="discountValue!"
                            placeholder="0,00" autocomplete="off"
                            class="w-full py-6 pl-9 text-2xl font-bold text-center rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
                    </div>
                </div>

                <div v-if="discountType === 'percentage'" class="grid grid-cols-4 gap-2">
                    <button v-for="preset in descontoPresets" :key="preset" type="button"
                        @click="aplicarPresetDesconto(preset)"
                        class="rounded-md border border-border py-2 text-sm font-semibold hover:bg-primary/10 hover:border-primary transition">
                        {{ preset }}%
                    </button>
                </div>

                <div class="rounded-lg border border-dashed border-border bg-card/60 p-3 text-sm space-y-1">
                    <div class="flex items-center justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{{ formatCurrencyBR(subtotal) }}</span>
                    </div>
                    <div class="flex items-center justify-between text-red-500 dark:text-red-400">
                        <span>Desconto</span>
                        <span>- {{ formatCurrencyBR(discount) }}</span>
                    </div>
                    <div class="flex items-center justify-between text-base font-bold border-t border-border pt-1">
                        <span>Novo total</span>
                        <span class="text-green-600 dark:text-green-400">{{ formatCurrencyBR(total) }}</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <Button type="button" variant="outline" class="w-1/3" @click="limparDesconto">
                        Limpar
                    </Button>
                    <Button type="button" class="flex-1" @click="aplicarDesconto">
                        Aplicar desconto <kbd class="ml-2 text-[10px] opacity-80">Enter</kbd>
                    </Button>
                </div>
            </div>

            <!-- Desconto (PDV Básico) -->
            <div v-else class="px-4 gap-4 flex flex-col">
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
                        <Input type="text" v-model="discountValue!" placeholder="0,00"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
                    </div>
                </div>
                <Button type="button" @click="aplicarDesconto" class="w-full">Aplicar desconto</Button>
            </div>
        </ModalView>
        <ModalView v-model:open="openModalAcoes" title="Ações do PDV" description="Escolha a ação que deseja realizar"
            size="sm">
            <!-- Desconto -->
            <div class="px-4 gap-4 grid grid-cols-2">
                <div @click="abrirMovimento('SANGRIA')"
                    class="flex cursor-pointer hover:bg-secondary/80 transition flex-col items-center gap-2 mb-2 text-yellow-700 dark:text-yellow-400 border rounded-md py-7">
                    <HandGrab />
                    <h1>Sangria</h1>
                </div>
                <div @click="abrirMovimento('REFORCO')"
                    class="flex cursor-pointer hover:bg-secondary/80 transition  flex-col items-center gap-2 mb-2 text-green-700 dark:text-green-400 border rounded-md py-7">
                    <HandCoins />
                    <h1>Reforço</h1>
                </div>
                <div @click="fecharCaixa"
                    class="col-span-2 flex cursor-pointer hover:bg-secondary/80 transition flex-col items-center gap-2 text-blue-700 dark:text-blue-400 border rounded-md py-5">
                    <MonitorDown />
                    <h1>Fechar caixa</h1>
                    <span class="text-xs text-muted-foreground">
                        Saldo esperado: {{ formatCurrencyBR(caixaStore.caixaAtivo?.saldoEsperado || 0) }}
                    </span>
                </div>
            </div>
        </ModalView>

        <ModalView v-model:open="caixaStore.openModalSelecionarCaixa" title="Caixa do PDV"
            description="Abra um caixa ou entre em um caixa aberto para vender." size="lg">
            <div class="grid gap-4 px-4">
                <div class="rounded-md border bg-card p-4">
                    <h3 class="text-sm font-semibold">Abrir novo caixa</h3>
                    <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div class="flex flex-col gap-1">
                            <label class="text-xs text-muted-foreground">PDV</label>
                            <select v-model="abrirCaixaForm.pdvId"
                                class="h-10 rounded-md border bg-background px-3 text-sm">
                                <option :value="null">Sem PDV especifico</option>
                                <option v-for="pdv in caixaStore.pdvs" :key="pdv.id" :value="pdv.id">
                                    {{ pdv.nome }}
                                </option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs text-muted-foreground">Saldo inicial</label>
                            <Input v-model="abrirCaixaForm.valorInicial" placeholder="0,00" />
                        </div>
                        <div class="md:col-span-2 flex flex-col gap-1">
                            <label class="text-xs text-muted-foreground">Observacao</label>
                            <Input v-model="abrirCaixaForm.observacao" placeholder="Ex.: Abertura do turno" />
                        </div>
                    </div>
                    <div class="mt-3 flex justify-end">
                        <Button type="button" :disabled="caixaStore.loading" @click="submitAbrirCaixa">
                            Abrir caixa
                        </Button>
                    </div>
                </div>

                <div class="rounded-md border bg-card p-4">
                    <h3 class="text-sm font-semibold">Caixas abertos</h3>
                    <div v-if="!caixaStore.caixasAbertos.length" class="mt-3 text-sm text-muted-foreground">
                        Nenhum caixa aberto no momento.
                    </div>
                    <div v-else class="mt-3 grid gap-2">
                        <button v-for="caixa in caixaStore.caixasAbertos" :key="caixa.id" type="button"
                            class="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-left hover:bg-muted/40"
                            :disabled="caixaStore.loading" @click="caixaStore.entrarCaixa(caixa.id)">
                            <span>
                                <span class="block text-sm font-medium">{{ caixa.codigo }}</span>
                                <span class="text-xs text-muted-foreground">
                                    Aberto por {{ caixa.abertoPor?.nome || 'usuario' }}
                                </span>
                            </span>
                            <span class="text-sm font-semibold">{{ formatCurrencyBR(caixa.saldoEsperado || 0) }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </ModalView>

        <ModalView v-model:open="caixaStore.openModalMovimento" :title="movimentoForm.tipo"
            description="Registre uma movimentacao manual no caixa." size="sm">
            <form class="grid gap-3 px-4" @submit.prevent="submitMovimentoCaixa">
                <div class="flex flex-col gap-1">
                    <label class="text-xs text-muted-foreground">Valor</label>
                    <Input v-model="movimentoForm.valor" placeholder="0,00" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-xs text-muted-foreground">Descricao</label>
                    <Input v-model="movimentoForm.descricao" placeholder="Motivo da movimentacao" />
                </div>
                <div class="flex justify-end gap-2">
                    <Button type="button" variant="outline" @click="caixaStore.openModalMovimento = false">
                        Cancelar
                    </Button>
                    <Button type="submit" :disabled="caixaStore.loading">
                        Registrar
                    </Button>
                </div>
            </form>
        </ModalView>

        <ModalView v-model:open="caixaStore.openModalFechamento" title="Fechar caixa"
            description="Informe o saldo contado para concluir o caixa." size="sm">
            <form class="grid gap-3 px-4" @submit.prevent="submitFechamentoCaixa">
                <div class="rounded-md border bg-card p-3 text-sm">
                    <div class="flex justify-between">
                        <span>Saldo esperado</span>
                        <strong>{{ formatCurrencyBR(caixaStore.caixaAtivo?.saldoEsperado || 0) }}</strong>
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-xs text-muted-foreground">Saldo contado</label>
                    <Input v-model="fechamentoForm.valorFechamento" placeholder="0,00" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-xs text-muted-foreground">Observacao</label>
                    <Input v-model="fechamentoForm.descricao" placeholder="Conferencia do fechamento" />
                </div>
                <div class="flex justify-end gap-2">
                    <Button type="button" variant="outline" @click="caixaStore.openModalFechamento = false">
                        Cancelar
                    </Button>
                    <Button type="submit" :disabled="caixaStore.loading">
                        Fechar caixa
                    </Button>
                </div>
            </form>
        </ModalView>

        <ClientesModal />
        <!-- <ModalFechamento v-model:open="openModalFechamento" /> -->
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
import { ref, computed, onMounted, watch, onUnmounted } from "vue"
import http from "@/utils/axios"
import { Input } from '@/components/ui/input';
import Select2Ajax from '@/components/formulario/Select2Ajax.vue';
import { POSITION, useToast } from 'vue-toastification';
import { useUiStore } from '@/stores/ui/uiStore';
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue';
import { useClientesStore } from '@/stores/clientes/useClientes';
import { useCaixaStore } from '@/stores/vendas/useCaixa';
import { ClienteRepository } from '@/repositories/cliente-repository';
import { VendaRepository } from '@/repositories/venda-repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BadgeCell from '@/components/tabela/BadgeCell.vue';
import { CirclePercent, Dot, Download, HandCoins, HandGrab, Link2, MessageCircleMore, MonitorDown, Package, Plus, Printer, Send, ShoppingBasket, ShoppingCart, SquareX, UserPlus } from 'lucide-vue-next';
import ModalView from '@/components/formulario/ModalView.vue';
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import type { ProdutoVariante } from '@/types/schemas';
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters';
import { resolveFileUrl } from '@/utils/fileUrl';
import router from '@/router';
import { useConfirm } from '@/composables/useConfirm';

const { proMode = false } = defineProps<{ proMode?: boolean }>()

const toast = useToast()
const useConf = useConfirm()
const uiStore = useUiStore()
const storeCliente = useClientesStore()
const caixaStore = useCaixaStore()
const podeFinalizarPDV = ref(false)
const openModalDesconto = ref(false)
const openModalAcoes = ref(false)
const openModalVendaFinalizada = ref(false)
const openModalEnvioComprovante = ref(false)
const openModalCrediario = ref(false)
const printingCupom = ref(false)
const downloadingCupom = ref(false)
const sendingCupomWhatsapp = ref(false)
const vendaRecibo = ref<{
    id: number
    uid?: string | null
    total: number
    subtotal: number
    discount: number
    clienteId: number | null
    itemCount: number
    paymentMethod: string
    createdAt: string
    receivedAmount: number | null
    change: number
    items: Array<{
        id: number
        label: string
        quantity: number
        unitPrice: number
        total: number
    }>
} | null>(null)
const clienteEnvio = ref<number | null>(null)
const numeroPreview = ref<string>('')
const searchInputField = ref<HTMLInputElement | null>(null)
const clienteSelectRef = ref<{ open: () => void } | null>(null)
const discountInputRef = ref<{ $el?: HTMLElement } | null>(null)
const descontoPresets = [5, 10, 15, 20]
const abrirCaixaForm = ref({
    pdvId: null as number | null,
    valorInicial: '0',
    observacao: '',
})
const movimentoForm = ref({
    tipo: 'SANGRIA' as 'SANGRIA' | 'REFORCO',
    valor: '',
    descricao: '',
})
const fechamentoForm = ref({
    valorFechamento: '',
    descricao: '',
})
function focusDiscountInput() {
    setTimeout(() => {
        const el = discountInputRef.value?.$el as HTMLInputElement | undefined
        el?.focus()
        el?.select?.()
    }, 60)
}

function definirTipoDesconto(tipo: 'percentage' | 'value') {
    discountType.value = tipo
    focusDiscountInput()
}

function aplicarPresetDesconto(valor: number) {
    discountType.value = 'percentage'
    discountValue.value = valor
    focusDiscountInput()
}

function limparDesconto() {
    discountValue.value = null
    focusDiscountInput()
}

function aplicarDesconto() {
    if (discountValue.value === null || String(discountValue.value).trim() === '') {
        return toast.error('Informe o desconto a ser aplicado')
    }
    if (discount.value > subtotal.value) {
        return toast.error('O desconto não pode ser maior que o subtotal')
    }
    openModalDesconto.value = false
    toast.success('Desconto aplicado com sucesso')
}

// Foca o valor do desconto ao abrir o modal (uso rápido apenas pelo teclado)
watch(() => openModalDesconto.value, (open) => {
    if (open) focusDiscountInput()
})
interface CartItem extends ProdutoVariante {
    quantity: number
}

const products = ref<ProdutoVariante[]>([])
const cart = ref<CartItem[]>(JSON.parse(localStorage.getItem("gestao_facil:cartPDV") || "[]"))
const searchTerm = ref("")
const discountType = ref<"percentage" | "value">("percentage")
const discountValue = ref<number | null>(null)
const paymentMethod = ref("PIX")
const receivedAmount = ref<string | null>(null)
const crediarioParcelas = ref(1)
const crediarioPrimeiroVencimento = ref<Date | string | null>(getDefaultCrediarioFirstDueDate())
const crediarioFinalizeOptions = ref<{ print?: boolean } | null>(null)
const cliente = ref(null)
const subtotal = computed(() =>
    cart.value.reduce((t, item) => t + Number(item.preco) * item.quantity, 0)
)

const valorParcelaCrediario = computed(() => {
    const parcelas = Math.max(1, Number(crediarioParcelas.value) || 1)
    return total.value / parcelas
})

function getDefaultCrediarioFirstDueDate() {
    const data = new Date()
    data.setMonth(data.getMonth() + 1)
    return data
}

function formatCrediarioDateForApi(value: Date | string | null) {
    if (!value) return null
    const parsed = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toISOString()
}

function syncPodeFinalizarPDV() {
    podeFinalizarPDV.value = cart.value.length > 0 && Boolean(caixaStore.caixaAtivo?.id)
}

async function confirmarSaidaCaixa() {
    const result = await useConf.confirm({
        cancelText: 'Cancelar',
        confirmText: 'Sim, sair do caixa!',
        colorButton: 'success',
        message: 'Deseja sair do caixa e voltar para o menu principal?',
        title: 'Sair do caixa'
    })
    return result
}

async function sairCaixa() {
    const confirmed = await confirmarSaidaCaixa()
    if (!confirmed) return false
    await router.push('/vendas')
    return true
}

async function fecharCaixa() {
    if (!caixaStore.caixaAtivo?.id) {
        toast.error('Nenhum caixa aberto')
        return
    }
    const result = await useConf.confirm({
        cancelText: 'Cancelar',
        confirmText: 'Sim, fechar caixa!',
        colorButton: 'primary',
        message: 'Deseja fechar o caixa?',
        title: 'Fechar caixa'
    })
    if (!result) return
    fechamentoForm.value.valorFechamento = String(caixaStore.caixaAtivo.saldoEsperado || '')
    caixaStore.openModalFechamento = true
    openModalAcoes.value = false
}

async function submitAbrirCaixa() {
    await caixaStore.abrirCaixa({
        pdvId: abrirCaixaForm.value.pdvId,
        valorInicial: formatToNumberValue(abrirCaixaForm.value.valorInicial),
        observacao: abrirCaixaForm.value.observacao || undefined,
    })
    abrirCaixaForm.value = { pdvId: null, valorInicial: '0', observacao: '' }
    syncPodeFinalizarPDV()
    searchInputField.value?.focus()
}

function abrirMovimento(tipo: 'SANGRIA' | 'REFORCO') {
    if (!caixaStore.caixaAtivo?.id) {
        toast.error('Abra um caixa antes de movimentar')
        return
    }
    movimentoForm.value = {
        tipo,
        valor: '',
        descricao: '',
    }
    caixaStore.openModalMovimento = true
    openModalAcoes.value = false
}

async function submitMovimentoCaixa() {
    if (!caixaStore.caixaAtivo?.id) return toast.error('Nenhum caixa aberto')
    await caixaStore.registrarMovimento({
        caixaId: caixaStore.caixaAtivo.id,
        tipoMovimento: movimentoForm.value.tipo,
        categoria: movimentoForm.value.tipo,
        valor: formatToNumberValue(movimentoForm.value.valor),
        descricao: movimentoForm.value.descricao || undefined,
    })
    movimentoForm.value = { tipo: 'SANGRIA', valor: '', descricao: '' }
}

async function submitFechamentoCaixa() {
    if (!caixaStore.caixaAtivo?.id) return toast.error('Nenhum caixa aberto')
    await caixaStore.fecharCaixa({
        caixaId: caixaStore.caixaAtivo.id,
        valorFechamento: formatToNumberValue(fechamentoForm.value.valorFechamento),
        descricao: fechamentoForm.value.descricao || undefined,
    })
    fechamentoForm.value = { valorFechamento: '', descricao: '' }
    syncPodeFinalizarPDV()
}

watch(() => searchTerm.value, () => {
    fetchProducts()
})

watch(() => cart.value, () => {
    searchTerm.value = ""
    syncPodeFinalizarPDV()
}, { deep: true })

watch(() => caixaStore.caixaAtivo?.id, () => {
    syncPodeFinalizarPDV()
})

watch(() => clienteEnvio.value, (value) => {
    atualizarNumeroPreview(value)
})

function quickAddCard() {
    const search = searchTerm.value.toLowerCase();
    if (!search) return toast.error('Informe o produto a ser adicionado')
    const itemProduto = products.value.find(item =>
        [item.nome, item.nomeVariante || '', item.codigo || ''].join(' ').toLowerCase().includes(search)
    )
    if (itemProduto?.nome) {
        adicionarAoCarrinho(itemProduto)
        searchInputField.value?.focus()
    }
}

function onKey(e: KeyboardEvent) {
    if (e.key === 'Control' && e.code === 'ControlLeft') {
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

function getPaymentMethodLabel(method?: string | null) {
    switch (method) {
        case 'DINHEIRO':
            return 'Dinheiro'
        case 'CARTAO':
            return 'Cartão'
        case 'CREDIARIO':
            return 'Crediário'
        case 'PIX':
            return 'PIX'
        case 'BOLETO':
            return 'Boleto'
        default:
            return method || 'Pagamento'
    }
}

function getPaymentMethodBadge(method?: string | null) {
    switch (method) {
        case 'DINHEIRO':
            return { color: 'green' as const, label: 'Dinheiro' }
        case 'CARTAO':
            return { color: 'blue' as const, label: 'Cartão' }
        case 'CREDIARIO':
            return { color: 'orange' as const, label: 'Crediário' }
        case 'PIX':
            return { color: 'purple' as const, label: 'PIX' }
        case 'BOLETO':
            return { color: 'orange' as const, label: 'Boleto' }
        default:
            return { color: 'gray' as const, label: method || 'Pagamento' }
    }
}

function openModalSelecionarEnvio() {
    if (!vendaRecibo.value?.id) {
        toast.error('Nenhum comprovante disponível para envio')
        return
    }
    openModalEnvioComprovante.value = true
}

async function fetchProducts() {
    try {
        const { data } = await http.get("/produtos/lista/geral", {
            params: { search: searchTerm.value, limit: 12, pdv: true },
        })
        products.value = data.data;
        syncPodeFinalizarPDV()
    } catch {
        alert("Erro ao buscar produtos")
    }
}

// ---- Carrinho ----
function saveCart() {
    localStorage.setItem("gestao_facil:cartPDV", JSON.stringify(cart.value))
    syncPodeFinalizarPDV()
}

function adicionarAoCarrinho(product: ProdutoVariante) {
    const existing = cart.value.find((i) => i.id === product.id)
    if (existing) {
        if (product.controlaEstoque && !product.producaoLocal) {
            existing.quantity < product.estoque ? existing.quantity++ : toast.error("Estoque insuficiente!")
        } else {
            existing.quantity++
        }
    } else {
        if (!product.estoque && product.controlaEstoque && !product.producaoLocal) return toast.error("Produto sem estoque!", { timeout: 3000, position: POSITION.BOTTOM_CENTER })
        if (!product.estoque && product.controlaEstoque && product.producaoLocal) {
            cart.value.push({ ...product, quantity: 1 })
            return toast.warning("Produto adicionado sem estoque, recomendado revisar posteriormente!", { timeout: 3000, position: POSITION.BOTTOM_CENTER })
        }
        cart.value.push({ ...product, quantity: 1 })
    }
    saveCart()
}

function atualizarQuantidade(id: number, qty: number) {
    const item = cart.value.find((i) => i.id === id)
    if (!item) return
    if (qty <= 0) {
        cart.value = cart.value.filter((i) => i.id !== id)
        saveCart()
        return
    }
    if (item.controlaEstoque && !item.producaoLocal) {
        qty <= item.estoque ? item.quantity = qty : toast.error("Estoque insuficiente!")
    } else {
        item.quantity = qty
    }
    saveCart()
}

function limparCarrinho() {
    cart.value = []
    podeFinalizarPDV.value = false
    saveCart()
}

function removerUltimoItem() {
    const ultimoItem = cart.value.at(-1)
    if (!ultimoItem?.id) return toast.info('Nenhum item para cancelar')
    atualizarQuantidade(ultimoItem.id, 0)
    toast.info('Último item removido do cupom')
}

function alternarPagamento() {
    const metodos = ['DINHEIRO', 'CARTAO', 'CREDIARIO', 'PIX', 'BOLETO']
    const indiceAtual = metodos.indexOf(paymentMethod.value)
    paymentMethod.value = metodos[(indiceAtual + 1) % metodos.length]
    toast.info(`Pagamento: ${getPaymentMethodLabel(paymentMethod.value)}`)
}

async function atualizarNumeroPreview(clienteId: number | string | null) {
    const id = clienteId ? Number(clienteId) : null
    if (!id) {
        numeroPreview.value = ''
        return
    }
    try {
        const response = await ClienteRepository.get(id)
        const dadosCliente = response.data
        numeroPreview.value = dadosCliente?.whastapp || dadosCliente?.telefone || ''
    } catch (error) {
        console.log(error)
        numeroPreview.value = ''
    }
}

function prepararComprovante(venda: any, resumo?: {
    subtotal: number
    discount: number
    total: number
    itemCount: number
    paymentMethod: string
    receivedAmount: number | null
    change: number
    items: Array<{
        id: number
        label: string
        quantity: number
        unitPrice: number
        total: number
    }>
}) {
    if (!venda) return
    const totalNumero = typeof venda.valor === 'number' ? venda.valor : Number(venda.valor || resumo?.total || 0)
    vendaRecibo.value = {
        id: venda.id,
        uid: venda.Uid ?? null,
        total: totalNumero,
        subtotal: resumo?.subtotal ?? totalNumero,
        discount: resumo?.discount ?? 0,
        clienteId: venda.clienteId ?? null,
        itemCount: resumo?.itemCount ?? cart.value.length,
        paymentMethod: resumo?.paymentMethod ?? paymentMethod.value,
        createdAt: venda.data ?? new Date().toISOString(),
        receivedAmount: resumo?.receivedAmount ?? null,
        change: resumo?.change ?? 0,
        items: resumo?.items ?? [],
    }
    clienteEnvio.value = vendaRecibo.value.clienteId ?? (cliente.value as any) ?? null
    atualizarNumeroPreview(clienteEnvio.value)
    openModalEnvioComprovante.value = false
    openModalVendaFinalizada.value = true
}

async function imprimirComprovante() {
    if (!vendaRecibo.value?.id) {
        toast.info('Finalize uma venda antes de imprimir o comprovante')
        return
    }
    try {
        printingCupom.value = true
        await VendaRepository.printCupom(vendaRecibo.value.id)
        toast.success('Cupom enviado para a impressora!')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao enviar cupom para a impressora')
    } finally {
        printingCupom.value = false
    }
}

async function baixarComprovantePdf() {
    if (!vendaRecibo.value?.id) return
    try {
        downloadingCupom.value = true
        await VendaRepository.getCupomPDF(vendaRecibo.value.id)
        toast.success('PDF do comprovante gerado com sucesso!')
    } catch (error) {
        console.log(error)
        toast.error('Erro ao gerar o PDF do comprovante')
    } finally {
        downloadingCupom.value = false
    }
}

function enviarComprovanteViaLink() {
    if (!numeroPreview.value) {
        toast.error('Selecione um cliente com telefone ou WhatsApp para enviar o comprovante')
        return
    }
    const numeroLimpo = numeroPreview.value.replace(/\D/g, '')
    if (!numeroLimpo) {
        toast.error('Número inválido para envio')
        return
    }
    const identificadorVenda = vendaRecibo.value?.uid || `#${vendaRecibo.value?.id}`
    const valorFormatado = formatCurrencyBR(vendaRecibo.value?.total || 0)
    const mensagem = encodeURIComponent(`Olá! Segue o comprovante da venda ${identificadorVenda} no valor de ${valorFormatado}.`)
    const url = `https://wa.me/${numeroLimpo}?text=${mensagem}`
    window.open(url, '_blank')
    openModalEnvioComprovante.value = false
    toast.success('Link de envio aberto com sucesso!')
}

async function enviarComprovanteViaApi() {
    if (!vendaRecibo.value?.id) {
        toast.error('Nenhum comprovante disponivel para envio')
        return
    }
    if (!clienteEnvio.value) {
        toast.error('Selecione um cliente para enviar o comprovante')
        return
    }

    try {
        sendingCupomWhatsapp.value = true
        await ClienteRepository.enviarWhatsapp(Number(clienteEnvio.value), {
            tipo: 'COMPROVANTE_VENDA',
            vendaId: vendaRecibo.value.id,
        })
        toast.success('Comprovante enviado pelo WhatsApp')
        openModalEnvioComprovante.value = false
    } catch (error: any) {
        console.log(error)
        toast.error(error?.response?.data?.message || 'Erro ao enviar comprovante pelo WhatsApp')
    } finally {
        sendingCupomWhatsapp.value = false
    }
}

// ---- Venda ----
async function finalizarVendaPDV(options?: { print?: boolean, crediarioConfirmado?: boolean }) {
    if (!cart.value.length) {
        toast.error("Carrinho vazio!")
        return
    }
    if (!caixaStore.caixaAtivo?.id) {
        toast.error("Abra ou selecione um caixa para finalizar a venda")
        caixaStore.openModalSelecionarCaixa = true
        return
    }
    if (paymentMethod.value === "DINHEIRO" && (receivedAmount.value ? parseFloat(receivedAmount.value?.replace(",", ".")) : 0) < total.value) {
        toast.error("Valor recebido insuficiente!")
        return
    }
    if (paymentMethod.value === "CREDIARIO" && !options?.crediarioConfirmado) {
        crediarioFinalizeOptions.value = { print: options?.print }
        if (!crediarioPrimeiroVencimento.value) {
            crediarioPrimeiroVencimento.value = getDefaultCrediarioFirstDueDate()
        }
        openModalCrediario.value = true
        return
    }
    if (paymentMethod.value === "CREDIARIO" && (!Number.isInteger(Number(crediarioParcelas.value)) || Number(crediarioParcelas.value) < 1)) {
        toast.error("Informe em quantas vezes sera o crediario")
        return
    }
    if (paymentMethod.value === "CREDIARIO" && !formatCrediarioDateForApi(crediarioPrimeiroVencimento.value)) {
        toast.error("Informe uma data valida para a primeira parcela")
        return
    }

    const data = {
        caixaId: caixaStore.caixaAtivo.id,
        clienteId: cliente.value,
        data: new Date().toISOString(),
        desconto: discount.value,
        pagamento: paymentMethod.value,
        valorRecebido: paymentMethod.value === 'DINHEIRO' ? receivedAmount.value : null,
        crediarioParcelas: paymentMethod.value === 'CREDIARIO' ? Number(crediarioParcelas.value) : null,
        crediarioPrimeiroVencimento: paymentMethod.value === 'CREDIARIO' ? formatCrediarioDateForApi(crediarioPrimeiroVencimento.value) : null,
        itens: cart.value.map((i) => ({
            id: Number(i.id),
            nome: `${i.nome}${i.nomeVariante ? ` / ${i.nomeVariante}` : ''}`,
            quantidade: i.quantity,
            preco: formatToNumberValue(i.preco),
            tipo: 'PRODUTO' as const,
        })),
    }

    const resumoRecibo = {
        subtotal: subtotal.value,
        discount: discount.value,
        total: total.value,
        itemCount: cart.value.reduce((acc, item) => acc + item.quantity, 0),
        paymentMethod: paymentMethod.value,
        receivedAmount: paymentMethod.value === 'DINHEIRO'
            ? (receivedAmount.value ? parseFloat(receivedAmount.value.replace(",", ".")) : null)
            : null,
        change: change.value,
        items: cart.value.map((item) => ({
            id: Number(item.id),
            label: `${item.nome}${item.nomeVariante && item.nomeVariante !== 'Padrão' ? ` / ${item.nomeVariante}` : ''}`,
            quantity: item.quantity,
            unitPrice: Number(item.preco),
            total: Number(item.preco) * item.quantity,
        })),
    }

    try {
        const vendaCriada = await VendaRepository.finalizarVendaPdv(data)
        limparCarrinho()
        crediarioParcelas.value = 1
        crediarioPrimeiroVencimento.value = getDefaultCrediarioFirstDueDate()
        await fetchProducts()
        await caixaStore.loadContexto()
        toast.success("Venda realizada com sucesso!")
        prepararComprovante(vendaCriada, resumoRecibo)
        if (options?.print && vendaCriada?.id) {
            await imprimirComprovante()
        }
        searchInputField.value?.focus()
    } catch (err: any) {
        toast.error(err.response?.data?.message || "Erro inesperado")
    }
}

async function confirmarCrediarioEFinalizar() {
    if (!Number.isInteger(Number(crediarioParcelas.value)) || Number(crediarioParcelas.value) < 1) {
        toast.error("Informe em quantas vezes sera o crediario")
        return
    }
    if (!formatCrediarioDateForApi(crediarioPrimeiroVencimento.value)) {
        toast.error("Informe uma data valida para a primeira parcela")
        return
    }

    openModalCrediario.value = false
    await finalizarVendaPDV({
        ...crediarioFinalizeOptions.value,
        crediarioConfirmado: true,
    })
    crediarioFinalizeOptions.value = null
}

const resumoVenda = computed(() => ({
    subtotal: subtotal.value,
    discount: discount.value,
    total: total.value,
    change: change.value,
}))

const quantidadeItens = computed(() => cart.value.reduce((acc, item) => acc + item.quantity, 0))

defineExpose({
    alternarPagamento,
    caixaAtivo: computed(() => caixaStore.caixaAtivo),
    fecharCaixa,
    finalizarVendaPDV,
    focusSearch: () => searchInputField.value?.focus(),
    limparCarrinho,
    abrirAcoesCaixa: () => { openModalAcoes.value = true },
    abrirCadastroCliente: () => storeCliente.openSave(),
    abrirSelecaoCliente: () => clienteSelectRef.value?.open(),
    abrirDesconto: () => { openModalDesconto.value = true },
    imprimirUltimoComprovante: imprimirComprovante,
    quantidadeItens,
    quickAddCard,
    removerUltimoItem,
    confirmarSaidaCaixa,
    sairCaixa,
    subtotal,
    total,
})

onMounted(async () => {
    await caixaStore.loadContexto().catch(() => null)
    await fetchProducts()
    cart.value = [];
    saveCart();
    uiStore.openSidebar = false
    searchInputField.value?.focus()
    window.addEventListener('keydown', onKey)
})

onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>
