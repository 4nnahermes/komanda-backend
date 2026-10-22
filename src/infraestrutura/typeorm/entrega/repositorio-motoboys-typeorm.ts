import { DataSource, Repository } from "typeorm";
import { Motoboy as MotoboyDominio } from "../../../dominio/entrega/motoboy";
import { RepositorioMotoboys } from "../../../dominio/entrega/repositorio-motoboys";
import { Motoboy as MotoboyEntity } from "../../../entity/motoboy";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { ConflitoDeDados } from "../../../dominio/compartilhado/erros";
import { ehViolacaoDeChaveEstrangeira, ehViolacaoDeUnicidade } from "../erros-postgres";

export class RepositorioMotoboysTypeorm implements RepositorioMotoboys {
    private readonly repositorio: Repository<MotoboyEntity>;
    constructor(dataSource: DataSource) { this.repositorio = dataSource.getRepository(MotoboyEntity); }
    async buscarPorId(id: number): Promise<MotoboyDominio | null> {
        const entity = await this.repositorio.findOneBy({ id });
        return entity ? mapear(entity) : null;
    }
    async existePorNome(nome: string, ignorarId?: number): Promise<boolean> {
        const query = this.repositorio.createQueryBuilder("motoboy").where("lower(motoboy.nome) = lower(:nome)", { nome });
        if (ignorarId !== undefined) query.andWhere("motoboy.id <> :ignorarId", { ignorarId });
        return query.getExists();
    }
    async salvar(motoboy: MotoboyDominio): Promise<number> {
        const entity = this.repositorio.create({ id: motoboy.id ?? undefined, nome: motoboy.nome, telefone: motoboy.telefone, valorFixoNoite: motoboy.valorFixoNoite.emReais, ativo: motoboy.ativo });
        try { return (await this.repositorio.save(entity)).id; }
        catch (erro) { if (ehViolacaoDeUnicidade(erro)) throw new ConflitoDeDados("Já existe um motoboy com esse nome"); throw erro; }
    }
    async atualizar(id: number, campos: Partial<{ nome: string; telefone: string | null; valorFixoNoite: number; ativo: boolean }>): Promise<boolean> {
        const atualizacao: Partial<MotoboyEntity> = {};
        if (campos.nome !== undefined) atualizacao.nome = campos.nome;
        if (campos.telefone !== undefined) atualizacao.telefone = campos.telefone;
        if (campos.valorFixoNoite !== undefined) atualizacao.valorFixoNoite = campos.valorFixoNoite;
        if (campos.ativo !== undefined) atualizacao.ativo = campos.ativo;
        try {
            const resultado = await this.repositorio.update(id, atualizacao);
            return (resultado.affected ?? 0) > 0;
        } catch (erro) { if (ehViolacaoDeUnicidade(erro)) throw new ConflitoDeDados("Já existe um motoboy com esse nome"); throw erro; }
    }
    async excluir(id: number): Promise<void> {
        try { await this.repositorio.delete(id); }
        catch (erro) { if (ehViolacaoDeChaveEstrangeira(erro)) throw new ConflitoDeDados("Não é possível excluir um motoboy em uso. Desative o motoboy"); throw erro; }
    }
}

export class ConsultaMotoboysTypeorm {
    private readonly repositorio: Repository<MotoboyEntity>;
    constructor(dataSource: DataSource) { this.repositorio = dataSource.getRepository(MotoboyEntity); }
    async listar(filtro: { ativo?: boolean }): Promise<MotoboyDominio[]> {
        const query = this.repositorio.createQueryBuilder("motoboy").orderBy("motoboy.nome", "ASC").addOrderBy("motoboy.id", "ASC");
        if (filtro.ativo !== undefined) query.andWhere("motoboy.ativo = :ativo", { ativo: filtro.ativo });
        return (await query.getMany()).map(mapear);
    }
    async buscarPorId(id: number): Promise<MotoboyDominio | null> {
        const entity = await this.repositorio.findOneBy({ id });
        return entity ? mapear(entity) : null;
    }
}

function mapear(entity: MotoboyEntity): MotoboyDominio {
    return MotoboyDominio.restaurar({ id: entity.id, nome: entity.nome, telefone: entity.telefone, valorFixoNoite: Dinheiro.deReais(entity.valorFixoNoite), ativo: entity.ativo });
}
