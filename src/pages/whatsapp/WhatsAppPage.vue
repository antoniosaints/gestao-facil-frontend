<template>
  <div class="container mx-auto space-y-5 pb-24 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MessageCircle class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Atendimento WhatsApp
        </h1>
        <p class="text-sm text-muted-foreground">
          Central de conversas, instâncias W-API e vínculo com clientes da conta atual.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Badge :variant="connectedInstances ? 'default' : 'outline'" class="gap-1">
          <Wifi class="h-3.5 w-3.5" />
          {{ connectedInstances }} conectada(s)
        </Badge>
        <Button variant="outline" :disabled="loading" @click="refreshAll">
          <RotateCw class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" />
          Atualizar
        </Button>
        <Button class="text-white" @click="createInstanceModalOpen = true">
          <Plus class="mr-2 h-4 w-4" />
          Nova instancia
        </Button>
        <Button v-if="instances.length" variant="outline" @click="manageInstanceModalOpen = true">
          <Smartphone class="mr-2 h-4 w-4" />
          Gerenciar
        </Button>
      </div>
    </div>

    <Tabs v-model="tab" class="w-full">
      <TabsContent value="inbox" class="mt-4">
        <div class="grid min-h-[680px] overflow-hidden rounded-xl border bg-background lg:grid-cols-[360px_1fr]">
          <aside class="border-r bg-body/40">
            <div class="space-y-3 border-b p-3">
              <div class="relative">
                <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input v-model="conversationSearch" class="pl-9" placeholder="Buscar por nome, telefone ou cliente" @keyup.enter="loadConversations" />
              </div>
              <div class="grid grid-cols-3 gap-2 text-xs">
                <Button :variant="statusFilter === undefined ? 'default' : 'outline'" size="sm" @click="setStatusFilter(undefined)">Todas</Button>
                <Button :variant="statusFilter === 'ABERTA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('ABERTA')">Abertas</Button>
                <Button :variant="statusFilter === 'FINALIZADA' ? 'default' : 'outline'" size="sm" @click="setStatusFilter('FINALIZADA')">Finalizadas</Button>
              </div>
            </div>

            <ScrollArea class="h-[600px]">
              <button
                v-for="conversation in conversations"
                :key="conversation.id"
                type="button"
                class="flex w-full gap-3 border-b p-3 text-left transition hover:bg-muted/60"
                :class="selectedConversation?.id === conversation.id ? 'bg-muted' : ''"
                @click="openConversation(conversation)"
              >
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {{ initials(conversationLabel(conversation)) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="truncate text-sm font-semibold">{{ conversationLabel(conversation) }}</p>
                    <span class="whitespace-nowrap text-[11px] text-muted-foreground">{{ formatTime(conversation.ultimaInteracaoEm) }}</span>
                  </div>
                  <p class="truncate text-xs text-muted-foreground">{{ conversation.telefone }}</p>
                  <p class="mt-1 line-clamp-1 text-xs">{{ conversation.ultimaMensagem || 'Sem mensagens ainda' }}</p>
                  <div class="mt-2 flex items-center gap-2">
                    <Badge variant="outline">{{ conversation.status }}</Badge>
                    <Badge v-if="conversation.naoLidas" class="bg-green-600 text-white">{{ conversation.naoLidas }}</Badge>
                    <span class="truncate text-[11px] text-muted-foreground">{{ conversation.Instancia?.nome }}</span>
                  </div>
                </div>
              </button>
              <div v-if="!conversations.length" class="p-8 text-center text-sm text-muted-foreground">
                Nenhuma conversa encontrada.
              </div>
            </ScrollArea>
          </aside>

          <section v-if="selectedConversation" class="flex min-w-0 flex-col">
            <header class="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold">{{ conversationLabel(selectedConversation) }}</h2>
                <p class="text-sm text-muted-foreground">
                  {{ selectedConversation.telefone }} · {{ selectedConversation.Instancia?.nome || 'Instância' }}
                </p>
                <p v-if="selectedConversation.Cliente" class="text-xs text-green-600">
                  Cliente vinculado: {{ selectedConversation.Cliente.nome }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" @click="markRead">
                  <CheckCheck class="mr-2 h-4 w-4" />
                  Marcar lida
                </Button>
                <Button v-if="selectedConversation.status !== 'FINALIZADA'" variant="outline" size="sm" @click="updateConversation({ status: 'FINALIZADA' })">
                  Finalizar
                </Button>
                <Button v-else variant="outline" size="sm" @click="updateConversation({ status: 'ABERTA' })">
                  Reabrir
                </Button>
              </div>
            </header>

            <div class="grid gap-4 border-b p-4 md:grid-cols-3">
              <div class="space-y-1">
                <Label>Cliente ERP</Label>
                <div class="flex gap-2">
                  <Input v-model="customerSearch" placeholder="Buscar cliente" @keyup.enter="loadCustomers" />
                  <Button variant="outline" @click="loadCustomers"><Search class="h-4 w-4" /></Button>
                </div>
                <select v-if="customerOptions.length" class="h-9 w-full rounded-md border bg-background px-3 text-sm" @change="linkCustomer(($event.target as HTMLSelectElement).value)">
                  <option value="">Selecionar cliente...</option>
                  <option v-for="customer in customerOptions" :key="customer.id" :value="customer.id">{{ customer.label }}</option>
                </select>
              </div>
              <div class="space-y-1">
                <Label>Setor/Fila</Label>
                <Input v-model="conversationForm.setor" placeholder="Ex.: Suporte" @change="updateConversation({ setor: conversationForm.setor || null })" />
              </div>
              <div class="space-y-1">
                <Label>Status</Label>
                <select v-model="conversationForm.status" class="h-9 w-full rounded-md border bg-background px-3 text-sm" @change="updateConversation({ status: conversationForm.status })">
                  <option value="ABERTA">Aberta</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="FINALIZADA">Finalizada</option>
                </select>
              </div>
            </div>

            <ScrollArea ref="messagesScroll" class="flex-1 bg-muted/20 p-4">
              <div class="space-y-3">
                <div
                  v-for="message in messages"
                  :key="message.id"
                  class="flex"
                  :class="message.direcao === 'SAIDA' ? 'justify-end' : 'justify-start'"
                >
                  <div
                    class="max-w-[78%] rounded-2xl px-4 py-2 shadow-sm"
                    :class="message.direcao === 'SAIDA' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-background'"
                  >
                    <div v-if="message.mediaUrl" class="mb-2 rounded-lg border bg-black/5 p-2 text-xs">
                      <a :href="message.mediaUrl" target="_blank" rel="noreferrer" class="underline">
                        {{ mediaLabel(message) }}
                      </a>
                    </div>
                    <p class="whitespace-pre-wrap text-sm">{{ message.conteudo || mediaLabel(message) }}</p>
                    <div class="mt-1 flex justify-end gap-1 text-[10px] opacity-70">
                      <span>{{ formatTime(message.createdAt) }}</span>
                      <span v-if="message.direcao === 'SAIDA'">· {{ message.statusEnvio }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <form class="border-t bg-background p-3" @submit.prevent="sendText">
              <div class="mb-2 grid gap-2 md:grid-cols-[160px_1fr]">
                <select v-model="messageForm.tipo" class="h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="text">Texto</option>
                  <option value="image">Imagem</option>
                  <option value="audio">Áudio</option>
                  <option value="video">Vídeo</option>
                  <option value="document">Documento</option>
                </select>
                <Input v-if="messageForm.tipo !== 'text'" v-model="messageForm.mediaUrl" placeholder="URL pública da mídia" />
              </div>
              <div class="flex items-end gap-2">
                <Textarea v-model="messageForm.conteudo" class="min-h-[48px]" :placeholder="messageForm.tipo === 'text' ? 'Digite a resposta...' : 'Legenda opcional...'" />
                <Button type="submit" class="text-white" :disabled="sending || !canSendMessage">
                  <LoaderIcon v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
                  <Send v-else class="mr-2 h-4 w-4" />
                  Enviar
                </Button>
              </div>
              <p v-if="selectedConversation.Instancia?.status !== 'CONECTADA'" class="mt-2 text-xs text-amber-600">
                A instância está {{ selectedConversation.Instancia?.status?.toLowerCase() }}; o envio fica bloqueado até reconectar.
              </p>
            </form>
          </section>

          <section v-else class="flex items-center justify-center p-8 text-center text-muted-foreground">
            <div>
              <Inbox class="mx-auto mb-3 h-10 w-10" />
              <p>Selecione uma conversa para iniciar o atendimento.</p>
            </div>
          </section>
        </div>
      </TabsContent>

      <TabsContent value="instances" class="mt-4 space-y-4">
        <div class="grid gap-3 xl:grid-cols-3">
          <Card v-for="instance in instances" :key="instance.id" class="overflow-hidden">
            <CardHeader class="pb-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <CardTitle class="truncate text-base font-medium">{{ instance.nome }}</CardTitle>
                  <CardDescription class="truncate text-xs">{{ instance.instanceId }}</CardDescription>
                </div>
                <Badge :variant="instance.status === 'CONECTADA' ? 'default' : 'outline'">{{ instance.status }}</Badge>
              </div>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="grid gap-2 md:grid-cols-2">
                <div class="rounded-md border p-2">
                  <p class="text-xs text-muted-foreground">Número conectado</p>
                  <p class="truncate text-sm font-medium">{{ instance.numeroConectado || 'Não identificado' }}</p>
                </div>
                <div class="rounded-md border p-2">
                  <p class="text-xs text-muted-foreground">Última sincronização</p>
                  <p class="truncate text-sm font-medium">{{ formatTime(instance.lastSyncAt) || 'Nunca' }}</p>
                </div>
              </div>
              <div v-if="instance.ultimoErro" class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle class="mr-1 inline h-4 w-4" />
                {{ instance.ultimoErro }}
              </div>
              <div class="rounded-md border p-2">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-medium">Mensalidades</p>
                    <p class="truncate text-xs text-muted-foreground">Pagamentos gerados para esta instancia.</p>
                  </div>
                  <span
                    v-if="latestPayment(instance)"
                    class="rounded-full border px-2 py-0.5 text-xs"
                    :class="paymentStatusClass(latestPayment(instance)?.status)"
                  >
                    {{ latestPayment(instance)?.status }}
                  </span>
                </div>
                <div v-if="instance.pagamentos?.length" class="space-y-2">
                  <div v-for="payment in instance.pagamentos.slice(0, 3)" :key="payment.id" class="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-xs">
                    <button type="button" class="min-w-0 flex-1 text-left" @click="openExistingPayment(instance, payment)">
                      <span class="block truncate font-medium">{{ paymentMethodLabel(payment.metodo) }} - {{ formatTime(payment.createdAt) }}</span>
                      <span class="block text-muted-foreground">{{ payment.status }}</span>
                    </button>
                    <Button v-if="payment.status === 'PENDENTE'" variant="ghost" size="icon" class="h-7 w-7" @click="openExistingPayment(instance, payment)">
                      <ExternalLink class="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      v-if="payment.status === 'PENDENTE'"
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7 text-destructive hover:text-destructive"
                      :disabled="deletingPaymentId === payment.id"
                      @click="deletePendingPayment(instance, payment)"
                    >
                      <LoaderIcon v-if="deletingPaymentId === payment.id" class="h-3.5 w-3.5 animate-spin" />
                      <Trash2 v-else class="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p v-else class="text-xs text-muted-foreground">Nenhuma cobranca gerada ainda.</p>
              </div>
              <div class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" @click="openEditInstance(instance)">
                    <PencilLine class="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" @click="openPaymentModal(instance)">
                    <CreditCard class="mr-2 h-4 w-4" />
                    Pagamento
                  </Button>
                  <Button variant="destructive" size="sm" @click="openDeleteModal(instance)">
                    <Trash2 class="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Button v-if="instance.status !== 'CONECTADA'" variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'qrCode')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'qrCode')" class="mr-2 h-4 w-4 animate-spin" />
                    <QrCode v-else class="mr-2 h-4 w-4" />
                    QR Code
                  </Button>
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'status')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'status')" class="mr-2 h-4 w-4 animate-spin" />
                    <Wifi v-else class="mr-2 h-4 w-4" />
                    Status
                  </Button>
                  <Button variant="outline" size="sm" :disabled="loadingWebhookConfig || isAnyInstanceActionLoading(instance.id)" @click="openWebhookModal(instance)">
                    <LoaderIcon v-if="loadingWebhookConfig && webhookInstance?.id === instance.id" class="mr-2 h-4 w-4 animate-spin" />
                    <Webhook v-else class="mr-2 h-4 w-4" />
                    Webhooks
                  </Button>
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'restart')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'restart')" class="mr-2 h-4 w-4 animate-spin" />
                    <RefreshCw v-else class="mr-2 h-4 w-4" />
                    Reiniciar
                  </Button>
                  <Button variant="outline" size="sm" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'disconnect')">
                    <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'disconnect')" class="mr-2 h-4 w-4 animate-spin" />
                    <WifiOff v-else class="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
                <div
                  v-if="instanceActionResult[instance.id]"
                  class="overflow-hidden rounded-lg border bg-background"
                  :class="instanceActionCardClass(instance.id)"
                >
                  <div class="flex items-start justify-between gap-3 p-3">
                    <div class="flex min-w-0 gap-3">
                      <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" :class="instanceActionIconClass(instance.id)">
                        <CheckCircle2 v-if="instanceActionTone[instance.id] === 'success'" class="h-4 w-4" />
                        <WifiOff v-else-if="instanceActionTone[instance.id] === 'warning'" class="h-4 w-4" />
                        <AlertTriangle v-else-if="instanceActionTone[instance.id] === 'danger'" class="h-4 w-4" />
                        <Wifi v-else class="h-4 w-4" />
                      </span>
                      <div class="min-w-0">
                        <p class="text-sm font-medium">{{ instanceActionSummary[instance.id] || 'Retorno recebido da W-API' }}</p>
                        <p v-if="instanceActionDetail[instance.id]" class="mt-1 text-xs text-muted-foreground">
                          {{ instanceActionDetail[instance.id] }}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" title="Ver JSON" @click="openRawResultModal(instance)">
                      <Terminal class="h-4 w-4" />
                    </Button>
                  </div>
                  <div v-if="instanceQrCodeImage[instance.id]" class="grid gap-3 border-t p-3 md:grid-cols-[180px_1fr]">
                    <div class="flex h-[180px] items-center justify-center rounded-lg border bg-white p-2">
                      <img
                        :src="instanceQrCodeImage[instance.id]"
                        alt="QR Code para conectar WhatsApp"
                        class="max-h-full max-w-full"
                      />
                    </div>
                    <div class="flex flex-col justify-center gap-2 text-sm">
                      <p class="font-medium">Leia este QR Code no WhatsApp para conectar a instancia.</p>
                      <p class="text-xs text-muted-foreground">
                        Abra o WhatsApp no celular, acesse aparelhos conectados e aponte a camera para o codigo.
                      </p>
                      <Button variant="outline" size="sm" class="w-fit" @click="copyToClipboard(instanceQrCodeImage[instance.id], 'QR Code copiado.')">
                        <Copy class="mr-2 h-4 w-4" />
                        Copiar QR Code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="webhookModalOpen">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configurar webhooks da W-API</DialogTitle>
          <DialogDescription>
            As URLs abaixo apontam para o backend deste ERP e já carregam o segredo da instância
            {{ webhookInstance?.nome ? `“${webhookInstance.nome}”` : '' }}. Confirme para enviar todas para a W-API.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle class="mr-1 inline h-4 w-4" />
            A URL pública vem de <code>BASE_URL</code> no backend. Se estiver local ou inacessível pela W-API, o recebimento não chegará ao ERP.
          </div>

          <div class="space-y-3">
            <div v-for="callback in webhookCallbacks" :key="callback.key" class="rounded-lg border p-3">
              <div class="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-medium">{{ callback.label }}</p>
                  <p class="text-xs text-muted-foreground">{{ callback.endpoint }}</p>
                </div>
                <Button variant="ghost" size="sm" class="h-8" @click="copyToClipboard(webhookUrls[callback.key] || '', 'URL copiada.')">
                  <Copy class="mr-1 h-3.5 w-3.5" />
                  Copiar
                </Button>
              </div>
              <Input v-model="webhookUrls[callback.key]" class="font-mono text-xs" />
            </div>
          </div>

          <div v-if="webhookSyncResults.length" class="rounded-lg border bg-muted/30 p-3">
            <p class="mb-2 text-sm font-medium">Resultado do último envio</p>
            <div class="space-y-2">
              <div v-for="result in webhookSyncResults" :key="result.key" class="flex items-start gap-2 text-sm">
                <CheckCircle2 v-if="result.ok" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <AlertTriangle v-else class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div class="min-w-0">
                  <p class="font-medium">{{ result.label }}</p>
                  <p class="break-all text-xs text-muted-foreground">
                    {{ result.ok ? 'Configurado na W-API.' : formatWebhookError(result.error) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="configuringWebhooks" @click="webhookModalOpen = false">Fechar</Button>
          <Button class="text-white" :disabled="configuringWebhooks || !webhookInstance" @click="confirmWebhooks">
            <LoaderIcon v-if="configuringWebhooks" class="mr-2 h-4 w-4 animate-spin" />
            <Webhook v-else class="mr-2 h-4 w-4" />
            Confirmar e enviar para W-API
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="createInstanceModalOpen">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova instancia W-API</DialogTitle>
          <DialogDescription>O token e salvo no backend e nao volta a ser exibido na interface.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4">
          <div class="space-y-1">
            <Label>Nome</Label>
            <Input v-model="instanceForm.nome" placeholder="Nome amigavel" />
          </div>
          <div class="space-y-1">
            <Label>Instance ID</Label>
            <Input v-model="instanceForm.instanceId" placeholder="Instance ID" />
          </div>
          <div class="space-y-1">
            <Label>Token W-API</Label>
            <Input v-model="instanceForm.token" type="password" placeholder="Token W-API" autocomplete="off" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="savingInstance" @click="createInstanceModalOpen = false">Cancelar</Button>
          <Button class="text-white" :disabled="savingInstance" @click="saveInstance">
            <LoaderIcon v-if="savingInstance" class="mr-2 h-4 w-4 animate-spin" />
            <Plus v-else class="mr-2 h-4 w-4" />
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="manageInstanceModalOpen">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar instancia</DialogTitle>
          <DialogDescription>Selecione uma instancia para editar dados, abrir pagamento ou remover.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-3">
          <Label>Instancia</Label>
          <select v-model.number="managedInstanceId" class="h-10 rounded-md border bg-background px-3 text-sm">
            <option v-for="instance in instances" :key="instance.id" :value="instance.id">
              {{ instance.nome }} - {{ instance.instanceId }}
            </option>
          </select>
          <div v-if="selectedManagedInstance" class="rounded-md border p-3 text-sm">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-medium">{{ selectedManagedInstance.nome }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ selectedManagedInstance.instanceId }}</p>
              </div>
              <Badge :variant="selectedManagedInstance.status === 'CONECTADA' ? 'default' : 'outline'">{{ selectedManagedInstance.status }}</Badge>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="!selectedManagedInstance" @click="selectedManagedInstance && openEditInstance(selectedManagedInstance)">
            <PencilLine class="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" :disabled="!selectedManagedInstance" @click="selectedManagedInstance && openPaymentModal(selectedManagedInstance)">
            <CreditCard class="mr-2 h-4 w-4" />
            Pagamento
          </Button>
          <Button variant="destructive" :disabled="!selectedManagedInstance" @click="selectedManagedInstance && openDeleteModal(selectedManagedInstance)">
            <Trash2 class="mr-2 h-4 w-4" />
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="editInstanceModalOpen">
      <DialogContent class="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar instancia</DialogTitle>
          <DialogDescription>Atualize nome, Instance ID ou informe um novo token W-API.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4">
          <div class="space-y-1">
            <Label>Nome</Label>
            <Input v-model="editInstanceForm.nome" />
          </div>
          <div class="space-y-1">
            <Label>Instance ID</Label>
            <Input v-model="editInstanceForm.instanceId" />
          </div>
          <div class="space-y-1">
            <Label>Novo token</Label>
            <Input v-model="editInstanceForm.token" type="password" placeholder="Deixe vazio para manter o token atual" autocomplete="off" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="savingInstanceEdit" @click="editInstanceModalOpen = false">Cancelar</Button>
          <Button class="text-white" :disabled="savingInstanceEdit" @click="saveInstanceEdit">
            <LoaderIcon v-if="savingInstanceEdit" class="mr-2 h-4 w-4 animate-spin" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="paymentModalOpen">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pagamento da instancia</DialogTitle>
          <DialogDescription>
            Gere uma nova cobranca ou continue um pagamento pendente da instancia {{ paymentInstance?.nome || '' }}.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-lg border p-3 text-left transition hover:bg-muted"
              :class="paymentMethod === 'PIX' ? 'border-primary bg-primary/5' : ''"
              @click="paymentMethod = 'PIX'; paymentResult = null"
            >
              <Landmark class="mb-2 h-5 w-5" />
              <p class="font-medium">PIX</p>
              <p class="text-xs text-muted-foreground">Gera QR Code, copia e cola e link do ticket.</p>
            </button>
            <button
              type="button"
              class="rounded-lg border p-3 text-left transition hover:bg-muted"
              :class="paymentMethod === 'CARTAO' ? 'border-primary bg-primary/5' : ''"
              @click="paymentMethod = 'CARTAO'; paymentResult = null"
            >
              <CreditCard class="mb-2 h-5 w-5" />
              <p class="font-medium">Cartao</p>
              <p class="text-xs text-muted-foreground">Abre o checkout Stripe para renovacao automatica.</p>
            </button>
          </div>

          <Button class="w-full text-white" :disabled="creatingPayment || !paymentInstance" @click="createPayment">
            <LoaderIcon v-if="creatingPayment" class="mr-2 h-4 w-4 animate-spin" />
            Gerar pagamento
          </Button>

          <div v-if="paymentResult" class="rounded-lg border p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <p class="font-medium">{{ paymentMethodLabel(paymentResult.metodo) }}</p>
                <p class="text-xs text-muted-foreground">Status: {{ paymentResult.status }}</p>
              </div>
              <span class="rounded-full border px-2 py-0.5 text-xs" :class="paymentStatusClass(paymentResult.status)">
                {{ paymentResult.status }}
              </span>
            </div>

            <div v-if="paymentResult.metodo === 'PIX'" class="grid gap-4 md:grid-cols-[180px_1fr]">
              <div class="flex h-[180px] items-center justify-center rounded-lg border bg-white p-2">
                <img v-if="pixQrCodeSrc(paymentResult)" :src="pixQrCodeSrc(paymentResult)" alt="QR Code PIX" class="max-h-full max-w-full" />
                <QrCode v-else class="h-12 w-12 text-muted-foreground" />
              </div>
              <div class="space-y-2">
                <Textarea :model-value="paymentResult.qrCodeCopyPaste || ''" readonly class="min-h-[96px] font-mono text-xs" />
                <div class="flex flex-wrap gap-2">
                  <Button variant="outline" :disabled="!paymentResult.qrCodeCopyPaste" @click="copyToClipboard(paymentResult.qrCodeCopyPaste || '', 'PIX copiado.')">
                    <Copy class="mr-2 h-4 w-4" />
                    Copiar PIX
                  </Button>
                  <Button v-if="paymentResult.ticketUrl" variant="outline" @click="openExternalUrl(paymentResult.ticketUrl)">
                    <ExternalLink class="mr-2 h-4 w-4" />
                    Abrir ticket
                  </Button>
                </div>
              </div>
            </div>

            <div v-else class="space-y-3">
              <p class="text-sm text-muted-foreground">Checkout Stripe criado para assinatura automatica.</p>
              <Button v-if="paymentResult.checkoutUrl" class="text-white" @click="openExternalUrl(paymentResult.checkoutUrl)">
                <ExternalLink class="mr-2 h-4 w-4" />
                Abrir checkout
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="creatingPayment" @click="paymentModalOpen = false">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="deleteModalOpen">
      <DialogContent class="max-w-xl">
        <DialogHeader>
          <DialogTitle>Remover instancia</DialogTitle>
          <DialogDescription>
            A instancia sera removida do ERP e o identificador externo sera liberado para novo cadastro.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-3">
          <div class="rounded-lg border p-3">
            <p class="text-sm font-medium">{{ deleteInstanceTarget?.nome }}</p>
            <p class="text-xs text-muted-foreground">{{ deleteInstanceTarget?.instanceId }} - {{ deleteInstanceTarget?.status }}</p>
          </div>
          <p class="text-xs text-muted-foreground">Use esta acao somente quando a instancia nao deve mais aparecer no ERP.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="removingInstance" @click="deleteModalOpen = false">Cancelar</Button>
          <Button variant="destructive" :disabled="removingInstance" @click="removeInstance">
            <LoaderIcon v-if="removingInstance" class="mr-2 h-4 w-4 animate-spin" />
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="rawResultModalOpen">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ rawResultTitle }}</DialogTitle>
          <DialogDescription>Retorno tecnico completo da W-API para suporte e conferencia.</DialogDescription>
        </DialogHeader>
        <div class="overflow-hidden rounded-lg border bg-slate-950">
          <div class="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs text-slate-300">
            <span>JSON</span>
            <Button variant="ghost" size="sm" class="h-7 px-2 text-slate-100 hover:text-slate-950" @click="copyToClipboard(rawResultBody, 'Retorno copiado.')">
              <Copy class="mr-1 h-3.5 w-3.5" />
              Copiar
            </Button>
          </div>
          <pre class="max-h-[60vh] overflow-auto p-3 text-xs text-slate-50">{{ rawResultBody }}</pre>
        </div>
      </DialogContent>
    </Dialog>

    <MobileBottomBar>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="refreshAll">
        <RotateCw class="h-5 w-5" :class="loading ? 'animate-spin' : ''" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="createInstanceModalOpen = true">
        <Plus class="h-5 w-5" />
        <span class="text-xs">Nova</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:opacity-50 dark:text-gray-300"
        :disabled="!instances.length"
        @click="manageInstanceModalOpen = true"
      >
        <Smartphone class="h-5 w-5" />
        <span class="text-xs">Gerenciar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:opacity-50 dark:text-gray-300"
        :disabled="!instances.length"
        @click="instances[0] && openPaymentModal(instances[0])"
      >
        <CreditCard class="h-5 w-5" />
        <span class="text-xs">Pagar</span>
      </button>
    </MobileBottomBar>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Inbox,
  Landmark,
  LoaderIcon,
  MessageCircle,
  PencilLine,
  Plus,
  QrCode,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  Smartphone,
  Terminal,
  Trash2,
  Webhook,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { ClienteRepository } from '@/repositories/cliente-repository'
