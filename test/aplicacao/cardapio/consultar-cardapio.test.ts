import { beforeEach, describe, expect, it } from "vitest";
import { ConsultarCardapio } from "../../../src/aplicacao/cardapio/cardapio/consultar-cardapio";
import { Produto } from "../../../src/dominio/cardapio/produto";
import { CardapioEmMemoria } from "../../fakes/cardapio-em-memoria";

describe("ConsultarCardapio", () => {
    let cardapio: CardapioEmMemoria;
    let consultar: ConsultarCardapio;

    async function adicionarProduto(nome: string, preco: number, categoriaId: number, ativo = true) {
        const produto = Produto.criar({ nome, preco, categoriaId });
        produto.definirAtivo(ativo);
        await cardapio.repositorioProdutos.salvar(produto);
    }

    beforeEach(() => {
        cardapio = new CardapioEmMemoria();
        consultar = new ConsultarCardapio(cardapio.consultaCardapio);
    });

    it("devolve vazio quando não há nada cadastrado", async () => {
        expect(await consultar.executar()).toEqual([]);
    });

    it("agrupa por categoria na ordem definida, com produtos por nome", async () => {
        cardapio.adicionarCategoria("Bebidas", 2);
        cardapio.adicionarCategoria("Xis", 1);
        await adicionarProduto("Xis Coração", 36.5, 2);
        await adicionarProduto("Refrigerante lata", 7, 1);
        await adicionarProduto("Xis Carne", 32.9, 2);

        const resultado = await consultar.executar();

        expect(resultado.map((c) => c.nome)).toEqual(["Xis", "Bebidas"]);
        expect(resultado[0]).toEqual({
            id: 2,
            nome: "Xis",
            ordem: 1,
            produtos: [
                { id: 3, nome: "Xis Carne", descricao: null, preco: 32.9 },
                { id: 1, nome: "Xis Coração", descricao: null, preco: 36.5 },
            ],
        });
    });

    it("deixa de fora produtos inativos e categorias inativas", async () => {
        cardapio.adicionarCategoria("Xis", 1);
        cardapio.adicionarCategoria("Porções", 2, false);
        await adicionarProduto("Xis Carne", 32.9, 1);
        await adicionarProduto("Xis Frango", 30, 1, false);
        await adicionarProduto("Batata frita", 28, 2);

        const resultado = await consultar.executar();

        expect(resultado).toHaveLength(1);
        expect(resultado[0].produtos.map((p) => p.nome)).toEqual(["Xis Carne"]);
    });

    it("não mostra categoria ativa sem nenhum produto ativo", async () => {
        cardapio.adicionarCategoria("Xis", 1);
        cardapio.adicionarCategoria("Bauru", 2);
        await adicionarProduto("Xis Carne", 32.9, 1);
        await adicionarProduto("Bauru simples", 25, 2, false);

        expect((await consultar.executar()).map((c) => c.nome)).toEqual(["Xis"]);
    });
});
