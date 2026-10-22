import { QueryFailedError } from "typeorm";
import { describe, expect, it } from "vitest";
import { MENSAGENS_BAIRROS } from "../../../../src/aplicacao/entrega/bairros/mensagens";
import { Bairro } from "../../../../src/dominio/entrega/bairro";
import { ConflitoDeDados } from "../../../../src/dominio/compartilhado/erros";
import { RepositorioBairrosTypeorm } from "../../../../src/infraestrutura/typeorm/entrega/repositorio-bairros-typeorm";

function queryError(code: string) {
    return new QueryFailedError("query", [], Object.assign(new Error("database error"), { code }));
}

describe("RepositorioBairrosTypeorm", () => {
    it("traduz PostgreSQL 23505 ao salvar", async () => {
        const dataSource = { getRepository: () => ({ create: () => ({}), save: async () => { throw queryError("23505"); } }) };
        const repo = new RepositorioBairrosTypeorm(dataSource as any);
        await expect(repo.salvar(Bairro.criar({ nome: "Centro", taxaEntrega: 1 }))).rejects.toEqual(new ConflitoDeDados(MENSAGENS_BAIRROS.nomeRepetido));
    });

    it("traduz PostgreSQL 23503 ao excluir", async () => {
        const dataSource = { getRepository: () => ({ delete: async () => { throw queryError("23503"); } }) };
        const repo = new RepositorioBairrosTypeorm(dataSource as any);
        await expect(repo.excluir(1)).rejects.toEqual(new ConflitoDeDados(MENSAGENS_BAIRROS.emUso));
    });

    it("atualiza só os campos enviados e não recria linha removida em concorrência", async () => {
        let capturado: unknown;
        const dataSource = { getRepository: () => ({
            update: async (_filtro: unknown, valores: unknown) => { capturado = valores; return { affected: 1 }; },
        }) };
        const repo = new RepositorioBairrosTypeorm(dataSource as any);
        const bairro = Bairro.restaurar({ id: 7, nome: "Centro", taxaEntrega: Bairro.criar({ nome: "Centro", taxaEntrega: 8.5 }).taxaEntrega, ativo: false });
        await repo.salvar(bairro, ["ativo"]);
        expect(capturado).toEqual({ ativo: false });

        const removido = new RepositorioBairrosTypeorm({ getRepository: () => ({ update: async () => ({ affected: 0 }) }) } as any);
        await expect(removido.salvar(bairro, ["ativo"])).rejects.toMatchObject({ name: "RecursoNaoEncontrado", message: "Bairro não encontrado" });
    });
});
