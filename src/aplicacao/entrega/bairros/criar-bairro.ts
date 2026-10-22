import { Bairro, NovoBairro } from "../../../dominio/entrega/bairro";
import { BairroApi, ConsultaBairros, RepositorioBairros } from "../../../dominio/entrega/repositorio-bairros";
import { ConflitoDeDados } from "../../../dominio/compartilhado/erros";
import { BuscarBairro } from "./buscar-bairro";
import { MENSAGENS_BAIRROS } from "./mensagens";

export class CriarBairro {
    constructor(
        private readonly repositorio: RepositorioBairros,
        private readonly consulta: ConsultaBairros,
    ) {}

    async executar(dados: NovoBairro): Promise<BairroApi> {
        const bairro = Bairro.criar(dados);
        if (await this.repositorio.existeComNome(bairro.nome)) {
            throw new ConflitoDeDados(MENSAGENS_BAIRROS.nomeRepetido);
        }
        const id = await this.repositorio.salvar(bairro);
        return new BuscarBairro(this.consulta).executar(id);
    }
}
