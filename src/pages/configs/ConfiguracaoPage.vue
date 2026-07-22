<template>
    <div class="container mx-auto space-y-6">
        <div class="flex items-start justify-between flex-col md:flex-row md:items-center">
            <div>
                <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Cog class="h-6 w-6" :stroke-width="2.5" />
                    Configurações
                </h1>
                <p class="text-muted-foreground">Ajuste preferências operacionais do sistema.</p>
            </div>
        </div>

        <Tabs v-model="tab" class="w-auto">
            <div class="overflow-auto max-w-full">
                <TabsList class="grid w-max border" :class="isRootUser ? 'grid-cols-7' : 'grid-cols-6'">
                    <TabsTrigger value="empresa"><i class="fa-solid fa-building mr-2"></i> Empresa</TabsTrigger>
                    <TabsTrigger value="notificacoes"><i class="fa-solid fa-bell mr-2"></i> Notificações</TabsTrigger>
                    <TabsTrigger :disabled="storeUi.isMobile" value="impressao"><i class="fa-solid fa-print mr-2"></i>
                        Impressão
                    </TabsTrigger>
                    <TabsTrigger value="vendas" class="flex items-center">
                        <ShoppingCart class="inline-flex mr-1 h-5 w-5" />
                        Vendas
                    </TabsTrigger>
                    <TabsTrigger value="aparencia" class="flex items-center">
                        <Palette class="inline-flex mr-1 h-5 w-5" />
                        Aparência
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" class="flex items-center">
                        <Banknote class="inline-flex mr-1 w-5 h-5" />
                        Financeiro
                    </TabsTrigger>
                    <TabsTrigger v-if="isRootUser" value="menus" class="flex items-center">
                        <i class="fa-solid fa-list-check mr-2"></i> Menus
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="empresa">
                <EmpresaPage />
            </TabsContent>

            <TabsContent value="notificacoes">
                <Card class="rounded-t-none bg-background">
                    <form @submit.prevent="submit(formularioNotificacoes)">
                        <CardHeader>
                            <CardTitle class="font-normal flex items-center gap-2">
                                <Bell class="w-5 h-5 text-primary" /> Notificações
                            </CardTitle>
                            <CardDescription>Configure e-mails e push de eventos.</CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <div class="grid md:grid-cols-2 gap-3">
                                <div class="space-y-2">
                                    <Label for="emailNotif">E-mail para avisos</Label>
                                    <Input id="emailNotif" v-model="(formularioNotificacoes.emailAvisos as string)"
                                        type="email" placeholder="seu@email.com" />
                                </div>
                                <SubscribeNotification />
                            </div>
                            <Separator />
                            <div class="grid gap-6">
                                <div class="space-y-2">
                                    <Label class="text-md">Eventos</Label>
                                    <div class="grid grid-cols-2 gap-3">
                                        <label for="vendaConcluida"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                            <span>Venda concluída <p class="text-xs text-muted-foreground">(Quando
                                                    realizar uma venda)</p></span>
                                            <Switch id="vendaConcluida"
                                                v-model="formularioNotificacoes.eventoVendaConcluida" />
                                        </label>
                                        <label for="sangriaEvento"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                            <span>Sangria registrada <p class="text-xs text-muted-foreground">(Retiradas
                                                    de valor em caixa PDV)</p></span>
                                            <Switch id="sangriaEvento" v-model="formularioNotificacoes.eventoSangria" />
                                        </label>
                                        <label for="estoqueBaixo"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                            <span>Estoque baixo <p class="text-xs text-muted-foreground">(classificado
                                                    em vermelho)</p></span>
                                            <Switch id="estoqueBaixo"
                                                v-model="formularioNotificacoes.eventoEstoqueBaixo" />
                                        </label>
                                        <label for="produtoEditadoReposicao"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                            <span>Alteração de produto <p class="text-xs text-muted-foreground">
                                                    (reposição, edição)</p></span>
                                            <Switch id="produtoEditadoReposicao"
                                                v-model="formularioNotificacoes.eventoProdutoAlterado" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div class="grid gap-3">
                                <label for="financeiroVencimentosNotificacoesAtivo"
                                    class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                    <span>Alertas de vencimentos financeiros
                                        <p class="text-xs text-muted-foreground">Avisos 3 dias antes, 1 dia antes, no
                                            dia e 1 dia depois para itens marcados.</p>
                                    </span>
                                    <Switch id="financeiroVencimentosNotificacoesAtivo"
                                        v-model="formularioNotificacoes.financeiroVencimentosNotificacoesAtivo" />
                                </label>
                            </div>
                            <template v-if="hasWhatsAppModule">
                                <Separator />
                                <div class="space-y-4">
                                    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <Label class="text-md">WhatsApp</Label>
                                            <p class="text-sm text-muted-foreground">Envie notificações administrativas
                                                usando a instância principal do módulo WhatsApp.</p>
                                        </div>
                                        <Button type="button" variant="outline" :disabled="loadingWhatsappInstances"
                                            @click="loadWhatsappInstances">
                                            <LoaderIcon v-if="loadingWhatsappInstances"
                                                class="mr-2 h-4 w-4 animate-spin" />
                                            Atualizar instâncias
                                        </Button>
                                    </div>

                                    <div v-if="!whatsappInstances.length"
                                        class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                        Cadastre uma instância de WhatsApp antes de ativar notificações por WhatsApp.
                                    </div>

                                    <div class="grid gap-3 md:grid-cols-2">
                                        <label for="whatsappNotificacoesAtivo"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer"
                                            :class="!whatsappInstances.length ? 'opacity-70' : ''">
                                            <span>Notificações por WhatsApp
                                                <p class="text-xs text-muted-foreground">Usa a api do WhatsApp W-API
                                                    para envio de notificações para admins.</p>
                                            </span>
                                            <Switch id="whatsappNotificacoesAtivo"
                                                v-model="formularioNotificacoes.whatsappNotificacoesAtivo"
                                                :disabled="!whatsappInstances.length" />
                                        </label>

                                        <div class="space-y-2 rounded-lg border bg-body/70 p-3 px-4">
                                            <Label for="whatsappInstanciaPrincipal">Instância principal</Label>
                                            <select id="whatsappInstanciaPrincipal"
                                                v-model.number="formularioNotificacoes.whatsappNotificacoesInstanciaId"
                                                class="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                                :disabled="!formularioNotificacoes.whatsappNotificacoesAtivo || !whatsappInstances.length">
                                                <option :value="null">Selecionar instância...</option>
                                                <option v-for="instance in whatsappInstances" :key="instance.id"
                                                    :value="instance.id">
                                                    {{ instance.nome }} - {{ instance.status }}
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        <label v-for="event in whatsappNotificationEvents" :key="event.field"
                                            :for="event.field"
                                            class="flex min-h-24 flex-col justify-between rounded-lg border bg-body/70 p-3 px-4"
                                            :class="!formularioNotificacoes.whatsappNotificacoesAtivo ? 'opacity-70' : ''">
                                            <span>{{ event.label }}
                                                <p class="text-xs text-muted-foreground">{{ event.description }}</p>
                                            </span>
                                            <div class="mt-3 flex justify-end">
                                                <Switch :id="event.field" v-model="formularioNotificacoes[event.field]"
                                                    :disabled="!formularioNotificacoes.whatsappNotificacoesAtivo" />
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </template>
                        </CardContent>
                        <CardFooter class="justify-end">
                            <Button :disabled="notificationSubmitDisabled" class="ml-2 text-white" type="submit">
                                <CircleCheck v-if="!loading" />
                                <LoaderIcon v-if="loading" class="animate-spin" />
                                {{ loading ? 'Salvando...' : 'Salvar' }}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            <TabsContent value="impressao">
                <ImpressaoPage />
            </TabsContent>

            <TabsContent value="vendas">
                <Card class="rounded-t-none bg-background">
                    <form @submit.prevent="submit(formularioVendas)">
                        <CardHeader>
                            <CardTitle class="font-normal flex items-center gap-2">
                                <Printer class="w-5 h-5 text-primary" /> Modelos de impressão
                            </CardTitle>
                            <CardDescription>Escolha a experiência usada ao abrir o PDV. A troca não altera vendas,
                                estoque ou
                                caixas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div class="grid gap-4 lg:grid-cols-2">
                                <button v-for="modelo in modelosPdv" :key="modelo.value" type="button"
                                    class="group relative overflow-hidden rounded-2xl border p-5 text-left transition-all"
                                    :class="formularioVendas.modeloPdv === modelo.value
                                        ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                                        : 'bg-body/60 hover:border-primary/50 hover:bg-body'"
                                    @click="formularioVendas.modeloPdv = modelo.value">
                                    <div class="flex items-start justify-between gap-4">
                                        <div class="flex gap-3">
                                            <div class="rounded-xl border bg-background p-3 text-primary shadow-sm">
                                                <component :is="modelo.icon" class="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div class="flex items-center gap-2">
                                                    <p class="font-semibold">PDV {{ modelo.label }}</p>
                                                    <span v-if="modelo.value === 'PRO'"
                                                        class="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Novo</span>
                                                </div>
                                                <p class="mt-1 text-sm text-muted-foreground">{{ modelo.description }}
                                                </p>
                                            </div>
                                        </div>
                                        <CircleCheck v-if="formularioVendas.modeloPdv === modelo.value"
                                            class="h-5 w-5 shrink-0 text-primary" />
                                        <span v-else class="h-5 w-5 shrink-0 rounded-full border-2" />
                                    </div>
                                    <div class="mt-5 flex flex-wrap gap-2">
                                        <span v-for="feature in modelo.features" :key="feature"
                                            class="rounded-full border bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
                                            {{ feature }}
                                        </span>
                                    </div>
                                </button>
                            </div>
                            <div class="mt-6 space-y-4 border-t pt-6">
                                <div>
                                    <h3 class="flex items-center gap-2 font-normal text-lg">
                                        <CircleDollarSign class="w-5 h-5 text-primary" /> Financeiro das vendas
                                    </h3>
                                    <p class="text-sm text-muted-foreground">
                                        Define se cada venda faturada gera automaticamente um lançamento de receita.
                                    </p>
                                </div>

                                <label
                                    class="flex items-center justify-between gap-4 rounded-lg border bg-body/70 p-3 px-4">
                                    <span>
                                        Lançar financeiro automático
                                        <p class="text-xs text-muted-foreground">
                                            Toda venda faturada (PDV e normal) nasce com um lançamento de receita já
                                            quitado. Vendas no crediário seguem o fluxo de parcelas e não são afetadas.
                                        </p>
                                    </span>
                                    <Switch v-model="formularioVendas.vendaLancamentoAutomatico" />
                                </label>

                                <div v-if="formularioVendas.vendaLancamentoAutomatico"
                                    class="grid gap-4 md:grid-cols-2">
                                    <div class="flex flex-col gap-2">
                                        <Label for="vendaCategoriaFinanceiraId" class="flex items-center gap-1">
                                            Categoria do lançamento <span class="text-red-500">*</span>
                                            <FormularioCategorias class="cursor-pointer px-2 text-blue-500"
                                                @created="selecionarCategoriaVendas">
                                                + Nova
                                            </FormularioCategorias>
                                        </Label>
                                        <Select2Ajax id="vendaCategoriaFinanceiraId"
                                            :key="`categoria-vendas-${categoriaVendasKey}`"
                                            v-model="formularioVendas.vendaCategoriaFinanceiraId"
                                            url="lancamentos/categorias/select2" allowClear class="w-full" />
                                        <p class="text-xs text-muted-foreground">
                                            Obrigatória: é a categoria usada em todo lançamento gerado pelas vendas.
                                        </p>
                                    </div>

                                    <div class="flex flex-col gap-2">
                                        <Label for="vendaContaFinanceiraId" class="flex items-center gap-1">
                                            Conta do lançamento
                                            <FormularioContas class="cursor-pointer px-2 text-blue-500"
                                                @created="selecionarContaVendas">
                                                + Nova
                                            </FormularioContas>
                                        </Label>
                                        <Select2Ajax id="vendaContaFinanceiraId"
                                            :key="`conta-vendas-${contaVendasKey}`"
                                            v-model="formularioVendas.vendaContaFinanceiraId"
                                            url="lancamentos/contas/select2" allowClear class="w-full" />
                                        <p class="text-xs text-muted-foreground">
                                            Opcional: sem escolha, usa a conta financeira padrão definida no Financeiro.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter class="justify-end">
                            <Button :disabled="vendasSubmitDisabled" class="ml-2 text-white" type="submit">
                                <CircleCheck v-if="!loading" />
                                <LoaderIcon v-else class="animate-spin" />
                                {{ loading ? 'Salvando...' : 'Salvar configurações de vendas' }}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            <TabsContent value="aparencia">
                <TemaPage />
            </TabsContent>

            <TabsContent value="financeiro">
                <Card class="rounded-t-none bg-background">
                    <form @submit.prevent="submit(formularioFinanceiro)">
                        <CardHeader>
                            <CardTitle class="font-normal flex items-center gap-2">
                                <DollarSign class="w-5 h-5 text-primary" /> Financeiro
                            </CardTitle>
                            <CardDescription>Configure apenas os parâmetros financeiros operacionais da sua conta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <div class="grid md:grid-cols-2 gap-3">
                                <div class="space-y-2">
                                    <Label for="chavePixSistema">Chave PIX (Celular, E-mail, CPF ou Aleatória)</Label>
                                    <Input id="chavePixSistema" v-model="(formularioFinanceiro.chavePix as string)"
                                        type="text" placeholder="Sua chave aqui..." />
                                </div>
                                <div class="space-y-2">
                                    <Label for="contaFinanceiraPadrao">Conta financeira padrão</Label>
                                    <Select2Ajax id="contaFinanceiraPadrao"
                                        v-model="formularioFinanceiro.contaFinanceiraPadraoId"
                                        url="/lancamentos/contas/select2" :allow-clear="true"
                                        placeholder="Usar quando nenhuma conta for informada" />
                                    <p class="text-xs text-muted-foreground">
                                        Usada em novos lançamentos e efetivações quando o usuário não escolher uma conta
                                        manualmente.
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div class="grid gap-3 md:grid-cols-2">
                                <label for="permitirLancamentoRetroativo"
                                    class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                    <span>Lançamento retroativo
                                        <p class="text-xs text-muted-foreground">Permite criar lançamentos com data
                                            anterior a hoje.
                                        </p>
                                    </span>
                                    <Switch id="permitirLancamentoRetroativo"
                                        v-model="formularioFinanceiro.permitirLancamentoRetroativo" />
                                </label>

                                <label for="permitirEfetivacaoFutura"
                                    class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                    <span>Efetivação futura
                                        <p class="text-xs text-muted-foreground">Permite baixar/efetivar lançamentos com
                                            data
                                            futura.</p>
                                    </span>
                                    <Switch id="permitirEfetivacaoFutura"
                                        v-model="formularioFinanceiro.permitirEfetivacaoFutura" />
                                </label>

                                <label for="permitirTransferenciaContaFinanceira"
                                    class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                    <span>Transferências entre contas
                                        <p class="text-xs text-muted-foreground">Libera transferências financeiras e
                                            remanejamento
                                            entre contas.</p>
                                    </span>
                                    <Switch id="permitirTransferenciaContaFinanceira"
                                        v-model="formularioFinanceiro.permitirTransferenciaContaFinanceira" />
                                </label>

                                <label for="permitirCriacaoCobranca"
                                    class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                    <span>Criação de cobranças
                                        <p class="text-xs text-muted-foreground">Bloqueia ou permite gerar cobranças em
                                            toda a
                                            aplicação.</p>
                                    </span>
                                    <Switch id="permitirCriacaoCobranca"
                                        v-model="formularioFinanceiro.permitirCriacaoCobranca" />
                                </label>
                            </div>
                        </CardContent>
                        <CardFooter class="justify-end">
                            <Button :disabled="loading" class="ml-2 text-white" type="submit">
                                <CircleCheck v-if="!loading" />
                                <LoaderIcon v-if="loading" class="animate-spin" />
                                {{ loading ? 'Salvando...' : 'Salvar' }}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            <TabsContent v-if="isRootUser" value="menus">
                <Card class="rounded-t-none bg-background">
                    <form @submit.prevent="submit(formularioMenus)">
                        <CardHeader>
                            <CardTitle class="font-normal flex items-center gap-2">
                                <Menu class="w-5 h-5 text-primary" /> Controle de menus
                            </CardTitle>
                            <CardDescription>Escolha quais atalhos aparecem na sidebar do sistema. Em cada menu você
                                pode
                                ocultar também os submenus, deixando visíveis apenas as funções que você realmente usa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <div v-for="menu in menuVisibilityOptions" :key="menu.key"
                                    class="flex min-h-[110px] flex-col rounded-lg border bg-body/70 p-4 transition"
                                    :class="{
                                        'border-primary bg-primary/5': isMenuSelected(menu.key),
                                        'opacity-80': isMenuLocked(menu.key),
                                    }">
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="space-y-1">
                                            <div class="font-medium leading-none flex items-center gap-2">
                                                <component :is="menu.icon" class="h-4 w-4" />
                                                {{ menu.nome }}
                                            </div>
                                            <p class="text-xs text-muted-foreground">{{ menu.descricao }}</p>
                                            <p v-if="isMenuLocked(menu.key)" class="text-xs text-muted-foreground">
                                                Mantido para acesso do root.
                                            </p>
                                        </div>
                                        <Switch :model-value="isMenuSelected(menu.key)"
                                            :disabled="isMenuLocked(menu.key)"
                                            @update:model-value="(checked) => toggleMenu(menu.key, Boolean(checked))" />
                                    </div>

                                    <div v-if="getSubmenus(menu.key).length" class="mt-auto pt-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger as-child>
                                                <Button type="button" variant="outline" size="sm"
                                                    class="w-full justify-between font-normal"
                                                    :disabled="!isMenuSelected(menu.key)">
                                                    <span class="flex items-center gap-2">
                                                        <ListChecks class="h-4 w-4" /> Submenus
                                                    </span>
                                                    <span class="flex items-center gap-1 text-xs text-muted-foreground">
                                                        {{ submenusVisiveisCount(menu.key) }}/{{
                                                            getSubmenus(menu.key).length }}
                                                        <ChevronDown class="h-4 w-4" />
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" class="w-56">
                                                <DropdownMenuLabel>Submenus visíveis</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuCheckboxItem v-for="sub in getSubmenus(menu.key)"
                                                    :key="sub.key" :model-value="isSubmenuVisible(sub.key)"
                                                    @update:model-value="(checked) => toggleSubmenu(sub.key, Boolean(checked))"
                                                    @select="(event) => event.preventDefault()">
                                                    {{ sub.nome }}
                                                </DropdownMenuCheckboxItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter class="justify-end">
                            <Button :disabled="loading" class="ml-2 text-white" type="submit">
                                <CircleCheck v-if="!loading" />
                                <LoaderIcon v-if="loading" class="animate-spin" />
                                {{ loading ? 'Salvando...' : 'Salvar' }}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>

        <nav v-if="storeUi.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <button type="button" @click="storeUi.openSidebar = true"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Menu />
                <span class="text-xs">Menu</span>
            </button>
            <button type="button" @click="goBack"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Undo2 />
                <span class="text-xs">Voltar</span>
            </button>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from 'vue-toastification'