import {
  WhatsAppRepository,
  type WhatsAppConversation,
  type WhatsAppConversationStatus,
  type WhatsAppInstance,
  type WhatsAppInstancePayment,
  type WhatsAppMessage,
  type WhatsAppWebhookCallback,
  type WhatsAppWebhookSyncResult,
  type WhatsAppWebhookUrls,
} from '@/repositories/whatsapp-repository'

const toast = useToast()
const tab = ref<'instances'>('instances')
const loading = ref(false)
const savingInstance = ref(false)
const savingInstanceEdit = ref(false)
const sending = ref(false)
const creatingPayment = ref(false)
const removingInstance = ref(false)

const instances = ref<WhatsAppInstance[]>([])
const conversations = ref<WhatsAppConversation[]>([])
const messages = ref<WhatsAppMessage[]>([])
const selectedConversation = ref<WhatsAppConversation | null>(null)
const conversationSearch = ref('')
const statusFilter = ref<WhatsAppConversationStatus | undefined>(undefined)
const customerSearch = ref('')
const customerOptions = ref<Array<{ id: number; label: string }>>([])
const instanceActionResult = reactive<Record<number, string>>({})
const instanceActionSummary = reactive<Record<number, string>>({})
const instanceActionDetail = reactive<Record<number, string>>({})
const instanceActionTone = reactive<Record<number, 'success' | 'warning' | 'danger' | 'info'>>({})
const instanceActionLoading = reactive<Record<string, boolean>>({})
const instanceQrCodeImage = reactive<Record<number, string>>({})
const rawResultModalOpen = ref(false)
const rawResultTitle = ref('Retorno da W-API')
const rawResultBody = ref('')

