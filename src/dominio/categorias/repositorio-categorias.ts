import { Categoria } from "./categoria";

export interface RepositorioCategorias {
    listar(ativo?: boolean): Promise<Categoria[]>;
    buscarPorId(id: number): Promise<Categoria | null>;
    atualizar(id: number, alteracoes: { nome?: string; ativo?: boolean }): Promise<Categoria | null>;
    criarOrdenada(categoria: Categoria, ordemSolicitada?: number): Promise<Categoria>;
    excluirOrdenada(id: number): Promise<"nao-encontrada" | "em-uso" | "excluida">;
    reordenarCompleto(ids: number[]): Promise<Categoria[] | null>;
    nomeExiste(nome: string, ignorarId?: number): Promise<boolean>;
}
