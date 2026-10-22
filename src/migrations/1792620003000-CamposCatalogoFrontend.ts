import { MigrationInterface, QueryRunner } from "typeorm";

export class CamposCatalogoFrontend1792620003000 implements MigrationInterface {
    name = "CamposCatalogoFrontend1792620003000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "produto" ADD "ingredientes" jsonb NOT NULL DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "produto" ADD "adicionais" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "produto" DROP COLUMN "adicionais"`);
        await queryRunner.query(`ALTER TABLE "produto" DROP COLUMN "ingredientes"`);
    }
}
