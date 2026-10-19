import { z } from "zod";

// Formato do corpo das requisições de produtos (docs/api-contrato.md, seção 3).
// Aqui só se confere o tipo de cada campo; as regras de negócio, como preço
// maior que zero, ficam na entidade Produto.

const nome = z.string({ error: "O nome do produto é obrigatório" });

const preco = z.number({
    error: (problema) =>
        problema.input === undefined ? "O preço do produto é obrigatório" : "O preço deve ser um número",
});

const categoriaId = z
    .number({ error: "Informe a categoria do produto" })
    .int({ error: "Categoria não encontrada" })
    .positive({ error: "Categoria não encontrada" });

const descricao = z.string({ error: "A descrição deve ser um texto" }).nullable();

const ativo = z.boolean({ error: "O campo ativo deve ser true ou false" });

const corpoInvalido = { error: "O corpo da requisição deve ser um objeto JSON" };

export const esquemaNovoProduto = z.object(
    {
        nome,
        preco,
        categoriaId,
        descricao: descricao.optional(),
    },
    corpoInvalido,
);

export const esquemaAlteracoesProduto = z.object(
    {
        nome: nome.optional(),
        preco: preco.optional(),
        categoriaId: categoriaId.optional(),
        descricao: descricao.optional(),
        ativo: ativo.optional(),
    },
    corpoInvalido,
);
