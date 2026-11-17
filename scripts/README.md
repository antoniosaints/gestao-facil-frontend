# Auditoria de formulários

`npm run audit:inputs` verifica os templates Vue e os formulários legados suportados. O comando falha quando encontra um input editável sem placeholder ou um campo identificado de CEP, documento ou telefone sem máscara.

Para gerar o inventário completo, execute `node scripts/audit-inputs.mjs /tmp/input-audit.json --check`. O relatório inclui as exclusões, os campos e suas linhas. A identificação semântica é uma verificação estática complementar aos testes: campos novos ou montados dinamicamente também precisam de revisão funcional.

Use os formatos compartilhados de `src/lib/imaska.ts`. Preserve números do endereço com letras/S/N, chaves PIX e campos de busca com formatos mistos. Não aplique máscaras de texto a `type="number"`; preserve `step`, precisão e tipo do modelo, com `inputmode` adequado. Os placeholders orientam o preenchimento e não substituem rótulos.

`npm run qa:inputs` abre um servidor local na porta 4175 com os componentes reais de cadastro e checkout e controles legados, sem gravação de dados ou chamadas de cadastro. Os testes específicos ficam em `src/lib/inputMasks.spec.ts`.
