import { describe, expect, it } from "vitest";
import { ConsultarMetricas } from "../../../src/aplicacao/dashboard/consultar-metricas";
import { FecharCaixa } from "../../../src/aplicacao/dashboard/fechar-caixa";
import { ErroDeValidacao } from "../../../src/dominio/compartilhado/erros";
import { DashboardEmMemoria } from "../../fakes/dashboard-em-memoria";

// 22:00 de 17/11/2026 em Brasília: noite 2026-11-17
const AGORA = () => new Date("2026-11-18T01:00:00Z");
const xis = { produtoId: 10, nome: "Xis Salada", preco: 28 };
const refri = { produtoId: 20, nome: "Refrigerante lata", preco: 6 };
const batata = { produtoId: 30, nome: "Batata frita", preco: 25 };

function dados() {
    const banco = new DashboardEmMemoria();
    banco.categorias.set(10, { id: 1, nome: "Xis" });
    banco.categorias.set(20, { id: 2, nome: "Bebidas" });
    banco.categorias.set(30, { id: 3, nome: "Fritas" });
    banco.adicionarMotoboy(7, "Cleber", 40);
    banco.adicionarPedido({ noite: "2026-11-17", itens: [{ ...xis, quantidade: 2 }, { ...refri, quantidade: 3 }], formaPagamento: "DINHEIRO", taxa: 5, motoboy: { id: 7, nome: "Cleber" } });
    banco.adicionarPedido({ noite: "2026-11-17", itens: [{ ...batata, quantidade: 1 }], formaPagamento: "PIX", taxa: 8, motoboy: { id: 7, nome: "Cleber" } });
    banco.adicionarPedido({ noite: "2026-11-17", itens: [{ ...refri, quantidade: 1 }], formaPagamento: "FIADO" });
    // Fora do cálculo (RN6): cancelado e ainda em preparo.
    banco.adicionarPedido({ noite: "2026-11-17", itens: [{ ...batata, quantidade: 9 }], status: "CANCELADO" });
    banco.adicionarPedido({ noite: "2026-11-17", itens: [{ ...batata, quantidade: 9 }], status: "EM_PREPARO" });
    // Outra noite.
    banco.adicionarPedido({ noite: "2026-11-16", itens: [{ ...batata, quantidade: 4 }], formaPagamento: "CREDITO" });
    return banco;
}

describe("ConsultarMetricas", () => {
    it("usa a noite atual e conta só pedidos entregues, sem o fiado", async () => {
        const metricas = await new ConsultarMetricas(dados(), AGORA).executar({});
        expect(metricas).toMatchObject({
            inicio: "2026-11-17", fim: "2026-11-17",
            totalVendido: 112, pedidos: 2, ticketMedio: 56,
            produtoMaisVendido: { id: 20, nome: "Refrigerante lata", quantidade: 3 },
            produtoMenosVendido: { id: 30, nome: "Batata frita", quantidade: 1 },
            categoriaMaisVendida: { id: 2, nome: "Bebidas", quantidade: 3 },
        });
        expect(metricas.porFormaPagamento).toEqual([
            { formaPagamento: "PIX", pedidos: 1, total: 33 },
            { formaPagamento: "CREDITO", pedidos: 0, total: 0 },
            { formaPagamento: "DEBITO", pedidos: 0, total: 0 },
            { formaPagamento: "DINHEIRO", pedidos: 1, total: 79 },
        ]);
    });

    it("conta cada opção de bebida como uma unidade vendida", async () => {
        const banco = new DashboardEmMemoria();
        banco.categorias.set(20, { id: 2, nome: "Bebidas" });
        banco.adicionarPedido({ noite: "2026-11-17", itens: [{ ...refri, quantidade: 1, opcoes: ["Coca-Cola", "Guaraná"] }], formaPagamento: "PIX" });
        const metricas = await new ConsultarMetricas(banco, AGORA).executar({});
        expect(metricas).toMatchObject({ totalVendido: 12, produtoMaisVendido: { id: 20, quantidade: 2 } });
    });

    it("soma as noites do período", async () => {
        const metricas = await new ConsultarMetricas(dados(), AGORA).executar({ inicio: "2026-11-16", fim: "2026-11-17" });
        expect(metricas.pedidos).toBe(3);
        expect(metricas.produtoMaisVendido).toEqual({ id: 30, nome: "Batata frita", quantidade: 5 });
    });

    it("devolve zeros e nulos sem vendas", async () => {
        const metricas = await new ConsultarMetricas(new DashboardEmMemoria(), AGORA).executar({});
        expect(metricas).toMatchObject({ totalVendido: 0, pedidos: 0, ticketMedio: 0, produtoMaisVendido: null, categoriaMaisVendida: null });
    });

    it("recusa período invertido ou maior que um ano", async () => {
        const consultar = new ConsultarMetricas(dados(), AGORA);
        await expect(consultar.executar({ inicio: "2026-11-17", fim: "2026-11-16" })).rejects.toBeInstanceOf(ErroDeValidacao);
        await expect(consultar.executar({ inicio: "2025-01-01", fim: "2026-11-16" })).rejects.toBeInstanceOf(ErroDeValidacao);
    });
});

describe("FecharCaixa", () => {
    it("fecha a noite com taxas e acerto dos motoboys (RN4), sem o fiado", async () => {
        const fechamento = await new FecharCaixa(dados(), AGORA).executar();
        expect(fechamento).toMatchObject({ noite: "2026-11-17", pedidos: 2, totalVendido: 112, totalTaxasEntrega: 13 });
        expect(fechamento.porFormaPagamento.map((forma) => forma.formaPagamento)).not.toContain("FIADO");
        expect(fechamento.motoboys).toEqual([
            { id: 7, nome: "Cleber", entregas: 2, valorFixoNoite: 40, taxasEntrega: 13, totalAPagar: 53 },
        ]);
    });

    it("paga ao motoboy a entrega fiado, sem somar a taxa nas taxas arrecadadas", async () => {
        const banco = dados();
        banco.adicionarPedido({ noite: "2026-11-17", itens: [{ ...xis, quantidade: 1 }], formaPagamento: "FIADO", taxa: 6, motoboy: { id: 7, nome: "Cleber" } });
        const fechamento = await new FecharCaixa(banco, AGORA).executar();
        expect(fechamento).toMatchObject({ pedidos: 2, totalVendido: 112, totalTaxasEntrega: 13 });
        expect(fechamento.motoboys).toEqual([
            { id: 7, nome: "Cleber", entregas: 3, valorFixoNoite: 40, taxasEntrega: 19, totalAPagar: 59 },
        ]);
    });

    it("paga só as taxas a um motoboy que foi excluído", async () => {
        const banco = dados();
        banco.cadastrosMotoboys.clear();
        const [acerto] = (await new FecharCaixa(banco, AGORA).executar("2026-11-17")).motoboys;
        expect(acerto).toEqual({ id: 7, nome: "Cleber", entregas: 2, valorFixoNoite: 0, taxasEntrega: 13, totalAPagar: 13 });
    });
});
