<template>
    <div>
        <div class="flex flex-col xl:flex-row gap-4 xl:max-h-[calc(100vh-8rem)] rounded">
            <!-- Área Principal - Produtos -->
            <div class="flex-1 flex flex-col">
                <!-- Header -->
                <div class="mb-6 flex flex-col">
                    <div class="flex items-center justify-between">
                        <h2
                            class="text-xl md:text-2xl font-bold text-black dark:text-white flex items-center justify-between gap-2">
                            <div class="flex items-center">
                                <MonitorDown class="w-6 h-6 mr-2 inline-flex" :stroke-width="2.5" />
                                <span class="uppercase">
                                    PONTO DE VENDA
                                </span>
                                <span class="text-xs ml-2 bg-card rounded-xl px-2 flex items-center uppercase">
                                    {{ `CAIXA 01` }}
                                    <Dot class="w-8 h-7 inline-flex" :class="['text-green-600 dark:text-green-400']" />
                                    <span>
                                        {{ "ABERTO" }}
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
                                <img src="/imgs/logo.png" alt="logopng"
                                    class="w-16 h-16 object-cover mx-auto mb-2 rounded-md">
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
                            <Select2Ajax class="col-span-6" placeholder="Selecione o cliente" :url="'/clientes/select2'"
                                v-model:model-value="cliente" :allowClear="true" />
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
                        <div class="grid grid-cols-7 md:grid-cols-7 gap-2">
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
                                        <SelectItem value="PIX">
                                            PIX
                                        </SelectItem>
                                        <SelectItem value="BOLETO">
                                            Boleto
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <!-- <Button type="button" variant="outline"
                                class="bg-success hover:bg-success text-white hover:text-white"
                                @click="openModalAcoes = true">
                                <Cog />
                            </Button> -->
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
        <ModalView v-model:open="openModalVendaFinalizada" title="Comprovante da venda"
            description="Ticket da venda pronto para imprimir, baixar ou enviar." size="md">
            <div class="p-4 space-y-4">
                <div class="flex flex-col items-center text-center space-y-2">
                    <div
                        class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                        <i class="fas fa-check text-2xl text-green-600 dark:text-green-300"></i>
                    </div>
                </div>

                <div class="mx-auto w-full max-w-sm rounded-[28px] border border-dashed border-border bg-card px-4 py-5 shadow-sm">
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
                                <div class="truncate font-medium">{{ item.label }}</div>
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

                <Card class="border-border/70 shadow-sm">
                    <CardHeader class="pb-3">
                        <CardTitle class="text-base">Destino do envio</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-3">
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
                        class="rounded-xl border border-dashed border-border bg-card p-4 text-left transition hover:bg-muted/30">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="font-medium text-foreground flex items-center gap-2">
                                    <Send class="w-4 h-4 text-primary" />
                                    Enviar via API
                                </div>
                                <p class="mt-1 text-xs text-muted-foreground">
                                    Integração futura para envio automatizado direto pela aplicação.
                                </p>
                            </div>
                            <BadgeCell label="Em desenvolvimento" color="orange" :icon="Clock3"
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
                <div
                    class="flex cursor-pointer hover:bg-secondary/80 transition flex-col items-center gap-2 mb-2 text-yellow-700 dark:text-yellow-400 border rounded-md py-7">
                    <HandGrab />
                    <h1>Sangria</h1>
                </div>
                <div
                    class="flex cursor-pointer hover:bg-secondary/80 transition  flex-col items-center gap-2 mb-2 text-green-700 dark:text-green-400 border rounded-md py-7">
                    <HandCoins />
                    <h1>Reforço</h1>
                </div>
            </div>
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
import { ClienteRepository } from '@/repositories/cliente-repository';
import { VendaRepository } from '@/repositories/venda-repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BadgeCell from '@/components/tabela/BadgeCell.vue';
import { CirclePercent, Clock3, Dot, Download, HandCoins, HandGrab, Link2, MessageCircleMore, MonitorDown, Plus, Printer, Send, ShoppingBasket, ShoppingCart, SquareX, UserPlus } from 'lucide-vue-next';
import ModalView from '@/components/formulario/ModalView.vue';
import type { ProdutoVariante } from '@/types/schemas';
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters';
import router from '@/router';
import { useConfirm } from '@/composables/useConfirm';

const toast = useToast()
const useConf = useConfirm()
const uiStore = useUiStore()
const openModalFechamento = ref(false)
const storeCliente = useClientesStore()
const podeFinalizarPDV = ref(false)
const openModalDesconto = ref(false)
const openModalAcoes = ref(false)
const openModalVendaFinalizada = ref(false)
const openModalEnvioComprovante = ref(false)
const printingCupom = ref(false)
const downloadingCupom = ref(false)
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
function aplicarDesconto() {
    if (discountValue.value === null) return toast.error('Informe o desconto a ser aplicado')
    openModalDesconto.value = false
    toast.success('Desconto aplicado com sucesso')
}
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
const cliente = ref(null)
const subtotal = computed(() =>
    cart.value.reduce((t, item) => t + Number(item.preco) * item.quantity, 0)
)

async function sairCaixa() {
    const result = await useConf.confirm({
        cancelText: 'Cancelar',
        confirmText: 'Sim, sair do caixa!',
        colorButton: 'success',
        message: 'Deseja sair do caixa e voltar para o menu principal?',
        title: 'Sair do caixa'
    })
    if (!result) return
    router.push(`/vendas/pontos/caixas?pdv=`)
}

async function fecharCaixa() {
    const result = await useConf.confirm({
        cancelText: 'Cancelar',
        confirmText: 'Sim, fechar caixa!',
        colorButton: 'primary',
        message: 'Deseja fechar o caixa?',
        title: 'Fechar caixa'
    })
    if (!result) return
    openModalFechamento.value = true
    // mock.mockCaixas.find(caixa => caixa.id === Number(caixaId.value))!.status = 'FECHADO'
    // toast.error('Caixa fechado com sucesso!')
    // router.push(`/vendas/pontos/caixas?pdv=${HashGenerator.encode(Number(pdvId.value))}`)
}

watch(() => searchTerm.value, () => {
    fetchProducts()
})

watch(() => cart.value, () => {
    searchTerm.value = ""
}, { deep: true })

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
        if (cart.value.length > 0) {
            podeFinalizarPDV.value = true
        }
    } catch {
        alert("Erro ao buscar produtos")
    }
}

// ---- Carrinho ----
function saveCart() {
    localStorage.setItem("gestao_facil:cartPDV", JSON.stringify(cart.value))
    if (cart.value.length > 0) podeFinalizarPDV.value = true
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
    if (!vendaRecibo.value?.id) return
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

function enviarComprovanteViaApi() {
    toast.info('Envio via API em desenvolvimento.')
}

// ---- Venda ----
async function finalizarVendaPDV(options?: { print?: boolean }) {
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
            nome: `${i.nome}${i.nomeVariante ? ` / ${i.nomeVariante}` : ''}`,
            quantidade: i.quantity,
            preco: formatToNumberValue(i.preco),
            tipo: 'PRODUTO',
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
        const response = await http.post("/vendas/criar", data)
        const vendaCriada = response.data?.data ?? response.data
        limparCarrinho()
        await fetchProducts()
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
    window.addEventListener('keydown', onKey)
})

onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>
