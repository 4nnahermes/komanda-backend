import { Prisma, PrismaClient } from "@prisma/client";
import { emTransacao, ehUnicidade, normalizarNome, proximoId, reaisDoBanco } from "../infraestrutura/prisma/compartilhado";
import { AdicionalProduto, TIPOS_CATEGORIA, TipoCategoria, validarAdicionais, validarIngredientes, validarOpcoes } from "../dominio/cardapio/acompanhamentos";
import { ErroDeValidacao } from "../dominio/compartilhado/erros";
import { ErroApi } from "../utils/erro-api";

const TAMANHO_MAXIMO_NOME = 60;
const MENSAGEM_NOME_REPETIDO = "Já existe uma categoria com esse nome";
const MENSAGEM_CATEGORIA_NAO_ENCONTRADA = "Categoria não encontrada";
const MENSAGEM_CATEGORIA_COM_PRODUTOS =
    "Não é possível excluir uma categoria com produtos. Exclua ou mova os produtos, ou desative a categoria";

type CategoriaDTO = { id: number; nome: string; ordem: number; ativo: boolean; tipo: TipoCategoria; ingredientes: string[]; adicionais: AdicionalProduto[]; opcoes: string[] };
type AdicionalNoBanco = { nome: string; precoCentavos: bigint };
type DadosAcompanhamentos = { tipo?: unknown; ingredientes?: unknown; adicionais?: unknown; opcoes?: unknown };

// Regras da US01 (Requisito 1), conforme docs/api-contrato.md, seção 2.
export class CategoriaService {
    constructor(private readonly prisma: PrismaClient) {}

    async listar(ativo?: boolean): Promise<CategoriaDTO[]> {
        const categorias = await this.prisma.categoria.findMany({
            where: ativo === undefined ? undefined : { ativo },
            orderBy: [{ ordem: "asc" }, { id: "asc" }],
        });
        return categorias.map(paraDto);
    }

