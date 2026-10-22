import { PrismaClient } from "@prisma/client";
import { CategoriaResumida, CategoriasDoCardapio } from "../../../dominio/cardapio/categorias-do-cardapio";

export class CategoriasDoCardapioPrisma implements CategoriasDoCardapio {
    constructor(private readonly prisma: PrismaClient) {}

    buscarPorId(id: number): Promise<CategoriaResumida | null> {
        return this.prisma.categoria.findUnique({ where: { id }, select: { id: true, nome: true } });
    }
}
