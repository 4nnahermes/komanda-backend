import { MigrationInterface, QueryRunner } from "typeorm";

export class CriaBairro1792620000000 implements MigrationInterface {
    name = "CriaBairro1792620000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bairro" ("id" SERIAL NOT NULL, "nome" character varying(100) NOT NULL, "taxa_entrega" numeric(10,2) NOT NULL, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "pk_bairro" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_bairro_nome_lower" ON "bairro" (LOWER("nome"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "uq_bairro_nome_lower"`);
        await queryRunner.query(`DROP TABLE "bairro"`);
    }
}
