import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { tratarErros } from "../../../../src/interfaces/http/tratar-erros";
import { montarRotasProdutos } from "../../../../src/main/produtos";
import { CardapioEmMemoria } from "../../../fakes/cardapio-em-memoria";

// Confere o contrato da API (docs/api-contrato.md, seção 3) com o módulo
// montado sobre o cardápio em memória, sem banco.
function criarApp(cardapio: CardapioEmMemoria) {
    const app = express();
    app.use(express.json());
    app.use(
        "/api/produtos",
        montarRotasProdutos({
            repositorio: cardapio.repositorioProdutos,
            consulta: cardapio.consultaProdutos,
            categorias: cardapio.categoriasDoCardapio,
        }),
    );
    app.use(tratarErros);
    return app;
}

describe("API de produtos", () => {
    let api: ReturnType<typeof request>;

    beforeEach(() => {
        const cardapio = new CardapioEmMemoria();
        cardapio.adicionarCategoria("Xis", 1);
        api = request(criarApp(cardapio));
    });

    it("POST cria e responde 201 com o produto", async () => {
        const resposta = await api.post("/api/produtos").send({ nome: "Xis Coração", categoriaId: 1, preco: 36.5 });
        expect(resposta.status).toBe(201);
        expect(resposta.body).toEqual({
            id: 1,
            nome: "Xis Coração",
            descricao: null,
            preco: 36.5,
            ativo: true,
            categoria: { id: 1, nome: "Xis" },
        });
    });

    it.each([
        [{ categoriaId: 1, preco: 10 }, "O nome do produto é obrigatório"],
        [{ nome: "", categoriaId: 1, preco: 10 }, "O nome do produto é obrigatório"],
        [{ nome: "Xis", categoriaId: 1 }, "O preço do produto é obrigatório"],
        [{ nome: "Xis", categoriaId: 1, preco: "10" }, "O preço deve ser um número"],
        [{ nome: "Xis", categoriaId: 1, preco: 0 }, "O preço deve ser maior que zero"],
        [{ nome: "Xis", preco: 10 }, "Informe a categoria do produto"],
        [{ nome: "Xis", categoriaId: 99, preco: 10 }, "Categoria não encontrada"],
        [{ nome: "Xis", categoriaId: 1, preco: 10, descricao: 5 }, "A descrição deve ser um texto"],
    ])("POST com %j responde 400: %s", async (corpo, mensagem) => {
        const resposta = await api.post("/api/produtos").send(corpo);
        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({ erro: mensagem });
    });

    it("POST com nome repetido na categoria responde 409", async () => {
        await api.post("/api/produtos").send({ nome: "Xis Carne", categoriaId: 1, preco: 32.9 });
        const resposta = await api.post("/api/produtos").send({ nome: "Xis Carne", categoriaId: 1, preco: 30 });
        expect(resposta.status).toBe(409);
        expect(resposta.body).toEqual({ erro: "Já existe um produto com esse nome nesta categoria" });
    });

    it("GET lista com filtros e valida os filtros", async () => {
        await api.post("/api/produtos").send({ nome: "Xis Carne", categoriaId: 1, preco: 32.9 });
        expect((await api.get("/api/produtos?categoriaId=1&ativo=true")).body).toHaveLength(1);
        expect((await api.get("/api/produtos?ativo=false")).body).toEqual([]);

        const filtroInvalido = await api.get("/api/produtos?ativo=sim");
        expect(filtroInvalido.status).toBe(400);
        expect(filtroInvalido.body).toEqual({ erro: "O filtro ativo deve ser true ou false" });
    });

    it("GET /:id responde 404 para produto inexistente ou id inválido", async () => {
        for (const id of ["99", "abc"]) {
            const resposta = await api.get(`/api/produtos/${id}`);
            expect(resposta.status).toBe(404);
            expect(resposta.body).toEqual({ erro: "Produto não encontrado" });
        }
    });

    it("PATCH altera só os campos enviados", async () => {
        await api.post("/api/produtos").send({ nome: "Xis Carne", categoriaId: 1, preco: 32.9, descricao: "Pão e carne" });
        const resposta = await api.patch("/api/produtos/1").send({ preco: 34.9, descricao: null });
        expect(resposta.status).toBe(200);
        expect(resposta.body).toMatchObject({ nome: "Xis Carne", preco: 34.9, descricao: null });
    });

    it("PATCH sem campos responde 400", async () => {
        await api.post("/api/produtos").send({ nome: "Xis Carne", categoriaId: 1, preco: 32.9 });
        const resposta = await api.patch("/api/produtos/1").send({});
        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({ erro: "Informe ao menos um campo para alterar" });
    });

    it("PATCH com ativo inválido responde 400", async () => {
        await api.post("/api/produtos").send({ nome: "Xis Carne", categoriaId: 1, preco: 32.9 });
        const resposta = await api.patch("/api/produtos/1").send({ ativo: "não" });
        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({ erro: "O campo ativo deve ser true ou false" });
    });

    it("DELETE exclui e responde 204", async () => {
        await api.post("/api/produtos").send({ nome: "Xis Carne", categoriaId: 1, preco: 32.9 });
        expect((await api.delete("/api/produtos/1")).status).toBe(204);
        expect((await api.get("/api/produtos/1")).status).toBe(404);
    });
});
