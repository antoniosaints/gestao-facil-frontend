# Repositories

## Papel da pasta
`repositories` encapsula o acesso HTTP ao backend. O objetivo é evitar chamadas dispersas nas páginas e concentrar contratos de API por domínio.

## Padrão atual
- Cada domínio expõe uma classe com métodos estáticos.
- Os métodos usam o cliente central de `src/utils/axios.ts`.
- O naming dominante é simples: `get`, `save`, `update`, `remove`, `status`, `getStats` e variantes por caso de uso.

## Fluxo
- Página ou store chama o repository.
- O repository monta a rota e retorna os dados do `axios`.
- O cliente HTTP já injeta token e tenta renovação de sessão em caso de `401`.

## Relação com o backend
- As rotas seguem os domínios do backend, como `clientes`, `contas`, `vendas`, `lancamentos`, `servicos`, `arena` e `gemini`.
- Os contracts consumidos normalmente são tipados em `src/types/schemas.ts`.

## Regras
- Novas integrações HTTP devem entrar aqui, não direto em componentes.
- Reutilizar o cliente de `axios` existente para manter autenticação e tratamento de sessão.
- Se uma chamada exigir tratamento muito específico, manter o detalhe no repository e devolver uma interface previsível para a store ou página.
