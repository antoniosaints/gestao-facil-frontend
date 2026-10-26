<script setup lang="ts">
import { computed } from 'vue'
import type { Row } from '../adapters/domain'
const props = defineProps<{ base: Row; variant: Row }>()
const groups = computed(() => [
  {
    title: 'Cadastro e operação',
    source: props.variant,
    fields: [
      ['codigo', 'Código / SKU'],
      ['nomeVariante', 'Nome da variante'],
      ['precoPromocional', 'Preço promocional'],
      ['entradas', 'Permite entradas'],
      ['saidas', 'Permite saídas'],
      ['controlaEstoque', 'Controla estoque'],
      ['mostrarNoPdv', 'Visível no PDV'],
      ['mostrarNoCatalogo', 'Visível no catálogo'],
      ['producaoLocal', 'Produção local'],
      ['materiaPrima', 'Matéria-prima'],
      ['custoMedioProducao', 'Custo médio de produção'],
    ],
  },
  {
    title: 'Dados fiscais comuns ao produto',
    source: props.base,
    fields: [
      ['ncm', 'NCM'],
      ['cest', 'CEST'],
      ['cfop', 'CFOP'],
      ['origem', 'Origem'],
      ['codigoProduto', 'Código fiscal'],
      ['ean', 'EAN'],
      ['tipoItem', 'Tipo do item'],
      ['icmsCsosn', 'CSOSN'],
      ['icmsCst', 'CST ICMS'],
      ['pisCst', 'CST PIS'],
      ['cofinsCst', 'CST COFINS'],
      ['aliquotaIcms', 'Alíquota ICMS'],
      ['aliquotaIpi', 'Alíquota IPI'],
      ['aliquotaPis', 'Alíquota PIS'],
      ['aliquotaCofins', 'Alíquota COFINS'],
      ['issAliquota', 'Alíquota ISS'],
    ],
  },
  {
    title: 'Dados fiscais específicos da variante',
    source: props.variant,
    fields: [
      ['ncm', 'NCM'],
      ['cfop', 'CFOP'],
      ['origem', 'Origem'],
      ['icmsCsosn', 'CSOSN'],
      ['icmsCst', 'CST ICMS'],
      ['icmsMva', 'MVA'],
      ['icmsAliquotaSt', 'Alíquota ST'],
      ['icmsModBcSt', 'Modalidade BC ST'],
    ],
  },
])
function display(value: unknown) {
  return typeof value === 'boolean'
    ? value
      ? 'Sim'
      : 'Não'
    : value === null || value === undefined || value === ''
      ? 'Não informado'
      : String(value)
}
</script>
<template>
  <details>
    <summary>Consultar informações adicionais preservadas</summary>
    <section
      v-for="group in groups"
      :key="group.title"
      class="mf-stack mt-4 grid gap-4 border-t border-border pt-4"
    >
      <h2>{{ group.title }}</h2>
      <dl>
        <template v-for="[key, label] in group.fields" :key="key"
          ><dt>{{ label }}</dt>
          <dd>{{ display(group.source[key!]) }}</dd></template
        >
      </dl>
    </section>
  </details>
</template>