const webhookModalOpen = ref(false)
const loadingWebhookConfig = ref(false)
const configuringWebhooks = ref(false)
const webhookInstance = ref<WhatsAppInstance | null>(null)
const webhookCallbacks = ref<WhatsAppWebhookCallback[]>([])
const webhookSyncResults = ref<WhatsAppWebhookSyncResult[]>([])
const webhookUrls = reactive<WhatsAppWebhookUrls>({})

const instanceForm = reactive({ nome: '', instanceId: '', token: '' })
const editInstanceForm = reactive({ nome: '', instanceId: '', token: '' })
const conversationForm = reactive<{ status: WhatsAppConversationStatus; setor: string }>({ status: 'ABERTA', setor: '' })
const messageForm = reactive<{ tipo: 'text' | 'image' | 'audio' | 'video' | 'document'; conteudo: string; mediaUrl: string }>({
  tipo: 'text',
  conteudo: '',
  mediaUrl: '',
})

const connectedInstances = computed(() => instances.value.filter((instance) => instance.status === 'CONECTADA').length)
const managedInstanceId = ref<number | null>(null)
const selectedManagedInstance = computed(() => instances.value.find((instance) => instance.id === managedInstanceId.value) || null)
const createInstanceModalOpen = ref(false)
const manageInstanceModalOpen = ref(false)
const editInstanceModalOpen = ref(false)
const editInstanceTarget = ref<WhatsAppInstance | null>(null)
const paymentModalOpen = ref(false)
const paymentInstance = ref<WhatsAppInstance | null>(null)
const paymentMethod = ref<'PIX' | 'CARTAO'>('PIX')
const paymentResult = ref<WhatsAppInstancePayment | null>(null)
const deletingPaymentId = ref<number | null>(null)
const deleteModalOpen = ref(false)
const deleteInstanceTarget = ref<WhatsAppInstance | null>(null)
const canSendMessage = computed(() => {
  if (!selectedConversation.value) return false
  if (selectedConversation.value.Instancia?.status !== 'CONECTADA') return false
  if (messageForm.tipo === 'text') return Boolean(messageForm.conteudo.trim())
  return Boolean(messageForm.mediaUrl.trim())
})

