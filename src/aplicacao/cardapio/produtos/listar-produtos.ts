import { ConsultaProdutos, FiltroProdutos, ProdutoDetalhado } from "./consulta-produtos";

export class ListarProdutos {
    constructor(private readonly consulta: ConsultaProdutos) {}

    executar(filtro: FiltroProdutos): Promise<ProdutoDetalhado[]> {
        return this.consulta.listar(filtro);
    }
}
