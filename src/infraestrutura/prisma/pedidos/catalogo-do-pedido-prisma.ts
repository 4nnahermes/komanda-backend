import { PrismaClient } from "@prisma/client";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { BairroParaPedido, CatalogoDoPedido, MotoboyParaPedido, ProdutoParaPedido } from "../../../dominio/pedidos/catalogo-do-pedido";

export class CatalogoDoPedidoPrisma implements CatalogoDoPedido {
    constructor(private readonly prisma: PrismaClient) {}

    async buscarProduto(id: number): Promise<ProdutoParaPedido | null> {
        const produto = await this.prisma.produto.findUnique({
            where: { id },
            include: { categoria: { select: { ativo: true } } },
        });
        if (!produto) return null;
        return {
            id: produto.id,
            nome: produto.nome,
            preco: Dinheiro.deCentavos(Number(produto.precoCentavos)),
            ingredientes: produto.ingredientes,
            adicionais: produto.adicionais.map((adicional) => ({
                nome: adicional.nome,
                preco: Dinheiro.deCentavos(Number(adicional.precoCentavos)),
            })),
            disponivel: produto.ativo && produto.categoria.ativo,
        };
    }

    async buscarBairro(id: number): Promise<BairroParaPedido | null> {
        const bairro = await this.prisma.bairro.findUnique({ where: { id } });
        if (!bairro) return null;
        return { id: bairro.id, nome: bairro.nome, taxaEntrega: Dinheiro.deCentavos(Number(bairro.taxaEntregaCentavos)), ativo: bairro.ativo };
    }

    async buscarMotoboy(id: number): Promise<MotoboyParaPedido | null> {
        const motoboy = await this.prisma.motoboy.findUnique({ where: { id }, select: { id: true, nome: true, ativo: true } });
        return motoboy;
    }
}
