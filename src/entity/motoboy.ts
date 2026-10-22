import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { decimalTransformer } from "../utils/decimal-transformer";

@Entity("motoboy")
export class Motoboy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 100 })
    nome: string;

    @Column({ type: "varchar", length: 30, nullable: true })
    telefone: string | null;

    @Column({ name: "valor_fixo_noite", type: "numeric", precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
    valorFixoNoite: number;

    @Column({ type: "boolean", default: true })
    ativo: boolean;
}
