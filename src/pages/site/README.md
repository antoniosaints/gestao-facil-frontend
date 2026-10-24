# Site público e cadastro guiado

`HomePage.vue` apresenta a plataforma, o cadastro orientado, nichos existentes, apps, plano e FAQ. Mantém o contrato `SitePublicConfig` e o editor administrativo: textos, imagens, preço informativo, dias de teste e listas continuam vindo de `SiteRepository`. Os depoimentos atribuídos a pessoas e os indicadores fictícios dos antigos cards foram removidos; o antigo indicador padrão “5 min para configurar” não é exibido. Os defaults locais não prometem volume ilimitado nem backup/SLA sem evidência. Conteúdo já salvo pelo administrador permanece configurável e precisa de revisão editorial pelo responsável.

`CadastroSite.vue` substitui as três etapas por cinco: acesso, empreendimento/operação, revisão de módulos, aparência e confirmação. Dados ficam em memória; voltar preserva o formulário. A senha não é gravada no armazenamento do navegador e é limpa ao sair ou após sucesso. Erros de campo são associados aos controles, e mudanças de etapa movem o foco ao título. Falhas de catálogo e envio mantêm os dados e permitem repetir a operação.

## Integração

- `GET /contas/onboarding/config` fornece perguntas, módulos, preços, menus essenciais, presets e fontes.
- `POST /contas/onboarding/preview` é a autoridade de recomendações e ações. O frontend envia respostas e seleções, sem calcular elegibilidade, preço ou permissões.
- `POST /contas/cadastro` mantém o payload legado e acrescenta `onboarding` com versão, respostas, seleções, tema e `catalogVersion` quando fornecido pela API. O campo é opcional em `CreateConta`, preservando outros consumidores legados.
- `409 ONBOARDING_CATALOG_CHANGED` recarrega o catálogo e exige nova revisão; não reenvia automaticamente a criação. O token `catalogVersion` da prévia segue no cadastro para detectar alteração de preço/status entre as etapas.
- Apps pagos são recomendações para contratação posterior. Apenas o backend decide quais gratuitos ativar. Nenhum endpoint de contratação/cobrança é chamado pelo wizard.
- Chaves de submenu com `:` continuam no payload conforme a política retornada pelo backend, mas não são apresentadas como menus selecionáveis: elas têm semântica de blacklist. Menus essenciais ficam bloqueados na revisão.

`components/ThemePreview.vue` usa `getThemePalette` e `normalizeThemeCustomization` existentes. As cores e fontes são aplicadas somente ao elemento da prévia; não chama `applyThemeVariables`, não altera `uiStore` nem o tema global. Paletas vêm do catálogo; fontes são limitadas às já instaladas. Os dois modos aparecem lado a lado no desktop e em coluna no mobile, com conteúdo explicitamente ilustrativo.

## Verificação

`npm run test:unit -- --run src/pages/site/CadastroSite.spec.ts src/pages/site/HomePage.spec.ts src/pages/site/TermosPolitica.spec.ts src/pages/clientes/tabela/Mobile.spec.ts`

Os testes cobrem validação, retorno entre etapas, indicação, payload revisado, envio repetido, mudança de catálogo, falha recuperável, isolamento da prévia e configuração do site. O teste de criação usa repository simulado e não abre assinatura real. Homologação com persistência, e-mail e login deve usar ambiente de teste com migration do backend aplicada.
