export interface CategoriaResumida {
    id: number;
    nome: string;
}

// Consulta às categorias usada por outros módulos do cardápio,
// como o de produtos, para saber se uma categoria existe.
export interface CategoriasDoCardapio {
    buscarPorId(id: number): Promise<CategoriaResumida | null>;
}
