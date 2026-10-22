import { z } from "zod";

const corpoInvalido = { error: "O corpo da requisição deve ser um objeto JSON" };
const nome = z.string({ error: "O nome do bairro é obrigatório" });
const taxa = z.number({
    error: (issue) => issue.input === undefined ? "A taxa de entrega é obrigatória" : "A taxa de entrega deve ser um número",
}).refine((valor) => valor >= 0, "A taxa de entrega não pode ser negativa")
    .refine((valor) => Number.isFinite(valor) && Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6, "A taxa de entrega deve ter no máximo 2 casas decimais")
    .max(99_999_999.99, "A taxa de entrega deve ser no máximo 99999999.99");
const ativo = z.boolean({ error: "O campo ativo deve ser true ou false" });

export const esquemaNovoBairro = z.object({ nome, taxaEntrega: taxa, ativo: ativo.optional() }, corpoInvalido);
export const esquemaAlteracoesBairro = z.object({ nome: nome.optional(), taxaEntrega: taxa.optional(), ativo: ativo.optional() }, corpoInvalido);
