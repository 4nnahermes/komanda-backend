import { describe, expect, it } from "vitest";
import { CategoriaService } from "../../src/service/categoria-service";

type CategoriaFake = { id: number; nome: string; nomeNormalizado: string; ordem: number; ativo: boolean };

function criarServico() {
    const categorias: CategoriaFake[] = [];
    let produtosReferenciados = 0;
    const contadores = new Map<string, number>();

    const casar = (args: any) => categorias.filter((categoria) => {
        if (typeof args.where?.id === "number" && categoria.id !== args.where.id) return false;
        if (args.where?.ativo !== undefined && categoria.ativo !== args.where.ativo) return false;
        if (args.where?.nomeNormalizado !== undefined && categoria.nomeNormalizado !== args.where.nomeNormalizado) return false;
        if (args.where?.id?.not !== undefined && categoria.id === args.where.id.not) return false;
        if (args.where?.ordem?.gte !== undefined && categoria.ordem < args.where.ordem.gte) return false;
        if (args.where?.ordem?.gt !== undefined && categoria.ordem <= args.where.ordem.gt) return false;
        return true;
    });

    const categoria = {
        findMany: async (args: any = {}) => {
            const encontrados = casar(args).slice();
            const ordem = Array.isArray(args.orderBy) ? args.orderBy : args.orderBy ? [args.orderBy] : [];
            encontrados.sort((a, b) => {
                for (const criterio of ordem) {
                    const campo = Object.keys(criterio)[0] as "ordem" | "id";
                    const comparacao = a[campo] - b[campo];
                    if (comparacao !== 0) return criterio[campo] === "desc" ? -comparacao : comparacao;
                }
                return 0;
            });
            return encontrados.map((item) => args.select ? { id: item.id } : { ...item });
        },
        findUnique: async ({ where }: any) => {
            const encontrado = categorias.find((item) =>
                where.id !== undefined ? item.id === where.id : item.nomeNormalizado === where.nomeNormalizado,
            );
            return encontrado ? { ...encontrado } : null;
        },
        findFirst: async (args: any) => {
            const encontrado = casar(args)[0];
            return encontrado ? { ...encontrado } : null;
        },
        count: async (args: any = {}) => casar(args).length,
        updateMany: async ({ where, data }: any) => {
            const encontrados = casar({ where });
            for (const item of encontrados) {
                for (const [campo, valor] of Object.entries(data)) {
                    if (campo === "ordem" && typeof valor === "object" && valor !== null && "increment" in valor) {
                        item.ordem += (valor as { increment: number }).increment;
                    } else if (campo === "ordem" && typeof valor === "object" && valor !== null && "decrement" in valor) {
                        item.ordem -= (valor as { decrement: number }).decrement;
                    } else {
                        (item as any)[campo] = valor;
                    }
                }
            }
            return { count: encontrados.length };
        },
        create: async ({ data }: any) => {
            if (categorias.some((item) => item.nomeNormalizado === data.nomeNormalizado)) throw { code: "P2002" };
            const criada = { ...data } as CategoriaFake;
            categorias.push(criada);
            return { ...criada };
        },
        deleteMany: async ({ where }: any) => {
            const index = categorias.findIndex((item) => item.id === where.id);
            if (index < 0) return { count: 0 };
            categorias.splice(index, 1);
            return { count: 1 };
        },
    };

    const tx = {
        categoria,
        produto: { count: async () => produtosReferenciados },
        contador: {
            upsert: async ({ where, create, update }: any) => {
                const atual = contadores.get(where.chave);
                const novo = atual === undefined ? create.valor : atual + update.valor.increment;
                contadores.set(where.chave, novo);
                return { chave: where.chave, valor: novo };
            },
        },
    };
    const prisma = {
        categoria,
        $transaction: async (callback: (tx: any) => Promise<unknown>) => callback(tx),
    };
    const servico = new CategoriaService(prisma as never);
    return { servico, categorias, definirProdutos: (quantidade: number) => { produtosReferenciados = quantidade; } };
}

describe("CategoriaService com persistência Prisma", () => {
    it("preserva regras de criação, nomes únicos e DTOs sem campos internos", async () => {
        const { servico } = criarServico();
        await servico.inserir({ nome: "Xis" });
        await servico.inserir({ nome: "Bebidas" });
        const criada = await servico.inserir({ nome: "Bauru", ordem: 2 });

        expect(criada).toEqual({ id: 3, nome: "Bauru", ordem: 2, ativo: true });
        expect((await servico.listar()).map(({ nome }) => nome)).toEqual(["Xis", "Bauru", "Bebidas"]);
        await expect(servico.inserir({ nome: " bauru " })).rejects.toMatchObject({ status: 409 });
        await servico.atualizar(criada.id, { ativo: false });
        expect((await servico.listar(false)).map(({ nome }) => nome)).toEqual(["Bauru"]);
        expect((await servico.inserir({ nome: "Sobremesas", ordem: 2_147_483_648 })).ordem).toBe(4);
    });

    it("atualiza só campos enviados, valida reordenação sob transação e fecha a ordem ao excluir", async () => {
        const { servico, categorias } = criarServico();
        await servico.inserir({ nome: "Xis" });
        await servico.inserir({ nome: "Bebidas" });
        await servico.inserir({ nome: "Bauru" });
        const patch = await servico.atualizar(2, { nome: "Bebidas frias" });
        expect(patch).toEqual({ id: 2, nome: "Bebidas frias", ordem: 2, ativo: true });
        expect(categorias[1].ordem).toBe(2);

        const antes = await servico.listar();
        await expect(servico.reordenar([1, 1, 3])).rejects.toMatchObject({ status: 400 });
        expect(await servico.listar()).toEqual(antes);
        expect((await servico.reordenar([3, 1, 2])).map(({ id }) => id)).toEqual([3, 1, 2]);

        await servico.excluir(1);
        expect((await servico.listar()).map(({ ordem }) => ordem)).toEqual([1, 2]);
    });

    it("bloqueia exclusão com produtos e retorna 404 sem recriar registros", async () => {
        const { servico, definirProdutos, categorias } = criarServico();
        await servico.inserir({ nome: "Xis" });
        definirProdutos(1);
        await expect(servico.excluir(1)).rejects.toMatchObject({ status: 409 });
        expect(categorias).toHaveLength(1);
        definirProdutos(0);
        await servico.excluir(1);
        await expect(servico.atualizar(1, { ativo: false })).rejects.toMatchObject({ status: 404 });
        expect(categorias).toHaveLength(0);
    });
});
