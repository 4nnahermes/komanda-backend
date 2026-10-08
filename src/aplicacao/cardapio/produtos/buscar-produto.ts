import { RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { ConsultaProdutos, ProdutoDetalhado } from "./consulta-produtos";
import { MENSAGENS } from "./mensagens";

export class BuscarProduto {
    constructor(private readonly consulta: ConsultaProdutos) {}

    async executar(id: number): Promise<ProdutoDetalhado> {
        const produto = await this.consulta.buscarPorId(id);
        if (!produto) {
            throw new RecursoNaoEncontrado(MENSAGENS.produtoNaoEncontrado);
        }
        return produto;
    }
}
