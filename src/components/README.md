# Componentes Compartilhados

## Papel da pasta
`components` agrupa peças reutilizáveis do frontend. Ela não substitui `pages`: serve para blocos genéricos, estruturas compartilhadas e elementos visuais reaproveitados entre módulos.

## Subgrupos atuais
- `ui/`: primitives reutilizáveis baseadas no design system atual.
- `layout/`: header, sidebar, prompts e componentes da casca do app.
- `formulario/`: modais, selects, upload e entradas reutilizáveis.
- `tabela/`: blocos genéricos de tabela e células.
- `graficos/`: wrappers de gráficos.
- `calendario/`: calendário e variantes.
- `hooks/`: componentes de apoio como confirmações e integrações visuais.

## Padrão de uso
- Primeiro tentar compor a tela com `components/ui`.
- Depois reaproveitar componentes de `layout`, `formulario`, `tabela` e `graficos`.
- Só criar componente novo quando o bloco realmente for reutilizável em mais de uma tela ou reduzir complexidade da página.

## Regras
- Componentes desta pasta devem ser genéricos ou claramente compartilháveis.
- Se o componente existe apenas para um módulo específico, prefira mantê-lo perto da página em `pages/<dominio>`.
- Manter a linguagem visual, densidade, espaçamento e naming já presentes no projeto.
- Ao alterar `ui/`, considerar impacto em vários módulos antes de editar.
