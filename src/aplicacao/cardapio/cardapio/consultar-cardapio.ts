import { ConsultaCardapio, ItemAtivoDoCardapio } from "./consulta-cardapio";

export interface ProdutoNoCardapio {
    id: number;
    nome: string;
    descricao: string | null;
    preco: number;
}

export interface CategoriaNoCardapio {
    id: number;
    nome: string;
    ordem: number;
    produtos: ProdutoNoCardapio[];
}

// US03 (Requisito 8): monta o cardápio pronto para exibir.
// Categorias ativas na ordem definida, cada uma com os produtos ativos por nome.
// Categoria sem nenhum produto ativo não aparece.
export class ConsultarCardapio {
    constructor(private readonly consulta: ConsultaCardapio) {}

    async executar(): Promise<CategoriaNoCardapio[]> {
        const itens = await this.consulta.listarItensAtivos();
        return agruparPorCategoria(itens)
            .sort((a, b) => a.ordem - b.ordem || a.id - b.id)
            .map((categoria) => ({ ...categoria, produtos: categoria.produtos.sort(porNome) }));
    }
}

function agruparPorCategoria(itens: ItemAtivoDoCardapio[]): CategoriaNoCardapio[] {
    const categorias = new Map<number, CategoriaNoCardapio>();
    for (const { categoria, produto } of itens) {
        const existente = categorias.get(categoria.id) ?? { ...categoria, produtos: [] };
        existente.produtos.push(produto);
        categorias.set(categoria.id, existente);
    }
    return [...categorias.values()];
}

function porNome(a: ProdutoNoCardapio, b: ProdutoNoCardapio): number {
    return a.nome.localeCompare(b.nome, "pt-BR") || a.id - b.id;
}
