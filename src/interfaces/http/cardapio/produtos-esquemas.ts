import { z } from "zod";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";

// Formato do corpo das requisições de produtos (docs/api-contrato.md, seção 3).
// Aqui só se confere o tipo de cada campo; as regras de negócio, como preço
// maior que zero, ficam na entidade Produto.

const nome = z.string({ error: "O nome do produto é obrigatório" });

const preco = z.number({
    error: (problema) =>
        problema.input === undefined ? "O preço do produto é obrigatório" : "O preço deve ser um número",
}).max(99999999.99, { error: "O preço deve ser no máximo R$ 99.999.999,99" });

const categoriaId = z
    .number({ error: "Informe a categoria do produto" })
    .int({ error: "Categoria não encontrada" })
    .positive({ error: "Categoria não encontrada" });

const descricao = z.string({ error: "A descrição deve ser um texto" }).nullable();

const ativo = z.boolean({ error: "O campo ativo deve ser true ou false" });
const ingredientes = z.array(z.string({ error: "Cada ingrediente deve ser um texto" }).trim().min(1, { error: "Cada ingrediente deve ter de 1 a 120 caracteres" }).max(120, { error: "Cada ingrediente deve ter no máximo 120 caracteres" }), { error: "Os ingredientes devem ser uma lista de textos" })
    .max(50, { error: "Informe até 50 ingredientes" })
    .refine((valores) => new Set(valores).size === valores.length, { error: "Os ingredientes não podem se repetir" });
const adicional = z.object({
    nome: z.string({ error: "O nome do adicional deve ser um texto" }).trim().min(1, { error: "O nome do adicional é obrigatório" }).max(100, { error: "O nome do adicional deve ter no máximo 100 caracteres" }),
    preco: z.number({ error: "O preço do adicional deve ser um número" }).finite({ error: "O preço do adicional deve ser um número válido" }).min(0, { error: "O preço do adicional deve ser de R$ 0,00 a R$ 99.999.999,99" }).max(99999999.99, { error: "O preço do adicional deve ser de R$ 0,00 a R$ 99.999.999,99" }).refine(Dinheiro.ehValorEmReaisValido, { error: "O preço do adicional deve ter até 2 casas decimais" }),
}, { error: "Cada adicional deve ter nome e preço" }).strict();
const adicionais = z.array(adicional, { error: "Os adicionais devem ser uma lista" }).max(50, { error: "Informe até 50 adicionais" }).refine(
    (valores) => new Set(valores.map((extra) => extra.nome.toLocaleLowerCase("pt-BR"))).size === valores.length,
    { error: "Os nomes dos adicionais não podem se repetir" },
);

const corpoInvalido = { error: "O corpo da requisição deve ser um objeto JSON" };

export const esquemaNovoProduto = z.object(
    {
        nome,
        preco,
        categoriaId,
        descricao: descricao.optional(),
        ingredientes: ingredientes.optional(),
        adicionais: adicionais.optional(),
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
        ingredientes: ingredientes.optional(),
        adicionais: adicionais.optional(),
    },
    corpoInvalido,
);