import SubscribeNotification from '@/components/layout/subscribeNotification.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import FormularioCategorias from '@/pages/financeiro/lancamentos/modais/FormularioCategorias.vue'
import FormularioContas from '@/pages/financeiro/lancamentos/modais/FormularioContas.vue'
import EmpresaPage from '@/pages/configs/EmpresaPage.vue'
import { Banknote, Bell, ChevronDown, CircleCheck, CircleDollarSign, Cog, DollarSign, Keyboard, LayoutGrid, ListChecks, LoaderIcon, Menu, Palette, Printer, ShoppingCart, Undo2 } from 'lucide-vue-next'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UpdateParametrosConta } from '@/types/schemas'
import { ContaRepository, type WhatsAppNotificationInstanceOption } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import ImpressaoPage from './ImpressaoPage.vue'
import TemaPage from './TemaPage.vue'
import { goBack } from '@/hooks/links'
import {
    getMainMenuVisibilityOptions,
    MENU_SUBMENU_VISIBILITY_OPTIONS,
    ROOT_ALWAYS_VISIBLE_MENU_KEYS,
    type MainMenuVisibilityKey,
} from '@/layouts/options'

const tab = ref<'empresa' | 'notificacoes' | 'impressao' | 'vendas' | 'aparencia' | 'financeiro' | 'menus'>('empresa')
const toast = useToast()
const storeUi = useUiStore()
const loading = ref(false)
const loadingWhatsappInstances = ref(false)
const whatsappInstances = ref<WhatsAppNotificationInstanceOption[]>([])
const isRootUser = computed(() => storeUi.usuarioLogged.permissao === 'root')
const hasWhatsAppModule = computed(() => storeUi.hasActiveModule('whatsapp'))
const menuVisibilityOptions = computed(() => getMainMenuVisibilityOptions(storeUi.appModules))
const notificationSubmitDisabled = computed(() => {
    return Boolean(
        loading.value ||
        (
            hasWhatsAppModule.value &&
            formularioNotificacoes.whatsappNotificacoesAtivo &&
            !formularioNotificacoes.whatsappNotificacoesInstanciaId
        ),
    )
})