function setStatusFilter(status?: WhatsAppConversationStatus) {
  statusFilter.value = status
  loadConversations()
}

function conversationLabel(conversation: WhatsAppConversation) {
  return conversation.Cliente?.nome || conversation.Contato?.nome || conversation.telefone
}

function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'W'
}

function formatTime(value?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function mediaLabel(message: WhatsAppMessage) {
  const labels: Record<string, string> = {
    IMAGEM: 'Imagem',
    AUDIO: 'Áudio',
    VIDEO: 'Vídeo',
    DOCUMENTO: message.fileName || 'Documento',
  }
  return labels[message.tipo] || 'Mídia'
}

function paymentMethodLabel(method?: string | null) {
  if (method === 'PIX') return 'PIX'
  if (method === 'CARTAO') return 'Cartao'
  return '-'
}

function paymentStatusClass(status?: string | null) {
  if (status === 'PAGO') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'FALHOU') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'CANCELADO') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function latestPayment(instance: WhatsAppInstance) {
  return instance.pagamentos?.[0] || null
}

function pixQrCodeSrc(payment?: WhatsAppInstancePayment | null) {
  if (!payment?.qrCodeBase64) return ''
  return payment.qrCodeBase64.startsWith('data:')
    ? payment.qrCodeBase64
    : `data:image/png;base64,${payment.qrCodeBase64}`
}

