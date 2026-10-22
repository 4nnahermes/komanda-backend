# Contrato frontend/backend — MongoDB

Frontend de referência: `GabrielLTM/komanda-frontend`, derivado somente do frontend de `projeto_mau_mau_lanches_teste`. Esta migração preserva o contrato da integração: IDs numéricos e rotas em português com prefixo `/api`.

| Frontend | API |
|---|---|
| produto `name`, `price`, `desc`, `catId`, `active` | `nome`, `preco`, `descricao`, `categoriaId`, `ativo` |
| produto `ings: string[]` | `ingredientes: string[]` |
| produto `extras: [nome, preco][]` | `adicionais: {nome, preco}[]` |
| bairro `name`, `fee`, `active` | `nome`, `taxaEntrega`, `ativo` |
| motoboy `name`, `phone`, `baseFee`, `active` | `nome`, `telefone`, `valorFixoNoite`, `ativo` |

PATCH só atualiza os campos enviados e preserva zero, false, null e listas vazias quando permitidos. Respostas não expõem BigInt, contador ou nomeNormalizado. Ingredientes/adicionais são opções textuais do produto, sem movimentação de estoque.

Publicação: [Vercel + MongoDB Atlas](../PUBLICACAO.md). `DATABASE_URL` fica somente no backend; `VITE_API_URL` contém a URL pública da API com `/api`. Pedidos/quadro/estoque/caixa/acerto continuam fora da persistência implementada.
