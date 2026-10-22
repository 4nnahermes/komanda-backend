import { Categoria } from "../../dominio/categorias/categoria";
import { RecursoNaoEncontrado, ConflitoDeDados, ErroDeValidacao } from "../../dominio/compartilhado/erros";
import { RepositorioCategorias } from "../../dominio/categorias/repositorio-categorias";
import { MENSAGENS_CATEGORIAS } from "./mensagens";

export class AtualizarCategoria {
    constructor(private readonly repositorio: RepositorioCategorias) {}
    async executar(id: number, dados: { nome?: unknown; ativo?: unknown }) {
        if (dados.nome === undefined && dados.ativo === undefined) {
            throw new ErroDeValidacao("Informe ao menos um campo para alterar");
        }
        const existente = await this.repositorio.buscarPorId(id);
        if (!existente) throw new RecursoNaoEncontrado(MENSAGENS_CATEGORIAS.categoriaNaoEncontrada);
        const alteracoes: { nome?: string; ativo?: boolean } = {};
        if (dados.nome !== undefined) {
            const nome = existente.renomear(dados.nome).nome;
            if (await this.repositorio.nomeExiste(nome, id)) {
                throw new ConflitoDeDados(MENSAGENS_CATEGORIAS.nomeRepetido);
            }
            alteracoes.nome = nome;
        }
        if (dados.ativo !== undefined) alteracoes.ativo = existente.comStatus(dados.ativo).ativo;
        try {
            const atualizado = await this.repositorio.atualizar(id, alteracoes);
            if (!atualizado) throw new RecursoNaoEncontrado(MENSAGENS_CATEGORIAS.categoriaNaoEncontrada);
            return atualizado;
        } catch (erro) {
            if (erro instanceof ConflitoDeDados) throw new ConflitoDeDados(MENSAGENS_CATEGORIAS.nomeRepetido);
            throw erro;
        }
    }
}