function normalizeQrCodeImage(value?: string | null) {
  const qrCode = value?.trim()
  if (!qrCode) return ''
  return qrCode.startsWith('data:image/')
    ? qrCode
    : `data:image/png;base64,${qrCode.replace(/^data:image\/png;base64,/, '')}`
}

function extractQrCodeImage(value: unknown): string {
  if (!value || typeof value !== 'object') return ''

  const payload = value as Record<string, any>
  const candidates = [
    payload.qrcode,
    payload.qrCode,
    payload.qr_code,
    payload.qrCodeBase64,
    payload.base64,
    payload.data?.qrcode,
    payload.data?.qrCode,
    payload.data?.qr_code,
    payload.data?.qrCodeBase64,
    payload.result?.qrcode,
    payload.result?.qrCode,
    payload.result?.qr_code,
    payload.result?.qrCodeBase64,
    payload.result?.data?.qrcode,
    payload.result?.data?.qrCode,
    payload.result?.data?.qr_code,
    payload.result?.data?.qrCodeBase64,
  ]

  const qrCode = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim())
  return normalizeQrCodeImage(qrCode)
}

function openExternalUrl(url?: string | null) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function loadInstances() {
  instances.value = await WhatsAppRepository.listInstances()
  if (!managedInstanceId.value || !instances.value.some((instance) => instance.id === managedInstanceId.value)) {
    managedInstanceId.value = instances.value[0]?.id || null
  }
}

