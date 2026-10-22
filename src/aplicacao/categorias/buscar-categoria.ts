import { MENSAGENS_CATEGORIAS } from "./mensagens";
import { RecursoNaoEncontrado } from "../../dominio/compartilhado/erros";
import { RepositorioCategorias } from "../../dominio/categorias/repositorio-categorias";

export class BuscarCategoria {
    constructor(private readonly repositorio: RepositorioCategorias) {}
    async executar(id: number) {
        const categoria = await this.repositorio.buscarPorId(id);
        if (!categoria) throw new RecursoNaoEncontrado(MENSAGENS_CATEGORIAS.categoriaNaoEncontrada);
        return categoria;
    }
}
