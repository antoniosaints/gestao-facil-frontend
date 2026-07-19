<template>
    <ModalView v-model:open="store.openModalEtiquetas" :title="title" :description="description" :icon="Tags" size="2xl">
        <div class="grid items-start gap-4 px-4">
            <!-- Sem modelos cadastrados -->
            <div v-if="!carregando && !modelos.length"
                class="border rounded-lg p-4 text-center space-y-2 text-muted-foreground">
                <Info class="h-8 w-8 mx-auto text-primary/70" />
                <p class="text-sm">Nenhum modelo de etiqueta cadastrado.</p>
                <p class="text-xs">Crie um modelo em <strong>Configurações → Impressão → Modelos de etiquetas</strong>
                    (ex.: A4 com 65 etiquetas) e volte aqui para imprimir.</p>
                <Button variant="outline" size="sm" @click="irParaConfiguracoes">
                    Ir para Configurações
                </Button>
            </div>

            <template v-else>
                <!-- Modelo + posição inicial -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div class="md:col-span-8 space-y-1.5">
                        <Label>Modelo de etiqueta <span class="text-danger">*</span></Label>
                        <Select v-model="modeloId">
                            <SelectTrigger class="w-full bg-card">
                                <SelectValue placeholder="Selecione o modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="m in modelos" :key="m.id" :value="m.id">{{ m.nome }}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="md:col-span-4 space-y-1.5">
                        <Label for="posInicial">Iniciar na etiqueta nº</Label>
                        <Input id="posInicial" v-model.number="posicaoInicial" type="number" min="1" :max="perPage"
                            class="bg-card" />
                    </div>
                </div>
                <p v-if="modeloSelecionado" class="text-xs text-muted-foreground -mt-2">
                    {{ modeloSelecionado.colunas }}×{{ modeloSelecionado.linhas }} = {{ perPage }} etiquetas por folha.
                    A impressão começa na posição {{ posicaoInicial }} (as anteriores ficam em branco).
                </p>

                <!-- Itens -->
                <div class="rounded-lg border border-border">
                    <div class="flex items-center justify-between border-b border-border px-3 py-2">
                        <span class="text-sm font-semibold text-foreground">Produtos</span>
                        <Button type="button" size="sm" variant="outline" @click="adicionarLinha">
                            <Plus class="h-4 w-4" /> Adicionar produto
                        </Button>
                    </div>
                    <div class="divide-y divide-border">
                        <div v-for="(item, index) in itens" :key="index"
                            class="grid grid-cols-1 items-end gap-3 px-3 py-3 md:grid-cols-12">
                            <div class="md:col-span-8">
                                <label class="mb-1 block text-xs font-medium text-muted-foreground">Produto</label>
                                <Select2Ajax url="/produtos/select2" v-model:model-value="item.produtoId"
                                    :allow-clear="true" placeholder="Selecione o produto" />
                            </div>
                            <div class="md:col-span-3">
                                <label class="mb-1 block text-xs font-medium text-muted-foreground">Quantidade</label>
                                <Input type="number" min="1" v-model.number="item.quantidade" placeholder="Ex: 10" />
                            </div>
                            <div class="flex md:col-span-1 md:justify-center">
                                <Button type="button" variant="ghost" size="icon" class="text-red-500 hover:text-red-600"
                                    v-tooltip="'Remover linha'" @click="removerLinha(index)">
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-muted-foreground">Total de etiquetas: <strong>{{ totalEtiquetas }}</strong>.
                    Apenas produtos com código de barras cadastrado são impressos.</p>
            </template>

            <div class="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" @click="store.openModalEtiquetas = false">
                    Fechar
                </Button>
                <Button v-if="modelos.length" @click="gerarEtiquetas" class="text-white" type="button"
                    :disabled="gerando">
                    <LoaderCircle v-if="gerando" class="h-4 w-4 animate-spin" />
                    <FilePlus v-else class="h-4 w-4" />
                    {{ gerando ? 'Gerando...' : 'Gerar' }}
                </Button>
            </div>
        </div>
    </ModalView>
</template>

