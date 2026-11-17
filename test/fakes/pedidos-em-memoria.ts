import { Dinheiro } from "../../src/dominio/compartilhado/dinheiro";
import { BairroParaPedido, CatalogoDoPedido, MotoboyParaPedido, ProdutoParaPedido } from "../../src/dominio/pedidos/catalogo-do-pedido";
import { Pedido, StatusPedido } from "../../src/dominio/pedidos/pedido";
import { FiltroPedidos, RepositorioPedidos } from "../../src/dominio/pedidos/repositorio-pedidos";

// Substitui o banco nos testes de pedidos.
export class PedidosEmMemoria implements RepositorioPedidos {
    readonly pedidos = new Map<number, Pedido>();
    private proximoId = 1;
    private readonly numeroPorNoite = new Map<string, number>();

    async criar(pedido: Pedido): Promise<Pedido> {
        const id = this.proximoId++;
        const numero = (this.numeroPorNoite.get(pedido.noite) ?? 0) + 1;
        this.numeroPorNoite.set(pedido.noite, numero);
        const salvo = copiar(pedido, id, numero);
        this.pedidos.set(id, salvo);
        return copiar(salvo, id, numero);
    }

    async buscarPorId(id: number): Promise<Pedido | null> {
        const pedido = this.pedidos.get(id);
        return pedido ? copiar(pedido, id, pedido.numero!) : null;
    }

    async listar(filtro: FiltroPedidos): Promise<Pedido[]> {
        return [...this.pedidos.values()]
            .filter((p) => p.noite === filtro.noite && (filtro.status === undefined || p.status === filtro.status))
            .sort((a, b) => a.numero! - b.numero!)
            .map((p) => copiar(p, p.id!, p.numero!));
    }

    async atualizar(pedido: Pedido, statusAnterior: StatusPedido): Promise<boolean> {
        const atual = this.pedidos.get(pedido.id!);
        if (!atual || atual.status !== statusAnterior) return false;
        this.pedidos.set(pedido.id!, copiar(pedido, pedido.id!, pedido.numero!));
        return true;
    }

    async excluirEmPreparo(id: number): Promise<boolean> {
        const atual = this.pedidos.get(id);
        if (!atual || atual.status !== "EM_PREPARO") return false;
        return this.pedidos.delete(id);
    }
}

function copiar(pedido: Pedido, id: number, numero: number): Pedido {
    return Pedido.restaurar({
        id, numero,
        noite: pedido.noite, criadoEm: pedido.criadoEm, tipo: pedido.tipo, status: pedido.status,
        nomeCliente: pedido.nomeCliente, telefone: pedido.telefone, bairro: pedido.bairro, endereco: pedido.endereco,
        itens: pedido.itens, taxaEntrega: pedido.taxaEntrega, formaPagamento: pedido.formaPagamento,
        valorRecebido: pedido.valorRecebido, motoboy: pedido.motoboy,
    });
}

export class CatalogoEmMemoria implements CatalogoDoPedido {
    readonly produtos = new Map<number, ProdutoParaPedido>();
    readonly bairros = new Map<number, BairroParaPedido>();
    readonly motoboys = new Map<number, MotoboyParaPedido>();

    adicionarProduto(id: number, nome: string, preco: number, extras: { ingredientes?: string[]; adicionais?: Array<{ nome: string; preco: number }>; disponivel?: boolean } = {}): void {
        this.produtos.set(id, {
            id, nome, preco: Dinheiro.deReais(preco),
            ingredientes: extras.ingredientes ?? [],
            adicionais: (extras.adicionais ?? []).map((a) => ({ nome: a.nome, preco: Dinheiro.deReais(a.preco) })),
            disponivel: extras.disponivel ?? true,
        });
    }

    adicionarBairro(id: number, nome: string, taxa: number, ativo = true): void {
        this.bairros.set(id, { id, nome, taxaEntrega: Dinheiro.deReais(taxa), ativo });
    }

    adicionarMotoboy(id: number, nome: string, ativo = true): void {
        this.motoboys.set(id, { id, nome, ativo });
    }

    async buscarProduto(id: number) { return this.produtos.get(id) ?? null; }
    async buscarBairro(id: number) { return this.bairros.get(id) ?? null; }
    async buscarMotoboy(id: number) { return this.motoboys.get(id) ?? null; }
}
