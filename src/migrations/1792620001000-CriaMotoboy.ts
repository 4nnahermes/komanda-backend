import { MigrationInterface, QueryRunner } from "typeorm";

export class CriaMotoboy1792620001000 implements MigrationInterface {
    name = "CriaMotoboy1792620001000";
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "motoboy" ("id" SERIAL NOT NULL, "nome" character varying(100) NOT NULL, "telefone" character varying(30), "valor_fixo_noite" numeric(10,2) NOT NULL DEFAULT 0, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_motoboy" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_motoboy_nome_lower" ON "motoboy" (lower("nome"))`);
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "uq_motoboy_nome_lower"`);
        await queryRunner.query(`DROP TABLE "motoboy"`);
    }
}
