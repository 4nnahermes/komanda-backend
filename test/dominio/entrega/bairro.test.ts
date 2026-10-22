import { describe, expect, it } from "vitest";
import { Bairro } from "../../../src/dominio/entrega/bairro";
import { ErroDeValidacao } from "../../../src/dominio/compartilhado/erros";

describe("Bairro", () => {
    it("normaliza nome, guarda centavos e permite taxa zero", () => {
        const bairro = Bairro.criar({ nome: "  Centro  ", taxaEntrega: 12.34 });
        expect(bairro.nome).toBe("Centro");
        expect(bairro.taxaEntrega.centavos).toBe(1234);
        expect(Bairro.criar({ nome: "Bairro grátis", taxaEntrega: 0 }).taxaEntrega.centavos).toBe(0);
        expect(Bairro.criar({ nome: "Limite", taxaEntrega: 99_999_999.99 }).taxaEntrega.centavos).toBe(9_999_999_999);
    });

    it.each([
        [{ nome: " ", taxaEntrega: 0 }, "O nome do bairro é obrigatório"],
        [{ nome: "a".repeat(101), taxaEntrega: 0 }, "O nome do bairro deve ter no máximo 100 caracteres"],
        [{ nome: "Centro", taxaEntrega: -0.01 }, "A taxa de entrega não pode ser negativa"],
        [{ nome: "Centro", taxaEntrega: 1.001 }, "A taxa de entrega deve ter no máximo 2 casas decimais"],
        [{ nome: "Centro", taxaEntrega: 100_000_000 }, "A taxa de entrega deve ser no máximo 99999999.99"],
    ])("rejeita dados inválidos %j", (dados, mensagem) => {
        expect(() => Bairro.criar(dados as { nome: string; taxaEntrega: number })).toThrow(new ErroDeValidacao(mensagem as string));
    });
});
