<script setup lang="ts">
import ModalView from "@/components/formulario/ModalView.vue";
import Select2Ajax from "@/components/formulario/Select2Ajax.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from "@/components/ui/number-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProdutoRepository } from "@/repositories/produto-repository";
import { computed, onMounted, ref, watch } from "vue";
import { POSITION, useToast } from "vue-toastification";
import { vMaska } from "maska/vue"
import { moneyMaskOptions } from "@/lib/imaska";
import { FilePlus, HandCoins, PackagePlus, Trash } from "lucide-vue-next";
import Calendarpicker from "@/components/formulario/calendarpicker.vue";
import { useClientesStore } from "@/stores/clientes/useClientes";
import { useUiStore } from "@/stores/ui/uiStore";
import { hasPermission } from "@/hooks/authorize";
import { useOrdemServicoStore, type CarrinhoOS } from "@/stores/servicos/useOrdensServicos";
import { ServicoRepository } from "@/repositories/servico-repository";
import { formatCurrencyBR } from "@/utils/formatters";
import { addDays, format } from "date-fns";
import type { SaveOrdemServico } from "@/@types/schemas";
import { OrdensServicoRepository } from "@/repositories/os-repository";

const title = ref('Cadastro de OS')
const description = ref('Preencha os campos abaixo')
const toast = useToast()
const store = useOrdemServicoStore()
const storeUi = useUiStore()
const storeCliente = useClientesStore()
const adicionarTipo = ref<'PRODUTO' | 'SERVICO'>('PRODUTO')
const erros = ref<Record<string, string>>({})

const labelProdutoInsert = ref<string>('')
const addItemForm = ref<{ id: number | null, preco: number | string | null, quantidade: number }>({
  id: null,
  preco: null,
  quantidade: 1
})


