<template>
  <div class="container mx-auto space-y-5 pb-24 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MessageCircle class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Instâncias WhatsApp
        </h1>
        <p class="text-sm text-muted-foreground">
          Conexão e gerenciamento das instâncias W-API da conta. As conversas ficam no app Atendimento.
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
      <TabsContent value="instances" class="mt-4 space-y-4">
        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Card v-for="instance in instances" :key="instance.id" class="overflow-hidden">
            <CardContent class="p-4">
              <!-- Cabeçalho: identidade + status + menu -->
              <div class="flex items-start gap-3">
                <div class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Smartphone class="h-5 w-5" />
                  <span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background" :class="instanceStatusDotClass(instance.status)"></span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold leading-tight">{{ instance.nome }}</p>
                  <p class="truncate text-xs text-muted-foreground">{{ instance.instanceId }}</p>
                  <span class="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="instanceStatusPillClass(instance.status)">
                    <span class="h-1.5 w-1.5 rounded-full" :class="instanceStatusDotClass(instance.status)"></span>
                    {{ instanceStatusLabel(instance.status) }}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0 text-muted-foreground">
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44">
                    <DropdownMenuItem @click="openEditInstance(instance)">
                      <PencilLine class="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="openLogsModal(instance)">
                      <ScrollText class="mr-2 h-4 w-4" /> Logs de webhook
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="openPaymentModal(instance)">
                      <CreditCard class="mr-2 h-4 w-4" /> Pagamento
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive" @click="openDeleteModal(instance)">
                      <Trash2 class="mr-2 h-4 w-4" /> Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <!-- Metadados -->
              <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div class="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <Phone class="h-3.5 w-3.5 shrink-0" />
                  <span class="truncate text-foreground">{{ instance.numeroConectado || 'Sem número' }}</span>
                </div>
                <div class="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <Clock class="h-3.5 w-3.5 shrink-0" />
                  <span class="truncate">{{ formatTime(instance.lastSyncAt) || 'Nunca sincronizado' }}</span>
                </div>
              </div>

              <div v-if="instance.ultimoErro" class="mt-3 flex items-start gap-1.5 rounded-md border border-amber-300/60 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                <AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span class="min-w-0">{{ instance.ultimoErro }}</span>
              </div>

              <!-- Mensalidades (só a mais recente; demais no modal) -->
              <div v-if="latestPayment(instance)" class="mt-3 flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2 text-xs">
                <span class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Mensalidade</span>
                <button type="button" class="min-w-0 flex-1 truncate text-left hover:underline" @click="openExistingPayment(instance, latestPayment(instance)!)">
                  {{ paymentMethodLabel(latestPayment(instance)?.metodo) }} · {{ formatTime(latestPayment(instance)?.createdAt) }}
                </button>
                <span
                  class="shrink-0 rounded-full border px-2 py-0.5 text-[10px]"
                  :class="paymentStatusClass(latestPayment(instance)?.status)"
                >
                  {{ latestPayment(instance)?.status }}
                </span>
                <Button
                  v-if="(instance.pagamentos?.length || 0) > 1"
                  variant="ghost"
                  size="sm"
                  class="h-6 shrink-0 px-2 text-[11px]"
                  @click="openPaymentsModal(instance)"
                >
                  Ver todas
                </Button>
              </div>

              <!-- Ações de conexão -->
              <div class="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                <Button
                  v-if="instance.status !== 'CONECTADA'"
                  size="sm"
                  class="h-8 text-white"
                  :disabled="isAnyInstanceActionLoading(instance.id)"
                  @click="runInstanceAction(instance, 'qrCode')"
                >
                  <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'qrCode')" class="mr-1.5 h-4 w-4 animate-spin" />
                  <QrCode v-else class="mr-1.5 h-4 w-4" />
                  Conectar
                </Button>
                <Button variant="outline" size="icon" class="h-8 w-8" title="Verificar status" :disabled="isAnyInstanceActionLoading(instance.id)" @click="runInstanceAction(instance, 'status')">
                  <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'status')" class="h-4 w-4 animate-spin" />
                  <Wifi v-else class="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" class="h-8 w-8" title="Configurar webhooks" :disabled="loadingWebhookConfig || isAnyInstanceActionLoading(instance.id)" @click="openWebhookModal(instance)">
                  <LoaderIcon v-if="loadingWebhookConfig && webhookInstance?.id === instance.id" class="h-4 w-4 animate-spin" />
                  <Webhook v-else class="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" class="h-8 w-8" title="Reiniciar instância" :disabled="isAnyInstanceActionLoading(instance.id)" @click="confirmInstanceAction(instance, 'restart')">
                  <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'restart')" class="h-4 w-4 animate-spin" />
                  <RefreshCw v-else class="h-4 w-4" />
                </Button>
                <Button v-if="instance.status === 'CONECTADA'" variant="outline" size="icon" class="h-8 w-8 text-amber-600 hover:text-amber-700" title="Desconectar" :disabled="isAnyInstanceActionLoading(instance.id)" @click="confirmInstanceAction(instance, 'disconnect')">
                  <LoaderIcon v-if="isInstanceActionLoading(instance.id, 'disconnect')" class="h-4 w-4 animate-spin" />
                  <WifiOff v-else class="h-4 w-4" />
                </Button>
              </div>

              <div
                v-if="instanceActionResult[instance.id]"
                class="mt-3 overflow-hidden rounded-lg border bg-background"
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
            </CardContent>
          </Card>
          <Card v-if="!instances.length" class="border-dashed">
            <CardContent class="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Smartphone class="h-6 w-6" />
              </div>
              <p class="text-sm font-medium">Nenhuma instância cadastrada</p>
              <p class="max-w-xs text-xs text-muted-foreground">Cadastre uma instância da W-API para conectar um número de WhatsApp à conta.</p>
              <Button class="mt-1 text-white" @click="createInstanceModalOpen = true">
                <Plus class="mr-2 h-4 w-4" />
                Nova instância
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="webhookModalOpen">
      <DialogContent class="flex max-h-[90vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Configurar webhooks da W-API</DialogTitle>
          <DialogDescription>
            As URLs abaixo apontam para o backend deste ERP e já carregam o segredo da instância
            {{ webhookInstance?.nome ? `“${webhookInstance.nome}”` : '' }}. Confirme para enviar todas para a W-API.
          </DialogDescription>
        </DialogHeader>

        <div class="-mr-2 flex-1 space-y-4 overflow-y-auto pr-2">
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

    <Dialog v-model:open="logsModalOpen">
      <DialogContent class="flex max-h-[90vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Logs de webhook</DialogTitle>
          <DialogDescription>
            Eventos recebidos da W-API para {{ logsInstance?.nome || 'a instância' }}. Use para verificar se as mensagens estão chegando.
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-wrap items-center gap-2">
          <select v-model="logsTipo" class="h-9 rounded-md border bg-background px-3 text-sm" @change="loadLogs">
            <option value="">Todos os eventos</option>
            <option value="received">Mensagem recebida (received)</option>
            <option value="delivery">Mensagem enviada (delivery)</option>
            <option value="status">Status de mensagem</option>
            <option value="connected">Conectado</option>
            <option value="disconnected">Desconectado</option>
            <option value="presence">Presença</option>
          </select>
          <Button variant="outline" size="sm" class="h-9" :disabled="logsLoading" @click="loadLogs">
            <LoaderIcon v-if="logsLoading" class="mr-2 h-4 w-4 animate-spin" />
            <RefreshCw v-else class="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <div
          v-if="!logsLoading && logs.length && !logsTipo && logsReceivedCount === 0"
          class="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
        >
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Nenhum evento <strong>received</strong> registrado. As mensagens que o cliente envia não estão chegando ao backend:
            confira em "Webhooks" se a URL do evento <strong>received</strong> na W-API é exatamente a mostrada aqui (com o segredo) e se <code>BASE_URL</code> é público.
          </span>
        </div>

        <div class="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
          <div v-for="event in logs" :key="event.id" class="rounded-lg border">
            <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left" @click="toggleLogPayload(event.id)">
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                :class="event.tipo === 'received' ? 'bg-green-500/15 text-green-600' : 'bg-slate-500/15 text-slate-500'"
              >
                {{ webhookEventLabel(event.tipo) }}
              </span>
              <span class="min-w-0 flex-1 truncate text-xs text-muted-foreground">{{ formatTime(event.createdAt) }}</span>
              <CheckCircle2 v-if="event.processado && !event.erro" class="h-4 w-4 shrink-0 text-green-600" title="Processado" />
              <AlertTriangle v-else-if="event.erro" class="h-4 w-4 shrink-0 text-red-600" title="Erro no processamento" />
              <Clock v-else class="h-4 w-4 shrink-0 text-amber-600" title="Pendente" />
            </button>
            <div v-if="expandedLogId === event.id" class="border-t p-3">
              <p v-if="event.erro" class="mb-2 rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-600">Erro: {{ event.erro }}</p>
              <pre class="max-h-64 overflow-auto rounded-md bg-muted/50 p-2 text-[11px] leading-relaxed">{{ prettyJson(event.payload) }}</pre>
            </div>
          </div>

          <div v-if="logsLoading && !logs.length" class="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <LoaderIcon class="mr-2 h-4 w-4 animate-spin" /> Carregando eventos...
          </div>
          <div v-else-if="!logs.length" class="py-8 text-center text-sm text-muted-foreground">
            Nenhum evento de webhook registrado ainda.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="logsModalOpen = false">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="paymentsModalOpen">
      <DialogContent class="flex max-h-[85vh] max-w-lg flex-col">
        <DialogHeader>
          <DialogTitle>Mensalidades</DialogTitle>
          <DialogDescription>Cobranças geradas para {{ paymentsModalInstance?.nome || 'a instância' }}.</DialogDescription>
        </DialogHeader>

        <div class="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
          <div
            v-for="payment in paymentsModalInstance?.pagamentos || []"
            :key="payment.id"
            class="flex items-center gap-2 rounded-lg border p-2.5 text-sm"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{{ paymentMethodLabel(payment.metodo) }} · {{ formatTime(payment.createdAt) }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ payment.payerEmail }}</p>
            </div>
            <span class="shrink-0 rounded-full border px-2 py-0.5 text-[10px]" :class="paymentStatusClass(payment.status)">{{ payment.status }}</span>
            <Button variant="ghost" size="icon" class="h-7 w-7" title="Abrir pagamento" @click="openExistingPayment(paymentsModalInstance!, payment)">
              <ExternalLink class="h-3.5 w-3.5" />
            </Button>
            <Button
              v-if="payment.status === 'PENDENTE'"
              variant="ghost"
              size="icon"
              class="h-7 w-7 text-destructive hover:text-destructive"
              title="Remover pagamento pendente"
              :disabled="deletingPaymentId === payment.id"
              @click="deletePendingPayment(paymentsModalInstance!, payment)"
            >
              <LoaderIcon v-if="deletingPaymentId === payment.id" class="h-3.5 w-3.5 animate-spin" />
              <Trash2 v-else class="h-3.5 w-3.5" />
            </Button>
          </div>
          <p v-if="!(paymentsModalInstance?.pagamentos?.length)" class="py-8 text-center text-sm text-muted-foreground">
            Nenhuma cobrança gerada ainda.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="paymentsModalOpen = false">Fechar</Button>
          <Button
            v-if="paymentsModalInstance"
            class="text-white"
            @click="openPaymentModal(paymentsModalInstance!); paymentsModalOpen = false"
          >
            <CreditCard class="mr-2 h-4 w-4" />
            Gerar cobrança
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Landmark,
  LoaderIcon,
  MessageCircle,
  MoreVertical,
  PencilLine,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  RotateCw,
  ScrollText,
  Smartphone,
  Terminal,
  Trash2,
  Webhook,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useSocketEvent } from '@/composables/useSocketEvent'