async function loadConversations() {
  const response = await WhatsAppRepository.listConversations({
    search: conversationSearch.value || undefined,
    status: statusFilter.value,
    take: 80,
  })
  conversations.value = response.items
  if (selectedConversation.value) {
    selectedConversation.value = conversations.value.find((item) => item.id === selectedConversation.value?.id) || selectedConversation.value
  }
}

async function refreshAll() {
  try {
    loading.value = true
    await loadInstances()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao atualizar atendimento WhatsApp.')
  } finally {
    loading.value = false
  }
}

function openEditInstance(instance: WhatsAppInstance) {
  editInstanceTarget.value = instance
  Object.assign(editInstanceForm, {
    nome: instance.nome,
    instanceId: instance.instanceId,
    token: '',
  })
  manageInstanceModalOpen.value = false
  editInstanceModalOpen.value = true
}

async function saveInstanceEdit() {
  if (!editInstanceTarget.value) return
  if (!editInstanceForm.nome.trim() || !editInstanceForm.instanceId.trim()) {
    toast.warning('Informe nome e Instance ID.')
    return
  }

  try {
    savingInstanceEdit.value = true
    await WhatsAppRepository.updateInstance(editInstanceTarget.value.id, {
      nome: editInstanceForm.nome,
      instanceId: editInstanceForm.instanceId,
      ...(editInstanceForm.token.trim() ? { token: editInstanceForm.token } : {}),
    })
    toast.success('Instancia atualizada.')
    editInstanceModalOpen.value = false
    await loadInstances()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar instancia.')
  } finally {
    savingInstanceEdit.value = false
  }
}

function openPaymentModal(instance: WhatsAppInstance) {
  paymentInstance.value = instance
  paymentMethod.value = 'PIX'
  paymentResult.value = null
  manageInstanceModalOpen.value = false
  paymentModalOpen.value = true
}

function openExistingPayment(instance: WhatsAppInstance, payment: WhatsAppInstancePayment) {
  paymentInstance.value = instance
  paymentMethod.value = payment.metodo
  paymentResult.value = payment
  manageInstanceModalOpen.value = false
  paymentModalOpen.value = true
}

async function createPayment() {
  if (!paymentInstance.value) return
  try {
    creatingPayment.value = true
    paymentResult.value =
      paymentMethod.value === 'PIX'
        ? await WhatsAppRepository.createPixPayment(paymentInstance.value.id)
        : await WhatsAppRepository.createCardSubscription(paymentInstance.value.id)
    await loadInstances()
    toast.success(paymentMethod.value === 'PIX' ? 'PIX gerado.' : 'Checkout de cartao gerado.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar pagamento da instancia.')
  } finally {
    creatingPayment.value = false
  }
}

function openDeleteModal(instance: WhatsAppInstance) {
  deleteInstanceTarget.value = instance
  manageInstanceModalOpen.value = false
  deleteModalOpen.value = true
}

async function removeInstance() {
  if (!deleteInstanceTarget.value) return
  try {
    removingInstance.value = true
    await WhatsAppRepository.removeInstance(deleteInstanceTarget.value.id)
    toast.success('Instancia removida.')
    deleteModalOpen.value = false
    await loadInstances()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao remover instancia.')
  } finally {
    removingInstance.value = false
  }
}

async function deletePendingPayment(instance: WhatsAppInstance, payment: WhatsAppInstancePayment) {
  if (payment.status !== 'PENDENTE') return
  try {
    deletingPaymentId.value = payment.id
    await WhatsAppRepository.removePayment(instance.id, payment.id)
    if (paymentResult.value?.id === payment.id) {
      paymentResult.value = null
    }
    toast.success('Pagamento pendente removido.')
    await loadInstances()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao remover pagamento pendente.')
  } finally {
    deletingPaymentId.value = null
  }
}

