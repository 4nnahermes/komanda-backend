import { Dinheiro } from "../compartilhado/dinheiro";
import { ErroDeValidacao } from "../compartilhado/erros";

const LIMITE_CENTAVOS = 9_999_999_999;

export interface BairroSalvo {
    id: number;
    nome: string;
    taxaEntrega: Dinheiro;
    ativo: boolean;
}

export interface NovoBairro {
    nome: string;
    taxaEntrega: number;
    ativo?: boolean;
}

export class Bairro {
    private constructor(
        readonly id: number | null,
        private _nome: string,
        private _taxaEntrega: Dinheiro,
        private _ativo: boolean,
    ) {}

    static criar(dados: NovoBairro): Bairro {
        return new Bairro(null, validarNome(dados.nome), validarTaxa(dados.taxaEntrega), dados.ativo ?? true);
    }

    static restaurar(dados: BairroSalvo): Bairro {
        return new Bairro(dados.id, dados.nome, dados.taxaEntrega, dados.ativo);
    }

    get nome(): string { return this._nome; }
    get taxaEntrega(): Dinheiro { return this._taxaEntrega; }
    get ativo(): boolean { return this._ativo; }

    renomear(nome: string): void { this._nome = validarNome(nome); }
    alterarTaxa(taxaEntrega: number): void { this._taxaEntrega = validarTaxa(taxaEntrega); }
    definirAtivo(ativo: boolean): void { this._ativo = ativo; }
}

function validarNome(valor: string): string {
    const nome = valor.trim();
    if (!nome) throw new ErroDeValidacao("O nome do bairro é obrigatório");
    if (nome.length > 100) throw new ErroDeValidacao("O nome do bairro deve ter no máximo 100 caracteres");
    return nome;
}

function validarTaxa(valor: number): Dinheiro {
    if (!Dinheiro.ehValorEmReaisValido(valor)) {
        throw new ErroDeValidacao("A taxa de entrega deve ter no máximo 2 casas decimais");
    }
    if (valor < 0) throw new ErroDeValidacao("A taxa de entrega não pode ser negativa");
    if (valor > 99_999_999.99) throw new ErroDeValidacao("A taxa de entrega deve ser no máximo 99999999.99");
    const taxa = Dinheiro.deReais(valor);
    if (taxa.centavos > LIMITE_CENTAVOS) throw new ErroDeValidacao("A taxa de entrega deve ser no máximo 99999999.99");
    return taxa;
}