const whatsappNotificationEvents = [
    {
        field: 'whatsappEventoNovaVenda',
        label: 'Nova venda',
        description: 'Aviso quando uma venda for criada ou finalizada no PDV.',
    },
    {
        field: 'whatsappEventoNovaOs',
        label: 'Nova OS',
        description: 'Aviso quando uma ordem de serviço for aberta.',
    },
    {
        field: 'whatsappEventoNovoLancamento',
        label: 'Novo lançamento',
        description: 'Aviso quando um lançamento financeiro for criado.',
    },
    {
        field: 'whatsappEventoNovoCliente',
        label: 'Novo cliente',
        description: 'Aviso quando um cliente for cadastrado.',
    },
    {
        field: 'whatsappEventoComandaFaturada',
        label: 'Comanda faturada',
        description: 'Aviso quando uma comanda gerar cobrança/venda.',
    },
    {
        field: 'whatsappEventoCaixaAberto',
        label: 'Caixa aberto',
        description: 'Aviso quando um caixa PDV for aberto.',
    },
    {
        field: 'whatsappEventoCaixaFechado',
        label: 'Caixa fechado',
        description: 'Aviso quando um caixa PDV for fechado.',
    },
] as const

function getDefaultVisibleMenuKeys() {
    return menuVisibilityOptions.value.map((menu) => menu.key)
}

