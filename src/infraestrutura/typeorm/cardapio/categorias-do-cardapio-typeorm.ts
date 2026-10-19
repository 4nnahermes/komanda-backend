import { DataSource } from "typeorm";
import { CategoriaResumida, CategoriasDoCardapio } from "../../../dominio/cardapio/categorias-do-cardapio";
import { Categoria as CategoriaModelo } from "../../../entity/categoria";

export class CategoriasDoCardapioTypeorm implements CategoriasDoCardapio {
    constructor(private readonly dataSource: DataSource) {}

    buscarPorId(id: number): Promise<CategoriaResumida | null> {
        return this.dataSource.getRepository(CategoriaModelo).findOne({
            where: { id },
            select: { id: true, nome: true },
        });
    }
}
