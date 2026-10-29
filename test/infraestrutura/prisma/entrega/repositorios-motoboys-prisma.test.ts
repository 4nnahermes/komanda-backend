import { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { MENSAGENS } from "../../../../src/aplicacao/entrega/motoboys/mensagens";
import { Motoboy } from "../../../../src/dominio/entrega/motoboy";
import { ConflitoDeDados } from "../../../../src/dominio/compartilhado/erros";
import { ConsultaMotoboysPrisma, RepositorioMotoboysPrisma } from "../../../../src/infraestrutura/prisma/entrega/repositorio-motoboys-prisma";

function erroPrisma(codigo: string) { return Object.assign(new Error("erro simulado"), { code: codigo }); }

describe("adaptadores Prisma de motoboys", () => {
    it("cria com id do contador e persistência de telefone e dinheiro em BigInt", async () => {
        const tx = {
            contador: { upsert: vi.fn().mockResolvedValue({ valor: 13 }) },
            motoboy: { create: vi.fn().mockResolvedValue({}) },
        };
        const prisma = { $transaction: vi.fn(async (acao: (tx: unknown) => unknown) => acao(tx)) };
        const repo = new RepositorioMotoboysPrisma(prisma as unknown as PrismaClient);

        const id = await repo.salvar(Motoboy.criar({ nome: " Ana ", telefone: " 51 999 ", valorFixoNoite: 99999999.99, ativo: false }));

        expect(id).toBe(13);
        expect(tx.contador.upsert).toHaveBeenCalledWith({ where: { chave: "motoboys" }, create: { chave: "motoboys", valor: 1 }, update: { valor: { increment: 1 } } });
        expect(tx.motoboy.create).toHaveBeenCalledWith({ data: { id: 13, nome: "Ana", nomeNormalizado: "ana", telefone: "51 999", valorFixoNoiteCentavos: 9999999999n, ativo: false } });
    });

    it("PATCH altera só campos definidos e preserva null, zero e false", async () => {
        const updateMany = vi.fn().mockResolvedValue({ count: 1 });
        const repo = new RepositorioMotoboysPrisma({ motoboy: { updateMany } } as unknown as PrismaClient);

        await expect(repo.atualizar(8, { telefone: null, valorFixoNoite: 0, ativo: false })).resolves.toBe(true);
        expect(updateMany).toHaveBeenCalledWith({ where: { id: 8 }, data: { telefone: null, valorFixoNoiteCentavos: 0n, ativo: false } });

        await repo.atualizar(8, { nome: " Norte " });
        expect(updateMany).toHaveBeenLastCalledWith({ where: { id: 8 }, data: { nome: "Norte", nomeNormalizado: "norte" } });
    });

    it("mapeia P2002 para 409 e count zero retorna false sem upsert", async () => {
        const updateMany = vi.fn().mockRejectedValueOnce(erroPrisma("P2002")).mockResolvedValueOnce({ count: 0 });
        const repo = new RepositorioMotoboysPrisma({ motoboy: { updateMany } } as unknown as PrismaClient);
        await expect(repo.atualizar(8, { nome: "Ana" })).rejects.toEqual(new ConflitoDeDados(MENSAGENS.nomeRepetido));
        await expect(repo.atualizar(8, { ativo: true })).resolves.toBe(false);
        expect(updateMany).toHaveBeenCalledTimes(2);
    });

    it("deleteMany retorna false se uma remoção concorrente já excluiu o registro", async () => {
        const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
        const repo = new RepositorioMotoboysPrisma({ motoboy: { deleteMany } } as unknown as PrismaClient);
        await expect(repo.excluir(8)).resolves.toBe(false);
        expect(deleteMany).toHaveBeenCalledWith({ where: { id: 8 } });
    });

    it("lista ordenado, filtra ativo e reconstrói dinheiro e telefone nulo", async () => {
        const findMany = vi.fn().mockResolvedValue([{ id: 2, nome: "Ana", nomeNormalizado: "ana", telefone: null, valorFixoNoiteCentavos: 4050n, ativo: false }]);
        const findUnique = vi.fn().mockResolvedValue({ id: 2, nome: "Ana", nomeNormalizado: "ana", telefone: null, valorFixoNoiteCentavos: 4050n, ativo: false });
        const consulta = new ConsultaMotoboysPrisma({ motoboy: { findMany, findUnique } } as unknown as PrismaClient);
        await expect(consulta.listar({ ativo: false })).resolves.toMatchObject([{ id: 2, telefone: null, valorFixoNoite: { centavos: 4050 } }]);
        expect(findMany).toHaveBeenCalledWith({ where: { ativo: false }, orderBy: [{ nome: "asc" }, { id: "asc" }] });
        await expect(consulta.buscarPorId(2)).resolves.toMatchObject({ nome: "Ana", ativo: false, telefone: null });
    });
});