const formularioNotificacoes = reactive<UpdateParametrosConta>({
    eventoEstoqueBaixo: false,
    eventoProdutoAlterado: true,
    eventoVendaConcluida: false,
    eventoSangria: false,
    emailAvisos: '',
    whatsappNotificacoesAtivo: false,
    whatsappNotificacoesInstanciaId: null,
    whatsappEventoNovaVenda: true,
    whatsappEventoNovaOs: true,
    whatsappEventoNovoLancamento: true,
    whatsappEventoNovoCliente: true,
    whatsappEventoComandaFaturada: true,
    whatsappEventoCaixaAberto: true,
    whatsappEventoCaixaFechado: true,
    financeiroVencimentosNotificacoesAtivo: true,
})
const formularioFinanceiro = reactive<UpdateParametrosConta>({
    chavePix: '',
    contaFinanceiraPadraoId: null,
    permitirLancamentoRetroativo: true,
    permitirEfetivacaoFutura: true,
    permitirTransferenciaContaFinanceira: true,
    permitirCriacaoCobranca: true,
})
const formularioVendas = reactive<UpdateParametrosConta>({
    modeloPdv: 'BASICO',
    vendaLancamentoAutomatico: false,
    vendaCategoriaFinanceiraId: null,
    vendaContaFinanceiraId: null,
})

