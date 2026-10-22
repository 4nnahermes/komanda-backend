import { Categoria } from "../../src/dominio/categorias/categoria";
import { RepositorioCategorias } from "../../src/dominio/categorias/repositorio-categorias";

export class CategoriasEmMemoria implements RepositorioCategorias {
    private categorias: Categoria[] = [];
    private proximoId = 1;
    readonly idsComProdutos = new Set<number>();

    async listar(ativo?: boolean): Promise<Categoria[]> {
        return this.categorias
            .filter((categoria) => ativo === undefined || categoria.ativo === ativo)
            .sort((a, b) => a.ordem - b.ordem || (a.id ?? 0) - (b.id ?? 0))
            .map(copiar);
    }

    async buscarPorId(id: number): Promise<Categoria | null> {
        const categoria = this.categorias.find((item) => item.id === id);
        return categoria ? copiar(categoria) : null;
    }

    async nomeExiste(nome: string, ignorarId?: number): Promise<boolean> {
        return this.categorias.some((categoria) => categoria.id !== ignorarId && categoria.nome.toLowerCase() === nome.toLowerCase());
    }

    async atualizar(id: number, alteracoes: { nome?: string; ativo?: boolean }): Promise<Categoria | null> {
        const indice = this.categorias.findIndex((item) => item.id === id);
        if (indice < 0) return null;
        const atual = this.categorias[indice];
        const atualizada = Categoria.restaurar({
            id, nome: alteracoes.nome ?? atual.nome, ativo: alteracoes.ativo ?? atual.ativo, ordem: atual.ordem,
        });
        this.categorias[indice] = atualizada;
        return copiar(atualizada);
    }

    async criarOrdenada(categoria: Categoria, ordemSolicitada?: number): Promise<Categoria> {
        const ordem = Math.min(ordemSolicitada ?? this.categorias.length + 1, this.categorias.length + 1);
        this.categorias = this.categorias.map((item) => item.ordem >= ordem
            ? Categoria.restaurar({ id: item.id, nome: item.nome, ordem: item.ordem + 1, ativo: item.ativo })
            : item);
        const nova = Categoria.restaurar({ id: this.proximoId++, nome: categoria.nome, ordem, ativo: true });
        this.categorias.push(nova);
        return copiar(nova);
    }

    async excluirOrdenada(id: number): Promise<"nao-encontrada" | "em-uso" | "excluida"> {
        const categoria = this.categorias.find((item) => item.id === id);
        if (!categoria) return "nao-encontrada";
        if (this.idsComProdutos.has(id)) return "em-uso";
        this.categorias = this.categorias.filter((item) => item.id !== id)
            .map((item) => item.ordem > categoria.ordem
                ? Categoria.restaurar({ id: item.id, nome: item.nome, ordem: item.ordem - 1, ativo: item.ativo })
                : item);
        return "excluida";
    }

    async reordenarCompleto(ids: number[]): Promise<Categoria[] | null> {
        if (new Set(ids).size !== ids.length || ids.length !== this.categorias.length || ids.some((id) => !this.categorias.some((c) => c.id === id))) {
            return null;
        }
        this.categorias = ids.map((id, indice) => {
            const categoria = this.categorias.find((item) => item.id === id)!;
            return Categoria.restaurar({ id, nome: categoria.nome, ordem: indice + 1, ativo: categoria.ativo });
        });
        return this.listar();
    }
}

function copiar(categoria: Categoria): Categoria {
    return Categoria.restaurar({ id: categoria.id, nome: categoria.nome, ordem: categoria.ordem, ativo: categoria.ativo });
}
