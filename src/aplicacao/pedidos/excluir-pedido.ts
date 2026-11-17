import { ConflitoDeDados, RecursoNaoEncontrado } from "../../dominio/compartilhado/erros";
import { MENSAGENS_PEDIDO } from "../../dominio/pedidos/pedido";
import { RepositorioPedidos } from "../../dominio/pedidos/repositorio-pedidos";
import { MENSAGENS } from "./mensagens";

// Apaga um pedido lançado por engano. Só vale enquanto está em preparo;
// depois disso o pedido é cancelado e o registro fica.
export class ExcluirPedido {
    constructor(private readonly repositorio: RepositorioPedidos) {}

    async executar(id: number): Promise<void> {
        const pedido = await this.repositorio.buscarPorId(id);
        if (!pedido) throw new RecursoNaoEncontrado(MENSAGENS.pedidoNaoEncontrado);
        pedido.garantirQuePodeExcluir();
        // Se o status mudou entre a leitura e a exclusão, o pedido não é apagado.
        if (!(await this.repositorio.excluirEmPreparo(id))) throw new ConflitoDeDados(MENSAGENS_PEDIDO.exclusaoForaDoPreparo);
    }
}
