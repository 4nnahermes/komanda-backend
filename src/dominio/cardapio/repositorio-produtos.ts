import { Produto } from "./produto";

// O que os casos de uso precisam para gravar produtos.
// A implementação com TypeORM fica em src/infraestrutura.
export interface RepositorioProdutos {
    buscarPorId(id: number): Promise<Produto | null>;

    // Compara o nome sem diferenciar maiúsculas: "Xis Carne" e "xis carne" são o mesmo produto.
    existeNaCategoria(nome: string, categoriaId: number, ignorarId?: number): Promise<boolean>;

    // Insere quando o produto ainda não tem id; atualiza quando já tem. Devolve o id.
    salvar(produto: Produto): Promise<number>;

    excluir(id: number): Promise<void>;
}
