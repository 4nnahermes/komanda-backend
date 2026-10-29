import { Prisma, PrismaClient } from "@prisma/client";
import { Dinheiro } from "../../dominio/compartilhado/dinheiro";

export type ClienteTransacao = Prisma.TransactionClient;

export function normalizarNome(nome: string): string {
    return nome.trim().toLocaleLowerCase("pt-BR");
}

export function centavosParaBanco(reais: number): bigint {
    return BigInt(Dinheiro.deReais(reais).centavos);
}

export function reaisDoBanco(centavos: bigint): number {
    return Dinheiro.deCentavos(Number(centavos)).emReais;
}

export function ehUnicidade(erro: unknown): boolean {
    return typeof erro === "object" && erro !== null && "code" in erro && erro.code === "P2002";
}

export async function proximoId(tx: ClienteTransacao, chave: string): Promise<number> {
    const contador = await tx.contador.upsert({
        where: { chave }, create: { chave, valor: 1 }, update: { valor: { increment: 1 } },
    });
    return contador.valor;
}

function ehConflitoTransitorio(erro: unknown): boolean {
    if (typeof erro !== "object" || erro === null) return false;
    const dados = erro as { code?: string; meta?: { modelName?: string }; message?: string };
    if (dados.code === "P2034") return true;
    if (dados.code === "P2002" && dados.meta?.modelName === "Contador") return true;
    // O conector Mongo também pode encapsular WriteConflict como P2010/P2028.
    return (dados.code === "P2010" || dados.code === "P2028") &&
        /WriteConflict|TransientTransactionError|NoSuchTransaction/i.test(JSON.stringify(dados.meta) + dados.message);
}

export async function emTransacao<T>(
    cliente: PrismaClient,
    acao: (tx: ClienteTransacao) => Promise<T>,
    catalogo = false,
): Promise<T> {
    for (let tentativa = 0; ; tentativa++) {
        try {
            return await cliente.$transaction(async (tx) => {
                if (catalogo) {
                    // Todas as escritas do catálogo concorrem no mesmo documento.
                    // Assim não há corrida entre criar/mover produto e excluir categoria.
                    await tx.contador.upsert({
                        where: { chave: "lock:catalogo" },
                        create: { chave: "lock:catalogo", valor: 1 },
                        update: { valor: { increment: 1 } },
                    });
                }
                return acao(tx);
            }, { maxWait: 10_000, timeout: 15_000 });
        } catch (erro) {
            if (tentativa >= 8 || !ehConflitoTransitorio(erro)) throw erro;
            const atraso = Math.min(25 * (2 ** tentativa), 1000) * (0.75 + Math.random() / 2);
            await new Promise((resolve) => setTimeout(resolve, atraso));
        }
    }
}