    async buscarPorId(id: number): Promise<CategoriaDTO> {
        if (!idInteiroValido(id)) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);
        const categoria = await this.prisma.categoria.findUnique({ where: { id } });
        if (!categoria) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);
        return paraDto(categoria);
    }

    async inserir(dados: { nome?: unknown; ordem?: unknown } & DadosAcompanhamentos): Promise<CategoriaDTO> {
        const nome = this.validarNome(dados.nome);
        const acompanhamentos = lerAcompanhamentos(dados, "ALIMENTO");
        const ordemSolicitada = dados.ordem === undefined ? undefined : dados.ordem;
        if (ordemSolicitada !== undefined && !this.ehInteiroPositivo(ordemSolicitada)) {
            throw new ErroApi(400, "A ordem deve ser um número inteiro maior que zero");
        }

        try {
            return await emTransacao(this.prisma, async (tx) => {
                const nomeNormalizado = normalizarNome(nome);
                if (await tx.categoria.findUnique({ where: { nomeNormalizado }, select: { id: true } })) {
                    throw new ErroApi(409, MENSAGEM_NOME_REPETIDO);
                }

                const total = await tx.categoria.count();
                const ultimaPosicao = total + 1;
                const ordem = ordemSolicitada === undefined ? ultimaPosicao : Math.min(ordemSolicitada as number, ultimaPosicao);
                const id = await proximoId(tx, "categorias");

                await tx.categoria.updateMany({
                    where: { ordem: { gte: ordem } },
                    data: { ordem: { increment: 1 } },
                });

                const categoria = await tx.categoria.create({
                    data: { id, nome, nomeNormalizado, ordem, ativo: true, tipo: acompanhamentos.tipo, ingredientes: acompanhamentos.ingredientes ?? [], adicionais: acompanhamentos.adicionais ?? [], opcoes: acompanhamentos.opcoes ?? [] },
                });
                return paraDto(categoria);
            }, true);
        } catch (erro) {
            if (ehUnicidade(erro)) throw new ErroApi(409, MENSAGEM_NOME_REPETIDO);
            throw erro;
        }
    }

    async atualizar(id: number, dados: { nome?: unknown; ativo?: unknown } & DadosAcompanhamentos): Promise<CategoriaDTO> {
        if (!idInteiroValido(id)) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);
        try {
            return await emTransacao(this.prisma, async (tx) => {
                const existente = await tx.categoria.findUnique({ where: { id } });
                if (!existente) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);
                if ([dados.nome, dados.ativo, dados.tipo, dados.ingredientes, dados.adicionais, dados.opcoes].every((campo) => campo === undefined)) {
                    throw new ErroApi(400, "Informe ao menos um campo para alterar");
                }

                const alteracoes: Prisma.CategoriaUpdateManyMutationInput = {};
                if (dados.nome !== undefined) {
                    const nome = this.validarNome(dados.nome);
                    const nomeNormalizado = normalizarNome(nome);
                    const repetida = await tx.categoria.findFirst({
                        where: { nomeNormalizado, id: { not: id } },
                        select: { id: true },
                    });
                    if (repetida) throw new ErroApi(409, MENSAGEM_NOME_REPETIDO);
                    alteracoes.nome = nome;
                    alteracoes.nomeNormalizado = nomeNormalizado;
                }
                if (dados.ativo !== undefined) {
                    if (typeof dados.ativo !== "boolean") {
                        throw new ErroApi(400, "O campo ativo deve ser true ou false");
                    }
                    alteracoes.ativo = dados.ativo;
                }
                const acompanhamentos = lerAcompanhamentos(dados, existente.tipo ?? "ALIMENTO");
                if (dados.tipo !== undefined) alteracoes.tipo = acompanhamentos.tipo;
                if (acompanhamentos.ingredientes !== undefined) alteracoes.ingredientes = acompanhamentos.ingredientes;
                if (acompanhamentos.adicionais !== undefined) alteracoes.adicionais = acompanhamentos.adicionais;
                if (acompanhamentos.opcoes !== undefined) alteracoes.opcoes = acompanhamentos.opcoes;

                const atualizada = await tx.categoria.updateMany({ where: { id }, data: alteracoes });
                if (atualizada.count === 0) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);
                const categoria = await tx.categoria.findUnique({ where: { id } });
                if (!categoria) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);
                return paraDto(categoria);
            }, true);
        } catch (erro) {
            if (ehUnicidade(erro)) throw new ErroApi(409, MENSAGEM_NOME_REPETIDO);
            throw erro;
        }
    }

    async excluir(id: number): Promise<void> {
        if (!idInteiroValido(id)) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);
        await emTransacao(this.prisma, async (tx) => {
            const categoria = await tx.categoria.findUnique({ where: { id } });
            if (!categoria) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);

            const quantidadeProdutos = await tx.produto.count({ where: { categoriaId: id } });
            if (quantidadeProdutos > 0) throw new ErroApi(409, MENSAGEM_CATEGORIA_COM_PRODUTOS);

            const removida = await tx.categoria.deleteMany({ where: { id } });
            if (removida.count === 0) throw new ErroApi(404, MENSAGEM_CATEGORIA_NAO_ENCONTRADA);
            await tx.categoria.updateMany({
                where: { ordem: { gt: categoria.ordem } },
                data: { ordem: { decrement: 1 } },
            });
        }, true);
    }

    async reordenar(ids: unknown): Promise<CategoriaDTO[]> {
        if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => this.ehInteiroPositivo(id))) {
            throw new ErroApi(400, "Informe a lista de ids na nova ordem");
        }

        return emTransacao(this.prisma, async (tx) => {
            const existentes = await tx.categoria.findMany({ select: { id: true } });
            const idsExistentes = new Set(existentes.map((categoria) => categoria.id));
            const idsNumericos = ids as number[];
            const semRepetir = new Set(idsNumericos);
            const listaCompleta =
                semRepetir.size === idsNumericos.length &&
                idsNumericos.length === idsExistentes.size &&
                idsNumericos.every((id) => idsExistentes.has(id));

            if (!listaCompleta) throw new ErroApi(400, "A lista deve conter todas as categorias, sem repetir");

            for (let indice = 0; indice < idsNumericos.length; indice++) {
                await tx.categoria.updateMany({ where: { id: idsNumericos[indice] }, data: { ordem: indice + 1 } });
            }

            const categorias = await tx.categoria.findMany({ orderBy: [{ ordem: "asc" }, { id: "asc" }] });
            return categorias.map(paraDto);
        }, true);
    }

    private validarNome(valor: unknown): string {
        const nome = typeof valor === "string" ? valor.trim() : "";
        if (!nome) throw new ErroApi(400, "O nome da categoria é obrigatório");
        if (nome.length > TAMANHO_MAXIMO_NOME) {
            throw new ErroApi(400, `O nome da categoria deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres`);
        }
        return nome;
    }

    private ehInteiroPositivo(valor: unknown): boolean {
        return typeof valor === "number" && Number.isInteger(valor) && valor > 0;
    }
}

