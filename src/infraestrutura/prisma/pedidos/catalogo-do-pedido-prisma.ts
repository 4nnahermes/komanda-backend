import { PrismaClient } from "@prisma/client";
import { combinarComCategoria, unirOpcoes } from "../../../dominio/cardapio/acompanhamentos";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { BairroParaPedido, CatalogoDoPedido, MotoboyParaPedido, ProdutoParaPedido } from "../../../dominio/pedidos/catalogo-do-pedido";

export class CatalogoDoPedidoPrisma implements CatalogoDoPedido {
    constructor(private readonly prisma: PrismaClient) {}

    async buscarProduto(id: number): Promise<ProdutoParaPedido | null> {
        const produto = await this.prisma.produto.findUnique({
            where: { id },
            include: { categoria: { select: { ativo: true, tipo: true, ingredientes: true, adicionais: true, opcoes: true } } },
        });
        if (!produto) return null;
        // Bebida só tem opções; alimento tem acompanhamentos e adicionais.
        // Nos dois casos, valem os da categoria mais os do próprio produto.
        const bebida = produto.categoria.tipo === "BEBIDA";
        const combinados = combinarComCategoria(
            { ingredientes: produto.categoria.ingredientes ?? [], adicionais: produto.categoria.adicionais ?? [] },
            { ingredientes: produto.ingredientes, adicionais: produto.adicionais },
        );
        const ingredientes = bebida ? [] : combinados.ingredientes;
        const adicionais = bebida ? [] : combinados.adicionais;
        const opcoes = bebida ? unirOpcoes(produto.categoria.opcoes ?? [], produto.opcoes ?? []) : [];
        return {
            id: produto.id,
            nome: produto.nome,
            preco: Dinheiro.deCentavos(Number(produto.precoCentavos)),
            ingredientes,
            opcoes,
            adicionais: adicionais.map((adicional) => ({
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