import {
  WhatsAppRepository,
  type WhatsAppInstance,
  type WhatsAppInstancePayment,
  type WhatsAppWebhookCallback,
  type WhatsAppWebhookEvent,
  type WhatsAppWebhookSyncResult,
  type WhatsAppWebhookUrls,
} from '@/repositories/whatsapp-repository'

const toast = useToast()
const confirm = useConfirm()
const tab = ref<'instances'>('instances')
const loading = ref(false)
const savingInstance = ref(false)
const savingInstanceEdit = ref(false)
const creatingPayment = ref(false)
const removingInstance = ref(false)

const instances = ref<WhatsAppInstance[]>([])
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
const paymentsModalOpen = ref(false)
const paymentsModalInstanceId = ref<number | null>(null)
// Lê a instância viva da lista (para refletir exclusões de pagamento sem fechar o modal).
const paymentsModalInstance = computed(() => instances.value.find((instance) => instance.id === paymentsModalInstanceId.value) || null)

const logsModalOpen = ref(false)
const logsInstance = ref<WhatsAppInstance | null>(null)
const logs = ref<WhatsAppWebhookEvent[]>([])
const logsLoading = ref(false)
const logsTipo = ref<string>('')
const expandedLogId = ref<number | null>(null)
const logsReceivedCount = computed(() => logs.value.filter((event) => event.tipo === 'received').length)

