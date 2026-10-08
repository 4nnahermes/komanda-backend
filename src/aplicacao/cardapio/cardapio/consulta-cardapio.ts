export interface ItemAtivoDoCardapio {
    categoria: { id: number; nome: string; ordem: number };
    produto: { id: number; nome: string; descricao: string | null; preco: number };
}

// Leitura dos itens que podem aparecer no cardápio:
// produtos ativos que pertencem a categorias ativas.
export interface ConsultaCardapio {
    listarItensAtivos(): Promise<ItemAtivoDoCardapio[]>;
}
