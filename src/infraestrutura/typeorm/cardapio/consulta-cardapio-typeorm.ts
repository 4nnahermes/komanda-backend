import { DataSource } from "typeorm";
import { ConsultaCardapio, ItemAtivoDoCardapio } from "../../../aplicacao/cardapio/cardapio/consulta-cardapio";
import { Produto as ProdutoModelo } from "../../../entity/produto";

export class ConsultaCardapioTypeorm implements ConsultaCardapio {
    constructor(private readonly dataSource: DataSource) {}

    async listarItensAtivos(): Promise<ItemAtivoDoCardapio[]> {
        const produtos = await this.dataSource
            .getRepository(ProdutoModelo)
            .createQueryBuilder("produto")
            .innerJoinAndSelect("produto.categoria", "categoria")
            .where("produto.ativo = true")
            .andWhere("categoria.ativo = true")
            .getMany();

        return produtos.map((produto) => ({
            categoria: { id: produto.categoria.id, nome: produto.categoria.nome, ordem: produto.categoria.ordem },
            produto: { id: produto.id, nome: produto.nome, descricao: produto.descricao, preco: produto.preco },
        }));
    }
}
