import { BairroApi, ConsultaBairros, RepositorioBairros } from "../../../dominio/entrega/repositorio-bairros";
import { ConflitoDeDados, ErroDeValidacao, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { BuscarBairro } from "./buscar-bairro";
import { MENSAGENS_BAIRROS } from "./mensagens";

export interface AlteracoesBairro {
    nome?: string;
    taxaEntrega?: number;
    ativo?: boolean;
}

export class AtualizarBairro {
    constructor(
        private readonly repositorio: RepositorioBairros,
        private readonly consulta: ConsultaBairros,
    ) {}

    async executar(id: number, dados: AlteracoesBairro): Promise<BairroApi> {
        if (Object.values(dados).every((valor) => valor === undefined)) {
            throw new ErroDeValidacao(MENSAGENS_BAIRROS.nadaParaAlterar);
        }

        const bairro = await this.repositorio.buscarPorId(id);
        if (!bairro) {
            throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
        }

        if (dados.nome !== undefined) bairro.renomear(dados.nome);
        if (dados.taxaEntrega !== undefined) bairro.alterarTaxa(dados.taxaEntrega);
        if (dados.ativo !== undefined) bairro.definirAtivo(dados.ativo);

        if (dados.nome !== undefined && await this.repositorio.existeComNome(bairro.nome, id)) {
            throw new ConflitoDeDados(MENSAGENS_BAIRROS.nomeRepetido);
        }

        const camposAlterados = Object.keys(dados) as Array<"nome" | "taxaEntrega" | "ativo">;
        await this.repositorio.salvar(bairro, camposAlterados);
        return new BuscarBairro(this.consulta).executar(id);
    }
}
