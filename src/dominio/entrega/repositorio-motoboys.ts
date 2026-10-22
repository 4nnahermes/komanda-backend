import { Motoboy } from "./motoboy";

export interface RepositorioMotoboys {
    buscarPorId(id: number): Promise<Motoboy | null>;
    existePorNome(nome: string, ignorarId?: number): Promise<boolean>;
    salvar(motoboy: Motoboy): Promise<number>;
    atualizar(id: number, campos: Partial<{ nome: string; telefone: string | null; valorFixoNoite: number; ativo: boolean }>): Promise<boolean>;
    excluir(id: number): Promise<boolean>;
}

export interface FiltroMotoboys { ativo?: boolean; }
export interface ConsultaMotoboys {
    listar(filtro: FiltroMotoboys): Promise<Motoboy[]>;
    buscarPorId(id: number): Promise<Motoboy | null>;
}