async function submit() {
  if (store.carrinho.length === 0) {
    toast.error('Adicione pelo menos um item ao carrinho', { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
    return;
  }

  const hasId = store.form.id;

  if (resumoCarrinho.value.total <= 0) {
    toast.error('O valor total da os deve ser maior que zero', { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
    return;
  }

  try {
    const data: SaveOrdemServico = {
      id: store.form.id,
      descricao: store.form.descricao,
      descricaoCliente: store.form.descricaoCliente,
      clienteId: store.form.clienteId,
      vendedorId: store.form.vendedorId,
      data: store.form.data,
      garantia: store.form.garantia,
      desconto: store.form.desconto ? getValorDesconto.value : 0,
      status: store.form.status as any,
      itens: store.carrinho.map(item => ({ id: item.id, quantidade: item.quantidade, valor: item.preco, tipo: item.tipoItem, nome: item.produto }))
    };

    if (hasId) {
      await OrdensServicoRepository.update(data, hasId);
      toast.success('OS atualizada com sucesso!');
    } else {
      await OrdensServicoRepository.save(data);
      toast.success('OS criada com sucesso!');
    }

    store.updateTable();
    store.openModal = false;
  } catch (error: any) {
    console.log(error);
    const msg = error?.response?.data?.message || 'Ocorreu um erro ao registrar a OS';
    toast.error(msg, { timeout: 3000, position: POSITION.BOTTOM_RIGHT });
  }
}

const validar = () => {
  erros.value = {}

  if (!store.form.clienteId) erros.value.clienteId = 'O cliente é obrigatório.'
  if (!store.form.data) erros.value.data = 'A data é obrigatório.'
  if (!store.form.status) erros.value.status = 'O status é obrigatório.'
  if (!store.form.vendedorId) erros.value.operadorId = 'O responsável é obrigatório.'
}

const formularioValido = computed(() => Object.keys(erros.value).length === 0)

const submitFormularioVenda = async () => {
  validar()
  if (!formularioValido.value) return
  await submit()
}

function clearCart() {
  store.carrinho = [];
  localStorage.setItem('gestao_facil:carrinho_ordem_servico', JSON.stringify(store.carrinho));
}

function clearFormularioAddItem() {
  addItemForm.value.id = null;
  addItemForm.value.preco = null;
  addItemForm.value.quantidade = 1;
}

function addToCartVendas() {
  if (!addItemForm.value.id || !addItemForm.value.quantidade || !addItemForm.value.preco) {
    return toast.error('Preencha todos os campos (Produto/Serviço, Quantidade e Preço)');
  }

  // Verifica se o produto já foi adicionado
  const exists = store.carrinho.some(item => item.id === addItemForm.value.id && item.tipoItem === adicionarTipo.value);
  if (exists) {
    return toast.error('Este ítem já está na lista.');
  }

  const newItem: CarrinhoOS = {
    id: addItemForm.value.id,
    tipoItem: adicionarTipo.value,
    produto: labelProdutoInsert.value,
    quantidade: addItemForm.value.quantidade,
    preco: parseFloat(String(addItemForm.value.preco).replace(',', '.')),
    subtotal: +(parseFloat(String(addItemForm.value.preco).replace(',', '.')) * addItemForm.value.quantidade)
  };

  store.carrinho.push(newItem);
  localStorage.setItem('gestao_facil:carrinho_ordem_servico', JSON.stringify(store.carrinho));

  clearFormularioAddItem();
}


function removeFromCartVendas(produtoId: number) {
  const novoCarrinho = store.carrinho.filter(item => Number(item.id) !== Number(produtoId));

  store.carrinho = novoCarrinho;
  localStorage.setItem('gestao_facil:carrinho_ordem_servico', JSON.stringify(novoCarrinho));
}

function calculateTotalCartVendas() {
  const total = store.carrinho.reduce((sum, item) => {
    return sum + item.subtotal;
  }, 0);

  return total.toFixed(2);
}

function clearCartOrdemServico() {
  localStorage.removeItem('gestao_facil:carrinho_ordem_servico');
  store.carrinho = [];
}

const getValorDesconto = computed(() => {
  if (store.carrinho.length === 0) return 0;

  const subtotalValue = store.carrinho.reduce((total, item) => {
    // substitui vírgula por ponto para parseFloat funcionar corretamente
    const preco = item.preco;
    return total + preco * item.quantidade;
  }, 0);

  const descontoRaw = parseFloat(String(store.form.desconto).replace(',', '.')) || 0;

  if (store.tipoDesconto === 'PORCENTAGEM') {
    return subtotalValue * (descontoRaw / 100);
  } else {
    return descontoRaw;
  }
});

const maxQuantidadeAdd = ref(999999999999999);
const ableAdd = ref(true);
async function getValorProduto(id: number) {
  try {
    ableAdd.value = true
    const { data } = await ProdutoRepository.get(id);
    if (data.estoque <= 0) {
      addItemForm.value.preco = null;
      addItemForm.value.id = null;
      maxQuantidadeAdd.value = 1
      ableAdd.value = false
      return toast.error('Produto sem estoque disponível', {
        timeout: 3000,
        position: POSITION.BOTTOM_RIGHT
      });
    }

    if (data.estoque <= data.minimo) {
      toast.warning('Produto com estoque baixo, por favor, verificar o estoque antes de adicionar ao carrinho', { timeout: 3000 });
    }

    addItemForm.value.quantidade = 1
    maxQuantidadeAdd.value = data.estoque
    addItemForm.value.preco = data.preco;

  } catch (error) {
    addItemForm.value.preco = null;
    toast.warning('Erro ao buscar o produto, informe o preço manualmente', {
      timeout: 3000
    });
  }
}
async function getValorServico(id: number) {
  try {
    ableAdd.value = true
    const data = await ServicoRepository.get(id);

    addItemForm.value.quantidade = 1
    maxQuantidadeAdd.value = 999999999999
    addItemForm.value.preco = data.preco;

  } catch (error) {
    addItemForm.value.preco = null;
    toast.warning('Erro ao buscar o serviço, informe o preço manualmente', {
      timeout: 3000
    });
  }
}

watch(() => addItemForm.value.id, (id) => {
  if (id && adicionarTipo.value === 'PRODUTO') {
    getValorProduto(id);
  }
  else if (id && adicionarTipo.value === 'SERVICO') {
    getValorServico(id);
  }
  else {
    addItemForm.value.preco = null
  }
})

const resumoCarrinho = computed(() => {
  const subtotal = store.carrinho.reduce((total, item) => total + item.subtotal, 0);
  const desconto = getValorDesconto.value;
  return {
    subtotal,
    desconto,
    total: (subtotal - desconto)
  };
});

clearCartOrdemServico();
onMounted(() => {
  store.form.vendedorId = storeUi.usuarioLogged.id || null
})
</script>

<template>
  <ModalView v-model:open="store.openModal"
    :title="store.form.id ? 'Editar Ordem de serviço' : 'Criar Ordem de serviço'" :description="description" size="5xl">
    <form @submit.prevent="submitFormularioVenda" class="space-y-4 px-4">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div class="md:col-span-6">
          <label class="block text-sm mb-1">Cliente <span class="text-red-500">*</span></label>
          <div class="flex items-center justify-center gap-2">
            <Select2Ajax v-model="store.form.clienteId" class="w-full" url="/clientes/select2" />
            <button type="button" @click="storeCliente.openSave"
              class="bg-primary px-4 py-1.5 text-white rounded-md border border-border dark:border-border-dark flex justify-center items-center">+</button>
          </div>
          <p v-if="erros.clienteId" class="text-red-600 text-sm">{{ erros.clienteId }}</p>
        </div>

        <div class="md:col-span-3">
          <label class="block text-sm mb-1">Data da OS <span class="text-red-500">*</span></label>
          <Calendarpicker :required="false" v-model="store.form.data" :range="false" />
          <p v-if="erros.data" class="text-red-600 text-sm">{{ erros.data }}</p>
        </div>

        <div class="md:col-span-3">
          <label class="block text-sm mb-1">Status <span class="text-red-500">*</span></label>
          <Select v-model="store.form.status" default-value="ABERTA">
            <SelectTrigger class="w-full bg-card dark:bg-card-dark">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ABERTA">
                Aberta
              </SelectItem>
              <SelectItem value="ORCAMENTO">
                Orçamento
              </SelectItem>
              <SelectItem value="APROVADA">
                Aprovada
              </SelectItem>
              <SelectItem value="ANDAMENTO">
                Andamento
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="erros.status" class="text-red-600 text-sm">{{ erros.status }}</p>
        </div>

        <div class="md:col-span-6">
          <label class="block text-sm mb-1">Responsável <span class="text-red-500">*</span></label>
          <Select2Ajax :disabled="(hasPermission(storeUi.usuarioLogged, 3) ? false : true)"
            v-model="store.form.vendedorId" class="w-full" url="/usuarios/select2" />
          <p v-if="erros.operadorId" class="text-red-600 text-sm">{{ erros.operadorId }}</p>
        </div>


        <div class="md:col-span-2">
          <label for="garantia" class="block text-sm mb-1">Garantia (dias)</label>
          <NumberField v-model="store.form.garantia" class="bg-card dark:bg-card-dark" id="garantia" :default-value="0"
            :min="0">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>

        <div class="md:col-span-2">
          <label for="tipo_desconto" class="block text-sm mb-1">Tipo desconto <span
              class="text-red-500">*</span></label>
          <Select required v-model="store.tipoDesconto">
            <SelectTrigger class="w-full bg-card dark:bg-card-dark">
              <SelectValue placeholder="Desconto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PORCENTAGEM">
                Porcentagem
              </SelectItem>
              <SelectItem value="VALOR">
                Valor
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="md:col-span-2">
          <label for="input_desconto_venda_formulario" class="block text-sm mb-1">Valor desconto</label>
          <Input v-model="(store.form.desconto as number)" type="text" id="input_desconto_venda_formulario"
            name="desconto" v-maska="moneyMaskOptions"
            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark"
            placeholder="Ex: 1,99" />
        </div>
        <!-- Observações -->
        <div class="md:col-span-6">
          <label for="descricao_os" class="block text-sm mb-1">Descrição</label>
          <textarea v-model="store.form.descricao" name="observacoes" id="descricao_os"
            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark"
            rows="3" placeholder="Descrição da OS..."></textarea>
        </div>
        <div class="md:col-span-6">
          <label for="observacoes_internas_os" class="block text-sm mb-1">Observações cliente</label>
          <textarea v-model="store.form.descricaoCliente" name="observacoes" id="observacoes_internas_os"
            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark"
            rows="3" placeholder="Observações para a equipe..."></textarea>
        </div>
      </div>


      <hr class="border-border dark:border-border-dark">

      <!-- Adição de produtos -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div class="md:col-span-2">
          <label class="block text-sm mb-1">Tipo item <span class="text-red-500">*</span></label>
          <Select required v-model="adicionarTipo">
            <SelectTrigger class="w-full bg-card dark:bg-card-dark">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRODUTO">
                Produto
              </SelectItem>
              <SelectItem value="SERVICO">
                Serviço
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="adicionarTipo === 'PRODUTO'" class="md:col-span-5">
          <label class="block text-sm mb-1">Produto <span class="text-red-500">*</span></label>
          <Select2Ajax v-model="addItemForm.id" v-model:label="labelProdutoInsert" class="w-full"
            url="/produtos/select2" :params="[{ key: 'withStock', value: true }]" :allow-clear="true" />
        </div>
        <div v-else class="md:col-span-5">
          <label class="block text-sm mb-1">Serviço <span class="text-red-500">*</span></label>
          <Select2Ajax v-model="addItemForm.id" v-model:label="labelProdutoInsert" class="w-full"
            url="/servicos/select2" :params="[{ key: 'withStock', value: true }]" :allow-clear="true" />
        </div>

        <div class="md:col-span-2">
          <label for="quantidade_carrinho_adicionar" class="block text-sm mb-1">Quantidade <span
              class="text-red-500">*</span></label>
          <NumberField v-model="addItemForm.quantidade" class="bg-card dark:bg-card-dark"
            id="quantidade_carrinho_adicionar" :default-value="1" :min="1" :max="maxQuantidadeAdd">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm mb-1">Preço <span class="text-red-500">*</span></label>
          <Input v-model="(addItemForm.preco as number)" :disabled="!ableAdd" type="text" placeholder="R$ 0,00"
            v-maska="moneyMaskOptions" id="input_preco_venda_formulario"
            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
        </div>

        <div class="md:col-span-1">
          <Button type="button" :disabled="!ableAdd" @click="addToCartVendas" class="text-white w-full">
            <PackagePlus v-if="adicionarTipo === 'PRODUTO'" />
            <FilePlus v-else />
          </Button>
        </div>
      </div>

      <!-- Tabela de itens -->
      <div>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium mb-2">Produtos/Serviços</h3>
          <div class="flex gap-2">
            <button :disabled="store.carrinho.length === 0" @click="store.openModalPropor = true" type="button"
              class="text-sm text-white py-1 px-2 mb-2 rounded bg-emerald-500 dark:bg-emerald-800 dark:text-gray-200 disabled:opacity-50 flex items-center">
              <HandCoins class="mr-1 w-4 h-4" /> Propor
            </button>
            <button :disabled="store.carrinho.length === 0" @click="clearCart" type="button"
              class="text-sm text-white py-1 px-2 mb-2 rounded bg-red-500 dark:bg-red-800 disabled:opacity-50 dark:text-gray-200 flex items-center">
              <Trash class="mr-1 w-4 h-4" /> Limpar
            </button>
          </div>
        </div>
        <div class="relative overflow-x-auto rounded-sm">
          <div class="grid grid-cols-12 gap-4">
            <!-- Lista do carrinho -->
            <div id="lista-carrinho-vendas" class="col-span-12 lg:col-span-8 space-y-2">
              <div v-if="store.carrinho.length === 0"
                class="p-3 text-center text-gray-500 bg-white dark:bg-gray-900 border rounded-md">
                Nenhum item adicionado
              </div>
              <div v-else v-for="item in store.carrinho" :key="item.id"
                class="flex justify-between items-center bg-white dark:bg-gray-900 border rounded-md p-2 shadow-sm">
                <div class="flex flex-col text-sm">
                  <span class="font-medium text-gray-800 dark:text-gray-200">({{ item.tipoItem }}) {{ item.produto
                  }}</span>
                  <span class="text-gray-500 dark:text-gray-400">Qtd: {{ item.quantidade }}</span>
                </div>
                <div class="flex items-center">
                  <div class="flex flex-col text-right text-sm">
                    <span class="text-gray-800 text-md dark:text-gray-200">
                      {{ formatCurrencyBR(item.subtotal || 0) }}
                    </span>
                    <span class="font-medium text-xs text-gray-600 dark:text-gray-400">
                      {{ formatCurrencyBR(item.preco || 0) }} x {{ item.quantidade }}
                    </span>
                  </div>
                  <button type="button" @click="removeFromCartVendas(item.id)"
                    class="ml-3 text-red-900 bg-red-200 dark:text-red-100 dark:bg-red-800 p-2 rounded-sm">
                    <Trash class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Total do carrinho -->
            <div id="resumo-carrinho-vendas"
              class="col-span-12 lg:col-span-4 bg-white dark:bg-gray-900 border rounded-md p-4 shadow-sm">
              <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Resumo da OS</h3>
              <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Desconto:</span>
                <span id="desconto-total-carrinho">
                  {{ formatCurrencyBR(resumoCarrinho.desconto || 0) }}
                </span>
              </div>
              <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Subtotal:</span>
                <span id="subtotal-carrinho-vendas">
                  {{ formatCurrencyBR(resumoCarrinho.subtotal || 0) }}
                </span>
              </div>
              <div class="flex justify-between font-semibold text-md text-gray-700 dark:text-gray-300">
                <span>Total:</span>
                <span id="total-carrinho-vendas">
                  {{ formatCurrencyBR(resumoCarrinho.total || 0) }}
                </span>
              </div>
              <hr class="my-1">
              <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Produtos:</span>
                <span id="subtotal-carrinho-vendas">
                  {{store.carrinho.filter(item => item.tipoItem === 'PRODUTO').length}}
                </span>
              </div>
              <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Serviços:</span>
                <span id="subtotal-carrinho-vendas">
                  {{store.carrinho.filter(item => item.tipoItem === 'SERVICO').length}}
                </span>
              </div>
              <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Garantia:</span>
                <span id="subtotal-carrinho-vendas">
                  {{ store.form.garantia ? format(addDays(new Date(), store.form.garantia), 'dd/MM/yyyy') : 'N/A' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="store.openModal = false">
          Fechar
        </Button>
        <Button type="button" class="bg-warning hover:bg-warning/80 text-white" @click="store.reset">
          Resetar
        </Button>
        <Button :disabled="store.carrinho.length === 0" class="text-white" type="submit">
          Registrar
        </Button>
      </div>
    </form>
  </ModalView>
</template>
