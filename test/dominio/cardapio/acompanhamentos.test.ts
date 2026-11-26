import { describe, expect, it } from "vitest";
import { combinarComCategoria } from "../../../src/dominio/cardapio/acompanhamentos";

describe("combinarComCategoria", () => {
    it("junta a base da categoria com o que é do produto, sem repetir", () => {
        const resultado = combinarComCategoria(
            { ingredientes: ["Alface", "Tomate"], adicionais: [{ nome: "Bacon", preco: 5 }, { nome: "Ovo", preco: 3 }] },
            { ingredientes: ["tomate", "Coração"], adicionais: [{ nome: "Coração extra", preco: 7 }] },
        );
        expect(resultado.ingredientes).toEqual(["Alface", "Tomate", "Coração"]);
        expect(resultado.adicionais).toEqual([
            { nome: "Bacon", preco: 5 },
            { nome: "Ovo", preco: 3 },
            { nome: "Coração extra", preco: 7 },
        ]);
    });

    it("o adicional do produto com o mesmo nome substitui o preço da categoria", () => {
        const resultado = combinarComCategoria(
            { ingredientes: [], adicionais: [{ nome: "Bacon", preco: 5 }] },
            { ingredientes: [], adicionais: [{ nome: "bacon", preco: 8 }] },
        );
        expect(resultado.adicionais).toEqual([{ nome: "bacon", preco: 8 }]);
    });

    it("sem base na categoria, fica só o que é do produto", () => {
        const produto = { ingredientes: ["Queijo"], adicionais: [{ nome: "Cheddar", preco: 4 }] };
        expect(combinarComCategoria({ ingredientes: [], adicionais: [] }, produto)).toEqual(produto);
    });
});
