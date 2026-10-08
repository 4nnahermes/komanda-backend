import { CategoriaResumida } from "../../../dominio/cardapio/categorias-do-cardapio";

// Produto no formato de resposta da API: preço em reais e a categoria com o nome.
export interface ProdutoDetalhado {
    id: number;
    nome: string;
    descricao: string | null;
    preco: number;
    ativo: boolean;
    categoria: CategoriaResumida;
}

export interface FiltroProdutos {
    categoriaId?: number;
    ativo?: boolean;
}

// Leitura de produtos já no formato de resposta, com o join da categoria.
// Separada do repositório porque a listagem não precisa da entidade do domínio.
export interface ConsultaProdutos {
    // Ordena pela ordem da categoria no cardápio e depois pelo nome do produto.
    listar(filtro: FiltroProdutos): Promise<ProdutoDetalhado[]>;
    buscarPorId(id: number): Promise<ProdutoDetalhado | null>;
}
