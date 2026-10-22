import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { tratarErros } from "../../../../src/interfaces/http/tratar-erros";
import { montarRotasCategorias } from "../../../../src/main/categorias";
import { CategoriasEmMemoria } from "../../../fakes/categorias-em-memoria";

function criarApp(repositorio: CategoriasEmMemoria) {
    const app = express();
    app.use(express.json());
    app.use("/api/categorias", montarRotasCategorias(repositorio));
    app.use(tratarErros);
    return app;
}

describe("API de categorias (US01)", () => {
    let repositorio: CategoriasEmMemoria;
    let api: ReturnType<typeof request>;

    beforeEach(() => {
        repositorio = new CategoriasEmMemoria();
        api = request(criarApp(repositorio));
    });

    it("cria no fim ou na posição pedida e lista com filtro ativo", async () => {
        await api.post("/api/categorias").send({ nome: "Xis" });
        await api.post("/api/categorias").send({ nome: "Bebidas" });
        const criada = await api.post("/api/categorias").send({ nome: "Bauru", ordem: 2 });
        expect(criada.status).toBe(201);
        expect(criada.body).toMatchObject({ id: 3, nome: "Bauru", ordem: 2, ativo: true });
        expect((await api.get("/api/categorias")).body.map((c: { nome: string }) => c.nome)).toEqual(["Xis", "Bauru", "Bebidas"]);
        await api.patch("/api/categorias/2").send({ ativo: false });
        expect((await api.get("/api/categorias?ativo=false")).body).toHaveLength(1);
        expect((await api.get("/api/categorias?ativo=sim")).body).toEqual({ erro: "O filtro ativo deve ser true ou false" });
    });

    it("preserva mensagens de validação, conflitos e 404", async () => {
        expect((await api.post("/api/categorias").send({ nome: "  " })).body).toEqual({ erro: "O nome da categoria é obrigatório" });
        expect((await api.post("/api/categorias").send({ nome: "x".repeat(61) })).body).toEqual({ erro: "O nome da categoria deve ter no máximo 60 caracteres" });
        expect((await api.post("/api/categorias").send({ nome: "Xis", ordem: 0 })).body).toEqual({ erro: "A ordem deve ser um número inteiro maior que zero" });
        await api.post("/api/categorias").send({ nome: "Xis" });
        const repetida = await api.post("/api/categorias").send({ nome: " xis " });
        expect(repetida.status).toBe(409);
        expect(repetida.body).toEqual({ erro: "Já existe uma categoria com esse nome" });
        expect((await api.patch("/api/categorias/1").send({})).body).toEqual({ erro: "Informe ao menos um campo para alterar" });
        expect((await api.patch("/api/categorias/1").send({ ativo: "sim" })).body).toEqual({ erro: "O campo ativo deve ser true ou false" });
        expect((await api.get("/api/categorias/2147483648")).status).toBe(404);
        expect((await api.get("/api/categorias/999")).body).toEqual({ erro: "Categoria não encontrada" });
    });

    it("reordena apenas a lista completa e exclui fechando a lacuna", async () => {
        for (const nome of ["Xis", "Bebidas", "Bauru"]) await api.post("/api/categorias").send({ nome });
        const incompleta = await api.patch("/api/categorias/ordem").send({ ids: [1] });
        expect(incompleta.status).toBe(400);
        expect(incompleta.body).toEqual({ erro: "A lista deve conter todas as categorias, sem repetir" });
        const ordenada = await api.patch("/api/categorias/ordem").send({ ids: [3, 1, 2] });
        expect(ordenada.body.map((c: { id: number }) => c.id)).toEqual([3, 1, 2]);
        expect((await api.delete("/api/categorias/1")).status).toBe(204);
        expect((await api.get("/api/categorias")).body.map((c: { ordem: number }) => c.ordem)).toEqual([1, 2]);
    });

    it("bloqueia exclusão de categoria que tenha produtos", async () => {
        await api.post("/api/categorias").send({ nome: "Xis" });
        repositorio.idsComProdutos.add(1);
        const resposta = await api.delete("/api/categorias/1");
        expect(resposta.status).toBe(409);
        expect(resposta.body).toEqual({ erro: "Não é possível excluir uma categoria com produtos. Exclua ou mova os produtos, ou desative a categoria" });
    });
});
