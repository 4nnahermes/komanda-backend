import { RepositorioBairros } from "../../../dominio/entrega/repositorio-bairros";
import { RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { MENSAGENS_BAIRROS } from "./mensagens";

export class ExcluirBairro {
    constructor(private readonly repositorio: RepositorioBairros) {}

    async executar(id: number): Promise<void> {
        if (!(await this.repositorio.buscarPorId(id))) {
            throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
        }
        await this.repositorio.excluir(id);
    }
}