async function openConversation(conversation: WhatsAppConversation) {
  selectedConversation.value = conversation
  conversationForm.status = conversation.status
  conversationForm.setor = conversation.setor || ''
  customerSearch.value = conversation.Cliente?.nome || ''
  await loadMessages()
  if (conversation.naoLidas) await markRead()
}

async function loadMessages() {
  if (!selectedConversation.value) return
  const response = await WhatsAppRepository.listMessages(selectedConversation.value.id, { take: 80 })
  messages.value = response.items
  await nextTick()
}

async function saveInstance() {
  if (!instanceForm.nome.trim() || !instanceForm.instanceId.trim() || !instanceForm.token.trim()) {
    toast.warning('Informe nome, instance ID e token.')
    return
  }

  try {
    savingInstance.value = true
    await WhatsAppRepository.createInstance({ ...instanceForm })
    Object.assign(instanceForm, { nome: '', instanceId: '', token: '' })
    toast.success('Instância cadastrada.')
    createInstanceModalOpen.value = false
    await loadInstances()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao cadastrar instância.')
  } finally {
    savingInstance.value = false
  }
}

const actionLabels: Record<string, string> = {
  qrCode: 'QR Code',
  pairingCode: 'Código de pareamento',
  status: 'Status',
  device: 'Device',
  restart: 'Reiniciar',
  disconnect: 'Desconectar',
  setupWebhooks: 'Webhooks',
}

type InstanceActionTone = 'success' | 'warning' | 'danger' | 'info'
type InstanceActionName = Parameters<typeof WhatsAppRepository.instanceAction>[1]

function actionKey(instanceId: number, action: string) {
  return `${instanceId}:${action}`
}

function isInstanceActionLoading(instanceId: number, action: string) {
  return Boolean(instanceActionLoading[actionKey(instanceId, action)])
}

function isAnyInstanceActionLoading(instanceId: number) {
  return Object.keys(instanceActionLoading).some((key) => key.startsWith(`${instanceId}:`) && instanceActionLoading[key])
}

function stringifyResult(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function firstBoolean(values: unknown[]) {
  return values.find((value): value is boolean => typeof value === 'boolean')
}

function connectionFlagFromResult(value: any) {
  return firstBoolean([
    value?.connected,
    value?.result?.connected,
    value?.data?.connected,
    value?.instance?.connected,
    value?.connection?.connected,
  ])
}

function statusFromActionResult(value: any) {
  return value?.instance?.status || value?.status || value?.data?.status || value?.result?.status
}

function buildInstanceActionFeedback(action: InstanceActionName, result: any, hasQrCode: boolean) {
  if (hasQrCode) {
    return {
      tone: 'info' as InstanceActionTone,
      summary: 'QR Code gerado para conexao.',
      detail: 'Leia o codigo no WhatsApp pelo menu de aparelhos conectados.',
    }
  }

  if (action === 'disconnect') {
    return {
      tone: 'warning' as InstanceActionTone,
      summary: 'Instancia desconectada.',
      detail: 'A instancia nao enviara mensagens ate ser conectada novamente.',
    }
  }

  if (action === 'restart') {
    return {
      tone: 'info' as InstanceActionTone,
      summary: 'Reinicio enviado para a W-API.',
      detail: 'Aguarde alguns instantes e consulte o status novamente.',
    }
  }

  if (action === 'device') {
    return {
      tone: 'success' as InstanceActionTone,
      summary: 'Dados do aparelho sincronizados.',
      detail: 'As informacoes tecnicas da instancia foram atualizadas.',
    }
  }

  const connected = connectionFlagFromResult(result)
  const status = statusFromActionResult(result)

  if (connected === true || status === 'CONECTADA') {
    return {
      tone: 'success' as InstanceActionTone,
      summary: 'Instancia conectada.',
      detail: 'A sessao esta pronta para enviar e receber mensagens.',
    }
  }

  if (connected === false || status === 'DESCONECTADA') {
    return {
      tone: 'warning' as InstanceActionTone,
      summary: 'Instancia desconectada.',
      detail: 'Use o QR Code para reconectar antes de iniciar atendimentos.',
    }
  }

  if (status === 'ERRO') {
    return {
      tone: 'danger' as InstanceActionTone,
      summary: 'A W-API retornou erro para a instancia.',
      detail: 'Abra o JSON tecnico se precisar conferir o detalhe do provedor.',
    }
  }

  if (status === 'CONECTANDO' || status === 'PENDENTE') {
    return {
      tone: 'info' as InstanceActionTone,
      summary: 'Instancia aguardando conexao.',
      detail: 'A sessao ainda nao foi confirmada como conectada pela W-API.',
    }
  }

  return {
    tone: 'success' as InstanceActionTone,
    summary: `${actionLabels[action] || 'Acao'} executada com sucesso.`,
    detail: 'Retorno recebido e sincronizado com o ERP.',
  }
}

function instanceActionCardClass(instanceId: number) {
  const tone = instanceActionTone[instanceId]
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
  if (tone === 'warning') return 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20'
  if (tone === 'danger') return 'border-destructive/40 bg-destructive/5'
  return 'border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20'
}

function instanceActionIconClass(instanceId: number) {
  const tone = instanceActionTone[instanceId]
  if (tone === 'success') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
  if (tone === 'warning') return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
  if (tone === 'danger') return 'bg-destructive/10 text-destructive'
  return 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200'
}

function openRawResultModal(instance: WhatsAppInstance) {
  rawResultTitle.value = `Retorno tecnico - ${instance.nome}`
  rawResultBody.value = instanceActionResult[instance.id] || ''
  rawResultModalOpen.value = true
}

async function copyToClipboard(value: string, message: string) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    toast.success(message)
  } catch (error) {
    console.error(error)
    toast.error('Não foi possível copiar automaticamente.')
  }
}

function formatWebhookError(error: unknown) {
  if (!error) return 'Falha ao configurar webhook.'
  if (typeof error === 'string') return error
  return stringifyResult(error)
}

