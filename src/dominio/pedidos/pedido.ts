import { Dinheiro } from "../compartilhado/dinheiro";
import { ConflitoDeDados, ErroDeValidacao } from "../compartilhado/erros";
import { ProdutoParaPedido } from "./catalogo-do-pedido";

export const TIPOS_PEDIDO = ["ENTREGA", "RETIRADA"] as const;
export type TipoPedido = (typeof TIPOS_PEDIDO)[number];

export const STATUS_PEDIDO = ["EM_PREPARO", "PRONTO", "ENTREGUE", "CANCELADO"] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const FORMAS_PAGAMENTO = ["PIX", "CREDITO", "DEBITO", "DINHEIRO", "FIADO"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

// Para onde cada status pode ir. ENTREGUE e CANCELADO são finais.
// PRONTO → EM_PREPARO desfaz um avanço feito por engano.
const TRANSICOES: Record<StatusPedido, readonly StatusPedido[]> = {
    EM_PREPARO: ["PRONTO", "CANCELADO"],
    PRONTO: ["EM_PREPARO", "ENTREGUE", "CANCELADO"],
    ENTREGUE: [],
    CANCELADO: [],
};

const LIMITE_ITENS = 50;
const QUANTIDADE_MAXIMA = 99;
const TAMANHO_NOME_CLIENTE = 100;
const TAMANHO_TELEFONE = 30;
const TAMANHO_ENDERECO = 200;
const PRAZO_MAXIMO = 600;

export const MENSAGENS_PEDIDO = {
    nomeClienteObrigatorio: "O nome do cliente é obrigatório",
    nomeClienteLongo: `O nome do cliente deve ter no máximo ${TAMANHO_NOME_CLIENTE} caracteres`,
    telefoneLongo: `O telefone deve ter no máximo ${TAMANHO_TELEFONE} caracteres`,
    entregaSemBairro: "Informe o bairro da entrega",
    entregaSemEndereco: "Informe o endereço da entrega",
    enderecoLongo: `O endereço deve ter no máximo ${TAMANHO_ENDERECO} caracteres`,
    retiradaComDestino: "Pedido de retirada não tem bairro nem endereço",
    semItens: "Informe ao menos um item",
    muitosItens: `O pedido pode ter no máximo ${LIMITE_ITENS} itens`,
    quantidadeInvalida: `A quantidade deve ser um número inteiro de 1 a ${QUANTIDADE_MAXIMA}`,
    itemRepetido: "Ingredientes e adicionais não podem se repetir no item",
    valorRecebidoForaDoDinheiro: "O valor recebido só é informado no pagamento em dinheiro",
    valorRecebidoInvalido: "O valor recebido deve ser um número com até 2 casas decimais",
    valorRecebidoMenor: "O valor recebido é menor que o total do pedido",
    entregaSemMotoboy: "Vincule um motoboy antes de concluir a entrega",
    motoboyEmRetirada: "Pedido de retirada não tem motoboy",
    motoboyEmPedidoFinalizado: "Não é possível alterar o motoboy de um pedido entregue ou cancelado",
    exclusaoForaDoPreparo: "Só é possível excluir um pedido em preparo. Cancele o pedido",
    prazoInvalido: `O prazo deve ser um número inteiro de 1 a ${PRAZO_MAXIMO} minutos`,
} as const;

export interface Referencia {
    id: number;
    nome: string;
}

export interface AdicionalDoItem {
    nome: string;
    preco: Dinheiro;
}

// Item com nome e preços copiados do cardápio no momento da venda (RN5).
export interface ItemPedido {
    produtoId: number;
    nome: string;
    quantidade: number;
    precoUnitario: Dinheiro;
    ingredientesRetirados: string[];
    adicionais: AdicionalDoItem[];
}

export interface BairroDoPedido extends Referencia {
    taxaEntrega: Dinheiro;
}

export interface NovoPedido {
    tipo: TipoPedido;
    nomeCliente: string;
    telefone?: string | null;
    bairro: BairroDoPedido | null;
    endereco?: string | null;
    itens: ItemPedido[];
    formaPagamento: FormaPagamento;
    // Em reais, com até 2 casas decimais.
    valorRecebido?: number | null;
    criadoEm: Date;
    noite: string;
    // Tempo de espera vigente na criação; fica gravado e não muda depois.
    prazoMinutos?: number | null;
}

export interface PedidoSalvo {
    id: number;
    numero: number;
    noite: string;
    criadoEm: Date;
    tipo: TipoPedido;
    status: StatusPedido;
    nomeCliente: string;
    telefone: string | null;
    bairro: Referencia | null;
    endereco: string | null;
    itens: ItemPedido[];
    taxaEntrega: Dinheiro;
    formaPagamento: FormaPagamento;
    valorRecebido: Dinheiro | null;
    motoboy: Referencia | null;
    prazoMinutos?: number | null;
}

// (preço unitário + adicionais) × quantidade.
export function subtotalDoItem(item: ItemPedido): Dinheiro {
    const unitario = item.adicionais.reduce((soma, adicional) => soma.somar(adicional.preco), item.precoUnitario);
    return unitario.multiplicar(item.quantidade);
}

// Monta o item a partir do produto do cardápio, conferindo se os ingredientes
// retirados e os adicionais pertencem a ele. Compara sem diferenciar maiúsculas
// e grava o nome como está no cadastro.
export function criarItem(
    produto: ProdutoParaPedido,
    quantidade: number,
    ingredientesRetirados: string[] = [],
    adicionais: string[] = [],
): ItemPedido {
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > QUANTIDADE_MAXIMA) {
        throw new ErroDeValidacao(MENSAGENS_PEDIDO.quantidadeInvalida);
    }
    if (temRepetidos(ingredientesRetirados) || temRepetidos(adicionais)) {
        throw new ErroDeValidacao(MENSAGENS_PEDIDO.itemRepetido);
    }

    const retirados = ingredientesRetirados.map((nome) => {
        const encontrado = produto.ingredientes.find((ingrediente) => mesmaPalavra(ingrediente, nome));
        if (!encontrado) throw new ErroDeValidacao(`Ingrediente "${nome.trim()}" não pertence ao produto "${produto.nome}"`);
        return encontrado;
    });

    const extras = adicionais.map((nome) => {
        const encontrado = produto.adicionais.find((adicional) => mesmaPalavra(adicional.nome, nome));
        if (!encontrado) throw new ErroDeValidacao(`Adicional "${nome.trim()}" não pertence ao produto "${produto.nome}"`);
        return { nome: encontrado.nome, preco: encontrado.preco };
    });

    return {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade,
        precoUnitario: produto.preco,
        ingredientesRetirados: retirados,
        adicionais: extras,
    };
}

