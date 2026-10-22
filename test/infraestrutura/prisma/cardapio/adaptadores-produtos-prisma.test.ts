import { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { Produto } from "../../../../src/dominio/cardapio/produto";
import { ConflitoDeDados, ErroDeValidacao } from "../../../../src/dominio/compartilhado/erros";
import { CategoriasDoCardapioPrisma } from "../../../../src/infraestrutura/prisma/cardapio/categorias-do-cardapio-prisma";
import { ConsultaCardapioPrisma } from "../../../../src/infraestrutura/prisma/cardapio/consulta-cardapio-prisma";
import { ConsultaProdutosPrisma } from "../../../../src/infraestrutura/prisma/cardapio/consulta-produtos-prisma";
import { RepositorioProdutosPrisma } from "../../../../src/infraestrutura/prisma/cardapio/repositorio-produtos-prisma";

const adicional = { nome: "Queijo extra", precoCentavos: 410n };

function registro(overrides: Record<string, unknown> = {}) {
    return {
        id: 10,
        nome: "Xis Carne",
        nomeNormalizado: "xis carne",
        descricao: null,
        precoCentavos: 3290n,
        ativo: true,
        categoriaId: 3,
        ingredientes: ["cebola", "tomate"],
        adicionais: [adicional],
        categoria: { id: 3, nome: "Xis", ordem: 2, ativo: true },
        ...overrides,
    };
}

function prismaFake(tx: Record<string, any>, other: Record<string, any> = {}) {
    return {
        ...other,
        $transaction: vi.fn((callback: (client: unknown) => unknown) => callback(tx)),
    } as unknown as PrismaClient;
}

function txBase(overrides: Record<string, any> = {}) {
    return {
        contador: { upsert: vi.fn(async ({ where }: { where: { chave: string } }) => ({ valor: where.chave === "produtos" ? 42 : 1 })) },
        categoria: { findUnique: vi.fn(async () => ({ id: 3 })) },
        produto: {
            create: vi.fn(async () => ({})),
            updateMany: vi.fn(async () => ({ count: 1 })),
            deleteMany: vi.fn(async () => ({ count: 1 })),
        },
        ...overrides,
    };
}

describe("adaptadores Prisma de produtos e cardápio", () => {
    it("cria o produto na transação do catálogo e converte todos os preços para centavos", async () => {
        const tx = txBase();
        const prisma = prismaFake(tx);
        const adapter = new RepositorioProdutosPrisma(prisma);
        const produto = Produto.criar({
            nome: " Xis Carne ", categoriaId: 3, preco: 32.9,
            ingredientes: ["cebola"], adicionais: [{ nome: "Queijo extra", preco: 4.1 }],
        });

        await expect(adapter.salvar(produto)).resolves.toBe(42);
        expect(prisma.$transaction).toHaveBeenCalledOnce();
        expect(tx.produto.create).toHaveBeenCalledWith({ data: {
            id: 42, nome: "Xis Carne", nomeNormalizado: "xis carne", descricao: null, precoCentavos: 3290n,
            ativo: true, categoriaId: 3, ingredientes: ["cebola"], adicionais: [{ nome: "Queijo extra", precoCentavos: 410n }],
        } });
    });

    it("confere categoria dentro da transação antes de inserir", async () => {
        const tx = txBase({ categoria: { findUnique: vi.fn(async () => null) } });
        const adapter = new RepositorioProdutosPrisma(prismaFake(tx));
        await expect(adapter.salvar(Produto.criar({ nome: "Xis", categoriaId: 3, preco: 10 }))).rejects.toEqual(new ErroDeValidacao("Categoria não encontrada"));
        expect(tx.produto.create).not.toHaveBeenCalled();
    });

    it("faz PATCH somente com campos enviados, preservando false, zero, null e listas vazias", async () => {
        let captured: unknown;
        const tx = txBase({ produto: { updateMany: vi.fn(async ({ data }: { data: unknown }) => { captured = data; return { count: 1 }; }) } });
        const adapter = new RepositorioProdutosPrisma(prismaFake(tx));

        await expect(adapter.atualizarCampos(10, { ativo: false, preco: 0, descricao: null, ingredientes: [], adicionais: [] })).resolves.toBe(true);
        expect(captured).toEqual({ ativo: false, precoCentavos: 0n, descricao: null, ingredientes: [], adicionais: [] });
        expect(tx.produto.updateMany).toHaveBeenCalledWith({ where: { id: 10 }, data: captured });
    });

    it("valida a categoria de destino dentro do PATCH e não recria produto removido", async () => {
        const txCategoriaAusente = txBase({ categoria: { findUnique: vi.fn(async () => null) } });
        const adapterCategoria = new RepositorioProdutosPrisma(prismaFake(txCategoriaAusente));
        await expect(adapterCategoria.atualizarCampos(10, { categoriaId: 8 })).rejects.toEqual(new ErroDeValidacao("Categoria não encontrada"));
        expect(txCategoriaAusente.produto.updateMany).not.toHaveBeenCalled();

        const txRemovido = txBase({ produto: { updateMany: vi.fn(async () => ({ count: 0 })) } });
        await expect(new RepositorioProdutosPrisma(prismaFake(txRemovido)).atualizarCampos(10, { ativo: false })).resolves.toBe(false);
    });

    it("traduz colisão do índice único para conflito de domínio", async () => {
        const tx = txBase({ produto: { create: vi.fn(async () => { throw { code: "P2002" }; }) } });
        const adapter = new RepositorioProdutosPrisma(prismaFake(tx));
        await expect(adapter.salvar(Produto.criar({ nome: "Xis", categoriaId: 3, preco: 10 }))).rejects.toEqual(new ConflitoDeDados("Já existe um produto com esse nome nesta categoria"));
    });

    it("filtra e ordena produtos por ordem da categoria, nome e id, convertendo centavos", async () => {
        const findMany = vi.fn(async () => [
            registro({ id: 2, nome: "Xis", categoria: { id: 2, nome: "Lanches", ordem: 2, ativo: true } }),
            registro({ id: 8, nome: "Água", categoria: { id: 1, nome: "Bebidas", ordem: 1, ativo: true } }),
            registro({ id: 3, nome: "Xis", categoria: { id: 2, nome: "Lanches", ordem: 2, ativo: true } }),
        ]);
        const adapter = new ConsultaProdutosPrisma({ produto: { findMany } } as unknown as PrismaClient);
        const produtos = await adapter.listar({ ativo: false, categoriaId: 2 });

        expect(findMany).toHaveBeenCalledWith({ where: { categoriaId: 2, ativo: false }, include: { categoria: true } });
        expect(produtos.map((p) => p.id)).toEqual([8, 2, 3]);
        expect(produtos[0].preco).toBe(32.9);
        expect(produtos[0].adicionais).toEqual([{ nome: "Queijo extra", preco: 4.1 }]);
    });

    it("cardápio consulta somente produtos e categorias ativos e mapeia valores públicos em reais", async () => {
        const findMany = vi.fn(async () => [registro()]);
        const adapter = new ConsultaCardapioPrisma({ produto: { findMany } } as unknown as PrismaClient);
        await expect(adapter.listarItensAtivos()).resolves.toEqual([{
            categoria: { id: 3, nome: "Xis", ordem: 2 },
            produto: { id: 10, nome: "Xis Carne", descricao: null, preco: 32.9, ingredientes: ["cebola", "tomate"], adicionais: [{ nome: "Queijo extra", preco: 4.1 }] },
        }]);
        expect(findMany).toHaveBeenCalledWith({ where: { ativo: true, categoria: { is: { ativo: true } } }, include: { categoria: true } });
    });

    it("consulta categoria pelo id para validações do caso de uso", async () => {
        const findUnique = vi.fn(async () => ({ id: 3, nome: "Xis" }));
        const adapter = new CategoriasDoCardapioPrisma({ categoria: { findUnique } } as unknown as PrismaClient);
        await expect(adapter.buscarPorId(3)).resolves.toEqual({ id: 3, nome: "Xis" });
        expect(findUnique).toHaveBeenCalledWith({ where: { id: 3 }, select: { id: true, nome: true } });
    });
});
