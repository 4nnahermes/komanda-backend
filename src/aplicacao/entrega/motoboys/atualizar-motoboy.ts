import { RepositorioMotoboys, ConsultaMotoboys } from "../../../dominio/entrega/repositorio-motoboys";
import { ConflitoDeDados, ErroDeValidacao, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { BuscarMotoboy } from "./buscar-motoboy";
import { MENSAGENS } from "./mensagens";
import { MotoboyDto } from "./motoboy-dto";

export interface AlteracoesMotoboy { nome?: string; telefone?: string | null; valorFixoNoite?: number; ativo?: boolean; }
export class AtualizarMotoboy {
    private readonly buscar: BuscarMotoboy;
    constructor(private readonly repositorio: RepositorioMotoboys, consulta: ConsultaMotoboys) { this.buscar = new BuscarMotoboy(consulta); }
    async executar(id: number, alteracoes: AlteracoesMotoboy): Promise<MotoboyDto> {
        if (Object.values(alteracoes).every((v) => v === undefined)) throw new ErroDeValidacao(MENSAGENS.nadaParaAlterar);
        const motoboy = await this.repositorio.buscarPorId(id);
        if (!motoboy) throw new RecursoNaoEncontrado(MENSAGENS.motoboyNaoEncontrado);
        if (alteracoes.nome !== undefined) motoboy.renomear(alteracoes.nome);
        if (alteracoes.telefone !== undefined) motoboy.alterarTelefone(alteracoes.telefone);
        if (alteracoes.valorFixoNoite !== undefined) motoboy.alterarValorFixoNoite(alteracoes.valorFixoNoite);
        if (alteracoes.ativo !== undefined) motoboy.definirAtivo(alteracoes.ativo);
        if (alteracoes.nome !== undefined && await this.repositorio.existePorNome(motoboy.nome, id)) throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
        const campos: { nome?: string; telefone?: string | null; valorFixoNoite?: number; ativo?: boolean } = {};
        if (alteracoes.nome !== undefined) campos.nome = motoboy.nome;
        if (alteracoes.telefone !== undefined) campos.telefone = motoboy.telefone;
        if (alteracoes.valorFixoNoite !== undefined) campos.valorFixoNoite = motoboy.valorFixoNoite.emReais;
        if (alteracoes.ativo !== undefined) campos.ativo = motoboy.ativo;
        if (!(await this.repositorio.atualizar(id, campos))) throw new RecursoNaoEncontrado(MENSAGENS.motoboyNaoEncontrado);
        return this.buscar.executar(id);
    }
}
