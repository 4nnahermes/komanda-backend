import { Categoria } from "../../dominio/categorias/categoria";
import { ConflitoDeDados, ErroDeValidacao } from "../../dominio/compartilhado/erros";
import { RepositorioCategorias } from "../../dominio/categorias/repositorio-categorias";
import { MENSAGENS_CATEGORIAS } from "./mensagens";

export class CriarCategoria {
    constructor(private readonly repositorio: RepositorioCategorias) {}
    async executar(dados: { nome?: unknown; ordem?: unknown }) {
        const ordem = dados.ordem === undefined ? undefined : validarOrdem(dados.ordem);
        const categoria = Categoria.criar(dados.nome, ordem ?? 1);
        if (await this.repositorio.nomeExiste(categoria.nome)) {
            throw new ConflitoDeDados(MENSAGENS_CATEGORIAS.nomeRepetido);
        }
        try {
            return await this.repositorio.criarOrdenada(categoria, ordem);
        } catch (erro) {
            if (erro instanceof ConflitoDeDados) throw new ConflitoDeDados(MENSAGENS_CATEGORIAS.nomeRepetido);
            throw erro;
        }
    }
}

function validarOrdem(valor: unknown): number {
    if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0) {
        throw new ErroDeValidacao("A ordem deve ser um número inteiro maior que zero");
    }
    return valor;
}
