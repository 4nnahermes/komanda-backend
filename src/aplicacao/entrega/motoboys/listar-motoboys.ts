import { ConsultaMotoboys, FiltroMotoboys } from "../../../dominio/entrega/repositorio-motoboys";
import { MotoboyDto, paraMotoboyDto } from "./motoboy-dto";

export class ListarMotoboys {
    constructor(private readonly consulta: ConsultaMotoboys) {}
    async executar(filtro: FiltroMotoboys): Promise<MotoboyDto[]> { return (await this.consulta.listar(filtro)).map(paraMotoboyDto); }
}
