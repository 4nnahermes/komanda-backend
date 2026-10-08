import { describe, expect, it } from "vitest";
import { Produto } from "../../../src/dominio/cardapio/produto";
import { ErroDeValidacao } from "../../../src/dominio/compartilhado/erros";

const valido = { nome: "Xis Carne", preco: 32.9, categoriaId: 1 };

describe("Produto", () => {
    it("nasce ativo, com nome sem espaços nas pontas e preço em centavos", () => {
        const produto = Produto.criar({ ...valido, nome: "  Xis Carne  " });
        expect(produto.nome).toBe("Xis Carne");
        expect(produto.preco.centavos).toBe(3290);
        expect(produto.ativo).toBe(true);
        expect(produto.id).toBeNull();
    });

    it("exige nome", () => {
        expect(() => Produto.criar({ ...valido, nome: "   " })).toThrow(new ErroDeValidacao("O nome do produto é obrigatório"));
    });

    it("limita o nome a 80 caracteres", () => {
        expect(() => Produto.criar({ ...valido, nome: "x".repeat(81) })).toThrow(
            new ErroDeValidacao("O nome do produto deve ter no máximo 80 caracteres"),
        );
    });

    it.each([0, -5])("rejeita preço %d", (preco) => {
        expect(() => Produto.criar({ ...valido, preco })).toThrow(new ErroDeValidacao("O preço deve ser maior que zero"));
    });

    it("rejeita preço com mais de 2 casas decimais", () => {
        expect(() => Produto.criar({ ...valido, preco: 10.999 })).toThrow(
            new ErroDeValidacao("O preço deve ter no máximo 2 casas decimais"),
        );
    });

    it("trata descrição vazia como ausente e limita o tamanho", () => {
        expect(Produto.criar({ ...valido, descricao: "   " }).descricao).toBeNull();
        expect(() => Produto.criar({ ...valido, descricao: "x".repeat(256) })).toThrow(
            new ErroDeValidacao("A descrição deve ter no máximo 255 caracteres"),
        );
    });

    it("aplica as mesmas regras ao alterar", () => {
        const produto = Produto.criar(valido);
        produto.alterarPreco(34.9);
        produto.definirAtivo(false);
        produto.moverParaCategoria(2);
        expect(produto.preco.emReais).toBe(34.9);
        expect(produto.ativo).toBe(false);
        expect(produto.categoriaId).toBe(2);
        expect(() => produto.renomear("")).toThrow(ErroDeValidacao);
        expect(() => produto.alterarPreco(0)).toThrow(ErroDeValidacao);
    });
});