function idInteiroValido(id: number): boolean {
    return Number.isInteger(id) && id > 0 && id <= 2_147_483_647;
}

function paraDto(categoria: { id: number; nome: string; ordem: number; ativo: boolean; tipo?: TipoCategoria | null; ingredientes?: string[]; adicionais?: AdicionalNoBanco[]; opcoes?: string[] }): CategoriaDTO {
    return {
        id: categoria.id,
        nome: categoria.nome,
        ordem: categoria.ordem,
        ativo: categoria.ativo,
        // Categorias antigas não têm os campos gravados: valem como alimento, com listas vazias.
        tipo: categoria.tipo ?? "ALIMENTO",
        ingredientes: categoria.ingredientes ?? [],
        adicionais: (categoria.adicionais ?? []).map((adicional) => ({ nome: adicional.nome, preco: reaisDoBanco(adicional.precoCentavos) })),
        opcoes: categoria.opcoes ?? [],
    };
}

// Valida o tipo e a base da categoria com as mesmas regras do produto.
// Alimento tem acompanhamentos e adicionais; bebida tem só opções. Ao trocar o tipo,
// a base do outro tipo é apagada. Campo ausente fica de fora; erro de validação vira 400.
function lerAcompanhamentos(
    dados: DadosAcompanhamentos,
    tipoAtual: TipoCategoria,
): { tipo: TipoCategoria; ingredientes?: string[]; adicionais?: AdicionalNoBanco[]; opcoes?: string[] } {
    try {
        if (dados.tipo !== undefined && !(TIPOS_CATEGORIA as readonly unknown[]).includes(dados.tipo)) {
            throw new ErroDeValidacao("O tipo da categoria deve ser ALIMENTO ou BEBIDA");
        }
        const tipo = (dados.tipo as TipoCategoria | undefined) ?? tipoAtual;
        const lido = {
            tipo,
            ingredientes: dados.ingredientes === undefined ? undefined : validarIngredientes(dados.ingredientes as string[]),
            adicionais: dados.adicionais === undefined
                ? undefined
                : validarAdicionais(dados.adicionais as AdicionalProduto[]).map(({ nome, centavos }) => ({ nome, precoCentavos: BigInt(centavos) })),
            opcoes: dados.opcoes === undefined ? undefined : validarOpcoes(dados.opcoes as string[]),
        };
        if (tipo === "BEBIDA" && (lido.ingredientes?.length || lido.adicionais?.length)) {
            throw new ErroDeValidacao("Categoria de bebida não tem acompanhamentos nem adicionais. Use opções");
        }
        if (tipo === "ALIMENTO" && lido.opcoes?.length) {
            throw new ErroDeValidacao("Opções são só para categoria de bebida");
        }
        if (tipo !== tipoAtual) {
            if (tipo === "BEBIDA") return { ...lido, ingredientes: [], adicionais: [] };
            return { ...lido, opcoes: [] };
        }
        return lido;
    } catch (erro) {
        if (erro instanceof ErroDeValidacao) throw new ErroApi(400, erro.message);
        throw erro;
    }
}
