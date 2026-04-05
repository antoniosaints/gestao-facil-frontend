<template>
    <ModalView v-model:open="store.openModalRelatorioGeral" :title="title" :description="description" size="md">
        <form @submit.prevent="submit" class="grid items-start gap-4 px-4">
            <div class="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <div class="font-medium text-foreground">Período do relatório</div>
                <p class="text-sm text-muted-foreground">
                    O PDF será gerado com os produtos cadastrados no período selecionado. Se nenhum período for informado, o relatório sairá geral.
                </p>
            </div>

            <div>
                <Label for="periodo_relatorio_produtos">Período</Label>
                <Calendarpicker id="periodo_relatorio_produtos" v-model="filtroPeriodo" :range="true" :required="false"
                    :teleport="true" />
            </div>

            <div class="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" @click="store.openModalRelatorioGeral = false" :disabled="loading">
                    Fechar
                </Button>
                <Button class="text-white" type="submit" :disabled="loading">
                    <FilePlus />
                    {{ loading ? 'Gerando...' : 'Gerar' }}
                </Button>
            </div>
        </form>
    </ModalView>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue"
import { format } from 'date-fns'
import { Button } from "@/components/ui/button"
import { useProdutoStore } from "@/stores/produtos/useProduto"
import { useToast } from "vue-toastification"
import { Label } from "@/components/ui/label"
import ModalView from "@/components/formulario/ModalView.vue"
import { ProdutoRepository } from "@/repositories/produto-repository"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import { FilePlus } from "lucide-vue-next"

const title = ref('Gerar relatório de produtos')
const description = ref('Selecione o período para exportar o PDF de produtos com estoque e preços.')

const store = useProdutoStore()
const toast = useToast()
const loading = ref(false)
const filtroPeriodo = ref<[Date, Date] | null>(null)

const periodoFormatado = computed(() => {
    if (!filtroPeriodo.value) {
        return {
            inicio: undefined,
            fim: undefined,
        }
    }

    const [inicio, fim] = filtroPeriodo.value

    return {
        inicio: format(inicio, "yyyy-MM-dd'T'00:00:00"),
        fim: format(fim, "yyyy-MM-dd'T'23:59:59"),
    }
})

async function submit() {
    try {
        loading.value = true
        await ProdutoRepository.gerarRelatorioGeral(periodoFormatado.value.inicio, periodoFormatado.value.fim)
        toast.success('Relatório geral gerado com sucesso')
        store.updateTable()
        store.openModalRelatorioGeral = false
    } catch (error: any) {
        console.log(error)
        toast.error('Erro ao gerar o relatório, tente novamente.')
    } finally {
        loading.value = false
    }
}
</script>
