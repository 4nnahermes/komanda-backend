import { RepositorioMotoboys } from "../../../dominio/entrega/repositorio-motoboys";
import { RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { MENSAGENS } from "./mensagens";

export class ExcluirMotoboy {
    constructor(private readonly repositorio: RepositorioMotoboys) {}
    async executar(id: number): Promise<void> {
        if (!(await this.repositorio.buscarPorId(id))) throw new RecursoNaoEncontrado(MENSAGENS.motoboyNaoEncontrado);
        await this.repositorio.excluir(id);
    }
}
