import { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { MENSAGENS_BAIRROS } from "../../../../src/aplicacao/entrega/bairros/mensagens";
import { Bairro } from "../../../../src/dominio/entrega/bairro";
import { ConflitoDeDados, RecursoNaoEncontrado } from "../../../../src/dominio/compartilhado/erros";
import { ConsultaBairrosPrisma, RepositorioBairrosPrisma } from "../../../../src/infraestrutura/prisma/entrega/repositorio-bairros-prisma";

function erroPrisma(codigo: string) { return Object.assign(new Error("erro simulado"), { code: codigo }); }

describe("adaptadores Prisma de bairros", () => {
    it("cria com contador transacional, nome normalizado e centavos BigInt", async () => {
        const tx = {
            contador: { upsert: vi.fn().mockResolvedValue({ valor: 21 }) },
            bairro: { create: vi.fn().mockResolvedValue({}) },
        };
        const prisma = { $transaction: vi.fn(async (acao: (tx: unknown) => unknown) => acao(tx)) };
        const repo = new RepositorioBairrosPrisma(prisma as unknown as PrismaClient);

        const id = await repo.salvar(Bairro.criar({ nome: " Centro ", taxaEntrega: 12.34, ativo: false }));

        expect(id).toBe(21);
        expect(tx.contador.upsert).toHaveBeenCalledWith({ where: { chave: "bairros" }, create: { chave: "bairros", valor: 1 }, update: { valor: { increment: 1 } } });
        expect(tx.bairro.create).toHaveBeenCalledWith({ data: { id: 21, nome: "Centro", nomeNormalizado: "centro", taxaEntregaCentavos: 1234n, ativo: false } });
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("atualiza apenas os campos enviados, mantendo zero e false", async () => {
        const updateMany = vi.fn().mockResolvedValue({ count: 1 });
        const prisma = { bairro: { updateMany } };
        const repo = new RepositorioBairrosPrisma(prisma as unknown as PrismaClient);
        const bairro = Bairro.restaurar({ id: 4, nome: "Norte", taxaEntrega: Bairro.criar({ nome: "x", taxaEntrega: 0 }).taxaEntrega, ativo: false });

        await repo.salvar(bairro, ["taxaEntrega", "ativo"]);

        expect(updateMany).toHaveBeenCalledWith({ where: { id: 4 }, data: { taxaEntregaCentavos: 0n, ativo: false } });
    });

    it("transforma P2002 em conflito ao criar ou renomear", async () => {
        const updateMany = vi.fn().mockRejectedValue(erroPrisma("P2002"));
        const repo = new RepositorioBairrosPrisma({ bairro: { updateMany } } as unknown as PrismaClient);
        const bairro = Bairro.restaurar({ id: 4, nome: "Centro", taxaEntrega: Bairro.criar({ nome: "x", taxaEntrega: 0 }).taxaEntrega, ativo: true });
        await expect(repo.salvar(bairro, ["nome"])).rejects.toEqual(new ConflitoDeDados(MENSAGENS_BAIRROS.nomeRepetido));
    });

    it("não recria registro removido e retorna 404 quando update ou delete afeta zero", async () => {
        const updateMany = vi.fn().mockResolvedValue({ count: 0 });
        const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
        const repo = new RepositorioBairrosPrisma({ bairro: { updateMany, deleteMany } } as unknown as PrismaClient);
        const bairro = Bairro.restaurar({ id: 4, nome: "Centro", taxaEntrega: Bairro.criar({ nome: "x", taxaEntrega: 5 }).taxaEntrega, ativo: true });
        await expect(repo.salvar(bairro, ["ativo"])).rejects.toEqual(new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado));
        await expect(repo.excluir(4)).rejects.toEqual(new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado));
    });

    it("consulta em ordem nome/id, aplica filtro e converte BigInt para reais", async () => {
        const findMany = vi.fn().mockResolvedValue([{ id: 7, nome: "Centro", nomeNormalizado: "centro", taxaEntregaCentavos: 1250n, ativo: false }]);
        const findUnique = vi.fn().mockResolvedValue({ id: 7, nome: "Centro", nomeNormalizado: "centro", taxaEntregaCentavos: 1250n, ativo: false });
        const prisma = { bairro: { findMany, findUnique } };
        const consulta = new ConsultaBairrosPrisma(prisma as unknown as PrismaClient);

        await expect(consulta.listar(false)).resolves.toEqual([{ id: 7, nome: "Centro", taxaEntrega: 12.5, ativo: false }]);
        expect(findMany).toHaveBeenCalledWith({ where: { ativo: false }, orderBy: [{ nome: "asc" }, { id: "asc" }] });
        await expect(consulta.buscarPorId(7)).resolves.toMatchObject({ taxaEntrega: 12.5 });
    });
});
