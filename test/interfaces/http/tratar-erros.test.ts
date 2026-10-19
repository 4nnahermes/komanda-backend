import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { ConflitoDeDados, ErroDeValidacao, RecursoNaoEncontrado } from "../../../src/dominio/compartilhado/erros";
import { tratarErros } from "../../../src/interfaces/http/tratar-erros";

function appQueLanca(erro: unknown) {
    const app = express();
    app.use(express.json());
    app.post("/", async () => {
        throw erro;
    });
    app.use(tratarErros);
    return app;
}

describe("tratarErros", () => {
    it.each([
        [new ErroDeValidacao("Dado inválido"), 400],
        [new RecursoNaoEncontrado("Não encontrado"), 404],
        [new ConflitoDeDados("Já existe"), 409],
    ])("traduz %s para o status %i com a mensagem do erro", async (erro, status) => {
        const resposta = await request(appQueLanca(erro)).post("/").send({});
        expect(resposta.status).toBe(status);
        expect(resposta.body).toEqual({ erro: (erro as Error).message });
    });

    it("responde 400 quando o corpo não é um JSON válido", async () => {
        const resposta = await request(appQueLanca(new Error("não deve chegar aqui")))
            .post("/")
            .set("Content-Type", "application/json")
            .send("{ nome: ");
        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({ erro: "O corpo da requisição não é um JSON válido" });
    });

    it("esconde detalhes de erros inesperados", async () => {
        const silenciar = vi.spyOn(console, "error").mockImplementation(() => {});
        const resposta = await request(appQueLanca(new Error("senha do banco: 123"))).post("/").send({});
        expect(resposta.status).toBe(500);
        expect(resposta.body).toEqual({ erro: "Erro inesperado no servidor" });
        silenciar.mockRestore();
    });
});