// Confere bairro e endereço conforme o tipo, antes de buscar o bairro no banco.
// Devolve o endereço sem espaços nas pontas, ou null na retirada.
export function validarDestino(tipo: TipoPedido, bairroId: number | null | undefined, endereco: string | null | undefined): string | null {
    const temBairro = bairroId !== null && bairroId !== undefined;
    const temEndereco = endereco !== null && endereco !== undefined;
    if (tipo === "RETIRADA") {
        if (temBairro || temEndereco) throw new ErroDeValidacao(MENSAGENS_PEDIDO.retiradaComDestino);
        return null;
    }
    if (!temBairro) throw new ErroDeValidacao(MENSAGENS_PEDIDO.entregaSemBairro);
    const texto = endereco?.trim() ?? "";
    if (!texto) throw new ErroDeValidacao(MENSAGENS_PEDIDO.entregaSemEndereco);
    if (texto.length > TAMANHO_ENDERECO) throw new ErroDeValidacao(MENSAGENS_PEDIDO.enderecoLongo);
    return texto;
}

// Pedido do balcão ou do telefone (Requisitos 9 a 18).
// Calcula subtotal, taxa, total e troco (RN1 e RN2) e controla o status.
export class Pedido {
    private constructor(
        readonly id: number | null,
        readonly numero: number | null,
        readonly noite: string,
        readonly criadoEm: Date,
        readonly tipo: TipoPedido,
        private _status: StatusPedido,
        readonly nomeCliente: string,
        readonly telefone: string | null,
        readonly bairro: Referencia | null,
        readonly endereco: string | null,
        private readonly _itens: ItemPedido[],
        readonly taxaEntrega: Dinheiro,
        readonly formaPagamento: FormaPagamento,
        readonly valorRecebido: Dinheiro | null,
        private _motoboy: Referencia | null,
        readonly prazoMinutos: number | null,
    ) {}

    static criar(dados: NovoPedido): Pedido {
        const nomeCliente = validarNomeCliente(dados.nomeCliente);
        const telefone = validarTelefone(dados.telefone ?? null);
        const endereco = validarDestino(dados.tipo, dados.bairro?.id, dados.endereco);
        if (dados.itens.length === 0) throw new ErroDeValidacao(MENSAGENS_PEDIDO.semItens);
        if (dados.itens.length > LIMITE_ITENS) throw new ErroDeValidacao(MENSAGENS_PEDIDO.muitosItens);

        const bairro = dados.tipo === "ENTREGA" && dados.bairro ? { id: dados.bairro.id, nome: dados.bairro.nome } : null;
        // RN2: retirada não paga taxa de entrega.
        const taxaEntrega = dados.tipo === "ENTREGA" && dados.bairro ? dados.bairro.taxaEntrega : Dinheiro.deCentavos(0);
        const itens = dados.itens.map(copiarItem);
        const total = somarItens(itens).somar(taxaEntrega);
        const valorRecebido = validarValorRecebido(dados.valorRecebido ?? null, dados.formaPagamento, total);

        return new Pedido(
            null, null, dados.noite, dados.criadoEm, dados.tipo, "EM_PREPARO",
            nomeCliente, telefone, bairro, endereco, itens, taxaEntrega,
            dados.formaPagamento, valorRecebido, null, validarPrazo(dados.prazoMinutos ?? null),
        );
    }

