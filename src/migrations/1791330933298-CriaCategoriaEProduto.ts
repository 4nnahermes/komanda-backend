import { MigrationInterface, QueryRunner } from "typeorm";

export class CriaCategoriaEProduto1791330933298 implements MigrationInterface {
    name = 'CriaCategoriaEProduto1791330933298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categoria" ("id" SERIAL NOT NULL, "nome" character varying(60) NOT NULL, "ordem" integer NOT NULL, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_0a9942514087463668e9638bf90" UNIQUE ("nome"), CONSTRAINT "PK_f027836b77b84fb4c3a374dc70d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "produto" ("id" SERIAL NOT NULL, "nome" character varying(80) NOT NULL, "descricao" character varying(255), "preco" numeric(10,2) NOT NULL, "ativo" boolean NOT NULL DEFAULT true, "categoria_id" integer NOT NULL, CONSTRAINT "uq_produto_nome_categoria" UNIQUE ("nome", "categoria_id"), CONSTRAINT "PK_99c4351f9168c50c0736e6a66be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "produto" ADD CONSTRAINT "FK_3a3aed3f734f4071c5fff367c43" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "produto" DROP CONSTRAINT "FK_3a3aed3f734f4071c5fff367c43"`);
        await queryRunner.query(`DROP TABLE "produto"`);
        await queryRunner.query(`DROP TABLE "categoria"`);
    }

}