// Sem categoria definida o backend recusa o lançamento, então o Salvar fica travado
// enquanto o automático estiver ligado sem ela.
const vendasSubmitDisabled = computed(
    () => loading.value || (Boolean(formularioVendas.vendaLancamentoAutomatico) && !formularioVendas.vendaCategoriaFinanceiraId),
)

// O Select2Ajax carrega as opções uma vez; trocar a key o remonta para que o
// registro recém-criado apareça na lista já selecionado.
const categoriaVendasKey = ref(0)
const contaVendasKey = ref(0)

function selecionarCategoriaVendas(id: number) {
    formularioVendas.vendaCategoriaFinanceiraId = id
    categoriaVendasKey.value += 1
}

function selecionarContaVendas(id: number) {
    formularioVendas.vendaContaFinanceiraId = id
    contaVendasKey.value += 1
}
const modelosPdv = [
    {
        value: 'BASICO' as const,
        label: 'Básico',
        description: 'Mantém a tela atual, leve e familiar para operações por toque ou mouse.',
        icon: LayoutGrid,
        features: ['Grade de produtos', 'Carrinho lateral', 'Responsivo'],
    },
    {
        value: 'PRO' as const,
        label: 'PRO',
        description: 'Terminal mais denso, com status do caixa e atalhos pelas teclas de função.',
        icon: Keyboard,
        features: ['Atalhos F1-F12', 'Status em tempo real', 'Operação de balcão'],
    },
]
const formularioMenus = reactive<UpdateParametrosConta>({
    menusVisiveis: getDefaultVisibleMenuKeys(),
})

