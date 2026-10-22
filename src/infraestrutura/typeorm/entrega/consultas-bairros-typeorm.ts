import { DataSource } from "typeorm";
import { BairroApi, ConsultaBairros } from "../../../dominio/entrega/repositorio-bairros";
import { Bairro as BairroModelo } from "../../../entity/bairro";

export class ConsultasBairrosTypeorm implements ConsultaBairros {
    constructor(private readonly dataSource: DataSource) {}

    async listar(ativo?: boolean): Promise<BairroApi[]> {
        const query = this.dataSource.getRepository(BairroModelo).createQueryBuilder("bairro");
        if (ativo !== undefined) query.where("bairro.ativo = :ativo", { ativo });
        const bairros = await query.orderBy("bairro.nome", "ASC").addOrderBy("bairro.id", "ASC").getMany();
        return bairros.map(paraApi);
    }

    async buscarPorId(id: number): Promise<BairroApi | null> {
        const bairro = await this.dataSource.getRepository(BairroModelo).findOneBy({ id });
        return bairro ? paraApi(bairro) : null;
    }
}

function paraApi(bairro: BairroModelo): BairroApi {
    return { id: bairro.id, nome: bairro.nome, taxaEntrega: bairro.taxaEntrega, ativo: bairro.ativo };
}
