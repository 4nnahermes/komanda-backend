# Alinhamento entre API e telas — issue #25

22/10/2026. Decisões técnicas propostas para integrar o catálogo básico. Confirmação da dupla de frontend e do cliente ainda pendente; este documento não fecha a issue #25.

## Matriz de adaptação

| Tela/modelo do protótipo | Contrato backend | Ação frontend |
|---|---|---|
| Categoria | id, nome, ordem, ativo | Consumir /api/categorias, PATCH /ordem com todos os ids |
| Produto | id, nome, descricao, preco, ativo, categoria {id,nome} | Enviar categoriaId na escrita; converter o modelo local explicitamente |
| Consulta cardápio | array de categorias com produtos ativos | Consumir GET /api/cardapio; tratar [] e falha de rede |
| Bairro name/fee/active | nome/taxaEntrega/ativo | Converter nomes e consumir CRUD /api/bairros |
| Motoboy name/phone | nome/telefone | Converter nomes e consumir CRUD /api/motoboys |
| dailyFee global na tela | valorFixoNoite individual no modelo original | Não inferir R$40; confirmar global versus individual antes do acerto financeiro |

Referência local das telas: projeto_mau_mau_lanches_teste/src/components/{CardapioAdmin,BairrosAdmin,MotoboysAdmin,NovoPedido}.jsx e src/services/api.js. São evidência do protótipo, não prova de integração publicada. O repositório oficial do frontend é independente.

## Decisões de escopo do catálogo básico

- **Combos**: não há endpoint ou campos de composição. Exibir um produto com nome de combo não representa composição, desconto ou baixa por componentes. Confirmar itens, preço, personalização e estoque antes de modelar.
- **Estoque por produto**: o requisito controla ingredientes pela ficha técnica (R5/R22/R24), não saldo arbitrário no produto. Não derivar consumo da descrição ou da lista de nomes do mock. Ficha técnica precisa ids, quantidades e unidades.
- **Imagem**: produto atual não tem imagem nem upload/storage. Não enviar esse campo esperando persistência. Definir URL versus upload, hospedagem e limites antes de expandir o contrato.
- **Ingredientes removíveis**: a seleção por nomes do mock não substitui ids e quantidades da ficha técnica. Personalização pertence ao item de pedido e deve ajustar consumo; depende dos módulos de ingredientes/ficha técnica/pedidos. Confirmar quais ingredientes podem ser removidos e impressão do pedido.

Essas funcionalidades não são implementadas ou aprovadas por este documento. O frontend deve adaptar o catálogo ao contrato atual e manter controles futuros identificados como indisponíveis, sem prometer salvamento de campos não suportados.

## Roteiro para a issue #24

1. Integrar GET /api/cardapio e estados carregando/vazio/erro.
2. Conectar escrita/leitura de categorias e produtos e conferir recarregamento.
3. Após merge dos módulos novos, conectar bairros e motoboys conforme cadastros-entrega.md.
4. Tratar {erro}, 400/404/409 e exclusão 204, sem manter cadastro divergente no localStorage.
5. Validar uma rota ponta a ponta antes da sessão do cliente; registrar resultados e decisões na issue.

O backend já disponibiliza as rotas do cardápio. Implementar as telas ou registrar feedback real do cliente (#19) é trabalho separado e permanece pendente.
