import { Dinheiro } from "../../dominio/compartilhado/dinheiro";
import { FORMAS_PAGAMENTO, FormaPagamento, Pedido } from "../../dominio/pedidos/pedido";

export interface VendasPorFormaPagamento {
    formaPagamento: FormaPagamento;
    pedidos: number;
    total: number;
}

export function somarTotais(pedidos: Pedido[]): Dinheiro {
    return pedidos.reduce((soma, pedido) => soma.somar(pedido.total), Dinheiro.deCentavos(0));
}

// Todas as formas aparecem, mesmo com zero, para a tela montar a lista fixa.
export function porFormaPagamento(pedidos: Pedido[]): VendasPorFormaPagamento[] {
    return FORMAS_PAGAMENTO.map((formaPagamento) => {
        const daForma = pedidos.filter((pedido) => pedido.formaPagamento === formaPagamento);
        return { formaPagamento, pedidos: daForma.length, total: somarTotais(daForma).emReais };
    });
}
