import { z } from "zod";

const corpoInvalido = { error: "O corpo da requisição deve ser um objeto JSON" };
const nome = z.string({ error: "O nome da categoria é obrigatório" });
const ordem = z.number({ error: "A ordem deve ser um número inteiro maior que zero" })
    .int({ error: "A ordem deve ser um número inteiro maior que zero" })
    .positive({ error: "A ordem deve ser um número inteiro maior que zero" });
const ativo = z.boolean({ error: "O campo ativo deve ser true ou false" });

export const esquemaNovaCategoria = z.object({ nome, ordem: ordem.optional() }, corpoInvalido);
export const esquemaAlteracoesCategoria = z.object({ nome: nome.optional(), ativo: ativo.optional() }, corpoInvalido);
export const esquemaOrdemCategorias = z.object({
    ids: z.array(z.number().int().positive()).min(1, "Informe a lista de ids na nova ordem")
        .catch([]),
}, corpoInvalido);
