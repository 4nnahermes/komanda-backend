import { Dinheiro } from "../compartilhado/dinheiro";
import { ErroDeValidacao } from "../compartilhado/erros";

// Acompanhamentos (ingredientes que o atendente pode tirar) e adicionais pagos.
// Valem para o produto e para a categoria: a categoria define a base e o
// produto acrescenta ou ajusta o que for só dele.

const LIMITE_ADICIONAIS = 50;
const LIMITE_INGREDIENTES = 50;
const TAMANHO_INGREDIENTE = 120;
const TAMANHO_ADICIONAL = 100;

export interface AdicionalProduto {
    nome: string;
    preco: number;
}

export interface AdicionalEmCentavos {
    nome: string;
    centavos: number;
}

export function validarIngredientes(valores: string[]): string[] {
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

export function validarAdicionais(valores: AdicionalProduto[]): AdicionalEmCentavos[] {
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

export const TIPOS_CATEGORIA = ["ALIMENTO", "BEBIDA"] as const;
export type TipoCategoria = (typeof TIPOS_CATEGORIA)[number];

const LIMITE_OPCOES = 50;
const TAMANHO_OPCAO = 100;

// Opções de uma bebida, como sabores ou marcas. Só nome, sem preço próprio.
export function validarOpcoes(valores: string[]): string[] {
    if (!Array.isArray(valores)) throw new ErroDeValidacao("As opções devem ser uma lista de textos");
    if (valores.length > LIMITE_OPCOES) throw new ErroDeValidacao(`Informe até ${LIMITE_OPCOES} opções`);
    const vistas = new Set<string>();
    return valores.map((valor) => {
        if (typeof valor !== "string") throw new ErroDeValidacao("Cada opção deve ser um texto");
        const texto = valor.trim();
        if (!texto) throw new ErroDeValidacao("Cada opção deve ter um nome");
        if (texto.length > TAMANHO_OPCAO) throw new ErroDeValidacao(`Cada opção deve ter no máximo ${TAMANHO_OPCAO} caracteres`);
        const chave = texto.toLocaleLowerCase("pt-BR");
        if (vistas.has(chave)) throw new ErroDeValidacao("As opções não podem se repetir");
        vistas.add(chave);
        return texto;
    });
}

// Opções da categoria primeiro, depois as do produto, sem repetir.
export function unirOpcoes(daCategoria: string[], doProduto: string[]): string[] {
    return combinarComCategoria({ ingredientes: daCategoria, adicionais: [] }, { ingredientes: doProduto, adicionais: [] }).ingredientes;
}

// Junta a base da categoria com o que é próprio do produto.
// Acompanhamentos: os da categoria primeiro, sem repetir (sem diferenciar maiúsculas).
// Adicionais: um adicional do produto com o mesmo nome de um da categoria substitui o preço dele.
export function combinarComCategoria<A extends { nome: string }>(
    categoria: { ingredientes: string[]; adicionais: A[] },
    produto: { ingredientes: string[]; adicionais: A[] },
): { ingredientes: string[]; adicionais: A[] } {
    const chave = (texto: string) => texto.trim().toLocaleLowerCase("pt-BR");

    const ingredientes: string[] = [];
    const vistos = new Set<string>();
    for (const ingrediente of [...categoria.ingredientes, ...produto.ingredientes]) {
        if (vistos.has(chave(ingrediente))) continue;
        vistos.add(chave(ingrediente));
        ingredientes.push(ingrediente);
    }

    const doProduto = new Map(produto.adicionais.map((adicional) => [chave(adicional.nome), adicional]));
    const adicionais = categoria.adicionais.map((adicional) => doProduto.get(chave(adicional.nome)) ?? adicional);
    const daCategoria = new Set(categoria.adicionais.map((adicional) => chave(adicional.nome)));
    adicionais.push(...produto.adicionais.filter((adicional) => !daCategoria.has(chave(adicional.nome))));

    return { ingredientes, adicionais };
}
