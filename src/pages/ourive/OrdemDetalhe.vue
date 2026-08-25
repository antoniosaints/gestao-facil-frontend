<template>
  <div>
    <section v-if="order" class="space-y-6 [&_.text-muted-foreground]:text-foreground/70">
      <div class="mb-4 flex flex-col justify-between gap-3 md:flex-row">
        <div>
          <Button
            variant="ghost"
            size="sm"
            class="mb-2 -ml-2"
            @click="router.push({ name: 'ourive-ordens' })"
            ><ArrowLeft class="mr-2 h-4 w-4" />Voltar para ordens</Button
          >
          <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ClipboardList class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />{{
              order.ordemServico?.descricao
            }}
          </h2>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{{ order.codigoRastreio }}</span
            ><span>·</span>
            <span>{{ order.ordemServico?.Cliente?.nome || 'Cliente não informado' }}</span
            ><span>·</span>
            <span>{{ order.ordemServico?.Cliente?.telefone || 'Sem telefone' }}</span>
            <Badge variant="outline" class="ml-1">
              {{ order.tipo === 'ENCOMENDA' ? 'Encomenda' : 'Serviço' }}
            </Badge>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{{ label(order.status) }}</Badge>
          <Button variant="outline" size="sm" @click="historyModalOpen = true">
            <History class="mr-2 h-4 w-4" />Histórico da OS
          </Button>
          <Button v-if="can('ORCAMENTO') && !closed" variant="destructive" @click="cancel"
            >Cancelar</Button
          >
          <Button
            v-if="can('CONFIGURAR') && !order.faturadaEm"
            variant="outline"
            class="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            @click="deleteOrder"
            >Apagar ordem</Button
          >
        </div>
      </div>

      <Card class="overflow-hidden border-primary/20 shadow-sm">
        <CardHeader
          class="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4"
        >
          <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <CardTitle class="flex items-center gap-2 text-lg">
                <ListChecks class="h-5 w-5 text-primary" />Fluxo de finalização da OS
              </CardTitle>
              <CardDescription class="mt-1">
                Conclua uma etapa por vez. O andamento é atualizado automaticamente a cada ação.
              </CardDescription>
            </div>
            <Badge variant="outline" class="w-fit">Etapa atual: {{ flowCurrentLabel }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="p-4 sm:p-5">
          <ol class="grid gap-2 sm:grid-cols-5 sm:gap-3" aria-label="Etapas da ordem de serviço">
            <li v-for="(step, index) in flowSteps" :key="step.key" class="min-w-0">
              <div
                class="flex h-full gap-3 rounded-xl border p-3 transition-colors sm:block sm:text-center"
                :class="flowStepClass(index)"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:mx-auto sm:mb-2"
                  :class="flowStepIconClass(index)"
                >
                  <Check v-if="flowStepState(index) === 'done'" class="h-4 w-4" />
                  <component v-else :is="step.icon" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold">{{ step.label }}</p>
                  <p class="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {{ step.description }}
                  </p>
                </div>
              </div>
            </li>
          </ol>

          <div
            class="mt-4 rounded-xl border p-4"
            :class="flowIsInterrupted ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'"
          >
            <div
              :class="
                materialActionAvailable
                  ? 'flex flex-col gap-4'
                  : 'flex flex-col justify-between gap-4 lg:flex-row lg:items-center'
              "
            >
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Próxima ação
                </p>
                <p class="mt-1 font-semibold">{{ flowActionTitle }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ flowActionDescription }}</p>
              </div>

              <div v-if="materialActionAvailable" class="w-full space-y-3 lg:max-w-3xl">
                <div
                  v-for="need in pendingPurchaseNeeds"
                  :key="`action-need-${need.id}`"
                  class="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3"
                >
                  <p class="font-medium text-amber-900 dark:text-amber-200">Compra necessária</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ measure(need.quantidadeNecessaria, need.unidade) }} para
                    {{ need.produto?.nome || `o material #${need.produtoId}` }}.
                  </p>
                  <div class="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      v-model.number="purchaseFor(need).quantidadeComprada"
                      type="number"
                      min="0.001"
                      step="1"
                      :placeholder="`Quantidade (${unitLabel(need.unidade)})`"
                    />
                    <Input
                      v-model="purchaseFor(need).custoUnitarioReal"
                      v-maska="moneyMaskOptions"
                      type="text"
                      inputmode="decimal"
                      :placeholder="`Custo / ${unitLabel(need.unidade)}`"
                    />
                    <Button size="sm" @click="fulfillPurchase(need)">Registrar compra</Button>
                  </div>
                </div>

                <div
                  v-for="material in ['PRODUCAO', 'REVISAO'].includes(order.status)
                    ? materialsPendingReconciliation
                    : []"
                  :key="`action-material-${material.id}`"
                  class="rounded-lg border bg-muted/20 p-3"
                >
                  <p class="font-medium">
                    {{ material.produto?.nome || `Produto #${material.produtoId}` }}
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    Retirado:
                    {{
                      measure(
                        material.medidaConsumida || material.quantidadeConsumida,
                        material.unidade,
                      )
                    }}. Informe o destino de todo o material retirado.
                  </p>
                  <div class="mt-3 grid gap-2 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
                      Material utilizado ({{ unitLabel(material.unidade) }})
                      <Input
                        v-model.number="outcomeFor(material).medidaUtilizada"
                        type="number"
                        min="0"
                        :step="material.unidade === 'PESO' ? '0.001' : '1'"
                        :placeholder="`Informe o utilizado em ${unitLabel(material.unidade)}`"
                      />
                    </label>
                    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
                      Sobra devolvida ({{ unitLabel(material.unidade) }})
                      <Input
                        v-model.number="outcomeFor(material).medidaSobra"
                        type="number"
                        min="0"
                        :step="material.unidade === 'PESO' ? '0.001' : '1'"
                        :placeholder="`Informe a sobra em ${unitLabel(material.unidade)}`"
                      />
                    </label>
                    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
                      Quebra recuperável ({{ unitLabel(material.unidade) }})
                      <Input
                        v-model.number="outcomeFor(material).medidaQuebra"
                        type="number"
                        min="0"
                        :step="material.unidade === 'PESO' ? '0.001' : '1'"
                        :placeholder="`Informe a quebra em ${unitLabel(material.unidade)}`"
                      />
                    </label>
                    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
                      Perda real ({{ unitLabel(material.unidade) }})
                      <Input
                        v-model.number="outcomeFor(material).medidaPerdaReal"
                        type="number"
                        min="0"
                        :step="material.unidade === 'PESO' ? '0.001' : '1'"
                        :placeholder="`Informe a perda em ${unitLabel(material.unidade)}`"
                      />
                    </label>
                  </div>
                  <div class="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Input
                      v-model="outcomeFor(material).observacao"
                      placeholder="Observação do fechamento"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      class="shrink-0"
                      @click="finalizeMaterial(material)"
                      >Salvar resultado real</Button
                    >
                  </div>
                </div>

                <div v-if="order.status === 'PRODUCAO' && !closed" class="rounded-lg border p-3">
                  <p class="mb-2 text-sm font-semibold">Registrar custo extra</p>
                  <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end">
                    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
                      Descrição do custo
                      <Input v-model="extra.descricao" placeholder="Ex.: gravação terceirizada" />
                    </label>
                    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
                      Valor (R$)
                      <Input
                        v-model="extra.valor"
                        v-maska="moneyMaskOptions"
                        type="text"
                        inputmode="decimal"
                        placeholder="0,00"
                      />
                    </label>
                    <Button size="sm" @click="addCost">Adicionar</Button>
                  </div>
                </div>
              </div>
              <div
                v-else-if="order.status === 'PRODUCAO' && can('PRODUCAO')"
                class="w-full space-y-2 lg:w-[26rem]"
              >
                <label class="grid gap-1 text-sm font-medium">
                  Peso final <span class="font-normal text-muted-foreground">(opcional, em g)</span>
                  <Input
                    v-model.number="productionWeight"
                    type="number"
                    min="0.001"
                    step="0.001"
                    placeholder="Ex.: 10,500 — deixe em branco se não se aplicar"
                  />
                </label>
                <Button class="w-full" @click="finishProduction">
                  <CheckCircle2 class="mr-2 h-4 w-4" />Concluir produção
                </Button>
                <details class="rounded-lg border bg-muted/20 p-3 text-sm">
                  <summary class="cursor-pointer font-medium">Registrar custo extra</summary>
                  <div class="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end">
                    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
                      Descrição do custo
                      <Input v-model="extra.descricao" placeholder="Ex.: gravação terceirizada" />
                    </label>
                    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
                      Valor (R$)
                      <Input
                        v-model="extra.valor"
                        v-maska="moneyMaskOptions"
                        type="text"
                        inputmode="decimal"
                        placeholder="0,00"
                      />
                    </label>
                    <Button size="sm" @click="addCost">Adicionar</Button>
                  </div>
                </details>
              </div>
              <div
                v-else-if="
                  financialActionAvailable ||
                  (can('ENTREGAR') && order.status === 'PRONTA_ENTREGA' && currentBudgetApproved)
                "
                class="flex flex-wrap gap-2"
              >
                <Button
                  v-if="financialActionAvailable"
                  variant="outline"
                  @click="financialModalOpen = true"
                >
                  <FileText class="mr-2 h-4 w-4" />Revisar e consolidar financeiro
                </Button>
                <Button
                  v-if="
                    can('ENTREGAR') && order.status === 'PRONTA_ENTREGA' && currentBudgetApproved
                  "
                  @click="deliver"
                >
                  <Handshake class="mr-2 h-4 w-4" />Entregar e faturar
                </Button>
              </div>
              <Button
                v-else-if="
                  can('ORCAMENTO') &&
                  order.status === 'ORCAMENTO' &&
                  currentBudget &&
                  !currentBudget.enviadoEm &&
                  !currentBudget.aprovadoEm &&
                  !currentBudget.recusadoEm
                "
                @click="approveBudgetInternally"
              >
                <CheckCircle2 class="mr-2 h-4 w-4" />Aprovar internamente e continuar
              </Button>
              <Button
                v-else-if="
                  can('PRODUCAO') &&
                  ['ORCAMENTO', 'PRONTA_PRODUCAO'].includes(order.status) &&
                  currentBudgetApproved
                "
                :disabled="pendingPurchaseNeeds.length > 0"
                @click="start"
              >
                <Play class="mr-2 h-4 w-4" />Iniciar produção
              </Button>
              <Button
                v-else-if="can('ENTREGAR') && ['FINALIZADA', 'REVISAO'].includes(order.status)"
                @click="markReadyForDelivery"
              >
                <ClipboardCheck class="mr-2 h-4 w-4" />Concluir revisão e liberar entrega
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fluxo</p>
          <p class="mt-1 font-semibold">{{ label(order.status) }}</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Peças / itens
          </p>
          <p class="mt-1 text-2xl font-bold">{{ order.pecas?.length || 0 }}</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Materiais</p>
          <p class="mt-1 text-2xl font-bold">{{ order.materiais?.length || 0 }}</p>
        </div>
        <div
          class="rounded-xl border p-4 shadow-sm"
          :class="pendingPurchaseNeeds.length ? 'border-amber-500/40 bg-amber-500/5' : 'bg-card'"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Compras pendentes
          </p>
          <p class="mt-1 text-2xl font-bold">{{ pendingPurchaseNeeds.length }}</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="space-y-6">
          <Card
            ><CardHeader
              ><CardTitle>{{
                order.tipo === 'ENCOMENDA' ? 'Itens da encomenda' : 'Peças sob custódia'
              }}</CardTitle
              ><CardDescription>{{
                order.tipo === 'ENCOMENDA'
                  ? 'Especificações e rastreio individual da produção.'
                  : 'Fotos, checklist de recebimento e rastreio individual.'
              }}</CardDescription></CardHeader
            ><CardContent class="space-y-5"
              ><div v-for="piece in order.pecas" :key="piece.id" class="rounded-xl border p-4">
                <div class="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <p class="font-semibold">{{ piece.codigoRastreio }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ piece.descricao }}<span v-if="piece.metal"> · {{ piece.metal }}</span
                      ><span v-if="piece.pedras"> · {{ piece.pedras }}</span>
                    </p>
                  </div>
                  <label
                    v-if="can('RECEBER')"
                    class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary"
                    ><Upload class="h-4 w-4" />Adicionar foto<input
                      class="hidden"
                      type="file"
                      accept="image/*"
                      @change="uploadPhoto(piece, $event)"
                  /></label>
                </div>
                <p v-if="piece.estadoConservacao" class="mt-3 text-sm">
                  <span class="font-medium">Estado:</span> {{ piece.estadoConservacao }}
                </p>
                <div v-if="checklist(piece).length" class="mt-3 flex flex-wrap gap-2">
                  <Badge v-for="item in checklist(piece)" :key="item" variant="outline">{{
                    item
                  }}</Badge>
                </div>
                <div v-if="piece.fotos?.length" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div
                    v-for="photo in piece.fotos"
                    :key="photo.id"
                    class="group relative overflow-hidden rounded-lg border bg-muted"
                  >
                    <button type="button" class="block w-full" @click="photoPreview = photo.url">
                      <img
                        :src="photo.url"
                        :alt="photo.descricao || `Foto da peça ${piece.codigoRastreio}`"
                        class="aspect-square h-full w-full object-cover transition group-hover:scale-105"
                      /></button
                    ><Button
                      v-if="can('RECEBER')"
                      type="button"
                      size="icon"
                      variant="destructive"
                      class="absolute right-2 top-2 h-8 w-8 opacity-100 shadow-sm sm:opacity-0 sm:group-hover:opacity-100"
                      :disabled="removingPhotoId === photo.id"
                      :aria-label="`Excluir foto da peça ${piece.codigoRastreio}`"
                      @click="removePhoto(photo)"
                      ><Trash2 class="h-4 w-4"
                    /></Button>
                  </div>
                </div>
                <p
                  v-else
                  class="mt-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground"
                >
                  Nenhuma foto registrada para esta peça.
                </p>
              </div></CardContent
            ></Card
          >

          <Card
            ><CardHeader
              ><CardTitle>Orçamento versionado</CardTitle
              ><CardDescription
                >Serviços, desconto, prazo e materiais planejados antes da baixa.</CardDescription
              ></CardHeader
            ><CardContent class="space-y-5"
              ><div v-if="can('ORCAMENTO') && !budgetLocked" class="space-y-3">
                <div
                  v-for="(service, index) in budget.servicos"
                  :key="index"
                  class="grid gap-2 sm:grid-cols-[1fr_6rem_9rem_auto]"
                >
                  <Input v-model="service.descricao" placeholder="Serviço" />
                  <Input
                    v-model.number="service.quantidade"
                    :icon-label="'Un'"
                    type="number"
                    min="1"
                    placeholder="Qtd."
                  /><Input
                    :icon-label="'R$'"
                    icon-label-position="left"
                    v-model="service.valor"
                    v-maska="moneyMaskOptions"
                    type="text"
                    inputmode="decimal"
                    placeholder="0,00"
                  /><Button variant="ghost" size="icon" @click="budget.servicos.splice(index, 1)"
                    ><Trash2 class="h-4 w-4"
                  /></Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  @click="budget.servicos.push({ descricao: '', quantidade: 1, valor: 0 })"
                  ><Plus class="mr-2 h-4 w-4" />Serviço</Button
                >
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="grid gap-1 text-sm font-medium"
                    >Desconto
                    <Input
                      :icon-label="'R$'"
                      icon-label-position="left"
                      v-model="budget.desconto"
                      v-maska="moneyMaskOptions"
                      type="text"
                      inputmode="decimal"
                      placeholder="0,00" /></label
                  ><label class="grid gap-1 text-sm font-medium"
                    >Prazo previsto <Calendarpicker v-model="budget.prazoPrevisto" :teleport="true"
                  /></label>
                </div>
                <div class="space-y-2 rounded-lg border p-3">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold">Materiais planejados</p>
                      <p class="text-xs text-muted-foreground">
                        Adicione cada material em um formulário separado, com validação de estoque.
                      </p>
                    </div>
                    <Button type="button" size="sm" @click="openMaterialModal()"
                      ><Plus class="mr-2 h-4 w-4" />Adicionar material</Button
                    >
                  </div>
                  <div v-if="budget.materiais.length" class="grid gap-2 sm:grid-cols-2">
                    <div
                      v-for="(material, index) in budget.materiais"
                      :key="`${material.produtoId}-${index}`"
                      class="rounded-lg border bg-muted/20 p-3"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold">
                            {{ material.produtoNome || `Material #${material.produtoId}` }}
                          </p>
                          <p class="mt-1 text-xs text-muted-foreground">
                            {{ measure(material.quantidade, material.unidade) }} ·
                            {{ material.fornecidoPeloCliente ? 'Cliente' : 'Estoque da empresa' }}
                            <span v-if="material.pecaId"> · {{ pieceCode(material.pecaId) }} </span>
                          </p>
                        </div>
                        <div class="flex shrink-0 gap-1">
                          <Button size="sm" variant="ghost" @click="openMaterialModal(index as number)"
                            >Editar</Button
                          >
                          <Button
                            size="icon"
                            variant="ghost"
                            class="text-destructive hover:text-destructive"
                            :aria-label="`Remover ${material.produtoNome || 'material'}`"
                            @click="budget.materiais.splice(index, 1)"
                            ><Trash2 class="h-4 w-4"
                          /></Button>
                        </div>
                      </div>
                      <p
                        v-if="missingMaterial(material)"
                        class="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-800 dark:text-amber-300"
                      >
                        Compra necessária: faltam
                        {{ measure(missingMeasure(material), material.unidade) }}.
                      </p>
                    </div>
                  </div>
                  <p
                    v-else
                    class="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground"
                  >
                    Nenhum material adicionado ao orçamento.
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Salve a nova versão antes de gerar o link para que o cliente veja os materiais e
                    valores atualizados.
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <Button @click="saveBudget">Salvar nova versão</Button
                  ><Button v-if="currentBudget" variant="outline" @click="sendBudget"
                    >Gerar link de aprovação</Button
                  >
                  <div class="ml-auto text-right text-sm">
                    <p class="text-muted-foreground">Serviços: {{ money(subtotalBudget) }}</p>
                    <p v-if="materialCompanyValue" class="text-muted-foreground">
                      Materiais da empresa: {{ money(materialCompanyValue) }}
                    </p>
                    <p v-if="monetaryValue(budget.desconto)" class="font-medium text-destructive">
                      Desconto: − {{ money(budget.desconto) }}
                    </p>
                    <p class="font-semibold">Total: {{ money(totalBudget) }}</p>
                  </div>
                </div>
                <div v-if="budgetLink" class="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <p class="min-w-0 flex-1 break-all text-xs">{{ budgetLink }}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    class="shrink-0"
                    @click="copyBudgetLink"
                    ><Copy class="mr-2 h-4 w-4" />Copiar link</Button
                  >
                </div>
              </div>
              <div v-else-if="currentBudget" class="rounded-lg border p-4">
                <p class="font-semibold">
                  Versão {{ currentBudget.versao }} · {{ money(currentBudget.valorFinal) }}
                </p>
                <div
                  v-if="can('ORCAMENTO') && currentBudget.enviadoEm"
                  class="mt-3 flex flex-wrap items-center gap-2"
                >
                  <Button v-if="!budgetLink" size="sm" variant="outline" @click="sendBudget">
                    {{
                      currentBudget.aprovadoEm || currentBudget.recusadoEm
                        ? 'Gerar link do comprovante'
                        : 'Gerar novo link de aprovação'
                    }}
                  </Button>
                  <template v-else>
                    <Button type="button" size="sm" @click="copyBudgetLink"
                      ><Copy class="mr-2 h-4 w-4" />Copiar link</Button
                    >
                    <Button type="button" size="sm" variant="outline" @click="openBudgetLink"
                      >Abrir link</Button
                    >
                  </template>
                </div>
                <div v-if="budgetLink" class="mt-3 rounded-lg bg-muted p-3">
                  <p class="text-xs font-medium">Link de aceite / comprovante</p>
                  <p class="mt-1 break-all text-xs text-muted-foreground">{{ budgetLink }}</p>
                </div>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{
                    currentBudget.aprovadoEm
                      ? 'Aprovado'
                      : currentBudget.recusadoEm
                        ? 'Recusado'
                        : currentBudget.enviadoEm
                          ? 'Aguardando cliente'
                          : 'Rascunho'
                  }}
                </p>
              </div>
              <p v-else class="text-sm text-muted-foreground">
                Nenhum orçamento criado.
              </p></CardContent
            ></Card
          >
        </div>
        <div class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produção e prazo</CardTitle>
              <CardDescription
                >Pesos finais, datas e encerramento operacional da OS.</CardDescription
              >
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-lg border p-3">
                  <p class="text-xs font-medium uppercase text-muted-foreground">Prazo previsto</p>
                  <p class="mt-1 font-semibold">{{ formatDate(order.prazoPrevisto) }}</p>
                </div>
                <div class="rounded-lg border p-3">
                  <p class="text-xs font-medium uppercase text-muted-foreground">Peso final</p>
                  <p class="mt-1 font-semibold">
                    {{
                      order.pesoFinal
                        ? `${Number(order.pesoFinal).toLocaleString('pt-BR')} g`
                        : 'Não informado'
                    }}
                  </p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                Início: {{ formatDateTime(order.producaoIniciadaEm) }} · Finalização:
                {{ formatDateTime(order.producaoFinalizadaEm) }}
              </p>
            </CardContent>
          </Card>

          <Card v-if="can('FINANCEIRO')">
            <CardHeader>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Financeiro da OS</CardTitle>
                  <CardDescription
                    >Memória de cálculo, divisão e repasses do ourives.</CardDescription
                  >
                </div>
                <Badge variant="outline">{{ financialStatusLabel(financial?.status) }}</Badge>
              </div>
            </CardHeader>
            <CardContent v-if="financial" class="space-y-4">
              <div class="grid gap-2 sm:grid-cols-2">
                <div class="rounded-lg border p-3">
                  <p class="text-xs text-muted-foreground">Valor cobrado</p>
                  <p class="mt-1 font-semibold">
                    {{ money(financial.detalhamento?.valorCobrado) }}
                  </p>
                </div>
                <div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p class="text-xs text-muted-foreground">Lucro líquido da loja</p>
                  <p class="mt-1 font-semibold text-emerald-700 dark:text-emerald-300">
                    {{ money(financialDetail.lucroLiquido) }}
                  </p>
                </div>
              </div>
              <div v-if="financial.repasses?.length" class="space-y-2">
                <p class="text-sm font-semibold">Repasses gerados</p>
                <div
                  v-for="repasse in financial.repasses"
                  :key="repasse.id"
                  class="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <span>{{ repasse.usuario?.nome || `Ourives #${repasse.usuarioId}` }}</span>
                  <span class="font-semibold"
                    >{{ money(repasse.valor) }} · {{ repasse.status }}</span
                  >
                </div>
              </div>
              <p v-if="!financial.consolidadoEm" class="text-sm text-muted-foreground">
                A revisão e a consolidação são apresentadas em <strong>Próxima ação</strong> após a
                entrega.
              </p>
              <div v-else class="flex flex-wrap gap-2">
                <Button variant="outline" @click="financialModalOpen = true"
                  >Ver demonstrativo financeiro</Button
                >
                <Button
                  v-if="financial.status !== 'PAGO'"
                  variant="outline"
                  @click="reopenFinancial"
                  >Reabrir financeiro</Button
                >
              </div>
            </CardContent>
            <CardContent v-else class="text-sm text-muted-foreground"
              >Aguardando orçamento aprovado.</CardContent
            >
          </Card>

          <Card
            ><CardHeader
              ><CardTitle>Materiais e custos</CardTitle
              ><CardDescription
                >Consumo real, sobra, quebra, perda e compras vinculadas à OS.</CardDescription
              ></CardHeader
            ><CardContent class="space-y-3"
              ><div
                v-for="need in pendingPurchaseNeeds"
                :key="`need-${need.id}`"
                class="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3"
              >
                <p class="font-medium text-amber-900 dark:text-amber-200">Compra necessária</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ measure(need.quantidadeNecessaria, need.unidade) }} para
                  {{ need.produto?.nome || `o material #${need.produtoId}` }}. Registre a compra
                  para liberar o início da produção.
                </p>
                <p v-if="can('PRODUCAO')" class="mt-3 text-xs text-muted-foreground">
                  Registre esta compra em <strong>Próxima ação</strong>, no fluxo da OS.
                </p>
              </div>
              <div
                v-for="material in order.materiais"
                :key="material.id"
                class="rounded-lg border p-3"
              >
                <p class="font-medium">
                  {{ material.produto?.nome || `Produto #${material.produtoId}` }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Previsto:
                  {{
                    measure(
                      material.medidaPlanejada || material.quantidadePlanejada,
                      material.unidade,
                    )
                  }}
                  · Retirado:
                  {{
                    measure(
                      material.medidaConsumida || material.quantidadeConsumida,
                      material.unidade,
                    )
                  }}
                  ·
                  {{
                    material.fornecidoPeloCliente
                      ? 'Fornecido pelo cliente'
                      : `Valor no orçamento: ${money(material.valorUnitario)}/${unitLabel(material.unidade)}`
                  }}
                  · Custo interno: {{ money(material.custoSnapshot) }}/{{
                    unitLabel(material.unidade)
                  }}
                </p>
                <p v-if="material.finalizadoEm" class="mt-1 text-xs text-muted-foreground">
                  Utilizado: {{ measure(material.medidaUtilizada, material.unidade) }} · Sobra:
                  {{ measure(material.medidaSobra, material.unidade) }} · Quebra:
                  {{ measure(material.medidaQuebra, material.unidade) }} · Perda real:
                  {{ measure(material.medidaPerdaReal, material.unidade) }}
                </p>
                <p
                  v-if="material.finalizadoEm && (Number(material.medidaSobra) || Number(material.medidaQuebra))"
                  class="mt-1 text-xs text-amber-700 dark:text-amber-300"
                >
                  Sobra/quebra pendente de pesagem e consolidação em <strong>Sobras e quebras</strong>.
                </p>
                <p
                  v-else-if="can('PRODUCAO') && ['PRODUCAO', 'REVISAO'].includes(order.status)"
                  class="mt-2 text-xs text-muted-foreground"
                >
                  A conciliação deste material está disponível em <strong>Próxima ação</strong>.
                </p>
              </div>
              <p v-if="!order.materiais?.length" class="text-sm text-muted-foreground">
                Sem materiais planejados.
              </p>
              <div class="border-t pt-4">
                <p class="mb-2 text-sm font-semibold">Custo extra</p>
                <p
                  v-if="can('PRODUCAO') && order.status === 'PRODUCAO'"
                  class="text-xs text-muted-foreground"
                >
                  Registre custos extras em <strong>Próxima ação</strong> enquanto a produção
                  estiver em andamento.
                </p>
                <p class="mt-2 text-sm">
                  Acumulado: <strong>{{ money(order.custoExtra) }}</strong>
                </p>
              </div></CardContent
            ></Card
          >
        </div>
      </div>
    </section>
    <div v-else class="p-10 text-center text-sm text-muted-foreground">Carregando ordem…</div>
    <Dialog v-model:open="historyModalOpen">
      <DialogContent class="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico da OS</DialogTitle>
          <DialogDescription>
            {{ order?.codigoRastreio }} · movimentações de estoque e rastreabilidade do processo.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-5 py-2 lg:grid-cols-2">
          <section class="rounded-xl border p-4">
            <h3 class="font-semibold">Movimentações de estoque</h3>
            <div class="mt-4 space-y-2">
              <div
                v-for="movement in order?.movimentacoes || []"
                :key="movement.id"
                class="rounded-lg border p-3 text-sm"
              >
                <p class="font-medium">
                  {{ movement.tipo }} ·
                  {{ movement.Produto?.nome || `Produto #${movement.produtoId}` }}
                </p>
                <p class="mt-1 text-muted-foreground">
                  {{ movement.quantidade }} un. ·
                  {{ new Date(movement.data).toLocaleString('pt-BR') }}
                </p>
              </div>
              <p
                v-if="!(order?.movimentacoes || []).length"
                class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
              >
                Ainda não houve movimentação.
              </p>
            </div>
          </section>
          <section class="rounded-xl border p-4">
            <h3 class="font-semibold">Rastreabilidade</h3>
            <div class="mt-4 space-y-3">
              <div
                v-for="event in order?.eventos || []"
                :key="event.id"
                class="border-l-2 border-primary/60 pl-3"
              >
                <p class="text-sm">{{ event.descricao }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ new Date(event.createdAt).toLocaleString('pt-BR') }}
                </p>
              </div>
              <p
                v-if="!(order?.eventos || []).length"
                class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
              >
                Nenhum evento registrado.
              </p>
            </div>
          </section>
        </div>
        <DialogFooter
          ><Button variant="outline" @click="historyModalOpen = false">Fechar</Button></DialogFooter
        >
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="financialModalOpen">
      <DialogContent class="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Demonstrativo financeiro da OS</DialogTitle>
          <DialogDescription>
            {{ order?.codigoRastreio }} · confira receitas, custos, repasses e o resultado líquido
            antes de consolidar.
          </DialogDescription>
        </DialogHeader>

        <div v-if="financial" class="space-y-5 py-2">
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium uppercase text-muted-foreground">Receita aprovada</p>
              <p class="mt-1 text-xl font-bold">{{ money(financialDetail.valorCobrado) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">Total que será cobrado do cliente.</p>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium uppercase text-muted-foreground">Custo operacional</p>
              <p class="mt-1 text-xl font-bold">
                {{ money(financialDetail.custoTotalOperacional) }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                Materiais consumidos e custos extras.
              </p>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium uppercase text-muted-foreground">Repasse aos ourives</p>
              <p class="mt-1 text-xl font-bold">{{ money(financialDetail.repasseOurives) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ financial.memoria?.percentualOurives }}% da base após os custos.
              </p>
            </div>
            <div class="rounded-xl border border-emerald-500/35 bg-emerald-500/5 p-4">
              <p class="text-xs font-medium uppercase text-muted-foreground">
                Lucro líquido da loja
              </p>
              <p class="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {{ money(financialDetail.lucroLiquido) }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                Margem de {{ percent(financialDetail.margemLiquidaPercentual) }} sobre a receita.
              </p>
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <section class="rounded-xl border p-4">
              <h3 class="font-semibold">Composição da receita</h3>
              <p class="mt-1 text-xs text-muted-foreground">
                Valores aprovados pelo cliente no orçamento atual.
              </p>
              <div class="mt-4 space-y-3 text-sm">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-medium">Serviços e demais valores</p>
                    <p class="text-xs text-muted-foreground">
                      Após materiais e desconto do orçamento.
                    </p>
                  </div>
                  <strong>{{ money(financialServiceRevenue) }}</strong>
                </div>
                <div class="flex items-start justify-between gap-4 border-t pt-3">
                  <div>
                    <p class="font-medium">Materiais cobrados</p>
                    <p class="text-xs text-muted-foreground">
                      Somente materiais fornecidos pela loja.
                    </p>
                  </div>
                  <strong>{{ money(financialDetail.valorMateriaisLoja) }}</strong>
                </div>
                <div class="flex items-center justify-between border-t pt-3 text-base">
                  <strong>Receita total</strong
                  ><strong>{{ money(financialDetail.valorCobrado) }}</strong>
                </div>
              </div>
            </section>

            <section class="rounded-xl border p-4">
              <h3 class="font-semibold">Como o resultado é calculado</h3>
              <p class="mt-1 text-xs text-muted-foreground">
                O lucro líquido considera todos os desembolsos desta OS.
              </p>
              <div class="mt-4 space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <span>Receita aprovada</span
                  ><strong>{{ money(financialDetail.valorCobrado) }}</strong>
                </div>
                <div class="flex justify-between gap-4 text-destructive">
                  <span>− Custo real dos materiais</span
                  ><strong>{{ money(financialDetail.custoMaterialLoja) }}</strong>
                </div>
                <div class="flex justify-between gap-4 text-destructive">
                  <span>− Custos extras</span
                  ><strong>{{ money(financialDetail.outrosCustos) }}</strong>
                </div>
                <div class="flex justify-between gap-4 border-t pt-2">
                  <span>Base disponível para divisão</span
                  ><strong>{{ money(financial.memoria?.baseDivisao) }}</strong>
                </div>
                <div class="flex justify-between gap-4 text-destructive">
                  <span>− Repasse aos ourives ({{ financial.memoria?.percentualOurives }}%)</span
                  ><strong>{{ money(financialDetail.repasseOurives) }}</strong>
                </div>
                <div
                  class="flex justify-between gap-4 border-t pt-2 text-base text-emerald-700 dark:text-emerald-300"
                >
                  <strong>= Lucro líquido da loja</strong
                  ><strong>{{ money(financialDetail.lucroLiquido) }}</strong>
                </div>
              </div>
              <div class="mt-4 grid gap-2 sm:grid-cols-2">
                <div class="rounded-lg bg-muted p-3">
                  <p class="text-xs text-muted-foreground">Margem líquida</p>
                  <p class="font-semibold">
                    {{ percent(financialDetail.margemLiquidaPercentual) }}
                  </p>
                  <p class="text-xs text-muted-foreground">Lucro ÷ receita.</p>
                </div>
                <div class="rounded-lg bg-muted p-3">
                  <p class="text-xs text-muted-foreground">Retorno sobre o custo</p>
                  <p class="font-semibold">
                    {{ percent(financialDetail.retornoSobreCustoPercentual) }}
                  </p>
                  <p class="text-xs text-muted-foreground">Lucro ÷ custos e repasses.</p>
                </div>
              </div>
            </section>
          </div>

          <section class="rounded-xl border p-4">
            <h3 class="font-semibold">Onde o dinheiro foi gasto</h3>
            <p class="mt-1 text-xs text-muted-foreground">
              Quantidade efetivamente custeada, preço interno e total de cada item.
            </p>
            <div class="mt-4 space-y-2">
              <div
                v-for="material in financialDetail.materiais || []"
                :key="material.id"
                class="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div>
                  <p class="font-medium">{{ material.nome }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{
                      material.origem === 'CLIENTE' ? 'Fornecido pelo cliente' : 'Estoque da loja'
                    }}
                    · {{ measure(material.medidaCusteada, material.unidade) }} ×
                    {{ money(material.custoUnitario) }}/{{ unitLabel(material.unidade) }}
                  </p>
                </div>
                <strong :class="material.origem === 'CLIENTE' ? 'text-muted-foreground' : ''">
                  {{
                    material.origem === 'CLIENTE'
                      ? 'Sem custo para a loja'
                      : money(material.custoTotal)
                  }}
                </strong>
              </div>
              <p
                v-if="!financialDetail.materiais?.length"
                class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
              >
                Nenhum material foi lançado nesta OS.
              </p>
            </div>
            <div v-if="financialDetail.custosExtras?.length" class="mt-4 border-t pt-4">
              <p class="mb-2 text-sm font-semibold">Custos extras</p>
              <div
                v-for="cost in financialDetail.custosExtras"
                :key="cost.id"
                class="flex items-start justify-between gap-4 py-2 text-sm"
              >
                <div>
                  <p class="font-medium">{{ cost.descricao }}</p>
                  <p v-if="cost.createdAt" class="text-xs text-muted-foreground">
                    {{ formatDateTime(cost.createdAt) }}
                  </p>
                </div>
                <strong>{{ money(cost.valor) }}</strong>
              </div>
            </div>
          </section>

          <section v-if="!financial.consolidadoEm" class="rounded-xl border bg-muted/20 p-4">
            <h3 class="font-semibold">Dados para consolidação</h3>
            <label class="mt-4 grid gap-1 text-sm font-medium">
              Mão de obra informativa (não altera o cálculo)
              <div class="flex gap-2">
                <Input
                  v-model="financialLabor"
                  v-maska="moneyMaskOptions"
                  type="text"
                  inputmode="decimal"
                  placeholder="0,00"
                />
                <Button variant="outline" @click="saveFinancialLabor">Salvar</Button>
              </div>
              <span class="text-xs font-normal text-muted-foreground">
                O custo efetivo do trabalho é representado pelo repasse aos ourives, evitando
                descontar a mão de obra duas vezes.
              </span>
            </label>
            <div class="mt-4">
              <p class="text-sm font-semibold">Ourives responsáveis pelo serviço</p>
              <p class="mt-1 text-xs text-muted-foreground">
                O repasse de {{ money(financialDetail.repasseOurives) }} será dividido entre os
                profissionais selecionados.
              </p>
              <div v-if="financialOurives.length" class="mt-3 grid gap-2 sm:grid-cols-2">
                <label
                  v-for="member in financialOurives"
                  :key="member.id"
                  class="flex cursor-pointer items-center gap-2 rounded-lg border bg-background p-3 text-sm transition"
                  :class="
                    financialOuriveIds.includes(member.id)
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'hover:bg-muted'
                  "
                >
                  <input
                    v-model="financialOuriveIds"
                    type="checkbox"
                    :value="member.id"
                    class="h-4 w-4 accent-primary"
                  />
                  <span class="min-w-0">
                    <span class="block truncate font-medium">{{ member.nome }}</span>
                    <span class="block truncate text-xs text-muted-foreground">{{
                      member.email
                    }}</span>
                  </span>
                </label>
              </div>
              <p v-else class="mt-3 text-sm text-destructive">
                Nenhum usuário ativo possui o papel de Ourive.
              </p>
              <div
                v-if="projectedOuriveSplits.length"
                class="mt-3 rounded-lg border bg-background p-3"
              >
                <p class="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Previsão dos repasses
                </p>
                <div
                  v-for="split in projectedOuriveSplits"
                  :key="split.usuarioId"
                  class="flex justify-between gap-4 py-1 text-sm"
                >
                  <span>{{ split.nome }}</span
                  ><strong>{{ money(split.valor) }}</strong>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="financial.repasses?.length" class="rounded-xl border p-4">
            <h3 class="font-semibold">Repasses consolidados</h3>
            <div
              v-for="repasse in financial.repasses"
              :key="repasse.id"
              class="mt-2 flex justify-between gap-4 text-sm"
            >
              <span>{{ repasse.usuario?.nome || `Ourives #${repasse.usuarioId}` }}</span>
              <strong>{{ money(repasse.valor) }} · {{ repasse.status }}</strong>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="financialModalOpen = false">Fechar</Button>
          <Button
            v-if="financial && !financial.consolidadoEm"
            :disabled="!financialOuriveIds.length || consolidatingFinancial"
            @click="consolidateFinancial"
            >{{ consolidatingFinancial ? 'Consolidando…' : 'Confirmar consolidação' }}</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="materialModalOpen">
      <DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{
            editingMaterialIndex === null ? 'Adicionar material' : 'Editar material'
          }}</DialogTitle>
          <DialogDescription>
            Informe a origem, a medida e os valores. O estoque da empresa é validado antes da
            produção.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-2 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-medium sm:col-span-2"
            >Material
            <Select2Ajax
              v-model="materialDraft.produtoId"
              url="/produtos/select2"
              placeholder="Selecione o material"
              @update:model-value="updateMaterialCost(materialDraft, $event)"
            />
          </label>
          <label class="grid gap-1 text-sm font-medium"
            >Origem
            <select
              v-model="materialDraft.fornecidoPeloCliente"
              class="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option :value="false">Estoque da empresa</option>
              <option :value="true">Fornecido pelo cliente</option>
            </select>
          </label>
          <label class="grid gap-1 text-sm font-medium"
            >Medição
            <select
              v-model="materialDraft.unidade"
              class="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="QUANTIDADE">Quantidade</option>
              <option value="PESO">Peso (g)</option>
            </select>
          </label>
          <label class="grid gap-1 text-sm font-medium"
            >Peça vinculada
            <select
              v-model.number="materialDraft.pecaId"
              class="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option :value="undefined">Todas as peças</option>
              <option v-for="piece in order?.pecas || []" :key="piece.id" :value="piece.id">
                {{ piece.codigoRastreio }}
              </option>
            </select>
          </label>
          <label class="grid gap-1 text-sm font-medium"
            >{{ materialDraft.unidade === 'PESO' ? 'Peso previsto (g)' : 'Quantidade prevista' }}
            <Input
              :icon-label="materialDraft.unidade === 'PESO' ? 'g' : 'un.'"
              v-model.number="materialDraft.quantidade"
              type="number"
              min="0.001"
              :placeholder="materialDraft.unidade === 'PESO' ? 'Ex.: 10,5' : 'Ex.: 10'"
              :step="
                materialDraft.unidade === 'PESO' && materialDraft.fornecidoPeloCliente
                  ? '0.001'
                  : '1'
              "
            />
          </label>
          <label class="grid gap-1 text-sm font-medium"
            >Custo interno / {{ materialDraft.unidade === 'PESO' ? 'g' : 'un.' }}
            <Input
              :icon-label="'R$'"
              icon-label-position="left"
              v-model="materialDraft.custoUnitario"
              v-maska="moneyMaskOptions"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
            />
          </label>
          <label class="grid gap-1 text-sm font-medium"
            >Valor cobrado / {{ materialDraft.unidade === 'PESO' ? 'g' : 'un.' }}
            <Input
              :icon-label="'R$'"
              icon-label-position="left"
              v-model="materialDraft.valorUnitario"
              v-maska="moneyMaskOptions"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              :disabled="materialDraft.fornecidoPeloCliente"
            />
          </label>
          <label class="grid gap-1 text-sm font-medium sm:col-span-2"
            >Observação
            <Input
              v-model="materialDraft.observacao"
              placeholder="Ex.: ouro reaproveitável, liga, referência"
            />
          </label>
          <p
            v-if="missingMaterial(materialDraft)"
            class="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 sm:col-span-2 dark:text-amber-300"
          >
            Compra necessária: faltam
            {{ measure(missingMeasure(materialDraft), materialDraft.unidade) }} no estoque da loja.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="materialModalOpen = false"
            >Cancelar</Button
          >
          <Button type="button" @click="saveMaterialDraft">Adicionar ao orçamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Teleport to="body">
      <div
        v-if="photoPreview"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
        @click="photoPreview = ''"
      >
        <img
          :src="photoPreview"
          alt="Visualização da foto da peça"
          class="max-h-[95vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
          @click.stop
        />
        <button
          type="button"
          class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Fechar visualização"
          @click="photoPreview = ''"
        >
          <X class="h-5 w-5" />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Copy,
  FileText,
  Handshake,
  History,
  ListChecks,
  Play,
  Plus,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { OuriveRepository, type OuriveCapability } from '@/repositories/ourive-repository'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { SiteRepository } from '@/repositories/site-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useConfirm } from '@/composables/useConfirm'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { moneyMaskOptions } from '@/lib/imaska'
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters'
import { vMaska } from 'maska/vue'
const route = useRoute()
const router = useRouter()
const toast = useToast()
const ui = useUiStore()
const order = ref<any>()
const financial = ref<any>()
const financialLabor = ref<number | string>(0)
const financialTeam = ref<any[]>([])
const financialOuriveIds = ref<number[]>([])
const consolidatingFinancial = ref(false)
const financialModalOpen = ref(false)
const historyModalOpen = ref(false)
const productionWeight = ref<number | '' | undefined>()
const budgetLink = ref('')
const photoPreview = ref('')
const removingPhotoId = ref<number | null>(null)
const materialOutcomes = reactive<Record<number, any>>({})
const purchaseInputs = reactive<Record<number, any>>({})
const extra = reactive<{ descricao: string; valor: number | string }>({ descricao: '', valor: '' })
const materialModalOpen = ref(false)
const editingMaterialIndex = ref<number | null>(null)
const emptyMaterial = () => ({
  produtoId: undefined as number | undefined,
  produtoNome: '',
  pecaId: undefined as number | undefined,
  fornecidoPeloCliente: false,
  unidade: 'QUANTIDADE',
  custoUnitario: 0,
  valorUnitario: 0,
  quantidade: 1,
  observacao: '',
  estoqueDisponivel: undefined as number | undefined,
})
const materialDraft = reactive<any>(emptyMaterial())
const emptyBudget = () => ({
  servicos: [{ descricao: '', quantidade: 1, valor: 0 }],
  desconto: 0,
  prazoPrevisto: null as Date | null,
  materiais: [] as Array<any>,
})
const budget = reactive<any>(emptyBudget())
const monetaryValue = (value: string | number | null | undefined) => formatToNumberValue(value ?? 0)
const can = (capability: OuriveCapability) => ui.hasOuriveCapability(capability)
const financialOurives = computed(() =>
  financialTeam.value.filter(
    (member) => member.status === 'ATIVO' && member.papeis?.includes('OURIVE'),
  ),
)
const closed = computed(() => ['ENTREGUE', 'RECUSADA', 'CANCELADA'].includes(order.value?.status))
const budgetLocked = computed(() =>
  [
    'AGUARDANDO_MATERIAL',
    'PRONTA_PRODUCAO',
    'PRODUCAO',
    'FINALIZADA',
    'REVISAO',
    'PRONTA_ENTREGA',
    'ENTREGUE',
    'RECUSADA',
    'CANCELADA',
  ].includes(order.value?.status),
)
const currentBudget = computed(() => order.value?.orcamentos?.[0])
const currentBudgetApproved = computed(() => Boolean(currentBudget.value?.aprovadoEm))
const pendingPurchaseNeeds = computed(() =>
  (order.value?.necessidadesCompra || []).filter((need: any) => need.status === 'PENDENTE'),
)
const materialsPendingReconciliation = computed(() =>
  (order.value?.materiais || []).filter((material: any) => !material.finalizadoEm),
)
const materialActionAvailable = computed(() => {
  if (!can('PRODUCAO')) return false
  if (order.value?.status === 'AGUARDANDO_MATERIAL') return pendingPurchaseNeeds.value.length > 0
  return (
    ['PRODUCAO', 'REVISAO'].includes(order.value?.status) &&
    (pendingPurchaseNeeds.value.length > 0 || materialsPendingReconciliation.value.length > 0)
  )
})
const financialActionAvailable = computed(
  () =>
    can('FINANCEIRO') &&
    ['PRONTA_ENTREGA', 'ENTREGUE'].includes(order.value?.status) &&
    Boolean(financial.value) &&
    !financial.value?.consolidadoEm,
)
const flowSteps = [
  { key: 'RECEBIMENTO', label: 'Recebimento', description: 'OS registrada', icon: ClipboardList },
  { key: 'ORCAMENTO', label: 'Orçamento', description: 'Planejar e aprovar', icon: FileText },
  { key: 'PRODUCAO', label: 'Produção', description: 'Executar a peça', icon: Wrench },
  { key: 'REVISAO', label: 'Revisão', description: 'Conferir e liberar', icon: ClipboardCheck },
  { key: 'ENTREGA', label: 'Entrega', description: 'Faturar e concluir', icon: Handshake },
]
const flowIsInterrupted = computed(() => ['RECUSADA', 'CANCELADA'].includes(order.value?.status))
const flowStepIndex = computed(() => {
  switch (order.value?.status) {
    case 'ORCAMENTO':
    case 'AGUARDANDO_MATERIAL':
    case 'PRONTA_PRODUCAO':
      return 1
    case 'PRODUCAO':
      return 2
    case 'FINALIZADA':
    case 'REVISAO':
      return 3
    case 'PRONTA_ENTREGA':
    case 'ENTREGUE':
      return 4
    default:
      return 0
  }
})
const flowCurrentLabel = computed(() =>
  flowIsInterrupted.value
    ? label(order.value?.status || '')
    : flowSteps[flowStepIndex.value]?.label || 'Recebimento',
)
const flowStepState = (index: number) => {
  if (flowIsInterrupted.value) return 'pending'
  if (order.value?.status === 'ENTREGUE') return 'done'
  if (index < flowStepIndex.value) return 'done'
  return index === flowStepIndex.value ? 'active' : 'pending'
}
const flowStepClass = (index: number) => {
  const state = flowStepState(index)
  if (state === 'done') return 'border-emerald-500/35 bg-emerald-500/5'
  if (state === 'active') return 'border-primary/55 bg-primary/10 shadow-sm'
  return 'border-border bg-card opacity-70'
}
const flowStepIconClass = (index: number) => {
  const state = flowStepState(index)
  if (state === 'done') return 'border-emerald-500/40 bg-emerald-500 text-white'
  if (state === 'active') return 'border-primary bg-primary text-primary-foreground'
  return 'border-border bg-muted text-muted-foreground'
}
const flowActionTitle = computed(() => {
  if (flowIsInterrupted.value) return 'Esta ordem foi encerrada.'
  if (materialActionAvailable.value)
    return order.value?.status === 'AGUARDANDO_MATERIAL'
      ? 'Registre as compras necessárias para liberar a produção.'
      : 'Concilie os materiais antes de concluir a produção.'
  if (financialActionAvailable.value)
    return order.value?.status === 'PRONTA_ENTREGA'
      ? 'Conclua a entrega e revise o financeiro da OS.'
      : 'Revise e consolide o financeiro da OS.'
  switch (order.value?.status) {
    case 'RECEBIDA':
      return 'Monte a primeira versão do orçamento.'
    case 'ORCAMENTO':
      return currentBudget.value?.enviadoEm && !currentBudgetApproved.value
        ? 'Aguarde a aprovação do orçamento.'
        : currentBudget.value
          ? 'Escolha como aprovar o orçamento para continuar.'
          : 'Finalize e envie o orçamento para aprovação.'
    case 'AGUARDANDO_MATERIAL':
      return 'Aguarde a compra dos materiais necessários.'
    case 'PRONTA_PRODUCAO':
      return 'A produção pode ser iniciada.'
    case 'PRODUCAO':
      return 'Finalize materiais e etapas para concluir a produção.'
    case 'FINALIZADA':
    case 'REVISAO':
      return 'Revise o resultado e libere a OS para entrega.'
    case 'PRONTA_ENTREGA':
      return 'Confirme a entrega e gere o faturamento.'
    case 'ENTREGUE':
      return 'Processo concluído e faturamento registrado.'
    default:
      return 'Acompanhe o andamento da ordem.'
  }
})
const flowActionDescription = computed(() => {
  if (flowIsInterrupted.value) return 'Nenhuma nova ação é necessária para esta OS.'
  if (materialActionAvailable.value)
    return order.value?.status === 'AGUARDANDO_MATERIAL'
      ? 'Informe a compra de cada item pendente. O estoque será atualizado e a OS seguirá automaticamente.'
      : 'Registre utilização, sobra, quebra ou perda de cada material retirado.'
  if (financialActionAvailable.value)
    return order.value?.status === 'PRONTA_ENTREGA'
      ? 'Você pode conferir os valores agora e confirmar a entrega quando o item for liberado ao cliente.'
      : 'Confira receitas, custos e repasses no demonstrativo antes de confirmar a consolidação.'
  switch (order.value?.status) {
    case 'RECEBIDA':
      return 'Preencha os serviços, materiais e prazo na seção de orçamento abaixo.'
    case 'ORCAMENTO':
      return currentBudget.value?.enviadoEm && !currentBudgetApproved.value
        ? 'Assim que o orçamento for aprovado, a OS seguirá para produção ou compra de material.'
        : currentBudget.value
          ? 'Para serviços rápidos, aprove internamente. Caso precise do aceite do cliente, gere o link de aprovação abaixo.'
          : 'Salve a versão e gere o link de aprovação quando estiver pronta.'
    case 'AGUARDANDO_MATERIAL':
      return `${pendingPurchaseNeeds.value.length} compra(s) pendente(s) precisam ser registradas antes da produção.`
    case 'PRONTA_PRODUCAO':
      return 'Os materiais estão disponíveis e o orçamento já foi aprovado.'
    case 'PRODUCAO':
      return 'O peso final é opcional. Você pode concluir a OS sem informá-lo.'
    case 'FINALIZADA':
    case 'REVISAO':
      return 'A liberação confirma que a produção e a conferência estão concluídas.'
    case 'PRONTA_ENTREGA':
      return 'Esta ação cria a receita da OS e deixa o valor pendente de recebimento.'
    case 'ENTREGUE':
      return 'Consulte o financeiro e a rastreabilidade da OS abaixo.'
    default:
      return ''
  }
})
const subtotalBudget = computed(() =>
  budget.servicos.reduce(
    (total: number, item: any) => total + Number(item.quantidade || 0) * monetaryValue(item.valor),
    0,
  ),
)
const materialCompanyValue = computed(() =>
  budget.materiais.reduce(
    (total: number, item: any) =>
      item.fornecidoPeloCliente
        ? total
        : total + Number(item.quantidade || 0) * monetaryValue(item.valorUnitario),
    0,
  ),
)
const totalBudget = computed(() =>
  Math.max(0, subtotalBudget.value + materialCompanyValue.value - monetaryValue(budget.desconto)),
)
const financialDetail = computed<any>(() => {
  const raw = financial.value?.detalhamento || {}
  const memory = financial.value?.memoria || {}
  const valorCobrado = monetaryValue(raw.valorCobrado ?? memory.valorBruto)
  const valorMateriaisLoja = monetaryValue(raw.valorMateriaisLoja)
  const custoMaterialLoja = monetaryValue(raw.custoMaterialLoja ?? memory.custoMaterialLoja)
  const outrosCustos = monetaryValue(raw.outrosCustos ?? memory.outrosCustos)
  const baseDivisao = Math.max(0, valorCobrado - custoMaterialLoja - outrosCustos)
  const percentualOurives = monetaryValue(memory.percentualOurives)
  const percentualLoja = monetaryValue(memory.percentualLoja ?? 100 - percentualOurives)
  const repassesConsolidados = (financial.value?.repasses || []).reduce(
    (total: number, repasse: any) => total + monetaryValue(repasse.valor),
    0,
  )
  const valorLojaCalculado = Math.round(((baseDivisao * percentualLoja) / 100) * 100) / 100
  const repasseOurives = repassesConsolidados || baseDivisao - valorLojaCalculado
  const custoTotalOperacional = custoMaterialLoja + outrosCustos
  const custoTotalComRepasses = custoTotalOperacional + repasseOurives
  const lucroLiquido = valorCobrado - custoTotalComRepasses
  const margemLiquidaPercentual = valorCobrado ? (lucroLiquido * 100) / valorCobrado : 0
  const retornoSobreCustoPercentual = custoTotalComRepasses
    ? (lucroLiquido * 100) / custoTotalComRepasses
    : 0
  const materiais = raw.materiais?.length
    ? raw.materiais
    : (order.value?.materiais || []).map((material: any) => {
        const medidaCusteada = material.finalizadoEm
          ? Number(material.medidaUtilizada || 0) + Number(material.medidaPerdaReal || 0)
          : Number(material.medidaConsumida || material.medidaPlanejada || 0)
        const custoUnitario = material.fornecidoPeloCliente
          ? 0
          : monetaryValue(material.custoSnapshot)
        return {
          id: material.id,
          nome: material.produto?.nome || `Material #${material.produtoId}`,
          origem: material.fornecidoPeloCliente ? 'CLIENTE' : 'LOJA',
          unidade: material.unidade,
          medidaCusteada,
          custoUnitario,
          custoTotal: custoUnitario * medidaCusteada,
          valorCobrado: material.fornecidoPeloCliente
            ? 0
            : monetaryValue(material.valorUnitario) * Number(material.medidaPlanejada || 0),
        }
      })
  const custosExtras = raw.custosExtras?.length
    ? raw.custosExtras
    : (order.value?.eventos || [])
        .filter((event: any) => event.tipo === 'CUSTO_EXTRA')
        .map((event: any) => ({
          id: event.id,
          descricao: event.descricao,
          valor: monetaryValue(event.dados?.valor),
          createdAt: event.createdAt,
        }))

  return {
    ...raw,
    valorCobrado,
    valorMateriaisLoja,
    custoMaterialLoja,
    outrosCustos,
    baseDivisao,
    materiais,
    custosExtras,
    custoTotalOperacional,
    repasseOurives,
    custoTotalComRepasses,
    lucroLiquido,
    margemLiquidaPercentual,
    retornoSobreCustoPercentual,
  }
})
const financialServiceRevenue = computed(() =>
  Math.max(
    0,
    monetaryValue(financialDetail.value.valorCobrado) -
      monetaryValue(financialDetail.value.valorMateriaisLoja),
  ),
)
const projectedOuriveSplits = computed(() => {
  const ids = [...new Set(financialOuriveIds.value.map(Number))].sort((a, b) => a - b)
  if (!ids.length) return []
  const totalCents = Math.round(monetaryValue(financialDetail.value.repasseOurives) * 100)
  const baseCents = Math.floor(totalCents / ids.length)
  let remainder = totalCents - baseCents * ids.length
  return ids.map((usuarioId) => ({
    usuarioId,
    nome:
      financialOurives.value.find((member) => Number(member.id) === usuarioId)?.nome ||
      `Ourives #${usuarioId}`,
    valor: (baseCents + (remainder-- > 0 ? 1 : 0)) / 100,
  }))
})
const money = (value: unknown) => formatCurrencyBR((value ?? 0) as string | number)
const percent = (value: unknown) =>
  `${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
const label = (status: string) =>
  (
    ({
      RECEBIDA: 'Recebida',
      ORCAMENTO: 'Orçamento',
      PRODUCAO: 'Produção',
      AGUARDANDO_MATERIAL: 'Aguardando material',
      PRONTA_PRODUCAO: 'Pronta para produção',
      FINALIZADA: 'Finalizada',
      REVISAO: 'Revisão',
      PRONTA_ENTREGA: 'Pronta para entrega',
      ENTREGUE: 'Entregue',
      RECUSADA: 'Recusada',
      CANCELADA: 'Cancelada',
    }) as Record<string, string>
  )[status] || status
const checklist = (piece: any) =>
  Array.isArray(piece.checklistRecebimento) ? piece.checklistRecebimento : []
const unitLabel = (unit: string) => (unit === 'PESO' ? 'g' : 'un.')
const measure = (value: unknown, unit: string) =>
  `${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: unit === 'PESO' ? 3 : 0,
  })} ${unitLabel(unit)}`
const stockUnits = (material: any) => Math.round(Number(material.quantidade || 0))
const missingMaterial = (material: any) =>
  material.fornecidoPeloCliente || material.estoqueDisponivel == null
    ? 0
    : Math.max(0, stockUnits(material) - Number(material.estoqueDisponivel || 0))
const missingMeasure = (material: any) => missingMaterial(material)
const formatDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : 'Não informado'
const formatDateTime = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleString('pt-BR') : 'Pendente'
const financialStatusLabel = (status?: string) =>
  (
    ({
      ABERTO: 'Aberto',
      CALCULADO: 'Calculado',
      CONSOLIDADO: 'Consolidado',
      PAGO: 'Pago',
    }) as Record<string, string>
  )[status || ''] || 'Aberto'
const pieceCode = (pieceId: number) =>
  order.value?.pecas?.find((piece: any) => piece.id === Number(pieceId))?.codigoRastreio ||
  'Peça vinculada'
function resetMaterialDraft(material = emptyMaterial()) {
  Object.keys(materialDraft).forEach((key) => delete materialDraft[key])
  Object.assign(materialDraft, material)
}
function openMaterialModal(index?: number) {
  editingMaterialIndex.value = typeof index === 'number' ? index : null
  resetMaterialDraft(typeof index === 'number' ? { ...budget.materiais[index] } : emptyMaterial())
  materialModalOpen.value = true
}
function saveMaterialDraft() {
  if (!materialDraft.produtoId || Number(materialDraft.quantidade) <= 0)
    return toast.info('Selecione o material e informe uma quantidade válida.')
  const material = {
    ...materialDraft,
    produtoId: Number(materialDraft.produtoId),
    pecaId: materialDraft.pecaId ? Number(materialDraft.pecaId) : undefined,
    quantidade: Number(materialDraft.quantidade),
    custoUnitario: monetaryValue(materialDraft.custoUnitario),
    valorUnitario: monetaryValue(materialDraft.valorUnitario),
    fornecidoPeloCliente: Boolean(materialDraft.fornecidoPeloCliente),
  }
  if (editingMaterialIndex.value === null) budget.materiais.push(material)
  else budget.materiais.splice(editingMaterialIndex.value, 1, material)
  materialModalOpen.value = false
}
function outcomeFor(material: any) {
  if (!materialOutcomes[material.id]) {
    const consumed = Number(material.medidaConsumida || material.medidaPlanejada || 0)
    materialOutcomes[material.id] = {
      medidaUtilizada: consumed || '',
      medidaSobra: '',
      medidaQuebra: '',
      medidaPerdaReal: '',
      observacao: '',
    }
  }
  return materialOutcomes[material.id]
}
function purchaseFor(need: any) {
  if (!purchaseInputs[need.id])
    purchaseInputs[need.id] = {
      quantidadeComprada: Number(need.quantidadeNecessaria || 0),
      custoUnitarioReal: 0,
    }
  return purchaseInputs[need.id]
}
function hydrateBudget() {
  const current = currentBudget.value
  const next = current
    ? {
        servicos: current.servicos || [],
        desconto: Number(current.desconto || 0),
        prazoPrevisto: current.prazoPrevisto ? new Date(current.prazoPrevisto) : null,
        materiais:
          order.value.materiais
            ?.filter((material: any) => !material.quantidadeConsumida)
            .map((material: any) => ({
              produtoId: material.produtoId,
              produtoNome: material.produto?.nome || '',
              pecaId: material.pecaId || undefined,
              fornecidoPeloCliente: Boolean(material.fornecidoPeloCliente),
              unidade: material.unidade || 'QUANTIDADE',
              custoUnitario: Number(material.custoSnapshot || 0),
              valorUnitario: Number(material.valorUnitario ?? material.custoSnapshot ?? 0),
              quantidade: Number(material.medidaPlanejada || material.quantidadePlanejada),
              observacao: material.observacao || '',
            })) || [],
      }
    : emptyBudget()
  Object.assign(budget, next)
  budgetLink.value = current?.tokenPublico
    ? `${window.location.origin}/ourive/orcamento/${current.tokenPublico}`
    : ''
}
async function updateMaterialCost(material: any, produtoId: number | string | null) {
  const id = Number(produtoId)
  material.produtoId = id || undefined
  if (!id) {
    material.custoUnitario = 0
    return
  }
  try {
    const response = await ProdutoVarianteRepository.get(id)
    // O select lista variantes; o custo precisa vir da mesma variante escolhida.
    if (Number(material.produtoId) !== id) return
    const produto = response?.data || response
    const custo = Number(produto?.custoMedioProducao ?? produto?.precoCompra ?? 0)
    material.custoUnitario = custo
    material.produtoNome = produto?.nome || material.produtoNome || ''
    // O custo é interno; o orçamento parte do preço de venda da variante e pode ser
    // ajustado para a negociação específica desta OS.
    material.valorUnitario = Number(produto?.preco ?? custo)
    material.estoqueDisponivel = Number(produto?.estoque ?? 0)
  } catch {
    if (Number(material.produtoId) === id) {
      material.custoUnitario = 0
      material.valorUnitario = 0
    }
    toast.error('Não foi possível carregar o custo do material.')
  }
}
async function load() {
  try {
    order.value = await OuriveRepository.ordem(Number(route.params.id))
    hydrateBudget()
    productionWeight.value = order.value.pesoFinal ? Number(order.value.pesoFinal) : undefined
    if (can('FINANCEIRO')) await loadFinancial()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar a ordem.')
  }
}
async function loadFinancial() {
  try {
    financial.value = await OuriveRepository.financeiroOrdem(Number(route.params.id))
    if (!financialTeam.value.length) {
      financialTeam.value = await OuriveRepository.equipe().catch(() => [])
    }
    const availableIds = new Set(financialOurives.value.map((member) => Number(member.id)))
    const savedIds = (financial.value?.responsavelIds || [])
      .map(Number)
      .filter((id: number) => availableIds.has(id))
    financialOuriveIds.value = savedIds.length
      ? savedIds
      : financialOuriveIds.value.filter((id) => availableIds.has(id))
    financialLabor.value = Number(financial.value?.detalhamento?.valorMaoObra || 0)
  } catch {
    financial.value = undefined
  }
}
async function finishProduction() {
  const parsedWeight = Number(productionWeight.value)
  const finalWeight =
    productionWeight.value === '' ||
    productionWeight.value == null ||
    !Number.isFinite(parsedWeight)
      ? undefined
      : parsedWeight
  if (finalWeight !== undefined && (!Number.isFinite(finalWeight) || finalWeight <= 0))
    return toast.info('Informe um peso final válido ou deixe o campo em branco.')
  try {
    await OuriveRepository.finalizarProducao(order.value.id, finalWeight)
    await load()
    toast.success(
      finalWeight === undefined
        ? 'Produção finalizada sem peso final informado.'
        : 'Produção finalizada com peso final registrado.',
    )
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível finalizar a produção.')
  }
}
async function markReadyForDelivery() {
  try {
    await OuriveRepository.atualizarStatus(order.value.id, { status: 'PRONTA_ENTREGA' })
    await load()
    toast.success('Ordem pronta para entrega.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar a ordem.')
  }
}
async function saveFinancialLabor() {
  try {
    await OuriveRepository.atualizarFinanceiroOrdem(order.value.id, {
      valorMaoObra: monetaryValue(financialLabor.value),
    })
    await loadFinancial()
    toast.success('Mão de obra atualizada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar o financeiro.')
  }
}
async function consolidateFinancial() {
  if (!financialOuriveIds.value.length)
    return toast.info('Selecione ao menos um ourives responsável pela OS.')
  consolidatingFinancial.value = true
  try {
    await OuriveRepository.consolidarFinanceiroOrdem(order.value.id, financialOuriveIds.value)
    await load()
    financialModalOpen.value = false
    toast.success('Financeiro consolidado e repasses gerados.')
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message || 'Não foi possível consolidar o financeiro.',
    )
  } finally {
    consolidatingFinancial.value = false
  }
}
async function reopenFinancial() {
  const motivo = window.prompt('Informe o motivo da reabertura:')
  if (!motivo) return
  try {
    await OuriveRepository.reabrirFinanceiroOrdem(order.value.id, motivo)
    await load()
    toast.success('Financeiro reaberto.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível reabrir o financeiro.')
  }
}
useSocketEvent<{
  ordemId: number
  status: 'APROVADO' | 'RECUSADO'
  versao: number
}>('ourive:ordem-atualizada', async (event) => {
  if (event.ordemId !== Number(route.params.id)) return
  await load()
  toast.success(
    event.status === 'APROVADO'
      ? `Orçamento versão ${event.versao} aprovado pelo cliente.`
      : `Orçamento versão ${event.versao} recusado pelo cliente.`,
  )
})
async function uploadPhoto(piece: any, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const uploaded = await SiteRepository.uploadSiteImage(file)
    await OuriveRepository.adicionarFoto(piece.id, {
      url: uploaded.publicUrl || uploaded.url,
      descricao: `Foto da peça ${piece.codigoRastreio}`,
    })
    await load()
    toast.success('Foto adicionada à galeria.')
  } catch {
    toast.error('Não foi possível enviar a foto.')
  } finally {
    input.value = ''
  }
}
async function removePhoto(photo: any) {
  const confirmed = await useConfirm().confirm({
    title: 'Excluir foto',
    message: 'A foto será removida da galeria desta peça. Esta ação não pode ser desfeita.',
    confirmText: 'Excluir foto',
    colorButton: 'danger',
  })
  if (!confirmed) return
  removingPhotoId.value = photo.id
  try {
    await OuriveRepository.excluirFoto(photo.id)
    await load()
    toast.success('Foto excluída da galeria.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível excluir a foto.')
  } finally {
    removingPhotoId.value = null
  }
}
async function saveBudget() {
  if (
    !budget.servicos.length ||
    budget.servicos.some((item: any) => !item.descricao || Number(item.quantidade) < 1) ||
    budget.materiais.some((item: any) => !item.produtoId || Number(item.quantidade) <= 0)
  )
    return toast.info('Complete os serviços e materiais planejados.')
  try {
    await OuriveRepository.salvarOrcamento(order.value.id, {
      ...budget,
      servicos: budget.servicos.map((item: any) => ({
        ...item,
        quantidade: Number(item.quantidade),
        valor: monetaryValue(item.valor),
      })),
      prazoPrevisto: budget.prazoPrevisto || undefined,
      desconto: monetaryValue(budget.desconto),
      materiais: budget.materiais.map((item: any) => ({
        produtoId: Number(item.produtoId),
        pecaId: item.pecaId || undefined,
        fornecidoPeloCliente: Boolean(item.fornecidoPeloCliente),
        custoUnitario: monetaryValue(item.custoUnitario),
        valorUnitario: monetaryValue(item.valorUnitario),
        quantidade: Number(item.quantidade),
        unidade: item.unidade || 'QUANTIDADE',
        observacao: item.observacao || undefined,
      })),
    })
    await load()
    toast.success('Nova versão do orçamento salva.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar o orçamento.')
  }
}
async function approveBudgetInternally() {
  const confirmed = await useConfirm().confirm({
    title: 'Aprovar orçamento internamente?',
    message:
      'Use esta opção somente quando o aceite do cliente não for necessário. A OS seguirá para a próxima etapa e o registro ficará como aprovação interna.',
    confirmText: 'Aprovar e continuar',
  })
  if (!confirmed) return
  try {
    await OuriveRepository.decidirOrcamentoInterno(order.value.id, {
      aprovar: true,
      observacao: 'Aprovação interna para serviço rápido.',
    })
    await load()
    toast.success('Orçamento aprovado internamente. A OS pode seguir para a próxima etapa.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível aprovar o orçamento.')
  }
}
async function sendBudget() {
  try {
    const result = await OuriveRepository.enviarOrcamento(order.value.id)
    budgetLink.value = `${window.location.origin}${result.url}`
    await load()
    toast.success(result.comprovante ? 'Link do comprovante gerado.' : 'Link seguro gerado.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível gerar o link.')
  }
}
async function copyBudgetLink() {
  if (!budgetLink.value) return
  try {
    await navigator.clipboard.writeText(budgetLink.value)
    toast.success('Link de aprovação copiado.')
  } catch {
    toast.error('Não foi possível copiar o link. Selecione e copie manualmente.')
  }
}
function openBudgetLink() {
  if (budgetLink.value) window.open(budgetLink.value, '_blank', 'noopener,noreferrer')
}
async function start() {
  try {
    await OuriveRepository.iniciarProducao(order.value.id)
    await load()
    toast.success('Produção iniciada e materiais baixados.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível iniciar a produção.')
  }
}
async function deliver() {
  try {
    await OuriveRepository.entregar(order.value.id)
    await load()
    toast.success('Entrega faturada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível faturar a entrega.')
  }
}
async function finalizeMaterial(material: any) {
  const outcome = outcomeFor(material)
  try {
    await OuriveRepository.finalizarMaterial(material.id, {
      ...outcome,
      medidaUtilizada: Number(outcome.medidaUtilizada || 0),
      medidaSobra: Number(outcome.medidaSobra || 0),
      medidaQuebra: Number(outcome.medidaQuebra || 0),
      medidaPerdaReal: Number(outcome.medidaPerdaReal || 0),
    })
    await load()
    if (Number(outcome.medidaSobra || 0) || Number(outcome.medidaQuebra || 0))
      toast.success('Resultado registrado. A sobra/quebra aguarda pesagem em Sobras e quebras.')
    else toast.success('Resultado real do material registrado.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível fechar o material.')
  }
}
async function fulfillPurchase(need: any) {
  const purchase = purchaseFor(need)
  if (!Number(purchase.quantidadeComprada)) return
  try {
    await OuriveRepository.atenderNecessidadeCompra(need.id, {
      quantidadeComprada: Number(purchase.quantidadeComprada),
      custoUnitarioReal: monetaryValue(purchase.custoUnitarioReal),
    })
    await load()
    toast.success('Compra registrada e estoque atualizado.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível registrar a compra.')
  }
}
async function addCost() {
  if (!extra.descricao || monetaryValue(extra.valor) <= 0) return
  try {
    await OuriveRepository.adicionarCustoExtra(order.value.id, {
      descricao: extra.descricao,
      valor: monetaryValue(extra.valor),
    })
    extra.descricao = ''
    extra.valor = ''
    await load()
    toast.success('Custo extra registrado.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível registrar o custo.')
  }
}
async function cancel() {
  const motivo = window.prompt('Informe o motivo do cancelamento:')
  if (!motivo) return
  try {
    await OuriveRepository.cancelar(order.value.id, motivo)
    await load()
    toast.success('Ordem cancelada.')
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message ||
        'Devolva integralmente os materiais antes de cancelar.',
    )
  }
}
async function deleteOrder() {
  const confirmed = await useConfirm().confirm({
    title: 'Apagar ordem de serviço',
    message:
      'A OS, suas peças, orçamento, etapas e histórico serão apagados definitivamente. Ordens faturadas ou com estoque movimentado não podem ser apagadas.',
    confirmText: 'Apagar definitivamente',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    await OuriveRepository.excluirOrdem(order.value.id)
    toast.success('Ordem apagada com sucesso.')
    await router.push({ name: 'ourive-ordens' })
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível apagar a ordem.')
  }
}
onMounted(load)
</script>
