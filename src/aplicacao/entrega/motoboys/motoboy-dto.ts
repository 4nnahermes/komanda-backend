import { Motoboy } from "../../../dominio/entrega/motoboy";

export interface MotoboyDto { id: number; nome: string; telefone: string | null; valorFixoNoite: number; ativo: boolean; }
export function paraMotoboyDto(motoboy: Motoboy): MotoboyDto {
    return { id: motoboy.id!, nome: motoboy.nome, telefone: motoboy.telefone, valorFixoNoite: motoboy.valorFixoNoite.emReais, ativo: motoboy.ativo };
}
