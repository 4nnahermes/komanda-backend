import { beforeEach, describe, expect, it } from "vitest";
import { AtualizarProduto } from "../../../src/aplicacao/cardapio/produtos/atualizar-produto";
import { BuscarProduto } from "../../../src/aplicacao/cardapio/produtos/buscar-produto";
import { CriarProduto } from "../../../src/aplicacao/cardapio/produtos/criar-produto";
import { ExcluirProduto } from "../../../src/aplicacao/cardapio/produtos/excluir-produto";
import { ListarProdutos } from "../../../src/aplicacao/cardapio/produtos/listar-produtos";
import { ConflitoDeDados, ErroDeValidacao, RecursoNaoEncontrado } from "../../../src/dominio/compartilhado/erros";
import { CardapioEmMemoria } from "../../fakes/cardapio-em-memoria";

describe("casos de uso de produtos", () => {
    let cardapio: CardapioEmMemoria;
    let criar: CriarProduto;
    let atualizar: AtualizarProduto;

    beforeEach(() => {
        cardapio = new CardapioEmMemoria();
        cardapio.adicionarCategoria("Xis", 1);
        cardapio.adicionarCategoria("Bebidas", 2);
        criar = new CriarProduto(cardapio.repositorioProdutos, cardapio.categoriasDoCardapio, cardapio.consultaProdutos);
        atualizar = new AtualizarProduto(cardapio.repositorioProdutos, cardapio.categoriasDoCardapio, cardapio.consultaProdutos);
    });

    describe("CriarProduto", () => {
        it("cadastra e devolve o produto com a categoria", async () => {
            const produto = await criar.executar({ nome: "Xis Carne", preco: 32.9, categoriaId: 1, descricao: "Pão e carne" });
            expect(produto).toEqual({
                id: 1,
                nome: "Xis Carne",
                descricao: "Pão e carne",
                preco: 32.9,
                ativo: true,
                categoria: { id: 1, nome: "Xis" },
            });
        });

        it("recusa categoria inexistente", async () => {
            await expect(criar.executar({ nome: "Xis Carne", preco: 32.9, categoriaId: 99 })).rejects.toEqual(
                new ErroDeValidacao("Categoria não encontrada"),
            );
        });

        it("recusa nome repetido na mesma categoria, sem diferenciar maiúsculas", async () => {
            await criar.executar({ nome: "Xis Carne", preco: 32.9, categoriaId: 1 });
            await expect(criar.executar({ nome: "xis carne", preco: 30, categoriaId: 1 })).rejects.toEqual(
                new ConflitoDeDados("Já existe um produto com esse nome nesta categoria"),
            );
        });

        it("aceita o mesmo nome em outra categoria", async () => {
            await criar.executar({ nome: "Especial", preco: 30, categoriaId: 1 });
            await expect(criar.executar({ nome: "Especial", preco: 8, categoriaId: 2 })).resolves.toMatchObject({ id: 2 });
        });
    });

    describe("AtualizarProduto", () => {
        beforeEach(async () => {
            await criar.executar({ nome: "Xis Carne", preco: 32.9, categoriaId: 1 });
            await criar.executar({ nome: "Xis Frango", preco: 30, categoriaId: 1 });
        });

        it("altera só os campos informados", async () => {
            const produto = await atualizar.executar(1, { preco: 34.9, ativo: false });
            expect(produto).toMatchObject({ nome: "Xis Carne", preco: 34.9, ativo: false });
        });

        it("exige ao menos um campo", async () => {
            await expect(atualizar.executar(1, {})).rejects.toEqual(new ErroDeValidacao("Informe ao menos um campo para alterar"));
        });

        it("recusa produto inexistente", async () => {
            await expect(atualizar.executar(99, { preco: 10 })).rejects.toEqual(new RecursoNaoEncontrado("Produto não encontrado"));
        });

        it("recusa renomear para um nome que já existe na categoria", async () => {
            await expect(atualizar.executar(2, { nome: "XIS CARNE" })).rejects.toBeInstanceOf(ConflitoDeDados);
        });

        it("confere o nome de novo ao mudar de categoria", async () => {
            await criar.executar({ nome: "Xis Carne", preco: 9, categoriaId: 2 });
            await expect(atualizar.executar(3, { categoriaId: 1 })).rejects.toBeInstanceOf(ConflitoDeDados);
        });

        it("recusa mover para categoria inexistente", async () => {
            await expect(atualizar.executar(1, { categoriaId: 99 })).rejects.toEqual(new ErroDeValidacao("Categoria não encontrada"));
        });

        it("não grava nada quando uma alteração é inválida", async () => {
            await expect(atualizar.executar(1, { preco: 40, nome: "" })).rejects.toBeInstanceOf(ErroDeValidacao);
            expect((await new BuscarProduto(cardapio.consultaProdutos).executar(1)).preco).toBe(32.9);
        });
    });

    describe("ListarProdutos", () => {
        it("ordena pela ordem da categoria e depois pelo nome, com filtros", async () => {
            await criar.executar({ nome: "Refrigerante", preco: 7, categoriaId: 2 });
            await criar.executar({ nome: "Xis Frango", preco: 30, categoriaId: 1 });
            await criar.executar({ nome: "Xis Carne", preco: 32.9, categoriaId: 1 });
            await atualizar.executar(2, { ativo: false });

            const listar = new ListarProdutos(cardapio.consultaProdutos);
            expect((await listar.executar({})).map((p) => p.nome)).toEqual(["Xis Carne", "Xis Frango", "Refrigerante"]);
            expect((await listar.executar({ categoriaId: 2 })).map((p) => p.nome)).toEqual(["Refrigerante"]);
            expect((await listar.executar({ ativo: false })).map((p) => p.nome)).toEqual(["Xis Frango"]);
        });
    });

    describe("ExcluirProduto", () => {
        it("exclui e depois não encontra mais", async () => {
            await criar.executar({ nome: "Xis Carne", preco: 32.9, categoriaId: 1 });
            const excluir = new ExcluirProduto(cardapio.repositorioProdutos);
            await excluir.executar(1);
            await expect(excluir.executar(1)).rejects.toEqual(new RecursoNaoEncontrado("Produto não encontrado"));
        });
    });
});