function isMenuLocked(key: MainMenuVisibilityKey) {
    return ROOT_ALWAYS_VISIBLE_MENU_KEYS.includes(key as (typeof ROOT_ALWAYS_VISIBLE_MENU_KEYS)[number])
}

function isMenuSelected(key: MainMenuVisibilityKey) {
    return formularioMenus.menusVisiveis?.includes(key) === true
}

function toggleMenu(key: MainMenuVisibilityKey, checked: boolean) {
    if (isMenuLocked(key)) return

    const selected = new Set(formularioMenus.menusVisiveis ?? [])
    if (checked) selected.add(key)
    else selected.delete(key)

    for (const lockedKey of ROOT_ALWAYS_VISIBLE_MENU_KEYS) {
        selected.add(lockedKey)
    }

    formularioMenus.menusVisiveis = Array.from(selected)
}

function getSubmenus(key: MainMenuVisibilityKey) {
    return MENU_SUBMENU_VISIBILITY_OPTIONS[key] ?? []
}

function submenusVisiveisCount(key: MainMenuVisibilityKey) {
    return getSubmenus(key).filter((sub) => isSubmenuVisible(sub.key)).length
}

// Submenu visível quando sua key NÃO está na lista (as keys de submenu funcionam como
// blacklist em menusVisiveis; ausência = visível, mantendo compatibilidade retroativa).
function isSubmenuVisible(subKey: string) {
    return !(formularioMenus.menusVisiveis ?? []).includes(subKey)
}