<script lang="ts" setup>
import { Button } from "@/components/ui/button"
import { useProdutoStore } from "@/stores/produtos/useProduto"
import { useToast } from "vue-toastification"
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Select2Ajax from "@/components/formulario/Select2Ajax.vue"
import ModalView from "@/components/formulario/ModalView.vue"
import { ProdutoVarianteRepository } from "@/repositories/produto-repository"
import { ContaRepository } from "@/repositories/conta-repository"
import type { EtiquetaModelo } from "@/pages/configs/partials/etiquetaPresets"
import { FilePlus, Info, LoaderCircle, Plus, Tags, Trash2 } from "lucide-vue-next"

const MODELO_STORAGE_KEY = "etiqueta_modelo_id"

const title = ref('Gerar etiquetas')
const description = ref('Escolha o modelo do papel, os produtos e a quantidade de etiquetas.')

const store = useProdutoStore()
const toast = useToast()
const router = useRouter()

type ItemLinha = { produtoId: number | null; quantidade: number }

const modelos = ref<EtiquetaModelo[]>([])
const modeloId = ref<string | undefined>(undefined)
const posicaoInicial = ref<number>(1)
const itens = ref<ItemLinha[]>([{ produtoId: null, quantidade: 1 }])
const carregando = ref(false)
const gerando = ref(false)

const modeloSelecionado = computed(() => modelos.value.find((m) => m.id === modeloId.value))
const perPage = computed(() =>
    modeloSelecionado.value ? modeloSelecionado.value.colunas * modeloSelecionado.value.linhas : 1,
)
const totalEtiquetas = computed(() =>
    itens.value.reduce((acc, i) => acc + (i.produtoId ? Math.max(0, Number(i.quantidade) || 0) : 0), 0),
)

function adicionarLinha() {
    itens.value.push({ produtoId: null, quantidade: 1 })
}

function removerLinha(index: number) {
    itens.value.splice(index, 1)
    if (!itens.value.length) itens.value.push({ produtoId: null, quantidade: 1 })
}

function irParaConfiguracoes() {
    store.openModalEtiquetas = false
    router.push({ name: 'configuracoes-home' })
}

async function carregarModelos() {
    carregando.value = true
    try {
        const response = await ContaRepository.getParametros()
        const salvos = response?.data?.etiquetaModelos
        modelos.value = Array.isArray(salvos) ? salvos : []

        const ultimo = localStorage.getItem(MODELO_STORAGE_KEY)
        modeloId.value =
            (ultimo && modelos.value.some((m) => m.id === ultimo) ? ultimo : undefined) ??
            modelos.value[0]?.id
    } catch (error) {
        console.error(error)
        modelos.value = []
    } finally {
        carregando.value = false
    }
}

// Ao abrir o modal: carrega modelos e pré-preenche o produto que disparou a ação.
watch(
    () => store.openModalEtiquetas,
    (aberto) => {
        if (!aberto) return
        posicaoInicial.value = 1
        itens.value = [{ produtoId: store.idMutation ?? null, quantidade: 1 }]
        carregarModelos()
    },
)

const gerarEtiquetas = async () => {
    if (!modeloId.value) {
        toast.error('Selecione um modelo de etiqueta.')
        return
    }
    const itensValidos = itens.value
        .filter((i) => i.produtoId && Number(i.quantidade) > 0)
        .map((i) => ({ produtoId: i.produtoId as number, quantidade: Number(i.quantidade) }))

    if (!itensValidos.length) {
        toast.error('Adicione ao menos um produto com quantidade.')
        return
    }

    const inicio = Math.min(Math.max(1, Number(posicaoInicial.value) || 1), perPage.value)

    try {
        gerando.value = true
        localStorage.setItem(MODELO_STORAGE_KEY, modeloId.value)
        await ProdutoVarianteRepository.gerarFolhaEtiquetas({
            modeloId: modeloId.value,
            posicaoInicial: inicio,
            itens: itensValidos,
        })
        toast.success('Etiquetas geradas com sucesso')
    } catch (error) {
        toast.error('Erro ao gerar as etiquetas')
        console.log(error)
    } finally {
        gerando.value = false
    }
}
</script>
