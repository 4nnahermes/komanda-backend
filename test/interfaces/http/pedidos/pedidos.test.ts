import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { tratarErros } from "../../../../src/interfaces/http/tratar-erros";
import { montarRotasPedidos } from "../../../../src/main/pedidos";
import { CatalogoEmMemoria, PedidosEmMemoria } from "../../../fakes/pedidos-em-memoria";

// 22:00 de 17/11/2026 em Brasília
const AGORA = new Date("2026-11-18T01:00:00Z");

function apiCriada() {
    const catalogo = new CatalogoEmMemoria();
    catalogo.adicionarProduto(10, "Xis Salada", 28, { ingredientes: ["Tomate"], adicionais: [{ nome: "Bacon", preco: 5 }] });
    catalogo.adicionarProduto(20, "Refrigerante lata", 6);
    catalogo.adicionarProduto(30, "Xis Antigo", 20, { disponivel: false });
    catalogo.adicionarBairro(2, "Centro", 5);
    catalogo.adicionarBairro(3, "Fechado", 8, false);
    catalogo.adicionarMotoboy(3, "Ana");
    const app = express();
    app.use(express.json());
    app.use("/api/pedidos", montarRotasPedidos({ repositorio: new PedidosEmMemoria(), catalogo, agora: () => AGORA }));
    app.use(tratarErros);
    return request(app);
}

const entrega = {
    tipo: "ENTREGA", nomeCliente: " João ", telefone: "(51) 99654-2210", bairroId: 2, endereco: "R. Sete de Setembro, 410",
    itens: [
        { produtoId: 10, quantidade: 2, ingredientesRetirados: ["tomate"], adicionais: ["bacon"] },
        { produtoId: 20, quantidade: 1 },
    ],
    formaPagamento: "DINHEIRO", valorRecebido: 100,
};

const retirada = { tipo: "RETIRADA", nomeCliente: "Maria", itens: [{ produtoId: 20, quantidade: 2 }], formaPagamento: "FIADO" };