async function openWebhookModal(instance: WhatsAppInstance) {
  try {
    webhookInstance.value = instance
    loadingWebhookConfig.value = true
    webhookSyncResults.value = []
    const config = await WhatsAppRepository.getInstanceWebhooks(instance.id)
    webhookCallbacks.value = config.callbacks
    Object.keys(webhookUrls).forEach((key) => delete webhookUrls[key as keyof WhatsAppWebhookUrls])
    Object.assign(webhookUrls, config.webhookUrls)
    webhookModalOpen.value = true
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao carregar URLs de webhook.')
  } finally {
    loadingWebhookConfig.value = false
  }
}

async function confirmWebhooks() {
  if (!webhookInstance.value) return
  try {
    configuringWebhooks.value = true
    webhookSyncResults.value = []
    const result = await WhatsAppRepository.configureInstanceWebhooks(webhookInstance.value.id, webhookUrls)
    webhookSyncResults.value = result.results || []
    instanceActionResult[webhookInstance.value.id] = stringifyResult(result)
    instanceActionSummary[webhookInstance.value.id] = result.success
      ? 'Webhooks sincronizados com sucesso.'
      : 'Webhooks sincronizados parcialmente; revise os itens abaixo.'
    instanceActionDetail[webhookInstance.value.id] = result.success
      ? 'Todos os eventos configurados foram aceitos pela W-API.'
      : 'Abra o JSON tecnico para conferir quais eventos precisam de ajuste.'
    instanceActionTone[webhookInstance.value.id] = result.success ? 'success' : 'warning'
    if (result.success) toast.success('Webhooks enviados para a W-API.')
    else toast.warning('Alguns webhooks não foram aceitos pela W-API.')
    await loadInstances()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao configurar webhooks na W-API.')
  } finally {
    configuringWebhooks.value = false
  }
}

async function runInstanceAction(instance: WhatsAppInstance, action: InstanceActionName) {
  const key = actionKey(instance.id, action)
  try {
    instanceActionLoading[key] = true
    instanceQrCodeImage[instance.id] = ''
    instanceActionTone[instance.id] = 'info'
    instanceActionSummary[instance.id] = `${actionLabels[action] || 'Acao'} em andamento...`
    instanceActionDetail[instance.id] = 'Consultando a W-API e sincronizando o ERP.'
    instanceActionResult[instance.id] = 'Aguardando resposta da W-API...'
    const result = await WhatsAppRepository.instanceAction(instance.id, action)
    const qrCodeImage = action === 'qrCode' ? extractQrCodeImage(result) : ''
    const feedback = buildInstanceActionFeedback(action, result, Boolean(qrCodeImage))
    instanceActionResult[instance.id] = stringifyResult(result)
    instanceQrCodeImage[instance.id] = qrCodeImage
    instanceActionTone[instance.id] = feedback.tone
    instanceActionSummary[instance.id] = feedback.summary
    instanceActionDetail[instance.id] = feedback.detail
    if (feedback.tone === 'warning') toast.warning(feedback.summary)
    else if (feedback.tone === 'danger') toast.error(feedback.summary)
    else toast.success(feedback.summary)
    await loadInstances()
  } catch (error: any) {
    console.error(error)
    const message = error?.response?.data?.message || 'Erro ao executar ação da instância.'
    instanceActionTone[instance.id] = 'danger'
    instanceActionSummary[instance.id] = `${actionLabels[action] || 'Acao'} falhou.`
    instanceActionDetail[instance.id] = 'Nao foi possivel concluir a consulta na W-API.'
    instanceActionResult[instance.id] = message
    instanceQrCodeImage[instance.id] = ''
    toast.error(message)
  } finally {
    instanceActionLoading[key] = false
  }
}

async function sendText() {
  if (!selectedConversation.value || !canSendMessage.value) return
  try {
    sending.value = true
    await WhatsAppRepository.sendMessage(selectedConversation.value.id, {
      tipo: messageForm.tipo,
      conteudo: messageForm.conteudo || undefined,
      caption: messageForm.tipo !== 'text' ? messageForm.conteudo || undefined : undefined,
      mediaUrl: messageForm.tipo !== 'text' ? messageForm.mediaUrl : undefined,
    })
    Object.assign(messageForm, { conteudo: '', mediaUrl: '' })
    await Promise.all([loadMessages(), loadConversations()])
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao enviar mensagem.')
  } finally {
    sending.value = false
  }
}

async function markRead() {
  if (!selectedConversation.value) return
  try {
    const updated = await WhatsAppRepository.markAsRead(selectedConversation.value.id)
    selectedConversation.value = { ...selectedConversation.value, ...updated }
    await loadConversations()
  } catch (error) {
    console.error(error)
  }
}

async function updateConversation(payload: Partial<{ status: WhatsAppConversationStatus; setor: string | null; clienteId: number | null }>) {
  if (!selectedConversation.value) return
  try {
    const updated = await WhatsAppRepository.updateConversation(selectedConversation.value.id, payload)
    selectedConversation.value = updated
    conversationForm.status = updated.status
    conversationForm.setor = updated.setor || ''
    await loadConversations()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar conversa.')
  }
}

async function loadCustomers() {
  try {
    customerOptions.value = await ClienteRepository.select2(customerSearch.value)
  } catch (error) {
    console.error(error)
    customerOptions.value = []
  }
}

async function linkCustomer(value: string) {
  const id = Number(value)
  if (!id) return
  await updateConversation({ clienteId: id })
  toast.success('Cliente vinculado à conversa.')
}

useSocketEvent<WhatsAppConversation>('whatsapp:conversa:updated', async (conversation) => {
  const index = conversations.value.findIndex((item) => item.id === conversation.id)
  if (index >= 0) conversations.value[index] = { ...conversations.value[index], ...conversation }
  else await loadConversations()

  if (selectedConversation.value?.id === conversation.id) {
    selectedConversation.value = { ...selectedConversation.value, ...conversation }
  }
})

useSocketEvent<WhatsAppMessage>('whatsapp:mensagem:created', async (message) => {
  if (selectedConversation.value?.id !== message.conversaId) return
  const index = messages.value.findIndex((item) => item.id === message.id)
  if (index >= 0) messages.value[index] = message
  else messages.value.push(message)
})

useSocketEvent<WhatsAppInstance>('whatsapp:instancia:updated', async () => {
  await loadInstances()
})

onMounted(refreshAll)
</script>
