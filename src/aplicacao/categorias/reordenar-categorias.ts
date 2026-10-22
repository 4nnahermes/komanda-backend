import { Categoria } from "../../dominio/categorias/categoria";
import { ErroDeValidacao } from "../../dominio/compartilhado/erros";
import { RepositorioCategorias } from "../../dominio/categorias/repositorio-categorias";
import { MENSAGENS_CATEGORIAS } from "./mensagens";

export class ReordenarCategorias {
    constructor(private readonly repositorio: RepositorioCategorias) {}
    async executar(ids: unknown): Promise<Categoria[]> {
        if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "number" && Number.isInteger(id) && id > 0)) {
            throw new ErroDeValidacao(MENSAGENS_CATEGORIAS.listaDeIdsObrigatoria);
        }
        const ordenadas = await this.repositorio.reordenarCompleto(ids as number[]);
        if (!ordenadas) throw new ErroDeValidacao(MENSAGENS_CATEGORIAS.listaCompleta);
        return ordenadas;
    }
}
