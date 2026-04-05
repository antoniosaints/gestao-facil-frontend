# Páginas por Domínio

## Papel da pasta
`pages` organiza as telas do produto por domínio de negócio. O router carrega essas páginas de forma lazy e usa `meta` para layout, permissão e visibilidade pública.

## Organização atual
- Domínios principais: `dashboard`, `clientes`, `produtos`, `servicos`, `financeiro`, `usuarios`, `configs`, `perfil`, `vendas`.
- Áreas complementares: `site`, `auth`, `assinatura`, `agente`, `chats`.
- Modo alternativo do produto: `arena`, com rotas, telas e fluxos próprios.
- Administração separada: `admin`.

## Padrão de composição
Cada domínio tende a repetir esta estrutura:
- `Home.vue` ou tela principal de listagem;
- subpastas como `tabela`, `modais`, `formulario`, `dashboard`, `publico` e `others`;
- componentes locais do módulo, mantidos junto da página para reduzir acoplamento global.

## Relação com router e layouts
- O router define qual página é renderizada e qual layout será usado.
- `VITE_MODE_SYSTEM` altera a escolha de algumas telas, principalmente entre ERP e `arena`.
- Rotas privadas dependem de autenticação, status da conta e `permissao`.
- Páginas de dashboard devem refletir filtros operacionais reais do domínio, como período e agregações segregadas por conta.

## Regras
- Ao criar funcionalidade nova, encaixar dentro do domínio correto antes de abrir uma nova área.
- Componentes específicos da tela devem ficar próximos dela.
- Regras de acesso devem ser refletidas tanto no router quanto na experiência visual da página.
- Fluxos operacionais como PDV, comprovante pós-venda e modais de envio devem manter ações principais visíveis, feedback imediato e estados explícitos de disponibilidade ou desenvolvimento.
- Sempre use Tanstack table para criação de listagens desktop, acesse outras tabelas para entender o padrão
