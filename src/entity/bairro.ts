import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { decimalTransformer } from "../utils/decimal-transformer";

@Entity("bairro")
export class Bairro {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 100 })
    nome: string;

    @Column({ name: "taxa_entrega", type: "numeric", precision: 10, scale: 2, transformer: decimalTransformer })
    taxaEntrega: number;

    @Column({ type: "boolean", default: true })
    ativo: boolean;
}
