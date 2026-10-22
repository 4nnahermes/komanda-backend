import { MigrationInterface, QueryRunner } from "typeorm";

export class UnicidadeCategorias1792620002000 implements MigrationInterface {
    name = "UnicidadeCategorias1792620002000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const duplicadas = await queryRunner.query(`
            SELECT LOWER(nome) AS nome_normalizado, ARRAY_AGG(nome ORDER BY id) AS nomes, COUNT(*) AS quantidade
            FROM categoria
            GROUP BY LOWER(nome)
            HAVING COUNT(*) > 1
            ORDER BY LOWER(nome)
        `) as Array<{ nome_normalizado: string; nomes: string[]; quantidade: string }>;

        if (duplicadas.length > 0) {
            const detalhe = duplicadas
                .map((grupo) => `${grupo.nome_normalizado}: ${grupo.nomes.join(", ")}`)
                .join("; ");
            throw new Error(
                `Não foi possível criar a unicidade de categorias sem diferenciar maiúsculas: há nomes duplicados legados (${detalhe}). Corrija os dados manualmente e execute a migration novamente.`,
            );
        }

        await queryRunner.query(
            `CREATE UNIQUE INDEX "uq_categoria_nome_lower" ON "categoria" (LOWER("nome"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "uq_categoria_nome_lower"`);
    }
}
