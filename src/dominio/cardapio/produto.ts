import { Dinheiro } from "../compartilhado/dinheiro";
import { ErroDeValidacao } from "../compartilhado/erros";

const TAMANHO_MAXIMO_NOME = 80;
const TAMANHO_MAXIMO_DESCRICAO = 255;
const LIMITE_ADICIONAIS = 50;
const LIMITE_INGREDIENTES = 50;
const TAMANHO_INGREDIENTE = 120;
const TAMANHO_ADICIONAL = 100;

export interface AdicionalProduto {
    nome: string;
    preco: number;
}

export interface AlteracoesProduto {
    nome?: string;
    descricao?: string | null;
    preco?: number;
    categoriaId?: number;
    ativo?: boolean;
    ingredientes?: string[];
    adicionais?: AdicionalProduto[];
}

interface AdicionalEmCentavos {
    nome: string;
    centavos: number;
}

export interface NovoProduto {
    nome: string;
    descricao?: string | null;
    // Em reais, com até 2 casas decimais.
    preco: number;
    categoriaId: number;
    ingredientes?: string[];
    adicionais?: AdicionalProduto[];
}

export interface ProdutoSalvo {
    id: number;
    nome: string;
    descricao: string | null;
    preco: Dinheiro;
    categoriaId: number;
    ativo: boolean;
    ingredientes: string[];
    adicionais: AdicionalProduto[];
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
        private _ingredientes: string[],
        private _adicionais: AdicionalEmCentavos[],
    ) {}

    static criar(dados: NovoProduto): Produto {
        return new Produto(
            null,
            validarNome(dados.nome),
            normalizarDescricao(dados.descricao ?? null),
            validarPreco(dados.preco),
            dados.categoriaId,
            true,
            validarIngredientes(dados.ingredientes ?? []),
            validarAdicionais(dados.adicionais ?? []),
        );
    }

    // Reconstrói um produto já gravado, sem repetir as validações.
    static restaurar(dados: ProdutoSalvo): Produto {
        return new Produto(
            dados.id, dados.nome, dados.descricao, dados.preco, dados.categoriaId, dados.ativo,
            validarIngredientes(dados.ingredientes ?? []), validarAdicionais(dados.adicionais ?? []),
        );
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

    get ingredientes(): string[] {
        return [...this._ingredientes];
    }

    get adicionais(): AdicionalProduto[] {
        return this._adicionais.map(({ nome, centavos }) => ({ nome, preco: Dinheiro.deCentavos(centavos).emReais }));
    }

    alterarIngredientes(ingredientes: string[]): void {
        this._ingredientes = validarIngredientes(ingredientes);
    }

    alterarAdicionais(adicionais: AdicionalProduto[]): void {
        this._adicionais = validarAdicionais(adicionais);
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

function validarIngredientes(valores: string[]): string[] {
    if (!Array.isArray(valores)) throw new ErroDeValidacao("Os ingredientes devem ser uma lista de textos");
    if (valores.length > LIMITE_INGREDIENTES) throw new ErroDeValidacao(`Informe até ${LIMITE_INGREDIENTES} ingredientes`);
    const ingredientes = valores.map((valor) => {
        if (typeof valor !== "string") throw new ErroDeValidacao("Cada ingrediente deve ser um texto");
        const texto = valor.trim();
        if (!texto) throw new ErroDeValidacao("Cada ingrediente deve ter de 1 a 120 caracteres");
        if (texto.length > TAMANHO_INGREDIENTE) throw new ErroDeValidacao(`Cada ingrediente deve ter no máximo ${TAMANHO_INGREDIENTE} caracteres`);
        return texto;
    });
    if (new Set(ingredientes).size !== ingredientes.length) throw new ErroDeValidacao("Os ingredientes não podem se repetir");
    return ingredientes;
}

function validarAdicionais(valores: AdicionalProduto[]): AdicionalEmCentavos[] {
    if (!Array.isArray(valores)) throw new ErroDeValidacao("Os adicionais devem ser uma lista");
    if (valores.length > LIMITE_ADICIONAIS) throw new ErroDeValidacao(`Informe até ${LIMITE_ADICIONAIS} adicionais`);
    const nomes = new Set<string>();
    return valores.map((adicional) => {
        if (!adicional || typeof adicional !== "object") throw new ErroDeValidacao("Cada adicional deve ter um nome e um preço");
        if (typeof adicional.nome !== "string") throw new ErroDeValidacao("O nome do adicional deve ser um texto");
        const nome = adicional.nome.trim();
        if (!nome) throw new ErroDeValidacao("O nome do adicional é obrigatório");
        if (nome.length > TAMANHO_ADICIONAL) throw new ErroDeValidacao(`O nome do adicional deve ter no máximo ${TAMANHO_ADICIONAL} caracteres`);
        const chave = nome.toLocaleLowerCase("pt-BR");
        if (nomes.has(chave)) throw new ErroDeValidacao("Os nomes dos adicionais não podem se repetir");
        nomes.add(chave);
        if (typeof adicional.preco !== "number" || !Dinheiro.ehValorEmReaisValido(adicional.preco) || adicional.preco < 0 || adicional.preco > 99999999.99) {
            throw new ErroDeValidacao("O preço do adicional deve ser de R$ 0,00 a R$ 99.999.999,99, com até 2 casas decimais");
        }
        return { nome, centavos: Dinheiro.deReais(adicional.preco).centavos };
    });
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
    if (valor > 99999999.99) {
        throw new ErroDeValidacao("O preço deve ser no máximo R$ 99.999.999,99");
    }
    if (!Dinheiro.ehValorEmReaisValido(valor)) {
        throw new ErroDeValidacao("O preço deve ter no máximo 2 casas decimais");
    }
    const preco = Dinheiro.deReais(valor);
    if (!preco.ehMaiorQueZero()) {
        throw new ErroDeValidacao("O preço deve ser maior que zero");
    }
    return preco;
}
