import { DataSource, EntityManager } from "typeorm";
import { Categoria } from "../entity/categoria";
import { Produto } from "../entity/produto";
import { ErroApi } from "../utils/erro-api";

const TAMANHO_MAXIMO_NOME = 60;

// Regras da US01 (Requisito 1), conforme docs/api-contrato.md, seção 2.
export class CategoriaService {
    constructor(private dataSource: DataSource) {}

    private get repository() {
        return this.dataSource.getRepository(Categoria);
    }

    async listar(ativo?: boolean): Promise<Categoria[]> {
        return this.repository.find({
            where: ativo === undefined ? {} : { ativo },
            order: { ordem: "ASC" },
        });
    }

    async buscarPorId(id: number): Promise<Categoria> {
        const categoria = await this.repository.findOneBy({ id });
        if (!categoria) {
            throw new ErroApi(404, "Categoria não encontrada");
        }
        return categoria;
    }

    async inserir(dados: { nome?: unknown; ordem?: unknown }): Promise<Categoria> {
        const nome = this.validarNome(dados.nome);
        await this.verificarNomeRepetido(nome);

        if (dados.ordem !== undefined && !this.ehInteiroPositivo(dados.ordem)) {
            throw new ErroApi(400, "A ordem deve ser um número inteiro maior que zero");
        }

        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(Categoria);
            const total = await repo.count();
            const ultimaPosicao = total + 1;

            // Sem ordem (ou ordem além do fim): entra no fim da lista.
            let ordem = dados.ordem === undefined ? ultimaPosicao : Number(dados.ordem);
            if (ordem > ultimaPosicao) ordem = ultimaPosicao;

            // As categorias a partir dessa posição descem uma posição.
            await repo
                .createQueryBuilder()
                .update(Categoria)
                .set({ ordem: () => "ordem + 1" })
                .where("ordem >= :ordem", { ordem })
                .execute();

            return repo.save(repo.create({ nome, ordem, ativo: true }));
        });
    }

    async atualizar(id: number, dados: { nome?: unknown; ativo?: unknown }): Promise<Categoria> {
        const categoria = await this.buscarPorId(id);

        if (dados.nome === undefined && dados.ativo === undefined) {
            throw new ErroApi(400, "Informe ao menos um campo para alterar");
        }

        if (dados.nome !== undefined) {
            const nome = this.validarNome(dados.nome);
            await this.verificarNomeRepetido(nome, id);
            categoria.nome = nome;
        }

        if (dados.ativo !== undefined) {
            if (typeof dados.ativo !== "boolean") {
                throw new ErroApi(400, "O campo ativo deve ser true ou false");
            }
            categoria.ativo = dados.ativo;
        }

        return this.repository.save(categoria);
    }

    async excluir(id: number): Promise<void> {
        const categoria = await this.buscarPorId(id);

        const quantidadeProdutos = await this.dataSource
            .getRepository(Produto)
            .count({ where: { categoria: { id } } });

        if (quantidadeProdutos > 0) {
            throw new ErroApi(
                409,
                "Não é possível excluir uma categoria com produtos. Exclua ou mova os produtos, ou desative a categoria"
            );
        }

        await this.dataSource.transaction(async (manager) => {
            await manager.getRepository(Categoria).delete({ id });
            // As categorias seguintes sobem uma posição.
            await this.fecharLacuna(manager, categoria.ordem);
        });
    }

    async reordenar(ids: unknown): Promise<Categoria[]> {
        if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => this.ehInteiroPositivo(id))) {
            throw new ErroApi(400, "Informe a lista de ids na nova ordem");
        }

        const idsNumericos = ids.map(Number);
        const existentes = await this.repository.find({ select: { id: true } });
        const idsExistentes = new Set(existentes.map((c) => c.id));
        const semRepetir = new Set(idsNumericos);

        const listaCompleta =
            semRepetir.size === idsNumericos.length &&
            idsNumericos.length === idsExistentes.size &&
            idsNumericos.every((id) => idsExistentes.has(id));

        if (!listaCompleta) {
            throw new ErroApi(400, "A lista deve conter todas as categorias, sem repetir");
        }

        await this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(Categoria);
            for (let i = 0; i < idsNumericos.length; i++) {
                await repo.update({ id: idsNumericos[i] }, { ordem: i + 1 });
            }
        });

        return this.listar();
    }

    private validarNome(valor: unknown): string {
        const nome = typeof valor === "string" ? valor.trim() : "";
        if (!nome) {
            throw new ErroApi(400, "O nome da categoria é obrigatório");
        }
        if (nome.length > TAMANHO_MAXIMO_NOME) {
            throw new ErroApi(400, `O nome da categoria deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres`);
        }
        return nome;
    }

    // Compara sem diferenciar maiúsculas: "xis" e "Xis" são o mesmo nome.
    private async verificarNomeRepetido(nome: string, ignorarId?: number) {
        const consulta = this.repository
            .createQueryBuilder("categoria")
            .where("LOWER(categoria.nome) = LOWER(:nome)", { nome });

        if (ignorarId !== undefined) {
            consulta.andWhere("categoria.id != :ignorarId", { ignorarId });
        }

        if (await consulta.getExists()) {
            throw new ErroApi(409, "Já existe uma categoria com esse nome");
        }
    }

    private async fecharLacuna(manager: EntityManager, ordemRemovida: number) {
        await manager
            .createQueryBuilder()
            .update(Categoria)
            .set({ ordem: () => "ordem - 1" })
            .where("ordem > :ordem", { ordem: ordemRemovida })
            .execute();
    }

    private ehInteiroPositivo(valor: unknown): boolean {
        return typeof valor === "number" && Number.isInteger(valor) && valor > 0;
    }
}
