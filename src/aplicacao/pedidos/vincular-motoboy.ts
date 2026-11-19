import { ConflitoDeDados, ErroDeValidacao, RecursoNaoEncontrado } from "../../dominio/compartilhado/erros";
import { CatalogoDoPedido } from "../../dominio/pedidos/catalogo-do-pedido";
import { RepositorioPedidos } from "../../dominio/pedidos/repositorio-pedidos";
import { MENSAGENS } from "./mensagens";
import { PedidoDto, paraPedidoDto } from "./pedido-dto";

// Vincula o motoboy que vai levar a entrega (R17). null remove.
export class VincularMotoboy {
    constructor(
        private readonly repositorio: RepositorioPedidos,
        private readonly catalogo: CatalogoDoPedido,
    ) {}

    async executar(id: number, motoboyId: number | null): Promise<PedidoDto> {
        const pedido = await this.repositorio.buscarPorId(id);
        if (!pedido) throw new RecursoNaoEncontrado(MENSAGENS.pedidoNaoEncontrado);

        let motoboy = null;
        if (motoboyId !== null) {
            const encontrado = await this.catalogo.buscarMotoboy(motoboyId);
            if (!encontrado || !encontrado.ativo) throw new ErroDeValidacao(MENSAGENS.motoboyIndisponivel);
            motoboy = { id: encontrado.id, nome: encontrado.nome };
        }

        pedido.vincularMotoboy(motoboy);
        if (!(await this.repositorio.atualizar(pedido, pedido.status))) throw new ConflitoDeDados(MENSAGENS.alteradoNoMeio);
        return paraPedidoDto(pedido);
    }
}
