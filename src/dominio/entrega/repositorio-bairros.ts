import { Bairro } from "./bairro";

export interface RepositorioBairros {
    buscarPorId(id: number): Promise<Bairro | null>;
    existeComNome(nome: string, ignorarId?: number): Promise<boolean>;
    salvar(bairro: Bairro, camposAlterados?: Array<"nome" | "taxaEntrega" | "ativo">): Promise<number>;
    excluir(id: number): Promise<void>;
}

export interface BairroApi {
    id: number;
    nome: string;
    taxaEntrega: number;
    ativo: boolean;
}

export interface ConsultaBairros {
    listar(ativo?: boolean): Promise<BairroApi[]>;
    buscarPorId(id: number): Promise<BairroApi | null>;
}