    // Reconstrói um pedido já gravado, sem repetir as validações.
    static restaurar(dados: PedidoSalvo): Pedido {
        return new Pedido(
            dados.id, dados.numero, dados.noite, dados.criadoEm, dados.tipo, dados.status,
            dados.nomeCliente, dados.telefone, dados.bairro, dados.endereco, dados.itens.map(copiarItem),
            dados.taxaEntrega, dados.formaPagamento, dados.valorRecebido, dados.motoboy, dados.prazoMinutos ?? null,
        );
    }

    get status(): StatusPedido {
        return this._status;
    }

    get motoboy(): Referencia | null {
        return this._motoboy;
    }

    get itens(): ItemPedido[] {
        return this._itens.map(copiarItem);
    }

    get subtotal(): Dinheiro {
        return somarItens(this._itens);
    }

    // RN1: total = itens + taxa de entrega.
    get total(): Dinheiro {
        return this.subtotal.somar(this.taxaEntrega);
    }

    get troco(): Dinheiro | null {
        if (!this.valorRecebido) return null;
        return Dinheiro.deCentavos(this.valorRecebido.centavos - this.total.centavos);
    }

    alterarStatus(novo: StatusPedido): void {
        if (novo === this._status || !TRANSICOES[this._status].includes(novo)) {
            throw new ConflitoDeDados(`Não é possível mudar o pedido de ${this._status} para ${novo}`);
        }
        // O acerto dos motoboys (R27) depende de saber quem levou cada entrega.
        if (novo === "ENTREGUE" && this.tipo === "ENTREGA" && !this._motoboy) {
            throw new ConflitoDeDados(MENSAGENS_PEDIDO.entregaSemMotoboy);
        }
        this._status = novo;
    }

    // null remove o motoboy.
    vincularMotoboy(motoboy: Referencia | null): void {
        if (this.tipo === "RETIRADA") throw new ConflitoDeDados(MENSAGENS_PEDIDO.motoboyEmRetirada);
        if (this.estaFinalizado()) throw new ConflitoDeDados(MENSAGENS_PEDIDO.motoboyEmPedidoFinalizado);
        this._motoboy = motoboy ? { id: motoboy.id, nome: motoboy.nome } : null;
    }

    // Excluir serve só para desfazer um lançamento errado; depois disso, cancela.
    garantirQuePodeExcluir(): void {
        if (this._status !== "EM_PREPARO") throw new ConflitoDeDados(MENSAGENS_PEDIDO.exclusaoForaDoPreparo);
    }

    private estaFinalizado(): boolean {
        return this._status === "ENTREGUE" || this._status === "CANCELADO";
    }
}

function somarItens(itens: ItemPedido[]): Dinheiro {
    return itens.reduce((soma, item) => soma.somar(subtotalDoItem(item)), Dinheiro.deCentavos(0));
}

function copiarItem(item: ItemPedido): ItemPedido {
    return {
        ...item,
        ingredientesRetirados: [...item.ingredientesRetirados],
        adicionais: item.adicionais.map((adicional) => ({ ...adicional })),
    };
}

function validarNomeCliente(valor: string): string {
    const nome = valor.trim();
    if (!nome) throw new ErroDeValidacao(MENSAGENS_PEDIDO.nomeClienteObrigatorio);
    if (nome.length > TAMANHO_NOME_CLIENTE) throw new ErroDeValidacao(MENSAGENS_PEDIDO.nomeClienteLongo);
    return nome;
}

// Telefone vazio é o mesmo que não ter telefone.
function validarTelefone(valor: string | null): string | null {
    const telefone = valor?.trim() ?? "";
    if (telefone.length > TAMANHO_TELEFONE) throw new ErroDeValidacao(MENSAGENS_PEDIDO.telefoneLongo);
    return telefone || null;
}

function validarPrazo(valor: number | null): number | null {
    if (valor === null) return null;
    if (!Number.isInteger(valor) || valor < 1 || valor > PRAZO_MAXIMO) throw new ErroDeValidacao(MENSAGENS_PEDIDO.prazoInvalido);
    return valor;
}

function validarValorRecebido(valor: number | null, forma: FormaPagamento, total: Dinheiro): Dinheiro | null {
    if (valor === null) return null;
    if (forma !== "DINHEIRO") throw new ErroDeValidacao(MENSAGENS_PEDIDO.valorRecebidoForaDoDinheiro);
    if (!Dinheiro.ehValorEmReaisValido(valor) || valor < 0 || valor > 99_999_999.99) {
        throw new ErroDeValidacao(MENSAGENS_PEDIDO.valorRecebidoInvalido);
    }
    const recebido = Dinheiro.deReais(valor);
    if (recebido.centavos < total.centavos) throw new ErroDeValidacao(MENSAGENS_PEDIDO.valorRecebidoMenor);
    return recebido;
}

function mesmaPalavra(a: string, b: string): boolean {
    return a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");
}

function temRepetidos(nomes: string[]): boolean {
    const normalizados = nomes.map((nome) => nome.trim().toLocaleLowerCase("pt-BR"));
    return new Set(normalizados).size !== normalizados.length;
}
