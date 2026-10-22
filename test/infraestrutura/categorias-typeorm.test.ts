import "reflect-metadata";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Categoria } from "../../src/dominio/categorias/categoria";
import { RepositorioCategoriasTypeorm } from "../../src/infraestrutura/typeorm/categorias/repositorio-categorias-typeorm";
import { Categoria as CategoriaModelo } from "../../src/entity/categoria";
import { Produto } from "../../src/entity/produto";
import { UnicidadeCategorias1792620002000 } from "../../src/migrations/1792620002000-UnicidadeCategorias";

const url = process.env.CATEGORIAS_TEST_DATABASE_URL;
const describePostgres = url ? describe : describe.skip;

describePostgres("repositório TypeORM de categorias (PostgreSQL descartável)", () => {
    const schema = `categorias_agent_${process.pid}`;
    let admin: DataSource;
    let dataSource: DataSource;
    let repositorio: RepositorioCategoriasTypeorm;

    beforeAll(async () => {
        const endereco = new URL(url!);
        const banco = decodeURIComponent(endereco.pathname.slice(1));
        if (!new Set(["localhost", "127.0.0.1", "::1"]).has(endereco.hostname)) {
            throw new Error("CATEGORIAS_TEST_DATABASE_URL deve apontar para PostgreSQL local descartável");
        }
        if (banco !== "komanda_review" && !banco.startsWith("komanda_test")) {
            throw new Error("CATEGORIAS_TEST_DATABASE_URL deve usar o banco komanda_review ou komanda_test*");
        }

        admin = new DataSource({ type: "postgres", url, synchronize: false, entities: [] });
        await admin.initialize();
        await admin.query(`CREATE SCHEMA "${schema}"`);
        dataSource = new DataSource({
            type: "postgres", url, schema, synchronize: true, dropSchema: false,
            entities: [CategoriaModelo, Produto], logging: false,
            extra: { options: `-c search_path=${schema}` },
        });
        await dataSource.initialize();
        const migracao = new UnicidadeCategorias1792620002000();
        const queryRunner = dataSource.createQueryRunner();
        try {
            await migracao.up(queryRunner);
        } finally {
            await queryRunner.release();
        }
        repositorio = new RepositorioCategoriasTypeorm(dataSource);
    }, 30000);

    afterAll(async () => {
        if (dataSource?.isInitialized) await dataSource.destroy();
        if (admin?.isInitialized) {
            await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
            await admin.destroy();
        }
    }, 30000);

    it("serializa criação e reordenação, mantém PATCH parcial e protege unicidade no índice", async () => {
        const xis = await repositorio.criarOrdenada(Categoria.criar("Xis"));
        const bebidas = await repositorio.criarOrdenada(Categoria.criar("Bebidas"));
        const [criada] = await Promise.all([
            repositorio.criarOrdenada(Categoria.criar("Bauru"), 2),
            repositorio.reordenarCompleto([bebidas.id!, xis.id!]),
        ]);
        expect(criada).toBeDefined();
        const [atualizada] = await Promise.all([
            repositorio.atualizar(bebidas.id!, { ativo: false }),
            repositorio.reordenarCompleto([xis.id!, bebidas.id!, criada.id!]),
        ]);
        expect(atualizada).toMatchObject({ id: bebidas.id, ativo: false });
        const lista = await repositorio.listar();
        expect(lista.map((categoria) => categoria.ordem)).toEqual([1, 2, 3]);
        expect(new Set(lista.map((categoria) => categoria.ordem)).size).toBe(3);
        const concorrentes = await Promise.allSettled([
            repositorio.criarOrdenada(Categoria.criar("Kebab")),
            repositorio.criarOrdenada(Categoria.criar("kebab")),
        ]);
        expect(concorrentes.filter((resultado) => resultado.status === "fulfilled")).toHaveLength(1);
        const conflito = concorrentes.find((resultado) => resultado.status === "rejected");
        expect(conflito?.status === "rejected" && conflito.reason.message).toBe("Já existe uma categoria com esse nome");
    });

    it("recusa a migration quando os dados legados já têm nomes duplicados", async () => {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.query(`DROP INDEX "${schema}"."uq_categoria_nome_lower"`);
            await queryRunner.query(`CREATE UNIQUE INDEX "uq_categoria_nome_case_sensitive_legacy" ON "${schema}"."categoria" ("nome")`);
            await queryRunner.query(`INSERT INTO "${schema}"."categoria" (nome, ordem, ativo) VALUES ('Legado', 1, true), ('legado', 2, true)`);
            await expect(new UnicidadeCategorias1792620002000().up(queryRunner)).rejects.toThrow(/nomes duplicados legados.*Legado, legado/);
            await queryRunner.query(`DELETE FROM "${schema}"."categoria"`);
            await queryRunner.query(`DROP INDEX "${schema}"."uq_categoria_nome_case_sensitive_legacy"`);
            await new UnicidadeCategorias1792620002000().up(queryRunner);
        } finally {
            await queryRunner.release();
        }
    });

    it("mantém 409 se a chave estrangeira proteger uma exclusão concorrente", async () => {
        const categoria = await repositorio.criarOrdenada(Categoria.criar("Com produto"));
        await dataSource.getRepository(Produto).save({
            nome: "Item", descricao: null, preco: 12, ativo: true,
            categoria: { id: categoria.id } as CategoriaModelo,
        });
        expect(await repositorio.excluirOrdenada(categoria.id!)).toBe("em-uso");
    });
});
