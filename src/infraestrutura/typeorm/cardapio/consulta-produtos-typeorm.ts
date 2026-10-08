import { DataSource } from "typeorm";
import { ConsultaProdutos, FiltroProdutos, ProdutoDetalhado } from "../../../aplicacao/cardapio/produtos/consulta-produtos";
import { Produto as ProdutoModelo } from "../../../entity/produto";

export class ConsultaProdutosTypeorm implements ConsultaProdutos {
    constructor(private readonly dataSource: DataSource) {}

    async listar(filtro: FiltroProdutos): Promise<ProdutoDetalhado[]> {
        const consulta = this.consultaBase()
            .orderBy("categoria.ordem", "ASC")
            .addOrderBy("produto.nome", "ASC")
            .addOrderBy("produto.id", "ASC");

        if (filtro.categoriaId !== undefined) {
            consulta.andWhere("categoria.id = :categoriaId", { categoriaId: filtro.categoriaId });
        }
        if (filtro.ativo !== undefined) {
            consulta.andWhere("produto.ativo = :ativo", { ativo: filtro.ativo });
        }

        return (await consulta.getMany()).map(paraDetalhado);
    }

    async buscarPorId(id: number): Promise<ProdutoDetalhado | null> {
        const modelo = await this.consultaBase().where("produto.id = :id", { id }).getOne();
        return modelo ? paraDetalhado(modelo) : null;
    }

    private consultaBase() {
        return this.dataSource
            .getRepository(ProdutoModelo)
            .createQueryBuilder("produto")
            .innerJoinAndSelect("produto.categoria", "categoria");
    }
}

function paraDetalhado(modelo: ProdutoModelo): ProdutoDetalhado {
    return {
        id: modelo.id,
        nome: modelo.nome,
        descricao: modelo.descricao,
        preco: modelo.preco,
        ativo: modelo.ativo,
        categoria: { id: modelo.categoria.id, nome: modelo.categoria.nome },
    };
}