function toggleSubmenu(subKey: string, visible: boolean) {
    const selected = new Set(formularioMenus.menusVisiveis ?? [])
    if (visible) selected.delete(subKey)
    else selected.add(subKey)
    formularioMenus.menusVisiveis = Array.from(selected)
}

async function submit(data: UpdateParametrosConta) {
    try {
        loading.value = true
        await ContaRepository.parametros(data)
        await Promise.all([storeUi.getDataUsuario(), storeUi.getStatus()])
        toast.success('Configurações salvas com sucesso')
        await getParametros()
    } catch (error) {
        console.error(error)
        toast.error('Erro ao salvar as configurações')
    } finally {
        loading.value = false
    }
}

async function loadWhatsappInstances() {
    if (!hasWhatsAppModule.value) {
        whatsappInstances.value = []
        return
    }

    try {
        loadingWhatsappInstances.value = true
        whatsappInstances.value = await ContaRepository.listarInstanciasWhatsappNotificacao()
    } catch (error) {
        console.error(error)
        whatsappInstances.value = []
        toast.error('Erro ao buscar instâncias do WhatsApp')
    } finally {
        loadingWhatsappInstances.value = false
    }
}

async function getParametros() {
    try {
        const response = await ContaRepository.getParametros()
        if (response.data != null) {
            Object.assign(formularioNotificacoes, {
                eventoEstoqueBaixo: response.data.eventoEstoqueBaixo,
                eventoProdutoAlterado: response.data.eventoProdutoAlterado ?? true,
                eventoVendaConcluida: response.data.eventoVendaConcluida,
                eventoSangria: response.data.eventoSangria,
                emailAvisos: response.data.emailAvisos,
                whatsappNotificacoesAtivo: response.data.whatsappNotificacoesAtivo ?? false,
                whatsappNotificacoesInstanciaId: response.data.whatsappNotificacoesInstanciaId ?? null,
                whatsappEventoNovaVenda: response.data.whatsappEventoNovaVenda ?? true,
                whatsappEventoNovaOs: response.data.whatsappEventoNovaOs ?? true,
                whatsappEventoNovoLancamento: response.data.whatsappEventoNovoLancamento ?? true,
                whatsappEventoNovoCliente: response.data.whatsappEventoNovoCliente ?? true,
                whatsappEventoComandaFaturada: response.data.whatsappEventoComandaFaturada ?? true,
                whatsappEventoCaixaAberto: response.data.whatsappEventoCaixaAberto ?? true,
                financeiroVencimentosNotificacoesAtivo: response.data.financeiroVencimentosNotificacoesAtivo ?? true,
                whatsappEventoCaixaFechado: response.data.whatsappEventoCaixaFechado ?? true,
            })
            Object.assign(formularioFinanceiro, {
                chavePix: response.data.chavePix,
                contaFinanceiraPadraoId: response.data.contaFinanceiraPadraoId ?? null,
                permitirLancamentoRetroativo: response.data.permitirLancamentoRetroativo ?? true,
                permitirEfetivacaoFutura: response.data.permitirEfetivacaoFutura ?? true,
                permitirTransferenciaContaFinanceira: response.data.permitirTransferenciaContaFinanceira ?? true,
                permitirCriacaoCobranca: response.data.permitirCriacaoCobranca ?? true,
            })
            Object.assign(formularioVendas, {
                modeloPdv: response.data.modeloPdv === 'PRO' ? 'PRO' : 'BASICO',
                vendaLancamentoAutomatico: response.data.vendaLancamentoAutomatico ?? false,
                vendaCategoriaFinanceiraId: response.data.vendaCategoriaFinanceiraId ?? null,
                vendaContaFinanceiraId: response.data.vendaContaFinanceiraId ?? null,
            })
            Object.assign(formularioMenus, {
                menusVisiveis: Array.isArray(response.data.menusVisiveis)
                    ? response.data.menusVisiveis
                    : getDefaultVisibleMenuKeys(),
            })
        }
    } catch (error) {
        console.error(error)
        toast.error('Erro ao buscar as configurações')
    }
}

onMounted(async () => {
    await storeUi.loadAppModules()
    await Promise.all([
        getParametros(),
        loadWhatsappInstances(),
    ])
})
</script>

<style scoped>
:root {
    --pad: 0.75rem;
}

.compact :is(input, button, .shadcn-control) {
    padding: calc(var(--pad) * 0.6);
}
</style>
