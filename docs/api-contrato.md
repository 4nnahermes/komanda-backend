# Contrato da API — Komanda

Sprint 2 · Responsáveis: Anna Hermes e Gabriel Lessa
Versão 0.1 · rascunho para revisão com a dupla de frontend

---

## 1. Convenções gerais

| Item | Regra |
|---|---|
| Endereço base | `http://localhost:3000/api` |
| Formato | JSON em todas as requisições e respostas (`Content-Type: application/json`) |
| Nomes de campos | camelCase, em português, sem acento (`categoriaId`, `preco`, `ativo`) |
| Identificadores | `id` numérico gerado pelo banco |
| Dinheiro | número com até 2 casas decimais, em reais (`32.9` = R$ 32,90) |
| Datas e horas | texto ISO 8601 (`2026-10-08T19:30:00.000Z`) |
| Edição | sempre com `PATCH`: o corpo leva só os campos que mudam |
| Exclusão e desativação | os cadastros podem ser **excluídos** (`DELETE`) ou **desativados** (`ativo: false` no `PATCH`). Desativar esconde do cardápio e mantém o histórico; excluir apaga de vez e só é permitido quando nada depende do registro |
| Listagens | devolvem um array direto, sem paginação no MVP |

### Formato dos erros

Todo erro devolve o código HTTP adequado e um corpo com a mensagem, pronta para exibir na tela:

```json
{ "erro": "O nome da categoria é obrigatório" }
```

| Código | Quando |
|---|---|
| `400 Bad Request` | dados inválidos ou faltando |
| `404 Not Found` | o recurso do caminho (`/:id`) não existe |
| `409 Conflict` | conflito com dado existente (ex.: nome repetido, exclusão de registro em uso) |
| `500 Internal Server Error` | erro inesperado no servidor |

---

## 2. Categorias — US01 (Requisito 1)

### Objeto `Categoria`

```json
{
  "id": 1,
  "nome": "Xis",
  "ordem": 1,
  "ativo": true
}
```

| Campo | Tipo | Regra |
|---|---|---|
| `id` | número | gerado pelo banco |
| `nome` | texto | obrigatório, 1 a 60 caracteres, único (sem diferenciar maiúsculas) |
| `ordem` | número | posição no cardápio, começando em 1 |
| `ativo` | booleano | `true` ao criar |

> Os ingredientes padrão da categoria (Requisito 3) entram quando o cadastro de ingredientes existir. Até lá, a categoria não tem esse campo.

### `GET /api/categorias`

Lista as categorias ordenadas por `ordem`.

| Parâmetro (query) | Obrigatório | Descrição |
|---|---|---|
| `ativo` | não | `true` ou `false` para filtrar. Sem o parâmetro, devolve todas |

**200 OK**

```json
[
  { "id": 1, "nome": "Xis", "ordem": 1, "ativo": true },
  { "id": 2, "nome": "Bauru", "ordem": 2, "ativo": true },
  { "id": 5, "nome": "Bebidas", "ordem": 3, "ativo": true },
  { "id": 7, "nome": "Porções", "ordem": 4, "ativo": false }
]
```

### `GET /api/categorias/:id`

**200 OK** — o objeto `Categoria`.
**404** — `{ "erro": "Categoria não encontrada" }`

### `POST /api/categorias`

Cria uma categoria. Ela entra no fim da ordem, a menos que `ordem` seja informada.

**Requisição**

```json
{ "nome": "Hambúrguer" }
```

| Campo | Obrigatório |
|---|---|
| `nome` | sim |
| `ordem` | não. Se informada, a categoria entra nessa posição e as seguintes descem uma posição |

**201 Created** — o objeto `Categoria` criado.

```json
{ "id": 6, "nome": "Hambúrguer", "ordem": 5, "ativo": true }
```

**Erros**

| Código | Mensagem |
|---|---|
| 400 | `O nome da categoria é obrigatório` |
| 400 | `O nome da categoria deve ter no máximo 60 caracteres` |
| 400 | `A ordem deve ser um número inteiro maior que zero` |
| 409 | `Já existe uma categoria com esse nome` |

### `PATCH /api/categorias/:id`

Edita a categoria: nome e/ou status. Só os campos enviados são alterados. A ordem tem rota própria.

**Requisição** — exemplos:

```json
{ "nome": "Xis e Sanduíches" }
```

```json
{ "ativo": false }
```

| Campo | Obrigatório |
|---|---|
| `nome` | não |
| `ativo` | não |

Pelo menos um dos dois precisa ser enviado.

**200 OK** — o objeto `Categoria` atualizado.

**Erros**

| Código | Mensagem |
|---|---|
| 400 | `Informe ao menos um campo para alterar` |
| 400 | `O nome da categoria é obrigatório` (nome enviado vazio) |
| 400 | `O nome da categoria deve ter no máximo 60 caracteres` |
| 400 | `O campo ativo deve ser true ou false` |
| 404 | `Categoria não encontrada` |
| 409 | `Já existe uma categoria com esse nome` |

> Desativar uma categoria não desativa os produtos dela, mas eles deixam de aparecer no cardápio enquanto a categoria estiver inativa. Ao reativar, eles voltam.

