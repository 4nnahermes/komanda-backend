import { unidadesDoItem } from "../../dominio/pedidos/pedido";
import { Dinheiro } from "../../dominio/compartilhado/dinheiro";
import { ErroDeValidacao } from "../../dominio/compartilhado/erros";
import { noiteDe } from "../../dominio/pedidos/noite";
import { ConsultaDashboard } from "./consulta-dashboard";
import { VendasPorFormaPagamento, porFormaPagamento, semFiado, somarTotais } from "./vendas";

const MAXIMO_DIAS = 366;

export interface ItemVendido {
    id: number;
    nome: string;
    quantidade: number;
}

export interface MetricasDoPeriodo {
    inicio: string;
    fim: string;
    totalVendido: number;
    pedidos: number;
    ticketMedio: number;
    porFormaPagamento: VendasPorFormaPagamento[];
    produtoMaisVendido: ItemVendido | null;
    produtoMenosVendido: ItemVendido | null;
    categoriaMaisVendida: ItemVendido | null;
}

// Dashboard do gestor (Requisitos 30 e 31): métricas das noites de inicio a fim.
// Conta só pedidos entregues (RN6) e deixa o fiado de fora. Sem período, usa a noite atual.
export class ConsultarMetricas {
    constructor(
        private readonly consulta: ConsultaDashboard,
        private readonly agora: () => Date = () => new Date(),
    ) {}

    async executar(periodo: { inicio?: string; fim?: string }): Promise<MetricasDoPeriodo> {
        const noiteAtual = noiteDe(this.agora());
        const inicio = periodo.inicio ?? periodo.fim ?? noiteAtual;
        const fim = periodo.fim ?? periodo.inicio ?? noiteAtual;
        validarPeriodo(inicio, fim);

        const pedidos = semFiado(await this.consulta.listarPedidosEntregues(inicio, fim));
        const total = somarTotais(pedidos);

        // Quantidade vendida por produto, com o nome gravado no pedido.
        const produtos = new Map<number, ItemVendido>();
        for (const item of pedidos.flatMap((pedido) => pedido.itens)) {
            const atual = produtos.get(item.produtoId) ?? { id: item.produtoId, nome: item.nome, quantidade: 0 };
            atual.quantidade += unidadesDoItem(item);
            produtos.set(item.produtoId, atual);
        }
        const ranking = [...produtos.values()].sort(porQuantidadeENome);

        return {
            inicio,
            fim,
            totalVendido: total.emReais,
            pedidos: pedidos.length,
            ticketMedio: pedidos.length ? Dinheiro.deCentavos(Math.round(total.centavos / pedidos.length)).emReais : 0,
            porFormaPagamento: porFormaPagamento(pedidos),
            produtoMaisVendido: ranking[0] ?? null,
            produtoMenosVendido: ranking.at(-1) ?? null,
            categoriaMaisVendida: await this.categoriaMaisVendida(ranking),
        };
    }

    private async categoriaMaisVendida(produtos: ItemVendido[]): Promise<ItemVendido | null> {
        const categoriaDe = await this.consulta.categoriasDosProdutos(produtos.map((produto) => produto.id));
        const categorias = new Map<number, ItemVendido>();
        for (const produto of produtos) {
            const categoria = categoriaDe.get(produto.id);
            if (!categoria) continue;
            const atual = categorias.get(categoria.id) ?? { id: categoria.id, nome: categoria.nome, quantidade: 0 };
            atual.quantidade += produto.quantidade;
            categorias.set(categoria.id, atual);
        }
        return [...categorias.values()].sort(porQuantidadeENome)[0] ?? null;
    }
}

function porQuantidadeENome(a: ItemVendido, b: ItemVendido): number {
    return b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, "pt-BR");
}

function validarPeriodo(inicio: string, fim: string): void {
    if (inicio > fim) throw new ErroDeValidacao("O início do período deve ser anterior ou igual ao fim");
    const dias = (Date.parse(fim) - Date.parse(inicio)) / 86_400_000 + 1;
    if (dias > MAXIMO_DIAS) throw new ErroDeValidacao(`O período pode ter no máximo ${MAXIMO_DIAS} dias`);
}
