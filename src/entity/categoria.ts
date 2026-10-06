import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Produto } from "./produto";

// Requisito 1: categorias do cardápio, com ordem de exibição e ativo/inativo.
@Entity("categoria")
export class Categoria {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 60, unique: true })
    nome: string;

    // Posição no cardápio, começando em 1. O service reorganiza as demais ao mudar.
    @Column({ type: "int" })
    ordem: number;

    @Column({ type: "boolean", default: true })
    ativo: boolean;

    @OneToMany(() => Produto, (produto) => produto.categoria)
    produtos: Produto[];
}
