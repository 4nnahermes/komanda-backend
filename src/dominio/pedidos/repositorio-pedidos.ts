import { Pedido, StatusPedido } from "./pedido";

export interface FiltroPedidos {
    noite: string;
    status?: StatusPedido;
}

// O que os casos de uso precisam para gravar e ler pedidos.
// As implementações de persistência ficam em src/infraestrutura.
export interface RepositorioPedidos {
    // Gera o id e o número da noite e devolve o pedido gravado.
    criar(pedido: Pedido): Promise<Pedido>;

    buscarPorId(id: number): Promise<Pedido | null>;

    // Ordenado pelo número do pedido.
    listar(filtro: FiltroPedidos): Promise<Pedido[]>;

    // Grava status e motoboy só se o status no banco ainda for statusAnterior.
    // Devolve false se o pedido sumiu ou foi alterado por outra pessoa no meio.
    atualizar(pedido: Pedido, statusAnterior: StatusPedido): Promise<boolean>;

    // Exclui só se o pedido ainda estiver em preparo. Devolve false caso contrário.
    excluirEmPreparo(id: number): Promise<boolean>;
}
