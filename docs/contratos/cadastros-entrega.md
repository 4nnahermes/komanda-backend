# Contrato — bairros e motoboys

Proposta implementável da Sprint 3, 22/10/2026. Complementa o contrato geral da API; não afirma validação do cliente.

## Formatos

Bairro: `{"id":1,"nome":"Centro","taxaEntrega":5.5,"ativo":true}`.
Motoboy: `{"id":1,"nome":"João","telefone":null,"valorFixoNoite":0,"ativo":true}`.

| Método | Bairros | Motoboys | Resultado |
|---|---|---|---|
| GET | /api/bairros?ativo=true | /api/motoboys?ativo=true | 200, array; filtro opcional true/false, sem filtro inclui todos |
| GET | /api/bairros/:id | /api/motoboys/:id | 200, objeto |
| POST | /api/bairros | /api/motoboys | 201, objeto criado |
| PATCH | /api/bairros/:id | /api/motoboys/:id | 200, objeto atualizado |
| DELETE | /api/bairros/:id | /api/motoboys/:id | 204, sem corpo |

Listas ordenadas por nome e id. Ids são inteiros positivos de até 2147483647; inválidos respondem como inexistentes. POST de bairro exige nome e taxaEntrega; ativo é opcional (true). POST de motoboy exige nome; telefone, valorFixoNoite e ativo são opcionais (null, zero e true). PATCH aceita os mesmos campos, todos opcionais, mas exige pelo menos um conhecido; desconhecidos são ignorados e não persistem. Omitir campo preserva o valor. Nomes são aparados, 1–100 caracteres, únicos por lower(nome), incluindo inativos. Homônimos de motoboys devem usar nomes de identificação distintos nesta proposta.

Dinheiro: número JSON em reais, não negativo, até duas casas decimais e máximo 99999999.99, inclusive. Strings monetárias, null, booleanos e negativos são inválidos. Telefone: texto opcional até 30 caracteres após trim; null ou vazio limpam o telefone. Não impõe formato nacional nem transforma número em texto. Ativo sempre booleano.

## Erros

Sempre `{ "erro": "mensagem" }`. As mensagens abaixo são contrato dos módulos.

| Condição | Status | Mensagem |
|---|---|---|
| Nome ausente/vazio/tipo inválido | 400 | O nome do bairro é obrigatório / O nome do motoboy é obrigatório |
| Nome longo | 400 | O nome do bairro deve ter no máximo 100 caracteres / O nome do motoboy deve ter no máximo 100 caracteres |
| Taxa ausente | 400 | A taxa de entrega é obrigatória |
| Taxa de tipo inválido | 400 | A taxa de entrega deve ser um número |
| Taxa negativa | 400 | A taxa de entrega não pode ser negativa |
| Precisão inválida | 400 | A taxa de entrega deve ter no máximo 2 casas decimais |
| Taxa acima do limite | 400 | A taxa de entrega deve ser no máximo 99999999.99 |
| Valor fixo de tipo inválido | 400 | O valor fixo por noite deve ser um número |
| Valor fixo negativo | 400 | O valor fixo por noite não pode ser negativo |
| Precisão do valor fixo | 400 | O valor fixo por noite deve ter no máximo 2 casas decimais |
| Valor fixo acima do limite | 400 | O valor fixo por noite deve ser no máximo 99999999.99 |
| Telefone de tipo inválido | 400 | O telefone deve ser um texto |
| Telefone longo | 400 | O telefone deve ter no máximo 30 caracteres |
| Ativo inválido | 400 | O campo ativo deve ser true ou false |
| Filtro inválido | 400 | O filtro ativo deve ser true ou false |
| PATCH sem campos conhecidos | 400 | Informe ao menos um campo para alterar |
| Corpo não objeto | 400 | O corpo da requisição deve ser um objeto JSON |
| Recurso/id inexistente | 404 | Bairro não encontrado / Motoboy não encontrado |
| Nome duplicado | 409 | Já existe um bairro com esse nome / Já existe um motoboy com esse nome |
| Referência impede exclusão | 409 | Não é possível excluir um bairro em uso. Desative o bairro / Não é possível excluir um motoboy em uso. Desative o motoboy |

JSON malformado e falhas inesperadas seguem o middleware compartilhado. MongoDB não tem foreign keys; pedidos ainda não existem nesta API e não há bloqueio fictício de uso por pedidos. Nenhum acerto financeiro é calculado pelo cadastro. O valor individual segue R26/modelo original; diária global exibida no protótipo depende de decisão futura e não é copiada como regra de negócio.

## Exemplos

POST /api/bairros: `{"nome":"Centro","taxaEntrega":0}`.
PATCH /api/bairros/1: `{"ativo":false}`.
POST /api/motoboys: `{"nome":"João","telefone":"(51) 99999-0000","valorFixoNoite":40}`.
PATCH /api/motoboys/1: `{"telefone":null}`.
