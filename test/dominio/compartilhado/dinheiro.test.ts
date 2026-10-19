import { describe, expect, it } from "vitest";
import { Dinheiro } from "../../../src/dominio/compartilhado/dinheiro";

describe("Dinheiro", () => {
    it("converte reais para centavos sem erro de arredondamento", () => {
        expect(Dinheiro.deReais(32.9).centavos).toBe(3290);
        expect(Dinheiro.deReais(1.15).centavos).toBe(115);
        expect(Dinheiro.deReais(0.1).somar(Dinheiro.deReais(0.2)).emReais).toBe(0.3);
    });

    it("aceita no máximo 2 casas decimais", () => {
        expect(Dinheiro.ehValorEmReaisValido(10)).toBe(true);
        expect(Dinheiro.ehValorEmReaisValido(10.5)).toBe(true);
        expect(Dinheiro.ehValorEmReaisValido(10.55)).toBe(true);
        expect(Dinheiro.ehValorEmReaisValido(10.555)).toBe(false);
        expect(Dinheiro.ehValorEmReaisValido(Number.NaN)).toBe(false);
        expect(Dinheiro.ehValorEmReaisValido(Number.POSITIVE_INFINITY)).toBe(false);
        expect(() => Dinheiro.deReais(10.555)).toThrow(RangeError);
    });

    it("multiplica por quantidade inteira", () => {
        expect(Dinheiro.deReais(7).multiplicar(3).emReais).toBe(21);
        expect(() => Dinheiro.deReais(7).multiplicar(1.5)).toThrow(RangeError);
    });

    it("compara valores", () => {
        expect(Dinheiro.deCentavos(500).igual(Dinheiro.deReais(5))).toBe(true);
        expect(Dinheiro.deCentavos(0).ehMaiorQueZero()).toBe(false);
        expect(Dinheiro.deCentavos(1).ehMaiorQueZero()).toBe(true);
    });
});