### `DELETE /api/categorias/:id`

Exclui a categoria de vez. As categorias seguintes sobem uma posição na ordem.

**204 No Content** — sem corpo.

**Erros**

| Código | Mensagem |
|---|---|
| 404 | `Categoria não encontrada` |
| 409 | `Não é possível excluir uma categoria com produtos. Exclua ou mova os produtos, ou desative a categoria` |

### `PATCH /api/categorias/ordem`

Define a ordem de todas as categorias de uma vez, como fica depois de o atendente arrastar os itens na tela.

**Requisição** — os `id` na ordem desejada:

```json
{ "ids": [2, 1, 6, 5, 7] }
```

**200 OK** — a lista completa já reordenada (mesmo formato do `GET /api/categorias`).

**Erros**

| Código | Mensagem |
|---|---|
| 400 | `Informe a lista de ids na nova ordem` |
| 400 | `A lista deve conter todas as categorias, sem repetir` |

---

## 3. Produtos — US02 (Requisito 4)

### Objeto `Produto`

```json
{
  "id": 10,
  "nome": "Xis Carne",
  "descricao": "Pão, hambúrguer, ovo, presunto, queijo, alface, tomate e milho",
  "preco": 32.9,
  "ativo": true,
  "categoria": { "id": 1, "nome": "Xis" }
}
```

| Campo | Tipo | Regra |
|---|---|---|
| `nome` | texto | obrigatório, 1 a 80 caracteres, único dentro da categoria (sem diferenciar maiúsculas) |
| `descricao` | texto | opcional, até 255 caracteres; vazia é gravada como `null` |
| `preco` | número | obrigatório, maior que zero, até 2 casas decimais |
| `ativo` | booleano | `true` ao criar |
| `categoria` | objeto | a categoria do produto (`id` e `nome`) |

> A ficha técnica (Requisito 5) e os grupos de complementos (Requisito 6) terão rotas próprias quando forem implementados.

### `GET /api/produtos`

Lista os produtos ordenados pela ordem da categoria e depois pelo nome.

| Parâmetro (query) | Obrigatório | Descrição |
|---|---|---|
| `categoriaId` | não | só os produtos dessa categoria |
| `ativo` | não | `true` ou `false` |

**200 OK** — array de objetos `Produto`.

**Erros**

| Código | Mensagem |
|---|---|
| 400 | `O filtro categoriaId deve ser um número inteiro maior que zero` |
| 400 | `O filtro ativo deve ser true ou false` |

### `GET /api/produtos/:id`

**200 OK** — o objeto `Produto`.
**404** — `{ "erro": "Produto não encontrado" }`

### `POST /api/produtos`

**Requisição**

```json
{
  "nome": "Xis Coração",
  "categoriaId": 1,
  "descricao": "Pão, coração de frango, ovo, queijo, alface e tomate",
  "preco": 36.5
}
```

**201 Created** — o objeto `Produto` criado.

**Erros**

| Código | Mensagem |
|---|---|
| 400 | `O nome do produto é obrigatório` |
| 400 | `O nome do produto deve ter no máximo 80 caracteres` |
| 400 | `O preço do produto é obrigatório` |
| 400 | `O preço deve ser um número` |
| 400 | `O preço deve ser maior que zero` |
| 400 | `O preço deve ter no máximo 2 casas decimais` |
| 400 | `Informe a categoria do produto` |
| 400 | `Categoria não encontrada` |
| 400 | `A descrição deve ser um texto` |
| 400 | `A descrição deve ter no máximo 255 caracteres` |
| 409 | `Já existe um produto com esse nome nesta categoria` |

### `PATCH /api/produtos/:id`

Edita nome, descrição, preço, categoria e/ou status. Só os campos enviados são alterados.

**Requisição** — exemplos:

```json
{ "preco": 34.9 }
```

```json
{ "ativo": false }
```

```json
{ "descricao": null }
```

Enviar `descricao: null` remove a descrição. Mudar o nome ou a categoria confere de novo se o nome está livre na categoria de destino.

**200 OK** — o objeto `Produto` atualizado.

**Erros:** os mesmos do `POST`, mais:

| Código | Mensagem |
|---|---|
| 400 | `Informe ao menos um campo para alterar` |
| 400 | `O campo ativo deve ser true ou false` |
| 404 | `Produto não encontrado` |

> Mudar o preço não altera os pedidos já feitos, que guardam o preço do momento da venda (RN5).

### `DELETE /api/produtos/:id`

Exclui o produto de vez.

**204 No Content** — sem corpo.

**Erros**

| Código | Mensagem |
|---|---|
| 404 | `Produto não encontrado` |
| 409 | `Não é possível excluir um produto que já foi vendido. Desative o produto` |

> A regra do 409 entra em vigor quando o módulo de pedidos existir. Ela protege os relatórios (RN5 e RN6).

---

## 4. Cardápio — US03 (Requisito 8)

### `GET /api/cardapio`

Devolve o cardápio pronto para exibir: as categorias **ativas**, na ordem definida, cada uma com os seus produtos **ativos** ordenados por nome. Categorias sem nenhum produto ativo não aparecem.

