import { Categoria } from "../../dominio/categorias/categoria";
import { RepositorioCategorias } from "../../dominio/categorias/repositorio-categorias";

export class ListarCategorias {
    constructor(private readonly repositorio: RepositorioCategorias) {}
    executar(ativo?: boolean): Promise<Categoria[]> {
        return this.repositorio.listar(ativo);
    }
}
