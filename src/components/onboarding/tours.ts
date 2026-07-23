// Registro de tours guiados do sistema. Cada tour tem um id, metadados (para o seletor) e
// uma lista de passos. O motor (useTour) recebe um id e executa os passos correspondentes.
//
// - type 'modal'     -> painel centralizado (sem alvo).
// - type 'spotlight' -> ilumina um elemento (target = seletor CSS) na rota indicada.
// O motor navega até `route` e espera o `target` aparecer antes de posicionar o holofote.

import { LayoutDashboard, Users, type LucideIcon } from 'lucide-vue-next'

export type TourStepType = 'modal' | 'spotlight'
export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto'

export interface TourStep {
  key: string
  type: TourStepType
  /** Rota para a qual navegar antes de exibir o passo (opcional). */
  route?: string
  /** Seletor CSS do elemento a iluminar (apenas para type 'spotlight'). */
  target?: string
  title: string
  /** Texto do corpo (pode conter quebras \n). */
  body: string
  placement?: TourPlacement
  /** Rótulo do botão de avançar neste passo (default: "Próximo"). */
  nextLabel?: string
}

export interface TourDefinition {
  id: string
  /** Título curto exibido no seletor de tours. */
  title: string
  /** Descrição de uma linha exibida no seletor. */
  description: string
  icon: LucideIcon
  /** Classe de cor do ícone no seletor. */
  colorClass: string
  /** Se conclui/pula persistem o flag de onboarding no banco (só o tour de boas-vindas). */
  persistConclusao?: boolean
  steps: TourStep[]
}

// ---------------------------------------------------------------------------
// Tour 1 — Boas-vindas (auto para novos assinantes): produto -> venda -> dashboard.
// ---------------------------------------------------------------------------
const boasVindas: TourDefinition = {
  id: 'boas-vindas',
  title: 'Primeiros passos',
  description: 'Cadastre um produto, lance uma venda e conheça a dashboard.',
  icon: LayoutDashboard,
  colorClass: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  persistConclusao: true,
  steps: [
    {
      key: 'welcome',
      type: 'modal',
      route: '/',
      title: 'Bem-vindo ao Gestão Fácil! 🎉',
      body: 'Que bom ter você aqui! Em menos de um minuto vamos mostrar os três primeiros passos para colocar seu negócio para rodar: cadastrar um produto, lançar uma venda e acompanhar tudo pela dashboard.',
      nextLabel: 'Vamos começar',
    },
    {
      key: 'produto',
      type: 'spotlight',
      route: '/produtos',
      target: '[data-tour="novo-produto"]',
      placement: 'auto',
      title: '1. Cadastre seu primeiro produto',
      body: 'Tudo começa pelo catálogo. Clique em "Novo Produto" para informar nome, preço e estoque. Depois de cadastrado, ele já fica disponível para venda no balcão e no PDV.',
    },
    {
      key: 'venda',
      type: 'spotlight',
      route: '/vendas',
      target: '[data-tour="nova-venda"]',
      placement: 'auto',
      title: '2. Lance uma venda',
      body: 'Com produtos cadastrados, registrar uma venda é rápido: em "Nova Venda" você escolhe o cliente, adiciona os itens ao carrinho e finaliza. Precisa de balcão ágil? Use também o PDV.',
    },
    {
      key: 'dashboard',
      type: 'spotlight',
      route: '/',
      target: '[data-tour="dashboard-indicadores"]',
      placement: 'auto',
      title: '3. Acompanhe pela dashboard',
      body: 'Aqui é a sua central: faturamento, ticket médio, saldo financeiro, estoque crítico e gráficos de tendência. Tudo se atualiza conforme você usa o sistema — é o seu negócio em tempo real.',
    },
    {
      key: 'suporte',
      type: 'modal',
      route: '/',
      title: 'Conte com a gente 💬',
      body: 'Pronto! Você já sabe o essencial. Se surgir qualquer dúvida, nosso suporte está à disposição pelos canais abaixo. Bons negócios!',
      nextLabel: 'Concluir',
    },
  ],
}

// ---------------------------------------------------------------------------
// Tour 2 — Criar outros usuários (equipe e permissões).
// ---------------------------------------------------------------------------
const usuarios: TourDefinition = {
  id: 'usuarios',
  title: 'Adicionar sua equipe',
  description: 'Crie usuários e defina os níveis de acesso de cada um.',
  icon: Users,
  colorClass: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-300',
  steps: [
    {
      key: 'intro',
      type: 'modal',
      route: '/administracao/usuarios',
      title: 'Traga sua equipe para o sistema 👥',
      body: 'Você pode dar acesso aos seus funcionários com logins próprios e permissões específicas — cada um vê e faz apenas o que precisa. Vamos ver como criar um novo usuário.',
      nextLabel: 'Mostrar como',
    },
    {
      key: 'novo-usuario',
      type: 'spotlight',
      route: '/administracao/usuarios',
      target: '[data-tour="novo-usuario"]',
      placement: 'auto',
      title: 'Criar um novo usuário',
      body: 'Clique em "Novo usuário". No formulário você informa nome, e-mail e a senha inicial de acesso — é com esses dados que a pessoa fará login no sistema.',
    },
    {
      key: 'permissoes',
      type: 'spotlight',
      route: '/administracao/usuarios',
      target: '[data-tour="novo-usuario"]',
      placement: 'auto',
      title: 'Defina o nível de acesso',
      body: 'Ainda no cadastro, escolha a permissão do usuário. Ela controla o que ele pode acessar — de um perfil operacional (só vendas/PDV) até um perfil gerencial com acesso amplo. Ajuste conforme a função de cada pessoa.',
    },
    {
      key: 'fim',
      type: 'modal',
      route: '/administracao/usuarios',
      title: 'Tudo pronto! ✅',
      body: 'Agora é só criar quantos usuários precisar. Você pode editar ou desativar o acesso de qualquer pessoa a qualquer momento por esta tela.',
      nextLabel: 'Concluir',
    },
  ],
}

export const tours: TourDefinition[] = [boasVindas, usuarios]

export function getTour(id: string): TourDefinition | undefined {
  return tours.find((tour) => tour.id === id)
}

export const ONBOARDING_TOUR_ID = boasVindas.id