**200 OK**

```json
[
  {
    "id": 1,
    "nome": "Xis",
    "ordem": 1,
    "produtos": [
      { "id": 10, "nome": "Xis Carne", "descricao": "Pão, hambúrguer, ovo, presunto, queijo, alface, tomate e milho", "preco": 32.9 },
      { "id": 11, "nome": "Xis Coração", "descricao": "Pão, coração de frango, ovo, queijo, alface e tomate", "preco": 36.5 }
    ]
  },
  {
    "id": 5,
    "nome": "Bebidas",
    "ordem": 3,
    "produtos": [
      { "id": 20, "nome": "Refrigerante lata", "descricao": null, "preco": 7 }
    ]
  }
]
```

No exemplo, a categoria Bauru (ordem 2) não aparece porque ainda não tem produtos ativos. Se não houver nada cadastrado, devolve `[]`.

---

## 5. Demais rotas do MVP (a detalhar)

Lista prevista para orientar o frontend. Caminhos e campos serão detalhados, e podem mudar, na sprint em que cada módulo for implementado.

### Cardápio (complementos e ficha técnica)

| Método | Rota | Descrição | Requisito |
|---|---|---|---|
| GET, POST, PATCH, DELETE | `/api/ingredientes` | Cadastro de ingredientes (unidade e estoque mínimo) | R2 |
| GET, PATCH | `/api/categorias/:id/ingredientes-padrao` | Ingredientes padrão da categoria | R3 |
| GET, PATCH | `/api/produtos/:id/ficha-tecnica` | Ficha técnica do produto | R5 |
| GET, POST, PATCH, DELETE | `/api/grupos-complementos` | Grupos de complementos e produtos ligados | R6 |
| GET, POST, PATCH, DELETE | `/api/grupos-complementos/:id/complementos` | Complementos de um grupo | R7 |

### Pedidos

| Método | Rota | Descrição | Requisito |
|---|---|---|---|
| GET | `/api/pedidos` | Lista pedidos (filtros por data e status) | R9, R18 |
| GET | `/api/pedidos/:id` | Detalhe do pedido com itens | R9 |
| POST | `/api/pedidos` | Cria pedido; calcula total, taxa, troco e prazo; dá baixa no estoque | R9–R17, R22, R24, RN1–RN3 |
| PATCH | `/api/pedidos/:id/status` | Altera o status (Em preparo, Saiu para entrega, Entregue, Cancelado) | R18 |
| PATCH | `/api/pedidos/:id/motoboy` | Vincula o motoboy | R17 |
| GET, PATCH | `/api/configuracoes/prazo-entrega` | Prazo médio de entrega vigente | R21 |

### Cadastros de apoio

| Método | Rota | Descrição | Requisito |
|---|---|---|---|
| GET, POST, PATCH, DELETE | `/api/bairros` | Bairros e taxa de entrega | R19 |
| GET, POST, PATCH, DELETE | `/api/formas-pagamento` | Formas de pagamento | R20 |
| GET, POST, PATCH, DELETE | `/api/motoboys` | Motoboys e valor fixo por noite | R26 |

### Estoque

| Método | Rota | Descrição | Requisito |
|---|---|---|---|
| POST | `/api/estoque/entradas` | Registra entrada de estoque | R23 |
| GET | `/api/estoque` | Saldo atual de cada ingrediente | R25 |
| GET | `/api/estoque/:ingredienteId/movimentos` | Histórico de entradas e saídas | R25 |

### Fechamento e dashboard

| Método | Rota | Descrição | Requisito |
|---|---|---|---|
| GET | `/api/caixa/fechamento?data=` | Fechamento do dia por forma de pagamento, taxas e motoboys | R28, R29, RN6 |
| GET | `/api/motoboys/acerto?data=` | Acerto de cada motoboy na noite | R27, RN4 |
| GET | `/api/dashboard/metricas?inicio=&fim=` | Métricas de vendas do período | R30–R32, RN6 |
| GET | `/api/dashboard/alertas-estoque` | Ingredientes abaixo ou perto do mínimo | R33 |

---

## Pontos para confirmar entre as duplas

1. **Ordenar categorias:** o frontend envia a lista inteira de `ids` em `PATCH /api/categorias/ordem`. Isso funciona tanto para arrastar e soltar quanto para botões de subir e descer.
2. **Excluir ou desativar:** as telas de categorias e produtos têm as duas ações. Quando a exclusão for bloqueada (409), a tela mostra a mensagem, que já sugere desativar.
3. **Mensagens de erro:** o frontend pode mostrar o campo `erro` direto para o atendente.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 06/10/2026 | Primeira versão: convenções, categorias, produtos e cardápio detalhados; demais rotas listadas |
| 0.2 | 06/10/2026 | Edição passa a ser só por `PATCH` (o status `ativo` vai no mesmo `PATCH`); incluída a exclusão com `DELETE` em categorias, produtos e demais cadastros |
| 0.3 | 07/10/2026 | Produtos: mensagens de erro de tamanho, tipo e casas decimais; erros dos filtros da listagem; `descricao: null` no `PATCH` |
