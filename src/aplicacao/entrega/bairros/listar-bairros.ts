import { BairroApi, ConsultaBairros } from "../../../dominio/entrega/repositorio-bairros";

export class ListarBairros {
    constructor(private readonly consulta: ConsultaBairros) {}

    executar(ativo?: boolean): Promise<BairroApi[]> {
        return this.consulta.listar(ativo);
    }
}
