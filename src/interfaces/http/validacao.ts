import { z } from "zod";
import { ErroDeValidacao, RecursoNaoEncontrado } from "../../dominio/compartilhado/erros";

// Confere o corpo da requisição com um esquema do zod e devolve os dados já tipados.
// A primeira mensagem de erro do esquema vira a resposta 400.
export function validarCorpo<T extends z.ZodType>(esquema: T, corpo: unknown): z.infer<T> {
    const resultado = esquema.safeParse(corpo ?? {});
    if (!resultado.success) {
        throw new ErroDeValidacao(resultado.error.issues[0].message);
    }
    return resultado.data;
}

// Um id que não é inteiro positivo não existe no banco, então a resposta é 404.
export function lerId(valor: unknown, mensagemNaoEncontrado: string): number {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        throw new RecursoNaoEncontrado(mensagemNaoEncontrado);
    }
    return id;
}

// Filtro de query string "true" ou "false". Ausente, devolve undefined.
export function lerFiltroBooleano(valor: unknown, nomeDoFiltro: string): boolean | undefined {
    if (valor === undefined) return undefined;
    if (valor === "true") return true;
    if (valor === "false") return false;
    throw new ErroDeValidacao(`O filtro ${nomeDoFiltro} deve ser true ou false`);
}

// Filtro de query string com um id. Ausente, devolve undefined.
export function lerFiltroId(valor: unknown, nomeDoFiltro: string): number | undefined {
    if (valor === undefined) return undefined;
    const id = Number(valor);
    if (typeof valor !== "string" || !Number.isInteger(id) || id <= 0) {
        throw new ErroDeValidacao(`O filtro ${nomeDoFiltro} deve ser um número inteiro maior que zero`);
    }
    return id;
}
