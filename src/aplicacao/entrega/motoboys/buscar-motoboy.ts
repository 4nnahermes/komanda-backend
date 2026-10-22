import { ConsultaMotoboys } from "../../../dominio/entrega/repositorio-motoboys";
import { RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { MENSAGENS } from "./mensagens";
import { MotoboyDto, paraMotoboyDto } from "./motoboy-dto";

export class BuscarMotoboy {
    constructor(private readonly consulta: ConsultaMotoboys) {}
    async executar(id: number): Promise<MotoboyDto> {
        const motoboy = await this.consulta.buscarPorId(id);
        if (!motoboy) throw new RecursoNaoEncontrado(MENSAGENS.motoboyNaoEncontrado);
        return paraMotoboyDto(motoboy);
    }
}
