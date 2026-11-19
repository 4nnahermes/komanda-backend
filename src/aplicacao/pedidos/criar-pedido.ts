import { ErroDeValidacao } from "../../dominio/compartilhado/erros";
import { CatalogoDoPedido } from "../../dominio/pedidos/catalogo-do-pedido";
import { noiteDe } from "../../dominio/pedidos/noite";
import { BairroDoPedido, FormaPagamento, Pedido, TipoPedido, criarItem, validarDestino } from "../../dominio/pedidos/pedido";
import { RepositorioPedidos } from "../../dominio/pedidos/repositorio-pedidos";
import { MENSAGENS } from "./mensagens";
import { PedidoDto, paraPedidoDto } from "./pedido-dto";

export interface ItemNovoPedido {
    produtoId: number;
    quantidade: number;
    ingredientesRetirados?: string[];
    adicionais?: string[];
}

export interface DadosNovoPedido {
    tipo: TipoPedido;
    nomeCliente: string;
    telefone?: string | null;
    bairroId?: number | null;
    endereco?: string | null;
    itens: ItemNovoPedido[];
    formaPagamento: FormaPagamento;
    valorRecebido?: number | null;
}

// Registra o pedido com os preços e a taxa vigentes no cadastro (RN5).
// O frontend envia só as escolhas; todos os valores são calculados aqui.
export class CriarPedido {
    constructor(
        private readonly repositorio: RepositorioPedidos,
        private readonly catalogo: CatalogoDoPedido,
        private readonly agora: () => Date = () => new Date(),
    ) {}

    async executar(dados: DadosNovoPedido): Promise<PedidoDto> {
        validarDestino(dados.tipo, dados.bairroId, dados.endereco);

        const itens = [];
        for (const item of dados.itens) {
            const produto = await this.catalogo.buscarProduto(item.produtoId);
            if (!produto || !produto.disponivel) throw new ErroDeValidacao(MENSAGENS.produtoIndisponivel);
            itens.push(criarItem(produto, item.quantidade, item.ingredientesRetirados, item.adicionais));
        }

        const bairro = await this.buscarBairro(dados);
        const criadoEm = this.agora();
        const pedido = Pedido.criar({
            tipo: dados.tipo,
            nomeCliente: dados.nomeCliente,
            telefone: dados.telefone,
            bairro,
            endereco: dados.endereco,
            itens,
            formaPagamento: dados.formaPagamento,
            valorRecebido: dados.valorRecebido,
            criadoEm,
            noite: noiteDe(criadoEm),
        });
        return paraPedidoDto(await this.repositorio.criar(pedido));
    }

    private async buscarBairro(dados: DadosNovoPedido): Promise<BairroDoPedido | null> {
        if (dados.tipo !== "ENTREGA" || dados.bairroId === null || dados.bairroId === undefined) return null;
        const bairro = await this.catalogo.buscarBairro(dados.bairroId);
        if (!bairro || !bairro.ativo) throw new ErroDeValidacao(MENSAGENS.bairroIndisponivel);
        return { id: bairro.id, nome: bairro.nome, taxaEntrega: bairro.taxaEntrega };
    }
}
