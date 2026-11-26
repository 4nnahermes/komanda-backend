import { Dinheiro } from "../compartilhado/dinheiro";

// Dados de outros cadastros que o pedido precisa consultar no momento da venda.
// As implementações ficam em src/infraestrutura.

export interface ProdutoParaPedido {
    id: number;
    nome: string;
    preco: Dinheiro;
    ingredientes: string[];
    // Opções de bebida (sabores, marcas). Vazio em alimentos.
    opcoes: string[];
    adicionais: Array<{ nome: string; preco: Dinheiro }>;
    // Produto ativo e de categoria ativa.
    disponivel: boolean;
}

export interface BairroParaPedido {
    id: number;
    nome: string;
    taxaEntrega: Dinheiro;
    ativo: boolean;
}

export interface MotoboyParaPedido {
    id: number;
    nome: string;
    ativo: boolean;
}

export interface CatalogoDoPedido {
    buscarProduto(id: number): Promise<ProdutoParaPedido | null>;
    buscarBairro(id: number): Promise<BairroParaPedido | null>;
    buscarMotoboy(id: number): Promise<MotoboyParaPedido | null>;
}
