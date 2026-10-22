import { describe, expect, it } from "vitest";
import { AtualizarCategoria } from "../../../src/aplicacao/categorias/atualizar-categoria";
import { CriarCategoria } from "../../../src/aplicacao/categorias/criar-categoria";
import { Categoria } from "../../../src/dominio/categorias/categoria";
import { CategoriasEmMemoria } from "../../fakes/categorias-em-memoria";

describe("casos de uso de categorias", () => {
    it("valida e normaliza nome e ordem na criação", async () => {
        const repositorio = new CategoriasEmMemoria();
        const criar = new CriarCategoria(repositorio);
        await expect(criar.executar({ nome: "  " })).rejects.toThrow("O nome da categoria é obrigatório");
        await expect(criar.executar({ nome: "Xis", ordem: 1.5 })).rejects.toThrow("A ordem deve ser um número inteiro maior que zero");
        const criada = await criar.executar({ nome: "  Xis  " });
        expect(criada.nome).toBe("Xis");
        expect(criada.ordem).toBe(1);
    });

    it("aplica PATCH parcial sem substituir a ordem e responde conflito/404", async () => {
        const repositorio = new CategoriasEmMemoria();
        const xis = await repositorio.criarOrdenada(Categoria.criar("Xis"));
        const bebidas = await repositorio.criarOrdenada(Categoria.criar("Bebidas"));
        await repositorio.reordenarCompleto([bebidas.id!, xis.id!]);
        const atualizar = new AtualizarCategoria(repositorio);
        const alterada = await atualizar.executar(xis.id!, { ativo: false });
        expect(alterada).toMatchObject({ nome: "Xis", ordem: 2, ativo: false });
        await expect(atualizar.executar(xis.id!, { nome: "BEBIDAS" })).rejects.toThrow("Já existe uma categoria com esse nome");
        await expect(atualizar.executar(999, { ativo: false })).rejects.toThrow("Categoria não encontrada");
    });
});
