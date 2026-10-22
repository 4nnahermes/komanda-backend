import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { tratarErros } from "../../../../src/interfaces/http/tratar-erros";
import { montarRotasMotoboys } from "../../../../src/main/motoboys";
import { MotoboysEmMemoria } from "../../../fakes/motoboys-em-memoria";

function apiCriada() {
    const mem = new MotoboysEmMemoria(); const app = express(); app.use(express.json());
    app.use("/api/motoboys", montarRotasMotoboys({ repositorio: mem, consulta: mem })); app.use(tratarErros);
    return request(app);
}

describe("API de motoboys", () => {
    it("faz CRUD, preserva omissão e limpa telefone com null", async () => {
        const api = apiCriada();
        const criado = await api.post("/api/motoboys").send({ nome: " Ana ", telefone: " 11999999999 ", valorFixoNoite: 40.25, ativo: false });
        expect(criado.status).toBe(201);
        expect(criado.body).toEqual({ id: 1, nome: "Ana", telefone: "11999999999", valorFixoNoite: 40.25, ativo: false });
        expect((await api.patch("/api/motoboys/1").send({ telefone: null, ativo: true })).body).toMatchObject({ telefone: null, valorFixoNoite: 40.25, ativo: true });
        expect((await api.get("/api/motoboys/1")).body.telefone).toBeNull();
        expect((await api.delete("/api/motoboys/1")).status).toBe(204);
        expect((await api.get("/api/motoboys/1")).status).toBe(404);
    });
    it("usa valor zero, telefone null e ativo true por padrão; filtra e ordena", async () => {
        const api = apiCriada();
        await api.post("/api/motoboys").send({ nome: "Zeca" });
        await api.post("/api/motoboys").send({ nome: "Ana", telefone: " " });
        await api.patch("/api/motoboys/1").send({ ativo: false });
        expect((await api.get("/api/motoboys")).body.map((m: { nome: string }) => m.nome)).toEqual(["Ana", "Zeca"]);
        expect((await api.get("/api/motoboys?ativo=false")).body.map((m: { nome: string }) => m.nome)).toEqual(["Zeca"]);
        expect((await api.get("/api/motoboys?ativo=sim")).body).toEqual({ erro: "O filtro ativo deve ser true ou false" });
    });
    it.each([
        [{}, "O nome do motoboy é obrigatório"], [{ nome: "   " }, "O nome do motoboy é obrigatório"], [{ nome: "x".repeat(101) }, "O nome do motoboy deve ter no máximo 100 caracteres"],
        [{ nome: "Ana", telefone: 123 }, "O telefone deve ser um texto"], [{ nome: "Ana", telefone: "x".repeat(31) }, "O telefone deve ter no máximo 30 caracteres"],
        [{ nome: "Ana", valorFixoNoite: "3" }, "O valor fixo por noite deve ser um número"], [{ nome: "Ana", valorFixoNoite: -1 }, "O valor fixo por noite não pode ser negativo"],
        [{ nome: "Ana", valorFixoNoite: 1.234 }, "O valor fixo por noite deve ter no máximo 2 casas decimais"], [{ nome: "Ana", valorFixoNoite: 100_000_000 }, "O valor fixo por noite deve ser no máximo 99999999.99"], [{ nome: "Ana", ativo: "sim" }, "O campo ativo deve ser true ou false"],
    ])("POST inválido %j retorna mensagem contratual", async (corpo, mensagem) => {
        const resposta = await apiCriada().post("/api/motoboys").send(corpo);
        expect(resposta.status).toBe(400); expect(resposta.body).toEqual({ erro: mensagem });
    });
    it("rejeita conflito de nome, PATCH vazio e ids inválidos ou fora do integer", async () => {
        const api = apiCriada(); await api.post("/api/motoboys").send({ nome: "Ana" });
        expect((await api.post("/api/motoboys").send({ nome: " ana " })).body).toEqual({ erro: "Já existe um motoboy com esse nome" });
        expect((await api.patch("/api/motoboys/1").send({ campo: "x" })).body).toEqual({ erro: "Informe ao menos um campo para alterar" });
        for (const id of ["abc", "0", "2147483648"]) { const r = await api.get(`/api/motoboys/${id}`); expect(r.status).toBe(404); expect(r.body).toEqual({ erro: "Motoboy não encontrado" }); }
    });
});
