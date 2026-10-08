import { ConsultaProdutos, FiltroProdutos, ProdutoDetalhado } from "../../src/aplicacao/cardapio/produtos/consulta-produtos";
import { CategoriaResumida, CategoriasDoCardapio } from "../../src/dominio/cardapio/categorias-do-cardapio";
import { Produto } from "../../src/dominio/cardapio/produto";
import { RepositorioProdutos } from "../../src/dominio/cardapio/repositorio-produtos";

export interface CategoriaEmMemoria {
    id: number;
    nome: string;
    ordem: number;
    ativo: boolean;
}

// Substitui o banco nos testes. Guarda categorias e produtos em memória
// e oferece as mesmas interfaces que as implementações com TypeORM.
export class CardapioEmMemoria {
    readonly categorias: CategoriaEmMemoria[] = [];
    readonly produtos = new Map<number, Produto>();
    private proximoIdDeProduto = 1;

    adicionarCategoria(nome: string, ordem: number, ativo = true): CategoriaEmMemoria {
        const categoria = { id: this.categorias.length + 1, nome, ordem, ativo };
        this.categorias.push(categoria);
        return categoria;
    }

    readonly categoriasDoCardapio: CategoriasDoCardapio = {
        buscarPorId: async (id): Promise<CategoriaResumida | null> => {
            const categoria = this.categorias.find((c) => c.id === id);
            return categoria ? { id: categoria.id, nome: categoria.nome } : null;
        },
    };

    readonly repositorioProdutos: RepositorioProdutos = {
        buscarPorId: async (id) => this.produtos.get(id) ?? null,

        existeNaCategoria: async (nome, categoriaId, ignorarId) =>
            [...this.produtos.values()].some(
                (p) => p.categoriaId === categoriaId && p.nome.toLowerCase() === nome.toLowerCase() && p.id !== ignorarId,
            ),

        salvar: async (produto) => {
            const id = produto.id ?? this.proximoIdDeProduto++;
            this.produtos.set(id, copiarComId(produto, id));
            return id;
        },

        excluir: async (id) => {
            this.produtos.delete(id);
        },
    };

    readonly consultaProdutos: ConsultaProdutos = {
        listar: async (filtro: FiltroProdutos) =>
            [...this.produtos.values()]
                .filter((p) => filtro.categoriaId === undefined || p.categoriaId === filtro.categoriaId)
                .filter((p) => filtro.ativo === undefined || p.ativo === filtro.ativo)
                .sort((a, b) => this.ordemDaCategoria(a) - this.ordemDaCategoria(b) || a.nome.localeCompare(b.nome))
                .map((p) => this.detalhar(p)),

        buscarPorId: async (id) => {
            const produto = this.produtos.get(id);
            return produto ? this.detalhar(produto) : null;
        },
    };

    private ordemDaCategoria(produto: Produto): number {
        return this.categoria(produto.categoriaId).ordem;
    }

    private categoria(id: number): CategoriaEmMemoria {
        const categoria = this.categorias.find((c) => c.id === id);
        if (!categoria) throw new Error(`Categoria ${id} não existe no cardápio em memória`);
        return categoria;
    }

    private detalhar(produto: Produto): ProdutoDetalhado {
        const categoria = this.categoria(produto.categoriaId);
        return {
            id: produto.id as number,
            nome: produto.nome,
            descricao: produto.descricao,
            preco: produto.preco.emReais,
            ativo: produto.ativo,
            categoria: { id: categoria.id, nome: categoria.nome },
        };
    }
}

// Grava uma cópia, como o banco faria, para que alterações na entidade
// só valham depois de salvar.
function copiarComId(produto: Produto, id: number): Produto {
    return Produto.restaurar({
        id,
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.preco,
        categoriaId: produto.categoriaId,
        ativo: produto.ativo,
    });
}
