import { ConflitoDeDados, RecursoNaoEncontrado } from "../../dominio/compartilhado/erros";
import { RepositorioCategorias } from "../../dominio/categorias/repositorio-categorias";
import { MENSAGENS_CATEGORIAS } from "./mensagens";

export class ExcluirCategoria {
    constructor(private readonly repositorio: RepositorioCategorias) {}
    async executar(id: number): Promise<void> {
        const resultado = await this.repositorio.excluirOrdenada(id);
        if (resultado === "nao-encontrada") throw new RecursoNaoEncontrado(MENSAGENS_CATEGORIAS.categoriaNaoEncontrada);
        if (resultado === "em-uso") throw new ConflitoDeDados(MENSAGENS_CATEGORIAS.categoriaComProdutos);
    }
}