describe("API de pedidos", () => {
    it("cria o pedido calculando valores no backend", async () => {
        const resposta = await apiCriada().post("/api/pedidos").send(entrega);
        expect(resposta.status).toBe(201);
        expect(resposta.body).toEqual({
            id: 1, numero: 1, noite: "2026-11-17", criadoEm: AGORA.toISOString(), tipo: "ENTREGA", status: "EM_PREPARO",
            nomeCliente: "João", telefone: "(51) 99654-2210", bairro: { id: 2, nome: "Centro" }, endereco: "R. Sete de Setembro, 410",
            itens: [
                { produtoId: 10, nome: "Xis Salada", quantidade: 2, precoUnitario: 28, ingredientesRetirados: ["Tomate"], adicionais: [{ nome: "Bacon", preco: 5 }], subtotal: 66 },
                { produtoId: 20, nome: "Refrigerante lata", quantidade: 1, precoUnitario: 6, ingredientesRetirados: [], adicionais: [], subtotal: 6 },
            ],
            subtotal: 72, taxaEntrega: 5, total: 77, formaPagamento: "DINHEIRO", valorRecebido: 100, troco: 23, motoboy: null,
        });
    });

    it("retirada não tem taxa nem destino; lista por noite e status", async () => {
        const api = apiCriada();
        const criado = await api.post("/api/pedidos").send(retirada);
        expect(criado.body).toMatchObject({ numero: 1, bairro: null, endereco: null, taxaEntrega: 0, total: 12, valorRecebido: null, troco: null });
        await api.post("/api/pedidos").send(entrega);
        await api.patch("/api/pedidos/1/status").send({ status: "PRONTO" });
        expect((await api.get("/api/pedidos")).body.map((p: { numero: number }) => p.numero)).toEqual([1, 2]);
        expect((await api.get("/api/pedidos?status=PRONTO")).body.map((p: { id: number }) => p.id)).toEqual([1]);
        expect((await api.get("/api/pedidos?noite=2026-11-16")).body).toEqual([]);
        expect((await api.get("/api/pedidos?noite=16-11-2026")).body).toEqual({ erro: "O filtro noite deve estar no formato AAAA-MM-DD" });
        expect((await api.get("/api/pedidos?status=FEITO")).body).toEqual({ erro: "O filtro status deve ser EM_PREPARO, PRONTO, ENTREGUE ou CANCELADO" });
    });

    it.each([
        [{ ...retirada, tipo: "MESA" }, "O tipo do pedido deve ser ENTREGA ou RETIRADA"],
        [{ ...retirada, nomeCliente: "  " }, "O nome do cliente é obrigatório"],
        [{ ...retirada, nomeCliente: undefined }, "O nome do cliente é obrigatório"],
        [{ ...entrega, bairroId: undefined }, "Informe o bairro da entrega"],
        [{ ...entrega, endereco: " " }, "Informe o endereço da entrega"],
        [{ ...retirada, bairroId: 2 }, "Pedido de retirada não tem bairro nem endereço"],
        [{ ...entrega, bairroId: 3 }, "Bairro não encontrado ou inativo"],
        [{ ...retirada, itens: [] }, "Informe ao menos um item"],
        [{ ...retirada, itens: [{ produtoId: 30, quantidade: 1 }] }, "Produto não encontrado ou indisponível"],
        [{ ...retirada, itens: [{ produtoId: 99, quantidade: 1 }] }, "Produto não encontrado ou indisponível"],
        [{ ...retirada, itens: [{ produtoId: 20, quantidade: 0 }] }, "A quantidade deve ser um número inteiro de 1 a 99"],
        [{ ...retirada, itens: [{ produtoId: 10, quantidade: 1, adicionais: ["Ovo"] }] }, 'Adicional "Ovo" não pertence ao produto "Xis Salada"'],
        [{ ...retirada, formaPagamento: "BOLETO" }, "A forma de pagamento deve ser PIX, CREDITO, DEBITO, DINHEIRO ou FIADO"],
        [{ ...retirada, valorRecebido: 50 }, "O valor recebido só é informado no pagamento em dinheiro"],
        [{ ...entrega, valorRecebido: 50 }, "O valor recebido é menor que o total do pedido"],
    ])("POST inválido %j retorna 400", async (corpo, mensagem) => {
        const resposta = await apiCriada().post("/api/pedidos").send(corpo);
        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({ erro: mensagem });
    });

    it("exige motoboy para concluir a entrega", async () => {
        const api = apiCriada();
        await api.post("/api/pedidos").send(entrega);
        await api.patch("/api/pedidos/1/status").send({ status: "PRONTO" });
        const semMotoboy = await api.patch("/api/pedidos/1/status").send({ status: "ENTREGUE" });
        expect(semMotoboy.status).toBe(409);
        expect(semMotoboy.body).toEqual({ erro: "Vincule um motoboy antes de concluir a entrega" });
        expect((await api.patch("/api/pedidos/1/motoboy").send({ motoboyId: 99 })).body).toEqual({ erro: "Motoboy não encontrado ou inativo" });
        expect((await api.patch("/api/pedidos/1/motoboy").send({ motoboyId: 3 })).body.motoboy).toEqual({ id: 3, nome: "Ana" });
        expect((await api.patch("/api/pedidos/1/status").send({ status: "ENTREGUE" })).body.status).toBe("ENTREGUE");
        expect((await api.patch("/api/pedidos/1/status").send({ status: "CANCELADO" })).status).toBe(409);
    });

    it("retirada não aceita motoboy e conclui sem ele", async () => {
        const api = apiCriada();
        await api.post("/api/pedidos").send(retirada);
        expect((await api.patch("/api/pedidos/1/motoboy").send({ motoboyId: 3 })).body).toEqual({ erro: "Pedido de retirada não tem motoboy" });
        await api.patch("/api/pedidos/1/status").send({ status: "PRONTO" });
        expect((await api.patch("/api/pedidos/1/status").send({ status: "ENTREGUE" })).status).toBe(200);
    });

    it("cancela, exclui só em preparo e não reaproveita o número", async () => {
        const api = apiCriada();
        await api.post("/api/pedidos").send(retirada);
        await api.post("/api/pedidos").send(retirada);
        expect((await api.patch("/api/pedidos/2/status").send({ status: "CANCELADO" })).body.status).toBe("CANCELADO");
        const exclusaoCancelado = await api.delete("/api/pedidos/2");
        expect(exclusaoCancelado.status).toBe(409);
        expect(exclusaoCancelado.body).toEqual({ erro: "Só é possível excluir um pedido em preparo. Cancele o pedido" });
        expect((await api.delete("/api/pedidos/1")).status).toBe(204);
        expect((await api.get("/api/pedidos/1")).status).toBe(404);
        expect((await api.post("/api/pedidos").send(retirada)).body.numero).toBe(3);
    });

    it("valida status, motoboyId e ids", async () => {
        const api = apiCriada();
        await api.post("/api/pedidos").send(entrega);
        expect((await api.patch("/api/pedidos/1/status").send({ status: "SAIU" })).body).toEqual({ erro: "O status deve ser EM_PREPARO, PRONTO, ENTREGUE ou CANCELADO" });
        expect((await api.patch("/api/pedidos/1/motoboy").send({})).body).toEqual({ erro: "Informe o motoboy ou null para remover" });
        expect((await api.patch("/api/pedidos/1/motoboy").send({ motoboyId: null })).body.motoboy).toBeNull();
        for (const id of ["abc", "0", "99"]) {
            const resposta = await api.get(`/api/pedidos/${id}`);
            expect(resposta.status).toBe(404);
            expect(resposta.body).toEqual({ erro: "Pedido não encontrado" });
        }
    });
});
