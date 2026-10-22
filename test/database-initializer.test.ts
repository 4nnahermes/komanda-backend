import { describe, expect, it, vi } from "vitest";
import { InicializadorDeBanco } from "../src/database-initializer";

describe("InicializadorDeBanco", () => {
    it("compartilha uma inicialização entre chamadas concorrentes", async () => {
        let liberar!: () => void;
        const gate = new Promise<void>((resolve) => { liberar = resolve; });
        const fonte = {
            isInitialized: false,
            initialize: vi.fn(async () => {
                await gate;
                fonte.isInitialized = true;
            }),
        };
        const inicializador = new InicializadorDeBanco(fonte);

        const chamadas = [inicializador.inicializar(), inicializador.inicializar(), inicializador.inicializar()];
        expect(fonte.initialize).toHaveBeenCalledTimes(1);
        liberar();
        await expect(Promise.all(chamadas)).resolves.toEqual([fonte, fonte, fonte]);
    });

    it("permite tentar novamente depois de uma falha", async () => {
        const fonte = {
            isInitialized: false,
            initialize: vi.fn()
                .mockRejectedValueOnce(new Error("indisponível"))
                .mockImplementationOnce(async () => { fonte.isInitialized = true; }),
        };
        const inicializador = new InicializadorDeBanco(fonte);

        await expect(inicializador.inicializar()).rejects.toThrow("indisponível");
        await expect(inicializador.inicializar()).resolves.toBe(fonte);
        expect(fonte.initialize).toHaveBeenCalledTimes(2);
    });
});
