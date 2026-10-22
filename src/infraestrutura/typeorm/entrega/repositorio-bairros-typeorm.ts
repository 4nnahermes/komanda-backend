import { DataSource } from "typeorm";
import { MENSAGENS_BAIRROS } from "../../../aplicacao/entrega/bairros/mensagens";
import { Bairro } from "../../../dominio/entrega/bairro";
import { ConflitoDeDados, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { RepositorioBairros } from "../../../dominio/entrega/repositorio-bairros";
import { Bairro as BairroModelo } from "../../../entity/bairro";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { ehViolacaoDeChaveEstrangeira, ehViolacaoDeUnicidade } from "../erros-postgres";

export class RepositorioBairrosTypeorm implements RepositorioBairros {
    constructor(private readonly dataSource: DataSource) {}

    private get modelos() { return this.dataSource.getRepository(BairroModelo); }

    async buscarPorId(id: number): Promise<Bairro | null> {
        const modelo = await this.modelos.findOneBy({ id });
        return modelo ? paraDominio(modelo) : null;
    }

    async existeComNome(nome: string, ignorarId?: number): Promise<boolean> {
        const query = this.modelos.createQueryBuilder("bairro").where("LOWER(bairro.nome) = LOWER(:nome)", { nome });
        if (ignorarId !== undefined) query.andWhere("bairro.id != :ignorarId", { ignorarId });
        return query.getExists();
    }

    async salvar(bairro: Bairro, camposAlterados?: Array<"nome" | "taxaEntrega" | "ativo">): Promise<number> {
        try {
            if (bairro.id !== null) {
                const valores: Partial<BairroModelo> = {};
                if (camposAlterados?.includes("nome")) valores.nome = bairro.nome;
                if (camposAlterados?.includes("taxaEntrega")) valores.taxaEntrega = bairro.taxaEntrega.emReais;
                if (camposAlterados?.includes("ativo")) valores.ativo = bairro.ativo;
                const resultado = await this.modelos.update({ id: bairro.id }, valores);
                if (resultado.affected === 0) throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
                return bairro.id;
            }
            const modelo = this.modelos.create();
            modelo.nome = bairro.nome;
            modelo.taxaEntrega = bairro.taxaEntrega.emReais;
            modelo.ativo = bairro.ativo;
            return (await this.modelos.save(modelo)).id;
        } catch (erro) {
            if (ehViolacaoDeUnicidade(erro)) throw new ConflitoDeDados(MENSAGENS_BAIRROS.nomeRepetido);
            throw erro;
        }
    }

    async excluir(id: number): Promise<void> {
        try {
            const resultado = await this.modelos.delete({ id });
            if (resultado.affected === 0) throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
        } catch (erro) {
            if (ehViolacaoDeChaveEstrangeira(erro)) throw new ConflitoDeDados(MENSAGENS_BAIRROS.emUso);
            throw erro;
        }
    }
}

function paraDominio(modelo: BairroModelo): Bairro {
    return Bairro.restaurar({
        id: modelo.id,
        nome: modelo.nome,
        taxaEntrega: Dinheiro.deCentavos(Math.round(modelo.taxaEntrega * 100)),
        ativo: modelo.ativo,
    });
}
