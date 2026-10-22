import { QueryFailedError } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { Motoboy } from "../../../src/dominio/entrega/motoboy";
import { ConflitoDeDados } from "../../../src/dominio/compartilhado/erros";
import { RepositorioMotoboysTypeorm } from "../../../src/infraestrutura/typeorm/entrega/repositorio-motoboys-typeorm";

function postgresError(code: string) { return new QueryFailedError("query", [], Object.assign(new Error("driver error"), { code })); }

describe("RepositorioMotoboysTypeorm", () => {
    it("traduz erro PostgreSQL 23505 na gravação em conflito contratual", async () => {
        const repo = { create: vi.fn((v) => v), save: vi.fn().mockRejectedValue(postgresError("23505")) };
        const adapter = new RepositorioMotoboysTypeorm({ getRepository: () => repo } as never);
        await expect(adapter.salvar(Motoboy.criar({ nome: "Ana" }))).rejects.toEqual(new ConflitoDeDados("Já existe um motoboy com esse nome"));
    });
    it("traduz erro PostgreSQL 23503 na exclusão para motoboy em uso", async () => {
        const repo = { delete: vi.fn().mockRejectedValue(postgresError("23503")) };
        const adapter = new RepositorioMotoboysTypeorm({ getRepository: () => repo } as never);
        await expect(adapter.excluir(1)).rejects.toEqual(new ConflitoDeDados("Não é possível excluir um motoboy em uso. Desative o motoboy"));
    });
    it("atualiza somente as colunas enviadas no PATCH", async () => {
        const repo = { update: vi.fn().mockResolvedValue({ affected: 1 }) };
        const adapter = new RepositorioMotoboysTypeorm({ getRepository: () => repo } as never);
        await expect(adapter.atualizar(1, { ativo: false })).resolves.toBe(true);
        expect(repo.update).toHaveBeenCalledWith(1, { ativo: false });
    });
    it("traduz erro PostgreSQL 23505 durante PATCH concorrente", async () => {
        const repo = { update: vi.fn().mockRejectedValue(postgresError("23505")) };
        const adapter = new RepositorioMotoboysTypeorm({ getRepository: () => repo } as never);
        await expect(adapter.atualizar(1, { nome: "Ana" })).rejects.toEqual(new ConflitoDeDados("Já existe um motoboy com esse nome"));
    });
});
