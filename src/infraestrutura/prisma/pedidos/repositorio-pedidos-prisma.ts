import { PrismaClient, Pedido as RegistroPedido } from "@prisma/client";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { Pedido, StatusPedido } from "../../../dominio/pedidos/pedido";
import { FiltroPedidos, RepositorioPedidos } from "../../../dominio/pedidos/repositorio-pedidos";
import { emTransacao, proximoId } from "../compartilhado";

export class RepositorioPedidosPrisma implements RepositorioPedidos {
    constructor(private readonly prisma: PrismaClient) {}

    async criar(pedido: Pedido): Promise<Pedido> {
        const registro = await emTransacao(this.prisma, async (tx) => {
            const id = await proximoId(tx, "pedidos");
            // Um contador por noite: o primeiro pedido de cada noite é o número 1.
            const numero = await proximoId(tx, `pedidos:${pedido.noite}`);
            return tx.pedido.create({
                data: {
                    id,
                    numero,
                    noite: pedido.noite,
                    criadoEm: pedido.criadoEm,
                    tipo: pedido.tipo,
                    status: pedido.status,
                    nomeCliente: pedido.nomeCliente,
                    telefone: pedido.telefone,
                    bairro: pedido.bairro ? { id: pedido.bairro.id, nome: pedido.bairro.nome } : null,
                    endereco: pedido.endereco,
                    itens: pedido.itens.map((item) => ({
                        produtoId: item.produtoId,
                        nome: item.nome,
                        quantidade: item.quantidade,
                        precoUnitarioCentavos: BigInt(item.precoUnitario.centavos),
                        ingredientesRetirados: item.ingredientesRetirados,
                        adicionais: item.adicionais.map((adicional) => ({
                            nome: adicional.nome,
                            precoCentavos: BigInt(adicional.preco.centavos),
                        })),
                    })),
                    taxaEntregaCentavos: BigInt(pedido.taxaEntrega.centavos),
                    formaPagamento: pedido.formaPagamento,
                    valorRecebidoCentavos: pedido.valorRecebido ? BigInt(pedido.valorRecebido.centavos) : null,
                    motoboy: null,
                },
            });
        });
        return paraDominio(registro);
    }

    async buscarPorId(id: number): Promise<Pedido | null> {
        const registro = await this.prisma.pedido.findUnique({ where: { id } });
        return registro ? paraDominio(registro) : null;
    }

    async listar(filtro: FiltroPedidos): Promise<Pedido[]> {
        const registros = await this.prisma.pedido.findMany({
            where: { noite: filtro.noite, ...(filtro.status ? { status: filtro.status } : {}) },
            orderBy: { numero: "asc" },
        });
        return registros.map(paraDominio);
    }

    async atualizar(pedido: Pedido, statusAnterior: StatusPedido): Promise<boolean> {
        const motoboy = pedido.motoboy ? { id: pedido.motoboy.id, nome: pedido.motoboy.nome } : null;
        const resultado = await this.prisma.pedido.updateMany({
            where: { id: pedido.id!, status: statusAnterior },
            data: { status: pedido.status, motoboy: { set: motoboy } },
        });
        return resultado.count > 0;
    }

    async excluirEmPreparo(id: number): Promise<boolean> {
        const resultado = await this.prisma.pedido.deleteMany({ where: { id, status: "EM_PREPARO" } });
        return resultado.count > 0;
    }
}

function dinheiro(centavos: bigint): Dinheiro {
    return Dinheiro.deCentavos(Number(centavos));
}

function paraDominio(registro: RegistroPedido): Pedido {
    return Pedido.restaurar({
        id: registro.id,
        numero: registro.numero,
        noite: registro.noite,
        criadoEm: registro.criadoEm,
        tipo: registro.tipo,
        status: registro.status,
        nomeCliente: registro.nomeCliente,
        telefone: registro.telefone,
        bairro: registro.bairro ? { id: registro.bairro.id, nome: registro.bairro.nome } : null,
        endereco: registro.endereco,
        itens: registro.itens.map((item) => ({
            produtoId: item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: dinheiro(item.precoUnitarioCentavos),
            ingredientesRetirados: item.ingredientesRetirados,
            adicionais: item.adicionais.map((adicional) => ({ nome: adicional.nome, preco: dinheiro(adicional.precoCentavos) })),
        })),
        taxaEntrega: dinheiro(registro.taxaEntregaCentavos),
        formaPagamento: registro.formaPagamento,
        valorRecebido: registro.valorRecebidoCentavos === null ? null : dinheiro(registro.valorRecebidoCentavos),
        motoboy: registro.motoboy ? { id: registro.motoboy.id, nome: registro.motoboy.nome } : null,
    });
}
