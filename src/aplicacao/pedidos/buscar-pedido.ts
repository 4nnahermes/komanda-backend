import { RecursoNaoEncontrado } from "../../dominio/compartilhado/erros";
import { RepositorioPedidos } from "../../dominio/pedidos/repositorio-pedidos";
import { MENSAGENS } from "./mensagens";
import { PedidoDto, paraPedidoDto } from "./pedido-dto";

export class BuscarPedido {
    constructor(private readonly repositorio: RepositorioPedidos) {}

    async executar(id: number): Promise<PedidoDto> {
        const pedido = await this.repositorio.buscarPorId(id);
        if (!pedido) throw new RecursoNaoEncontrado(MENSAGENS.pedidoNaoEncontrado);
        return paraPedidoDto(pedido);
    }
}
