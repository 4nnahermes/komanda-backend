import { BairroApi, ConsultaBairros } from "../../../dominio/entrega/repositorio-bairros";
import { RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { MENSAGENS_BAIRROS } from "./mensagens";

export class BuscarBairro {
    constructor(private readonly consulta: ConsultaBairros) {}

    async executar(id: number): Promise<BairroApi> {
        const bairro = await this.consulta.buscarPorId(id);
        if (!bairro) {
            throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
        }
        return bairro;
    }
}
