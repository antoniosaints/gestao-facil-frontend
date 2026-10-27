<script setup lang="ts">
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { specializedModules } from '../application/specialized'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
const ui = useUiStore(),
  route = useRoute()
const current = computed(() => specializedModules[String(route.params.modulo)])
const inventory = [
  ['restaurante-delivery', 'Restaurante'],
  ['arena', 'Arena / quadras'],
  ['reservas', 'Reservas'],
  ['ourives', 'Ourive'],
  ['assinaturas', 'Assinaturas'],
  ['loja-virtual', 'Loja virtual'],
  ['notas-fiscais', 'Notas fiscais'],
  ['combos', 'Combos'],
  ['atendimento', 'Atendimento'],
  ['core-ia', 'Inteligência artificial'],
  ['whatsapp', 'WhatsApp'],
]
const modules = computed(() =>
  inventory.map(([code, label]) => ({ code, label, active: ui.hasActiveModule(code!) })),
)
</script>
<template>
  <PageFrame>
    <PageHeader
      ><template #title>{{ current ? current.label : 'Mais recursos' }}</template></PageHeader
    >
    <section
      v-if="current"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    >
      <h2>Continuidade da operação</h2>
      <p>
        Este módulo ainda usa a interface completa. Você pode continuar a operação existente, com as
        mesmas permissões, sem alterar a preferência da conta.
      </p>
      <RouterLink
        v-if="ui.hasActiveModule(String(route.params.modulo))"
        class="mf-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/90 no-underline transition-colors hover:bg-muted/50 mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
        :to="{ path: current.path, query: { mfCompleto: '1' } }"
        >Abrir {{ current.label }} na interface completa</RouterLink
      >
      <p v-else>Este módulo não está ativo na conta.</p>
      <RouterLink to="/modofacil" class="mf-button">Voltar ao Modo Fácil</RouterLink>
    </section>
    <p>
      O Modo Fácil está em construção. Consulte abaixo o que já tem tela própria e o que ainda
      precisa de adaptação.
    </p>
    <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
      <RouterLink to="/modofacil/relatorios">Relatórios</RouterLink>
      <RouterLink to="/modofacil/servicos">Serviços</RouterLink
      ><RouterLink to="/modofacil/pessoas">Pessoas</RouterLink
      ><RouterLink v-if="hasPermission(ui.usuarioLogged, 4)" to="/modofacil/configuracoes"
        >Experiência da conta</RouterLink
      >
    </div>
    <section class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5">
      <h2>Cobertura operacional</h2>
      <ul>
        <li>
          Produtos: cadastro guiado, edição básica de variante, foto, categorias e consulta. Criação
          de variantes e edição avançada pendentes.
        </li>
        <li>
          Estoque: reposição individual, descarte e histórico. Lote e ajuste auditado pendentes.
        </li>
        <li>
          Vendas: venda de produtos/serviços com caixa, pagamento único ou crediário e comprovante.
          Orçamento, pagamento composto, fiscal, cancelamento e devolução pendentes.
        </li>
        <li>
          Dinheiro: resumo, registro de receita/despesa e pagamento integral. Recorrência,
          transferências, baixas parciais, estorno e configurações pendentes.
        </li>
        <li>
          Serviços: catálogo, cadastro, abertura e consulta de OS. Faturamento, equipamentos,
          assinatura, status e edição pendentes.
        </li>
        <li>
          Pessoas: cadastro, consulta e edição restrita de nome e contato; documentos, endereço e
          histórico operacional pendentes.
        </li>
        <li>
          Dashboard: fontes reais por permissão; resumos e gráfico. Rankings e relatórios próprios
          pendentes.
        </li>
      </ul>
    </section>
    <h2>Módulos adicionais da conta</h2>
    <p>
      Ativação e cobrança permanecem como estão. Nenhum dos módulos abaixo tem jornada simplificada
      completa.
    </p>
    <ul class="mf-list m-0 grid list-none gap-3 p-0">
      <li
        class="mf-row flex flex-wrap items-center justify-between gap-4 break-words rounded-[6px] border border-border p-4 [&>div]:min-w-0 min-w-0 bg-card"
        v-for="module in modules"
        :key="module.code"
      >
        <div>
          <h2>{{ module.label }}</h2>
          <span
            >{{ module.active ? 'Ativo na conta' : 'Não ativo na conta' }} · Jornada própria
            pendente</span
          >
        </div>
        <RouterLink :to="`/modofacil/recursos/${module.code}`" class="mf-button"
          >Ver cobertura</RouterLink
        >
      </li>
    </ul>
    <p
      class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
    >
      Se sua operação precisa de um recurso pendente, peça ao administrador para retornar a conta ao
      Normal. Os registros são compartilhados e permanecem disponíveis.
    </p>
  </PageFrame>
</template>
