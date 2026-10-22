import { Motoboy } from "../../src/dominio/entrega/motoboy";
import { Dinheiro } from "../../src/dominio/compartilhado/dinheiro";
import { ConsultaMotoboys, RepositorioMotoboys } from "../../src/dominio/entrega/repositorio-motoboys";

export class MotoboysEmMemoria implements RepositorioMotoboys, ConsultaMotoboys {
    private readonly dados = new Map<number, Motoboy>();
    private proximoId = 1;
    async buscarPorId(id: number): Promise<Motoboy | null> { return this.dados.get(id) ?? null; }
    async existePorNome(nome: string, ignorarId?: number): Promise<boolean> {
        return [...this.dados.values()].some((m) => m.id !== ignorarId && m.nome.toLocaleLowerCase() === nome.toLocaleLowerCase());
    }
    async salvar(motoboy: Motoboy): Promise<number> {
        const id = motoboy.id ?? this.proximoId++;
        this.dados.set(id, Motoboy.restaurar({ id, nome: motoboy.nome, telefone: motoboy.telefone, valorFixoNoite: motoboy.valorFixoNoite, ativo: motoboy.ativo }));
        return id;
    }
    async atualizar(id: number, campos: Partial<{ nome: string; telefone: string | null; valorFixoNoite: number; ativo: boolean }>): Promise<boolean> {
        const antigo = this.dados.get(id); if (!antigo) return false;
        const atualizado = Motoboy.restaurar({ id, nome: campos.nome ?? antigo.nome, telefone: campos.telefone === undefined ? antigo.telefone : campos.telefone, valorFixoNoite: campos.valorFixoNoite === undefined ? antigo.valorFixoNoite : Dinheiro.deReais(campos.valorFixoNoite), ativo: campos.ativo ?? antigo.ativo });
        this.dados.set(id, atualizado); return true;
    }
    async excluir(id: number): Promise<boolean> { return this.dados.delete(id); }
    async listar(filtro: { ativo?: boolean }): Promise<Motoboy[]> {
        return [...this.dados.values()].filter((m) => filtro.ativo === undefined || m.ativo === filtro.ativo).sort((a, b) => a.nome.localeCompare(b.nome) || a.id! - b.id!);
    }
}
