import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { tratarErros } from "../../../../src/interfaces/http/tratar-erros";
import { montarRotasDashboard } from "../../../../src/main/dashboard";
import { DashboardEmMemoria } from "../../../fakes/dashboard-em-memoria";

function api() {
    const banco = new DashboardEmMemoria();
    banco.adicionarPedido({ noite: "2026-11-17", itens: [{ produtoId: 1, nome: "Xis", quantidade: 1, preco: 30 }] });
    const rotas = montarRotasDashboard({ consulta: banco, agora: () => new Date("2026-11-18T01:00:00Z") });
    const app = express();
    app.use("/api/dashboard", rotas.dashboard);
    app.use("/api/caixa", rotas.caixa);
    app.use(tratarErros);
    return request(app);
}

describe("API do dashboard", () => {
    it("GET /api/dashboard/metricas aceita período", async () => {
        const resposta = await api().get("/api/dashboard/metricas?inicio=2026-11-17&fim=2026-11-17");
        expect(resposta.status).toBe(200);
        expect(resposta.body).toMatchObject({ totalVendido: 30, pedidos: 1 });
    });

    it("GET /api/caixa/fechamento usa a noite atual", async () => {
        const resposta = await api().get("/api/caixa/fechamento");
        expect(resposta.status).toBe(200);
        expect(resposta.body).toMatchObject({ noite: "2026-11-17", pedidos: 1, totalVendido: 30, motoboys: [] });
    });

    it.each([
        ["/api/dashboard/metricas?inicio=17-11-2026", "O filtro inicio deve estar no formato AAAA-MM-DD"],
        ["/api/caixa/fechamento?noite=2026-02-30", "O filtro noite deve estar no formato AAAA-MM-DD"],
        ["/api/dashboard/metricas?inicio=2026-11-18&fim=2026-11-17", "O início do período deve ser anterior ou igual ao fim"],
    ])("%s responde 400", async (url, mensagem) => {
        const resposta = await api().get(url);
        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({ erro: mensagem });
    });
});
