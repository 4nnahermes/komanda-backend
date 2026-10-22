import { Motoboy, NovoMotoboy } from "../../../dominio/entrega/motoboy";
import { RepositorioMotoboys } from "../../../dominio/entrega/repositorio-motoboys";
import { ConflitoDeDados } from "../../../dominio/compartilhado/erros";
import { MENSAGENS } from "./mensagens";
import { MotoboyDto } from "./motoboy-dto";

export class CriarMotoboy {
    constructor(private readonly repositorio: RepositorioMotoboys) {}
    async executar(dados: NovoMotoboy): Promise<MotoboyDto> {
        const motoboy = Motoboy.criar(dados);
        if (await this.repositorio.existePorNome(motoboy.nome)) throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
        const id = await this.repositorio.salvar(motoboy);
        return { id, nome: motoboy.nome, telefone: motoboy.telefone, valorFixoNoite: motoboy.valorFixoNoite.emReais, ativo: motoboy.ativo };
    }
}
