import { PrismaClient } from "@prisma/client";
import { ConsultaDashboard, MotoboyDoAcerto, Referencia } from "../../../aplicacao/dashboard/consulta-dashboard";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { Pedido } from "../../../dominio/pedidos/pedido";
import { paraDominio } from "../pedidos/repositorio-pedidos-prisma";

export class ConsultaDashboardPrisma implements ConsultaDashboard {
    constructor(private readonly prisma: PrismaClient) {}

    async listarPedidosEntregues(inicio: string, fim: string): Promise<Pedido[]> {
        // noite é AAAA-MM-DD, então a comparação de texto respeita a ordem das datas.
        const registros = await this.prisma.pedido.findMany({
            where: { status: "ENTREGUE", noite: { gte: inicio, lte: fim } },
            orderBy: [{ noite: "asc" }, { numero: "asc" }],
        });
        return registros.map(paraDominio);
    }

    async categoriasDosProdutos(produtoIds: number[]): Promise<Map<number, Referencia>> {
        if (produtoIds.length === 0) return new Map();
        const produtos = await this.prisma.produto.findMany({
            where: { id: { in: produtoIds } },
            select: { id: true, categoria: { select: { id: true, nome: true } } },
        });
        return new Map(produtos.map((produto) => [produto.id, produto.categoria]));
    }

    async motoboys(ids: number[]): Promise<Map<number, MotoboyDoAcerto>> {
        if (ids.length === 0) return new Map();
        const motoboys = await this.prisma.motoboy.findMany({
            where: { id: { in: ids } },
            select: { id: true, nome: true, valorFixoNoiteCentavos: true },
        });
        return new Map(motoboys.map((motoboy) => [motoboy.id, {
            id: motoboy.id,
            nome: motoboy.nome,
            valorFixoNoite: Dinheiro.deCentavos(Number(motoboy.valorFixoNoiteCentavos)),
        }]));
    }
}
