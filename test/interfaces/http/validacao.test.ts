import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ErroDeValidacao, RecursoNaoEncontrado } from "../../../src/dominio/compartilhado/erros";
import { lerFiltroBooleano, lerFiltroId, lerId, validarCorpo } from "../../../src/interfaces/http/validacao";

describe("validarCorpo", () => {
    const esquema = z.object({ nome: z.string({ error: "O nome é obrigatório" }) });

    it("devolve os dados quando o corpo é válido", () => {
        expect(validarCorpo(esquema, { nome: "Xis" })).toEqual({ nome: "Xis" });
    });

    it("lança erro de validação com a mensagem do esquema", () => {
        expect(() => validarCorpo(esquema, {})).toThrow(new ErroDeValidacao("O nome é obrigatório"));
        expect(() => validarCorpo(esquema, undefined)).toThrow(new ErroDeValidacao("O nome é obrigatório"));
    });
});

describe("lerId", () => {
    it("aceita inteiro positivo", () => {
        expect(lerId("7", "Não encontrado")).toBe(7);
    });

    it.each(["0", "-1", "1.5", "abc"])("trata %s como recurso inexistente", (valor) => {
        expect(() => lerId(valor, "Não encontrado")).toThrow(new RecursoNaoEncontrado("Não encontrado"));
    });
});

describe("filtros de query string", () => {
    it("lê booleano", () => {
        expect(lerFiltroBooleano(undefined, "ativo")).toBeUndefined();
        expect(lerFiltroBooleano("true", "ativo")).toBe(true);
        expect(lerFiltroBooleano("false", "ativo")).toBe(false);
        expect(() => lerFiltroBooleano("sim", "ativo")).toThrow(new ErroDeValidacao("O filtro ativo deve ser true ou false"));
    });

    it("lê id", () => {
        expect(lerFiltroId(undefined, "categoriaId")).toBeUndefined();
        expect(lerFiltroId("3", "categoriaId")).toBe(3);
        expect(() => lerFiltroId("x", "categoriaId")).toThrow(ErroDeValidacao);
    });
});
