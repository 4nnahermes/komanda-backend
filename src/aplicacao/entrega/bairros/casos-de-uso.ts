import { Bairro, NovoBairro } from "../../../dominio/entrega/bairro";
import { BairroApi, ConsultaBairros, RepositorioBairros } from "../../../dominio/entrega/repositorio-bairros";
import { ConflitoDeDados, ErroDeValidacao, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { MENSAGENS_BAIRROS } from "./mensagens";

export interface AlteracoesBairro {
    nome?: string;
    taxaEntrega?: number;
    ativo?: boolean;
}

export class ListarBairros {
    constructor(private readonly consulta: ConsultaBairros) {}
    executar(ativo?: boolean): Promise<BairroApi[]> { return this.consulta.listar(ativo); }
}

export class BuscarBairro {
    constructor(private readonly consulta: ConsultaBairros) {}
    async executar(id: number): Promise<BairroApi> {
        const bairro = await this.consulta.buscarPorId(id);
        if (!bairro) throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
        return bairro;
    }
}

export class CriarBairro {
    constructor(private readonly repositorio: RepositorioBairros, private readonly consulta: ConsultaBairros) {}
    async executar(dados: NovoBairro): Promise<BairroApi> {
        const bairro = Bairro.criar(dados);
        await garantirNomeLivre(this.repositorio, bairro.nome);
        const id = await this.repositorio.salvar(bairro);
        return new BuscarBairro(this.consulta).executar(id);
    }
}

export class AtualizarBairro {
    constructor(private readonly repositorio: RepositorioBairros, private readonly consulta: ConsultaBairros) {}
    async executar(id: number, dados: AlteracoesBairro): Promise<BairroApi> {
        if (Object.values(dados).every((valor) => valor === undefined)) throw new ErroDeValidacao(MENSAGENS_BAIRROS.nadaParaAlterar);
        const bairro = await this.repositorio.buscarPorId(id);
        if (!bairro) throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
        if (dados.nome !== undefined) bairro.renomear(dados.nome);
        if (dados.taxaEntrega !== undefined) bairro.alterarTaxa(dados.taxaEntrega);
        if (dados.ativo !== undefined) bairro.definirAtivo(dados.ativo);
        if (dados.nome !== undefined) await garantirNomeLivre(this.repositorio, bairro.nome, id);
        await this.repositorio.salvar(bairro, Object.keys(dados) as Array<"nome" | "taxaEntrega" | "ativo">);
        return new BuscarBairro(this.consulta).executar(id);
    }
}

export class ExcluirBairro {
    constructor(private readonly repositorio: RepositorioBairros) {}
    async executar(id: number): Promise<void> {
        if (!(await this.repositorio.buscarPorId(id))) throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
        await this.repositorio.excluir(id);
    }
}

async function garantirNomeLivre(repositorio: RepositorioBairros, nome: string, ignorarId?: number): Promise<void> {
    if (await repositorio.existeComNome(nome, ignorarId)) throw new ConflitoDeDados(MENSAGENS_BAIRROS.nomeRepetido);
}
