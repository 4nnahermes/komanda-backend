import { RepositorioProdutos } from "../../../dominio/cardapio/repositorio-produtos";
import { RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { MENSAGENS } from "./mensagens";

// Exclui de vez. Para só tirar do cardápio, o produto é desativado.
// Quando o módulo de pedidos existir, produto já vendido não poderá ser excluído (RN5 e RN6).
export class ExcluirProduto {
    constructor(private readonly repositorio: RepositorioProdutos) {}

    async executar(id: number): Promise<void> {
        if (!(await this.repositorio.buscarPorId(id))) {
            throw new RecursoNaoEncontrado(MENSAGENS.produtoNaoEncontrado);
        }
        await this.repositorio.excluir(id);
    }
}
