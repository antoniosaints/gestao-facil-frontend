<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { resolveFileUrl } from '@/utils/fileUrl'
import { useConfirm } from '@/composables/useConfirm'
import { LojaRepository, type LojaSecaoAdmin } from '@/repositories/loja-repository'
import { GripVertical, LayoutGrid, LoaderCircle, Package, Plus, Trash2, X } from 'lucide-vue-next'

const toast = useToast()
const secoes = ref<LojaSecaoAdmin[]>([])
const loading = ref(true)
const criando = ref(false)
const novaSecao = ref('')
// Chave por seção para "resetar" o Select2 após adicionar um produto.
const pickerKey = ref<Record<number, number>>({})

async function carregar() {
  loading.value = true
  try {
    secoes.value = await LojaRepository.listSecoes()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar as seções.')
  } finally {
    loading.value = false
  }
}

async function criarSecao() {
  const nome = novaSecao.value.trim()
  if (nome.length < 2) return toast.warning('Informe um nome para a seção.')
  try {
    criando.value = true
    const secao = await LojaRepository.createSecao(nome)
    secoes.value.push(secao)
    novaSecao.value = ''
    toast.success('Seção criada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível criar a seção.')
  } finally {
    criando.value = false
  }
}

function replaceSecao(atualizada: LojaSecaoAdmin) {
  const i = secoes.value.findIndex((s) => s.id === atualizada.id)
  if (i !== -1) secoes.value[i] = atualizada
}

let renameTimer: ReturnType<typeof setTimeout> | null = null
function renomear(secao: LojaSecaoAdmin, nome: string) {
  secao.nome = nome
  if (renameTimer) clearTimeout(renameTimer)
  renameTimer = setTimeout(async () => {
    if (nome.trim().length < 2) return
    try {
      await LojaRepository.updateSecao(secao.id, { nome: nome.trim() })
    } catch {
      toast.error('Não foi possível renomear a seção.')
    }
  }, 600)
}

async function alternarAtivo(secao: LojaSecaoAdmin, ativo: boolean) {
  secao.ativo = ativo
  try {
    await LojaRepository.updateSecao(secao.id, { ativo })
  } catch {
    secao.ativo = !ativo
    toast.error('Não foi possível alterar a visibilidade da seção.')
  }
}

async function excluirSecao(secao: LojaSecaoAdmin) {
  const ok = await useConfirm().confirm({
    title: 'Excluir seção',
    message: `Excluir a seção "${secao.nome}"? Os produtos continuam no catálogo.`,
    confirmText: 'Sim, excluir!',
  })
  if (!ok) return
  try {
    await LojaRepository.deleteSecao(secao.id)
    secoes.value = secoes.value.filter((s) => s.id !== secao.id)
    toast.success('Seção removida.')
  } catch {
    toast.error('Não foi possível excluir a seção.')
  }
}

async function adicionarProduto(secao: LojaSecaoAdmin, produtoBaseId: number | string | null) {
  if (!produtoBaseId) return
  const id = Number(produtoBaseId)
  if (secao.produtos.some((p) => p.produtoBaseId === id)) {
    pickerKey.value[secao.id] = (pickerKey.value[secao.id] || 0) + 1
    return toast.info('Esse produto já está na seção.')
  }
  try {
    replaceSecao(await LojaRepository.addProdutoSecao(secao.id, id))
  } catch {
    toast.error('Não foi possível adicionar o produto.')
  } finally {
    pickerKey.value[secao.id] = (pickerKey.value[secao.id] || 0) + 1
  }
}

async function removerProduto(secao: LojaSecaoAdmin, produtoBaseId: number) {
  try {
    replaceSecao(await LojaRepository.removeProdutoSecao(secao.id, produtoBaseId))
  } catch {
    toast.error('Não foi possível remover o produto.')
  }
}

onMounted(carregar)
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs text-muted-foreground">
      Crie seções personalizadas (ex.: "Coleção verão", "Kits") e escolha a dedo os produtos de cada uma.
      Elas aparecem no topo da loja, antes das seções automáticas.
    </p>

    <!-- Criar nova seção -->
    <div class="flex items-center gap-2">
      <Input v-model="novaSecao" placeholder="Nome da nova seção" class="h-9" @keyup.enter="criarSecao" />
      <Button class="shrink-0 text-white" :disabled="criando" @click="criarSecao">
        <LoaderCircle v-if="criando" class="mr-1 h-4 w-4 animate-spin" />
        <Plus v-else class="mr-1 h-4 w-4" /> Criar
      </Button>
    </div>

    <div v-if="loading" class="flex items-center gap-2 py-6 text-sm text-muted-foreground">
      <LoaderCircle class="h-4 w-4 animate-spin" /> Carregando seções...
    </div>

    <div v-else-if="!secoes.length" class="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
      <LayoutGrid class="mx-auto mb-2 h-6 w-6 opacity-60" />
      Nenhuma seção personalizada ainda.
    </div>

    <!-- Lista de seções -->
    <div v-for="secao in secoes" :key="secao.id" class="rounded-xl border bg-card p-3">
      <div class="flex items-center gap-2">
        <GripVertical class="h-4 w-4 shrink-0 text-muted-foreground/50" />
        <Input :model-value="secao.nome" class="h-8 font-medium" @update:model-value="renomear(secao, String($event))" />
        <div class="ml-auto flex shrink-0 items-center gap-2">
          <Switch :model-value="secao.ativo" title="Mostrar na loja" @update:model-value="alternarAtivo(secao, $event)" />
          <Button type="button" variant="ghost" size="icon" class="h-8 w-8 text-red-600" v-tooltip="'Excluir seção'" @click="excluirSecao(secao)">
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Produtos da seção -->
      <div class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="produto in secao.produtos"
          :key="produto.produtoBaseId"
          class="inline-flex items-center gap-1.5 rounded-full border bg-background py-1 pl-1 pr-2 text-xs"
        >
          <img v-if="produto.imagem" :src="resolveFileUrl(produto.imagem)" class="h-5 w-5 rounded-full object-cover" />
          <span v-else class="grid h-5 w-5 place-items-center rounded-full bg-muted"><Package class="h-3 w-3 text-muted-foreground" /></span>
          <span class="max-w-[140px] truncate">{{ produto.nome }}</span>
          <button type="button" class="text-muted-foreground hover:text-red-600" @click="removerProduto(secao, produto.produtoBaseId)">
            <X class="h-3.5 w-3.5" />
          </button>
        </span>
        <span v-if="!secao.produtos.length" class="text-xs text-muted-foreground">Nenhum produto ainda.</span>
      </div>

      <!-- Adicionar produto -->
      <div class="mt-3">
        <Select2Ajax
          :key="pickerKey[secao.id] || 0"
          :model-value="null"
          url="/produtos/select2"
          :params="[{ key: 'baseOnly', value: true }]"
          placeholder="+ Adicionar produto à seção"
          @update:model-value="adicionarProduto(secao, $event)"
        />
      </div>
    </div>
  </div>
</template>
