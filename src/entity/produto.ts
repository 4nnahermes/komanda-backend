import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Categoria } from "./categoria";
import { decimalTransformer } from "../utils/decimal-transformer";

// Requisito 4: produtos do cardápio, sempre ligados a uma categoria.
// O nome não se repete dentro da mesma categoria.
@Entity("produto")
@Unique("uq_produto_nome_categoria", ["nome", "categoria"])
export class Produto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 80 })
    nome: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    descricao: string | null;

    // Dinheiro em numeric(10,2) para não perder centavos; a API devolve como número.
    @Column({ type: "numeric", precision: 10, scale: 2, transformer: decimalTransformer })
    preco: number;

    @Column({ type: "boolean", default: true })
    ativo: boolean;

    // RESTRICT: o banco impede excluir uma categoria que ainda tem produtos.
    @ManyToOne(() => Categoria, (categoria) => categoria.produtos, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "categoria_id" })
    categoria: Categoria;
}
