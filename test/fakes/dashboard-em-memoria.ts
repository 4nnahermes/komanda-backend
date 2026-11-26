import { ConsultaDashboard, MotoboyDoAcerto, Referencia } from "../../src/aplicacao/dashboard/consulta-dashboard";
import { Dinheiro } from "../../src/dominio/compartilhado/dinheiro";
import { FormaPagamento, Pedido, StatusPedido } from "../../src/dominio/pedidos/pedido";

interface ItemSimples { produtoId: number; nome: string; quantidade: number; preco: number; opcoes?: string[] }

export class DashboardEmMemoria implements ConsultaDashboard {
    readonly pedidos: Pedido[] = [];
    readonly categorias = new Map<number, Referencia>();
    readonly cadastrosMotoboys = new Map<number, MotoboyDoAcerto>();

    adicionarPedido(dados: {
        noite: string; itens: ItemSimples[]; formaPagamento?: FormaPagamento; status?: StatusPedido;
        taxa?: number; motoboy?: Referencia;
    }): void {
        const entrega = dados.taxa !== undefined;
        this.pedidos.push(Pedido.restaurar({
            id: this.pedidos.length + 1, numero: this.pedidos.length + 1, noite: dados.noite, criadoEm: new Date(),
            tipo: entrega ? "ENTREGA" : "RETIRADA", status: dados.status ?? "ENTREGUE",
            nomeCliente: "Cliente", telefone: null, bairro: entrega ? { id: 1, nome: "Centro" } : null, endereco: entrega ? "Rua A" : null,
            itens: dados.itens.map((item) => ({
                produtoId: item.produtoId, nome: item.nome, quantidade: item.quantidade,
                precoUnitario: Dinheiro.deReais(item.preco), ingredientesRetirados: [], adicionais: [], opcoes: item.opcoes ?? [],
            })),
            taxaEntrega: Dinheiro.deReais(dados.taxa ?? 0), formaPagamento: dados.formaPagamento ?? "PIX",
            valorRecebido: null, motoboy: dados.motoboy ?? null,
        }));
    }

    adicionarMotoboy(id: number, nome: string, valorFixo: number): void {
        this.cadastrosMotoboys.set(id, { id, nome, valorFixoNoite: Dinheiro.deReais(valorFixo) });
    }

    async listarPedidosEntregues(inicio: string, fim: string) {
        return this.pedidos.filter((p) => p.status === "ENTREGUE" && p.noite >= inicio && p.noite <= fim);
    }

    async categoriasDosProdutos(ids: number[]) {
        return new Map([...this.categorias].filter(([id]) => ids.includes(id)));
    }

    async motoboys(ids: number[]) {
        return new Map([...this.cadastrosMotoboys].filter(([id]) => ids.includes(id)));
    }
}
