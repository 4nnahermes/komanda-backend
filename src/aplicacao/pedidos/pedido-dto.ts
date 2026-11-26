import { FormaPagamento, Pedido, Referencia, StatusPedido, TipoPedido, subtotalDoItem } from "../../dominio/pedidos/pedido";

export interface ItemPedidoDto {
    produtoId: number;
    nome: string;
    quantidade: number;
    precoUnitario: number;
    ingredientesRetirados: string[];
    adicionais: Array<{ nome: string; preco: number }>;
    subtotal: number;
}

// Formato do pedido na API. Valores em reais.
export interface PedidoDto {
    id: number;
    numero: number;
    noite: string;
    criadoEm: string;
    tipo: TipoPedido;
    status: StatusPedido;
    nomeCliente: string;
    telefone: string | null;
    bairro: Referencia | null;
    endereco: string | null;
    itens: ItemPedidoDto[];
    subtotal: number;
    taxaEntrega: number;
    total: number;
    formaPagamento: FormaPagamento;
    valorRecebido: number | null;
    troco: number | null;
    motoboy: Referencia | null;
    prazoMinutos: number | null;
}

export function paraPedidoDto(pedido: Pedido): PedidoDto {
    return {
        id: pedido.id!,
        numero: pedido.numero!,
        noite: pedido.noite,
        criadoEm: pedido.criadoEm.toISOString(),
        tipo: pedido.tipo,
        status: pedido.status,
        nomeCliente: pedido.nomeCliente,
        telefone: pedido.telefone,
        bairro: pedido.bairro,
        endereco: pedido.endereco,
        itens: pedido.itens.map((item) => ({
            produtoId: item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario.emReais,
            ingredientesRetirados: item.ingredientesRetirados,
            adicionais: item.adicionais.map((adicional) => ({ nome: adicional.nome, preco: adicional.preco.emReais })),
            subtotal: subtotalDoItem(item).emReais,
        })),
        subtotal: pedido.subtotal.emReais,
        taxaEntrega: pedido.taxaEntrega.emReais,
        total: pedido.total.emReais,
        formaPagamento: pedido.formaPagamento,
        valorRecebido: pedido.valorRecebido?.emReais ?? null,
        troco: pedido.troco?.emReais ?? null,
        motoboy: pedido.motoboy,
        prazoMinutos: pedido.prazoMinutos,
    };
}
