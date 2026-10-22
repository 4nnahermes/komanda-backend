import { z } from "zod";

const nome = z.string({ error: "O nome do motoboy é obrigatório" });
const telefone = z.string({ error: "O telefone deve ser um texto" }).nullable();
const valorFixoNoite = z.number({ error: (issue) => issue.input === undefined ? "O valor fixo por noite deve ser um número" : "O valor fixo por noite deve ser um número" });
const ativo = z.boolean({ error: "O campo ativo deve ser true ou false" });
const objeto = { error: "O corpo da requisição deve ser um objeto JSON" };

export const esquemaNovoMotoboy = z.object({ nome, telefone: telefone.optional(), valorFixoNoite: valorFixoNoite.optional(), ativo: ativo.optional() }, objeto);
export const esquemaAlteracoesMotoboy = z.object({ nome: nome.optional(), telefone: telefone.optional(), valorFixoNoite: valorFixoNoite.optional(), ativo: ativo.optional() }, objeto);