function formatTime(value?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
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

function instanceStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    CONECTADA: 'Conectada',
    DESCONECTADA: 'Desconectada',
    CONECTANDO: 'Conectando',
    PENDENTE: 'Pendente',
    ERRO: 'Erro',
  }
  return labels[status || ''] || status || 'Desconhecido'
}

function instanceStatusDotClass(status?: string | null) {
  if (status === 'CONECTADA') return 'bg-green-500'
  if (status === 'CONECTANDO' || status === 'PENDENTE') return 'bg-amber-500'
  if (status === 'ERRO') return 'bg-red-500'
  return 'bg-slate-400'
}

function instanceStatusPillClass(status?: string | null) {
  if (status === 'CONECTADA') return 'bg-green-500/15 text-green-600'
  if (status === 'CONECTANDO' || status === 'PENDENTE') return 'bg-amber-500/15 text-amber-600'
  if (status === 'ERRO') return 'bg-red-500/15 text-red-600'
  return 'bg-slate-500/15 text-slate-500'
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

async function refreshAll() {
  try {
    loading.value = true
    await loadInstances()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao atualizar as instâncias WhatsApp.')
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

// Ações sensíveis (reiniciar/desconectar) pedem confirmação para evitar clique acidental.
async function confirmInstanceAction(instance: WhatsAppInstance, action: 'restart' | 'disconnect') {
  const options =
    action === 'disconnect'
      ? {
          title: 'Desconectar instância',
          message: `Desconectar “${instance.nome}”? O número será desvinculado e você precisará ler o QR Code novamente para reconectar.`,
          confirmText: 'Desconectar',
        }
      : {
          title: 'Reiniciar instância',
          message: `Reiniciar “${instance.nome}”? A conexão será interrompida por alguns segundos.`,
          confirmText: 'Reiniciar',
        }
  const confirmed = await confirm.confirm({ ...options, colorButton: 'warning' })
  if (!confirmed) return
  await runInstanceAction(instance, action)
}

function openPaymentsModal(instance: WhatsAppInstance) {
  paymentsModalInstanceId.value = instance.id
  paymentsModalOpen.value = true
}

async function loadLogs() {
  if (!logsInstance.value) return
  try {
    logsLoading.value = true
    logs.value = await WhatsAppRepository.listInstanceWebhookEvents(logsInstance.value.id, {
      take: 50,
      tipo: logsTipo.value || undefined,
    })
  } catch (error) {
    console.error(error)
    toast.error('Não foi possível carregar os logs de webhook.')
    logs.value = []
  } finally {
    logsLoading.value = false
  }
}

function openLogsModal(instance: WhatsAppInstance) {
  logsInstance.value = instance
  logsTipo.value = ''
  expandedLogId.value = null
  logs.value = []
  logsModalOpen.value = true
  loadLogs()
}

function toggleLogPayload(id: number) {
  expandedLogId.value = expandedLogId.value === id ? null : id
}

function prettyJson(raw?: string | null) {
  if (!raw) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function webhookEventLabel(tipo: string) {
  const labels: Record<string, string> = {
    received: 'Mensagem recebida',
    delivery: 'Mensagem enviada',
    status: 'Status de mensagem',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    presence: 'Presença',
    generic: 'Genérico',
  }
  return labels[tipo] || tipo
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

useSocketEvent<WhatsAppInstance>('whatsapp:instancia:updated', async () => {
  await loadInstances()
})

onMounted(refreshAll)
</script>
