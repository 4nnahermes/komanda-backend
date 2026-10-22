import { ErroDeValidacao } from "../compartilhado/erros";

export interface DadosCategoria {
    id: number | null;
    nome: string;
    ordem: number;
    ativo: boolean;
}

export class Categoria {
    private constructor(
        readonly id: number | null,
        readonly nome: string,
        readonly ordem: number,
        readonly ativo: boolean,
    ) {}

    static criar(nome: unknown, ordem = 1): Categoria {
        const nomeNormalizado = typeof nome === "string" ? nome.trim() : "";
        if (!nomeNormalizado) throw new ErroDeValidacao("O nome da categoria é obrigatório");
        if (nomeNormalizado.length > 60) {
            throw new ErroDeValidacao("O nome da categoria deve ter no máximo 60 caracteres");
        }
        if (!Number.isInteger(ordem) || ordem < 1) {
            throw new ErroDeValidacao("A ordem deve ser um número inteiro maior que zero");
        }
        return new Categoria(null, nomeNormalizado, ordem, true);
    }

    static restaurar(dados: DadosCategoria): Categoria {
        return new Categoria(dados.id, dados.nome, dados.ordem, dados.ativo);
    }

    renomear(nome: unknown): Categoria {
        const nova = Categoria.criar(nome, this.ordem);
        return new Categoria(this.id, nova.nome, this.ordem, this.ativo);
    }

    comStatus(ativo: unknown): Categoria {
        if (typeof ativo !== "boolean") throw new ErroDeValidacao("O campo ativo deve ser true ou false");
        return new Categoria(this.id, this.nome, this.ordem, ativo);
    }
}
