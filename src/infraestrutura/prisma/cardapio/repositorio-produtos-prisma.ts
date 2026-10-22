import { Prisma, PrismaClient } from "@prisma/client";
import { MENSAGENS } from "../../../aplicacao/cardapio/produtos/mensagens";
import { AlteracoesProduto, Produto } from "../../../dominio/cardapio/produto";
import { RepositorioProdutos } from "../../../dominio/cardapio/repositorio-produtos";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { ConflitoDeDados, ErroDeValidacao } from "../../../dominio/compartilhado/erros";
import { centavosParaBanco, ehUnicidade, emTransacao, normalizarNome, proximoId, reaisDoBanco } from "../compartilhado";

export class RepositorioProdutosPrisma implements RepositorioProdutos {
    constructor(private readonly prisma: PrismaClient) {}

    async buscarPorId(id: number): Promise<Produto | null> {
        const registro = await this.prisma.produto.findUnique({ where: { id }, include: { categoria: true } });
        return registro ? paraDominio(registro) : null;
    }

    async existeNaCategoria(nome: string, categoriaId: number, ignorarId?: number): Promise<boolean> {
        const registro = await this.prisma.produto.findFirst({
            where: {
                categoriaId,
                nomeNormalizado: normalizarNome(nome),
                ...(ignorarId === undefined ? {} : { id: { not: ignorarId } }),
            },
            select: { id: true },
        });
        return registro !== null;
    }

    async salvar(produto: Produto): Promise<number> {
        try {
            return await emTransacao(this.prisma, async (tx) => {
                const categoria = await tx.categoria.findUnique({ where: { id: produto.categoriaId }, select: { id: true } });
                if (!categoria) throw new ErroDeValidacao(MENSAGENS.categoriaNaoEncontrada);

                const id = await proximoId(tx, "produtos");
                await tx.produto.create({
                    data: {
                        id,
                        nome: produto.nome,
                        nomeNormalizado: normalizarNome(produto.nome),
                        descricao: produto.descricao,
                        precoCentavos: centavosParaBanco(produto.preco.emReais),
                        ativo: produto.ativo,
                        categoriaId: produto.categoriaId,
                        ingredientes: produto.ingredientes,
                        adicionais: produto.adicionais.map((adicional) => ({
                            nome: adicional.nome,
                            precoCentavos: centavosParaBanco(adicional.preco),
                        })),
                    },
                });
                return id;
            }, true);
        } catch (erro) {
            if (ehUnicidade(erro)) throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
            throw erro;
        }
    }

    async atualizarCampos(id: number, campos: AlteracoesProduto): Promise<boolean> {
        const dados: Record<string, unknown> = {};
        if (campos.nome !== undefined) {
            dados.nome = campos.nome;
            dados.nomeNormalizado = normalizarNome(campos.nome);
        }
        if (campos.descricao !== undefined) dados.descricao = campos.descricao;
        if (campos.preco !== undefined) dados.precoCentavos = centavosParaBanco(campos.preco);
        if (campos.ativo !== undefined) dados.ativo = campos.ativo;
        if (campos.categoriaId !== undefined) dados.categoriaId = campos.categoriaId;
        if (campos.ingredientes !== undefined) dados.ingredientes = campos.ingredientes;
        if (campos.adicionais !== undefined) {
            dados.adicionais = campos.adicionais.map((adicional) => ({
                nome: adicional.nome,
                precoCentavos: centavosParaBanco(adicional.preco),
            }));
        }

        try {
            return await emTransacao(this.prisma, async (tx) => {
                if (campos.categoriaId !== undefined) {
                    const categoria = await tx.categoria.findUnique({ where: { id: campos.categoriaId }, select: { id: true } });
                    if (!categoria) throw new ErroDeValidacao(MENSAGENS.categoriaNaoEncontrada);
                }
                const resultado = await tx.produto.updateMany({ where: { id }, data: dados as never });
                return resultado.count > 0;
            }, true);
        } catch (erro) {
            if (ehUnicidade(erro)) throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
            throw erro;
        }
    }

    async excluir(id: number): Promise<void> {
        await emTransacao(this.prisma, async (tx) => {
            await tx.produto.deleteMany({ where: { id } });
        }, true);
    }
}

function paraDominio(produto: Prisma.ProdutoGetPayload<{ include: { categoria: true } }>): Produto {
    return Produto.restaurar({
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        preco: Dinheiro.deCentavos(Number(produto.precoCentavos)),
        categoriaId: produto.categoriaId,
        ativo: produto.ativo,
        ingredientes: produto.ingredientes,
        adicionais: produto.adicionais.map((adicional) => ({ nome: adicional.nome, preco: reaisDoBanco(adicional.precoCentavos) })),
    });
}
