import { DataSource, EntityManager, Repository } from "typeorm";
import { Categoria } from "../../../dominio/categorias/categoria";
import { ConflitoDeDados } from "../../../dominio/compartilhado/erros";
import { RepositorioCategorias } from "../../../dominio/categorias/repositorio-categorias";
import { Categoria as CategoriaModelo } from "../../../entity/categoria";
import { Produto } from "../../../entity/produto";
import { ehViolacaoDeChaveEstrangeira, ehViolacaoDeUnicidade } from "../erros-postgres";

const MENSAGEM_NOME_REPETIDO = "Já existe uma categoria com esse nome";
const MENSAGEM_CATEGORIA_EM_USO =
    "Não é possível excluir uma categoria com produtos. Exclua ou mova os produtos, ou desative a categoria";

export class RepositorioCategoriasTypeorm implements RepositorioCategorias {
    constructor(private readonly dataSource: DataSource) {}

    private get modelos(): Repository<CategoriaModelo> {
        return this.dataSource.getRepository(CategoriaModelo);
    }

    async listar(ativo?: boolean): Promise<Categoria[]> {
        const modelos = await this.modelos.find({
            where: ativo === undefined ? {} : { ativo },
            order: { ordem: "ASC", id: "ASC" },
        });
        return modelos.map(paraDominio);
    }

    async buscarPorId(id: number): Promise<Categoria | null> {
        const modelo = await this.modelos.findOneBy({ id });
        return modelo ? paraDominio(modelo) : null;
    }

    async nomeExiste(nome: string, ignorarId?: number): Promise<boolean> {
        const consulta = this.modelos.createQueryBuilder("categoria")
            .where("LOWER(categoria.nome) = LOWER(:nome)", { nome });
        if (ignorarId !== undefined) consulta.andWhere("categoria.id != :ignorarId", { ignorarId });
        return consulta.getExists();
    }

    async atualizar(id: number, alteracoes: { nome?: string; ativo?: boolean }): Promise<Categoria | null> {
        try {
            return await this.dataSource.transaction(async (manager) => {
                await travarColecao(manager);
                const repo = manager.getRepository(CategoriaModelo);
                const resultado = await repo.update({ id }, alteracoes);
                if (!resultado.affected) return null;
                const atualizado = await repo.findOneBy({ id });
                return atualizado ? paraDominio(atualizado) : null;
            });
        } catch (erro) {
            if (ehViolacaoDeUnicidade(erro)) throw new ConflitoDeDados(MENSAGEM_NOME_REPETIDO);
            throw erro;
        }
    }

    async criarOrdenada(categoria: Categoria, ordemSolicitada?: number): Promise<Categoria> {
        try {
            return await this.dataSource.transaction(async (manager) => {
                await travarColecao(manager);
                const repositorio = manager.getRepository(CategoriaModelo);
                const ultimaPosicao = (await repositorio.count()) + 1;
                const ordem = ordemSolicitada === undefined ? ultimaPosicao : Math.min(ordemSolicitada, ultimaPosicao);
                await repositorio.createQueryBuilder()
                    .update(CategoriaModelo)
                    .set({ ordem: () => "ordem + 1" })
                    .where("ordem >= :ordem", { ordem })
                    .execute();
                const salvo = await repositorio.save(repositorio.create({ nome: categoria.nome, ordem, ativo: true }));
                return paraDominio(salvo);
            });
        } catch (erro) {
            if (ehViolacaoDeUnicidade(erro)) throw new ConflitoDeDados(MENSAGEM_NOME_REPETIDO);
            throw erro;
        }
    }

    async excluirOrdenada(id: number): Promise<"nao-encontrada" | "em-uso" | "excluida"> {
        try {
            return await this.dataSource.transaction(async (manager) => {
                await travarColecao(manager);
                const repo = manager.getRepository(CategoriaModelo);
                const categoria = await repo.findOneBy({ id });
                if (!categoria) return "nao-encontrada";
                const quantidadeProdutos = await manager.getRepository(Produto).count({ where: { categoria: { id } } });
                if (quantidadeProdutos > 0) return "em-uso";
                await repo.delete({ id });
                await fecharLacuna(manager, categoria.ordem);
                return "excluida";
            });
        } catch (erro) {
            // Mantém o 409 mesmo se um produto for ligado à categoria entre a consulta e o DELETE.
            if (ehViolacaoDeChaveEstrangeira(erro)) throw new ConflitoDeDados(MENSAGEM_CATEGORIA_EM_USO);
            throw erro;
        }
    }

    async reordenarCompleto(ids: number[]): Promise<Categoria[] | null> {
        return this.dataSource.transaction(async (manager) => {
            await travarColecao(manager);
            const repo = manager.getRepository(CategoriaModelo);
            const existentes = await repo.find({ select: { id: true } });
            const conjunto = new Set(existentes.map((categoria) => categoria.id));
            if (new Set(ids).size !== ids.length || ids.length !== conjunto.size || !ids.every((id) => conjunto.has(id))) {
                return null;
            }
            for (let indice = 0; indice < ids.length; indice++) {
                await repo.update({ id: ids[indice] }, { ordem: indice + 1 });
            }
            return (await repo.find({ order: { ordem: "ASC", id: "ASC" } })).map(paraDominio);
        });
    }
}

async function travarColecao(manager: EntityManager): Promise<void> {
    // Chave fixa compartilhada por todos os processos que modificam a ordem.
    await manager.query("SELECT pg_advisory_xact_lock($1, $2)", [481516, 2342]);
}

async function fecharLacuna(manager: EntityManager, ordemRemovida: number): Promise<void> {
    await manager.createQueryBuilder()
        .update(CategoriaModelo)
        .set({ ordem: () => "ordem - 1" })
        .where("ordem > :ordem", { ordem: ordemRemovida })
        .execute();
}

function paraDominio(modelo: CategoriaModelo): Categoria {
    return Categoria.restaurar({ id: modelo.id, nome: modelo.nome, ordem: modelo.ordem, ativo: modelo.ativo });
}

