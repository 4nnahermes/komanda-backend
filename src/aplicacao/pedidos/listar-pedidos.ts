import { noiteDe } from "../../dominio/pedidos/noite";
import { StatusPedido } from "../../dominio/pedidos/pedido";
import { RepositorioPedidos } from "../../dominio/pedidos/repositorio-pedidos";
import { PedidoDto, paraPedidoDto } from "./pedido-dto";

export interface FiltroListarPedidos {
    // AAAA-MM-DD. Sem filtro, usa a noite atual.
    noite?: string;
    status?: StatusPedido;
}

export class ListarPedidos {
    constructor(
        private readonly repositorio: RepositorioPedidos,
        private readonly agora: () => Date = () => new Date(),
    ) {}

    async executar(filtro: FiltroListarPedidos): Promise<PedidoDto[]> {
        const pedidos = await this.repositorio.listar({
            noite: filtro.noite ?? noiteDe(this.agora()),
            status: filtro.status,
        });
        return pedidos.map(paraPedidoDto);
    }
}
