import { ConflitoDeDados, RecursoNaoEncontrado } from "../../dominio/compartilhado/erros";
import { StatusPedido } from "../../dominio/pedidos/pedido";
import { RepositorioPedidos } from "../../dominio/pedidos/repositorio-pedidos";
import { MENSAGENS } from "./mensagens";
import { PedidoDto, paraPedidoDto } from "./pedido-dto";

// Move o pedido entre as colunas do quadro ou cancela (R18).
export class AlterarStatusPedido {
    constructor(private readonly repositorio: RepositorioPedidos) {}

    async executar(id: number, status: StatusPedido): Promise<PedidoDto> {
        const pedido = await this.repositorio.buscarPorId(id);
        if (!pedido) throw new RecursoNaoEncontrado(MENSAGENS.pedidoNaoEncontrado);
        const anterior = pedido.status;
        pedido.alterarStatus(status);
        if (!(await this.repositorio.atualizar(pedido, anterior))) throw new ConflitoDeDados(MENSAGENS.alteradoNoMeio);
        return paraPedidoDto(pedido);
    }
}
