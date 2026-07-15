<script setup lang="ts" generic="T">
import { computed } from 'vue'
import { melhorColunas } from './autoGrid'

/**
 * Grade que nunca deixa lacuna, qualquer que seja a quantidade de itens.
 *
 * Existe porque a dashboard esconde blocos de módulos inativos: com `grid-cols-4` fixo, uma
 * conta com 3 blocos ficava com um buraco à direita. Aqui os itens da última linha esticam
 * para fechar a linha (`flex-grow`), e a quantidade de colunas é escolhida para minimizar
 * quanto eles precisam esticar.
 *
 * A quebra em telas estreitas sai de `min`, sem media query nem listener de resize — o que
 * também evita classes dinâmicas do Tailwind, que o purge removeria.
 */
const props = withDefaults(
  defineProps<{
    items: T[]
    /** Máximo de colunas em telas largas. */
    max?: number
    /** Largura mínima de cada item, em px, antes de quebrar a linha. */
    min?: number
    /** Espaçamento entre os itens, em px. */
    gap?: number
  }>(),
  { max: 4, min: 220, gap: 16 },
)

const colunas = computed(() => melhorColunas(props.items.length, props.max))

// Um pouco menor que a fração exata para caber `colunas` por linha junto com os gaps; o
// flex-grow devolve a diferença e fecha a linha.
const flexBasis = computed(() => `calc(${100 / colunas.value}% - ${props.gap}px)`)
</script>

<template>
  <div class="flex flex-wrap" :style="{ gap: `${gap}px` }">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="flex-1"
      :style="{ flexBasis, minWidth: `${min}px` }"
    >
      <slot :item="item" :index="index" />
    </div>
  </div>
</template>
