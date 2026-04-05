<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { Layers3, PackagePlus } from 'lucide-vue-next'

const store = useProdutoStore()
</script>

<template>
  <ModalView
    v-model:open="store.openModalCadastroTipo"
    title="Novo cadastro"
    description="Escolha se deseja criar um produto novo ou cadastrar apenas uma nova variante em um produto existente."
    size="2xl"
  >
    <div class="grid gap-4 px-4 pb-2 md:grid-cols-2">
      <Card class="border-border/70 shadow-sm transition hover:border-primary/50">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <PackagePlus class="h-4 w-4 text-primary" />
            Novo produto
          </CardTitle>
          <CardDescription>
            Cria um produto do zero com dados do produto base e da variante padrão inicial.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Ideal para itens inéditos no catálogo, com nome, categoria, preço, estoque e regras operacionais.
          </p>
          <Button class="w-full text-white" @click="store.openSaveProduto()">
            Criar produto
          </Button>
        </CardContent>
      </Card>

      <Card class="border-border/70 shadow-sm transition hover:border-primary/50">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <Layers3 class="h-4 w-4 text-primary" />
            Nova variante
          </CardTitle>
          <CardDescription>
            Vincula uma nova variante a um produto já existente, preenchendo apenas os dados da variante.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Ideal para novas cores, tamanhos, embalagens, códigos ou preços sem recriar o produto base.
          </p>
          <Button variant="outline" class="w-full" @click="store.openSaveVariante()">
            Criar variante
          </Button>
        </CardContent>
      </Card>
    </div>
  </ModalView>
</template>
