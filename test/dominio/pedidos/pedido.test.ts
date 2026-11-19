import { describe, expect, it } from "vitest";
import { Dinheiro } from "../../../src/dominio/compartilhado/dinheiro";
import { ConflitoDeDados, ErroDeValidacao } from "../../../src/dominio/compartilhado/erros";
import { ProdutoParaPedido } from "../../../src/dominio/pedidos/catalogo-do-pedido";
import { NovoPedido, Pedido, criarItem } from "../../../src/dominio/pedidos/pedido";

const xis: ProdutoParaPedido = {
    id: 10, nome: "Xis Salada", preco: Dinheiro.deReais(28), ingredientes: ["Tomate", "Alface"],
    adicionais: [{ nome: "Bacon", preco: Dinheiro.deReais(5) }], disponivel: true,
};

function novo(dados: Partial<NovoPedido> = {}): NovoPedido {
    return {
        tipo: "ENTREGA", nomeCliente: "João", bairro: { id: 2, nome: "Centro", taxaEntrega: Dinheiro.deReais(5) },
        endereco: "R. Sete, 410", itens: [criarItem(xis, 2, ["tomate"], ["BACON"])], formaPagamento: "PIX",
        criadoEm: new Date("2026-11-18T01:00:00Z"), noite: "2026-11-17", ...dados,
    };
}

describe("Pedido", () => {
    it("calcula subtotal, taxa, total e troco", () => {
        const pedido = Pedido.criar(novo({ formaPagamento: "DINHEIRO", valorRecebido: 100 }));
        expect(pedido.itens[0].ingredientesRetirados).toEqual(["Tomate"]);
        expect(pedido.itens[0].adicionais[0].nome).toBe("Bacon");
        expect(pedido.subtotal.emReais).toBe(66);
        expect(pedido.taxaEntrega.emReais).toBe(5);
        expect(pedido.total.emReais).toBe(71);
        expect(pedido.troco?.emReais).toBe(29);
        expect(pedido.status).toBe("EM_PREPARO");
    });

    it("retirada não cobra taxa e não aceita bairro nem endereço", () => {
        const pedido = Pedido.criar(novo({ tipo: "RETIRADA", bairro: null, endereco: null }));
        expect(pedido.taxaEntrega.emReais).toBe(0);
        expect(() => Pedido.criar(novo({ tipo: "RETIRADA", bairro: null }))).toThrow("Pedido de retirada não tem bairro nem endereço");
    });

    it("valida ingredientes e adicionais do produto", () => {
        expect(() => criarItem(xis, 1, ["Cebola"])).toThrow('Ingrediente "Cebola" não pertence ao produto "Xis Salada"');
        expect(() => criarItem(xis, 1, [], ["Ovo"])).toThrow('Adicional "Ovo" não pertence ao produto "Xis Salada"');
        expect(() => criarItem(xis, 1, ["Tomate", "tomate"])).toThrow(ErroDeValidacao);
        expect(() => criarItem(xis, 0)).toThrow("A quantidade deve ser um número inteiro de 1 a 99");
    });

    it("valida valor recebido", () => {
        expect(() => Pedido.criar(novo({ valorRecebido: 100 }))).toThrow("O valor recebido só é informado no pagamento em dinheiro");
        expect(() => Pedido.criar(novo({ formaPagamento: "DINHEIRO", valorRecebido: 70 }))).toThrow("O valor recebido é menor que o total do pedido");
    });

    it("segue as transições de status", () => {
        const pedido = Pedido.criar(novo());
        pedido.alterarStatus("PRONTO");
        pedido.alterarStatus("EM_PREPARO");
        pedido.alterarStatus("PRONTO");
        expect(() => pedido.alterarStatus("ENTREGUE")).toThrow("Vincule um motoboy antes de concluir a entrega");
        pedido.vincularMotoboy({ id: 3, nome: "Ana" });
        pedido.alterarStatus("ENTREGUE");
        expect(() => pedido.alterarStatus("CANCELADO")).toThrow("Não é possível mudar o pedido de ENTREGUE para CANCELADO");
        expect(() => pedido.vincularMotoboy(null)).toThrow(ConflitoDeDados);
    });

    it("só exclui em preparo", () => {
        const pedido = Pedido.criar(novo());
        expect(() => pedido.garantirQuePodeExcluir()).not.toThrow();
        pedido.alterarStatus("CANCELADO");
        expect(() => pedido.garantirQuePodeExcluir()).toThrow("Só é possível excluir um pedido em preparo. Cancele o pedido");
    });
});
