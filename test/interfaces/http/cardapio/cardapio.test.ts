import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { Produto } from "../../../../src/dominio/cardapio/produto";
import { tratarErros } from "../../../../src/interfaces/http/tratar-erros";
import { montarRotasCardapio } from "../../../../src/main/cardapio";
import { CardapioEmMemoria } from "../../../fakes/cardapio-em-memoria";

describe("API do cardápio", () => {
    it("GET /api/cardapio devolve o formato do contrato", async () => {
        const cardapio = new CardapioEmMemoria();
        cardapio.adicionarCategoria("Xis", 1);
        await cardapio.repositorioProdutos.salvar(
            Produto.criar({ nome: "Xis Carne", preco: 32.9, categoriaId: 1, descricao: "Pão e carne" }),
        );

        const app = express();
        app.use("/api/cardapio", montarRotasCardapio(cardapio.consultaCardapio));
        app.use(tratarErros);

        const resposta = await request(app).get("/api/cardapio");

        expect(resposta.status).toBe(200);
        expect(resposta.body).toEqual([
            {
                id: 1,
                nome: "Xis",
                ordem: 1,
                produtos: [{ id: 1, nome: "Xis Carne", descricao: "Pão e carne", preco: 32.9 }],
            },
        ]);
    });
});
