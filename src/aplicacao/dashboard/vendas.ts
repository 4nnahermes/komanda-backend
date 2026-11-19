import { Dinheiro } from "../../dominio/compartilhado/dinheiro";
import { FORMAS_PAGAMENTO, FormaPagamento, Pedido } from "../../dominio/pedidos/pedido";

export interface VendasPorFormaPagamento {
    formaPagamento: FormaPagamento;
    pedidos: number;
    total: number;
}

// Fiado é quase um brinde: o pedido existe, mas não entra em nenhuma métrica de venda.
export function semFiado(pedidos: Pedido[]): Pedido[] {
    return pedidos.filter((pedido) => pedido.formaPagamento !== "FIADO");
}

export function somarTotais(pedidos: Pedido[]): Dinheiro {
    return pedidos.reduce((soma, pedido) => soma.somar(pedido.total), Dinheiro.deCentavos(0));
}

// Todas as formas de venda aparecem, mesmo com zero, para a tela montar a lista fixa. O fiado não é venda.
export function porFormaPagamento(pedidos: Pedido[]): VendasPorFormaPagamento[] {
    return FORMAS_PAGAMENTO.filter((forma) => forma !== "FIADO").map((formaPagamento) => {
        const daForma = pedidos.filter((pedido) => pedido.formaPagamento === formaPagamento);
        return { formaPagamento, pedidos: daForma.length, total: somarTotais(daForma).emReais };
    });
}
