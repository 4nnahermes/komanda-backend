import { describe, expect, it } from "vitest";
import { Motoboy } from "../../../src/dominio/entrega/motoboy";
import { ErroDeValidacao } from "../../../src/dominio/compartilhado/erros";

describe("Motoboy", () => {
    it("apara nome e telefone e aplica os padrões", () => {
        const m = Motoboy.criar({ nome: " Ana ", telefone: " 123 ", ativo: false });
        expect([m.nome, m.telefone, m.valorFixoNoite.emReais, m.ativo]).toEqual(["Ana", "123", 0, false]);
    });
    it("converte telefone vazio em null e valida o limite textual", () => {
        expect(Motoboy.criar({ nome: "A", telefone: "  " }).telefone).toBeNull();
        expect(() => Motoboy.criar({ nome: "A", telefone: "x".repeat(31) })).toThrow("O telefone deve ter no máximo 30 caracteres");
    });
    it.each([["", "O nome do motoboy é obrigatório"], ["x".repeat(101), "O nome do motoboy deve ter no máximo 100 caracteres"]])("valida nome", (nome, mensagem) => {
        expect(() => Motoboy.criar({ nome })).toThrow(new ErroDeValidacao(mensagem));
    });
    it.each([[-0.01, "O valor fixo por noite não pode ser negativo"], [0.001, "O valor fixo por noite deve ter no máximo 2 casas decimais"], [100_000_000, "O valor fixo por noite deve ser no máximo 99999999.99"]])("valida valor fixo", (valor, mensagem) => {
        expect(() => Motoboy.criar({ nome: "A", valorFixoNoite: valor })).toThrow(new ErroDeValidacao(mensagem));
    });
    it("aceita o limite monetário e armazena centavos inteiros", () => {
        expect(Motoboy.criar({ nome: "A", valorFixoNoite: 99_999_999.99 }).valorFixoNoite.centavos).toBe(9_999_999_999);
        expect(Motoboy.criar({ nome: "B", valorFixoNoite: 99_999_999.98 }).valorFixoNoite.centavos).toBe(9_999_999_998);
        expect(Motoboy.criar({ nome: "C", valorFixoNoite: 99_999_999.97 }).valorFixoNoite.centavos).toBe(9_999_999_997);
        expect(Motoboy.criar({ nome: "D", valorFixoNoite: 12.34 }).valorFixoNoite.centavos).toBe(1234);
    });
});
