# Vendas e PDV

O PDV Básico, o PDV PRO e o modal de faturamento permitem dividir o total de uma venda entre formas de pagamento. A soma precisa coincidir com o total da venda antes de finalizar.

No detalhe da venda, as formas usadas no pagamento dividido aparecem explicitamente (por exemplo, `PIX + Dinheiro`), sem substituir essa informação por `Outro`.

Quando uma das partes for crediário, o operador seleciona o cliente e configura parcelas somente para o saldo pendente. A entrada é registrada pelas outras formas informadas.

Na gestão financeira, o modal de efetivação já preenche o valor total da parcela. Ao alterar o valor para menos, o operador pode somente quitar a parcela com o valor real informado ou clicar em **Lançar restante** para escolher o vencimento e criar uma nova parcela para o saldo. Neste segundo caso, a parcela efetivada também é atualizada para o valor recebido, evitando que o total do lançamento seja duplicado. O modal de detalhes da venda também expõe as parcelas pendentes, permite recebê-las/pagá-las diretamente e mantém o atalho para abrir o lançamento financeiro completo.
