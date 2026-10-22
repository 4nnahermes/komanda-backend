import { Dinheiro } from "../compartilhado/dinheiro";
import { ErroDeValidacao } from "../compartilhado/erros";

const MAXIMO = 9_999_999_999;

export interface NovoMotoboy {
    nome: string;
    telefone?: string | null;
    valorFixoNoite?: number;
    ativo?: boolean;
}

export interface MotoboySalvo {
    id: number;
    nome: string;
    telefone: string | null;
    valorFixoNoite: Dinheiro;
    ativo: boolean;
}

export class Motoboy {
    private constructor(
        readonly id: number | null,
        private _nome: string,
        private _telefone: string | null,
        private _valorFixoNoite: Dinheiro,
        private _ativo: boolean,
    ) {}

    static criar(dados: NovoMotoboy): Motoboy {
        return new Motoboy(null, validarNome(dados.nome), validarTelefone(dados.telefone ?? null), validarValor(dados.valorFixoNoite ?? 0), dados.ativo ?? true);
    }

    static restaurar(dados: MotoboySalvo): Motoboy {
        return new Motoboy(dados.id, dados.nome, dados.telefone, dados.valorFixoNoite, dados.ativo);
    }

    get nome(): string { return this._nome; }
    get telefone(): string | null { return this._telefone; }
    get valorFixoNoite(): Dinheiro { return this._valorFixoNoite; }
    get ativo(): boolean { return this._ativo; }

    renomear(nome: string): void { this._nome = validarNome(nome); }
    alterarTelefone(telefone: string | null): void { this._telefone = validarTelefone(telefone); }
    alterarValorFixoNoite(valor: number): void { this._valorFixoNoite = validarValor(valor); }
    definirAtivo(ativo: boolean): void { this._ativo = ativo; }
}

function validarNome(valor: string): string {
    const nome = valor.trim();
    if (!nome) throw new ErroDeValidacao("O nome do motoboy é obrigatório");
    if (nome.length > 100) throw new ErroDeValidacao("O nome do motoboy deve ter no máximo 100 caracteres");
    return nome;
}

function validarTelefone(valor: string | null): string | null {
    if (valor === null) return null;
    const telefone = valor.trim();
    if (telefone.length > 30) throw new ErroDeValidacao("O telefone deve ter no máximo 30 caracteres");
    return telefone || null;
}

function validarValor(valor: number): Dinheiro {
    if (!Number.isFinite(valor)) throw new ErroDeValidacao("O valor fixo por noite deve ser um número");
    if (valor < 0) throw new ErroDeValidacao("O valor fixo por noite não pode ser negativo");
    if (!Dinheiro.ehValorEmReaisValido(valor)) throw new ErroDeValidacao("O valor fixo por noite deve ter no máximo 2 casas decimais");
    if (valor > 99_999_999.99) throw new ErroDeValidacao("O valor fixo por noite deve ser no máximo 99999999.99");
    const dinheiro = Dinheiro.deReais(valor);
    if (dinheiro.centavos > MAXIMO) throw new ErroDeValidacao("O valor fixo por noite deve ser no máximo 99999999.99");
    return dinheiro;
}
