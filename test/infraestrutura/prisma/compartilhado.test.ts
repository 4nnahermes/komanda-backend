import { describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { centavosParaBanco, emTransacao, reaisDoBanco } from "../../../src/infraestrutura/prisma/compartilhado";
import { registrarErro } from "../../../src/utils/registrar-erro";

describe("persistência MongoDB compartilhada", () => {
    it("preserva limites monetários em centavos de 64 bits", () => {
        expect(centavosParaBanco(99999999.99)).toBe(9999999999n);
        expect(reaisDoBanco(9999999999n)).toBe(99999999.99);
        expect(centavosParaBanco(0)).toBe(0n);
    });

    it("repete uma transação abortada por concorrência", async () => {
        const erro = { code: "P2034" };
        const transacao = vi.fn().mockRejectedValueOnce(erro).mockResolvedValueOnce(42);
        const valor = await emTransacao({ $transaction: transacao } as unknown as PrismaClient, async () => 42);
        expect(valor).toBe(42);
        expect(transacao).toHaveBeenCalledTimes(2);
    });

    it("não repete conflito de nome único de negócio", async () => {
        const erro = { code: "P2002", meta: { modelName: "Bairro" } };
        const transacao = vi.fn().mockRejectedValue(erro);
        await expect(emTransacao({ $transaction: transacao } as unknown as PrismaClient, async () => 42)).rejects.toBe(erro);
        expect(transacao).toHaveBeenCalledTimes(1);
    });

    it("não registra mensagens, stack ou detalhes de conexão", () => {
        const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
        try {
            registrarErro({ code: "P1001", message: "mongodb+srv://usuario:segredo@exemplo/komanda", stack: "credencial" });
            expect(log).toHaveBeenCalledWith("Falha interna no servidor (P1001)");
            expect(JSON.stringify(log.mock.calls)).not.toContain("segredo");
        } finally {
            log.mockRestore();
        }
    });
});
