import { Dinheiro } from "../../dominio/compartilhado/dinheiro";
import { noiteDe } from "../../dominio/pedidos/noite";
import { Pedido } from "../../dominio/pedidos/pedido";
import { ConsultaDashboard } from "./consulta-dashboard";
import { VendasPorFormaPagamento, porFormaPagamento, somarTotais } from "./vendas";

export interface AcertoDoMotoboy {
    id: number;
    nome: string;
    entregas: number;
    valorFixoNoite: number;
    taxasEntrega: number;
    totalAPagar: number;
}

export interface FechamentoDeCaixa {
    noite: string;
    pedidos: number;
    totalVendido: number;
    porFormaPagamento: VendasPorFormaPagamento[];
    totalTaxasEntrega: number;
    motoboys: AcertoDoMotoboy[];
}

// Fechamento do caixa de uma noite (Requisitos 28 e 29) com o acerto
// de cada motoboy (Requisito 27, RN4). Conta só pedidos entregues (RN6).
export class FecharCaixa {
    constructor(
        private readonly consulta: ConsultaDashboard,
        private readonly agora: () => Date = () => new Date(),
    ) {}

    async executar(noite?: string): Promise<FechamentoDeCaixa> {
        const noiteDoFechamento = noite ?? noiteDe(this.agora());
        const pedidos = await this.consulta.listarPedidosEntregues(noiteDoFechamento, noiteDoFechamento);
        const entregas = pedidos.filter((pedido) => pedido.tipo === "ENTREGA");

        return {
            noite: noiteDoFechamento,
            pedidos: pedidos.length,
            totalVendido: somarTotais(pedidos).emReais,
            porFormaPagamento: porFormaPagamento(pedidos),
            totalTaxasEntrega: somarTaxas(entregas).emReais,
            motoboys: await this.acertos(entregas),
        };
    }

    // RN4: valor fixo da noite + soma das taxas dos bairros das entregas feitas.
    private async acertos(entregas: Pedido[]): Promise<AcertoDoMotoboy[]> {
        const porMotoboy = new Map<number, { nome: string; entregas: Pedido[] }>();
        for (const pedido of entregas) {
            if (!pedido.motoboy) continue;
            const atual = porMotoboy.get(pedido.motoboy.id) ?? { nome: pedido.motoboy.nome, entregas: [] };
            atual.entregas.push(pedido);
            porMotoboy.set(pedido.motoboy.id, atual);
        }

        const cadastros = await this.consulta.motoboys([...porMotoboy.keys()]);
        return [...porMotoboy.entries()]
            .map(([id, dados]) => {
                // Motoboy excluído depois da entrega: paga só as taxas.
                const valorFixo = cadastros.get(id)?.valorFixoNoite ?? Dinheiro.deCentavos(0);
                const taxas = somarTaxas(dados.entregas);
                return {
                    id,
                    nome: cadastros.get(id)?.nome ?? dados.nome,
                    entregas: dados.entregas.length,
                    valorFixoNoite: valorFixo.emReais,
                    taxasEntrega: taxas.emReais,
                    totalAPagar: valorFixo.somar(taxas).emReais,
                };
            })
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }
}

function somarTaxas(pedidos: Pedido[]): Dinheiro {
    return pedidos.reduce((soma, pedido) => soma.somar(pedido.taxaEntrega), Dinheiro.deCentavos(0));
}
