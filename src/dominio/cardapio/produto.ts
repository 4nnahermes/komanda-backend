import { Dinheiro } from "../compartilhado/dinheiro";
import { ErroDeValidacao } from "../compartilhado/erros";

const TAMANHO_MAXIMO_NOME = 80;
const TAMANHO_MAXIMO_DESCRICAO = 255;

export interface NovoProduto {
    nome: string;
    descricao?: string | null;
    // Em reais, com até 2 casas decimais.
    preco: number;
    categoriaId: number;
}

export interface ProdutoSalvo {
    id: number;
    nome: string;
    descricao: string | null;
    preco: Dinheiro;
    categoriaId: number;
    ativo: boolean;
}

// Produto do cardápio (Requisito 4). Sempre pertence a uma categoria.
// A entidade garante as próprias regras: nome, descrição e preço válidos.
// Regras que dependem de outros registros, como nome repetido na categoria,
// ficam nos casos de uso.
export class Produto {
    private constructor(
        readonly id: number | null,
        private _nome: string,
        private _descricao: string | null,
        private _preco: Dinheiro,
        private _categoriaId: number,
        private _ativo: boolean,
    ) {}

    static criar(dados: NovoProduto): Produto {
        return new Produto(
            null,
            validarNome(dados.nome),
            normalizarDescricao(dados.descricao ?? null),
            validarPreco(dados.preco),
            dados.categoriaId,
            true,
        );
    }

    // Reconstrói um produto já gravado, sem repetir as validações.
    static restaurar(dados: ProdutoSalvo): Produto {
        return new Produto(dados.id, dados.nome, dados.descricao, dados.preco, dados.categoriaId, dados.ativo);
    }

    get nome(): string {
        return this._nome;
    }

    get descricao(): string | null {
        return this._descricao;
    }

    get preco(): Dinheiro {
        return this._preco;
    }

    get categoriaId(): number {
        return this._categoriaId;
    }

    get ativo(): boolean {
        return this._ativo;
    }

    renomear(nome: string): void {
        this._nome = validarNome(nome);
    }

    alterarDescricao(descricao: string | null): void {
        this._descricao = normalizarDescricao(descricao);
    }

    // Pedidos já feitos guardam o preço do momento da venda (RN5),
    // então mudar o preço aqui não altera o histórico.
    alterarPreco(preco: number): void {
        this._preco = validarPreco(preco);
    }

    moverParaCategoria(categoriaId: number): void {
        this._categoriaId = categoriaId;
    }

    // Produto inativo continua cadastrado, mas sai do cardápio.
    definirAtivo(ativo: boolean): void {
        this._ativo = ativo;
    }
}

function validarNome(valor: string): string {
    const nome = valor.trim();
    if (!nome) {
        throw new ErroDeValidacao("O nome do produto é obrigatório");
    }
    if (nome.length > TAMANHO_MAXIMO_NOME) {
        throw new ErroDeValidacao(`O nome do produto deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres`);
    }
    return nome;
}

// Descrição vazia é o mesmo que não ter descrição.
function normalizarDescricao(valor: string | null): string | null {
    const descricao = valor?.trim() ?? "";
    if (descricao.length > TAMANHO_MAXIMO_DESCRICAO) {
        throw new ErroDeValidacao(`A descrição deve ter no máximo ${TAMANHO_MAXIMO_DESCRICAO} caracteres`);
    }
    return descricao || null;
}

function validarPreco(valor: number): Dinheiro {
    if (!Dinheiro.ehValorEmReaisValido(valor)) {
        throw new ErroDeValidacao("O preço deve ter no máximo 2 casas decimais");
    }
    const preco = Dinheiro.deReais(valor);
    if (!preco.ehMaiorQueZero()) {
        throw new ErroDeValidacao("O preço deve ser maior que zero");
    }
    return preco;
}
