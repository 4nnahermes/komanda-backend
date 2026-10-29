import { PrismaClient } from "@prisma/client";
import { MENSAGENS_BAIRROS } from "../../../aplicacao/entrega/bairros/mensagens";
import { Bairro } from "../../../dominio/entrega/bairro";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { ConflitoDeDados, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { BairroApi, ConsultaBairros, RepositorioBairros } from "../../../dominio/entrega/repositorio-bairros";
import { centavosParaBanco, ehUnicidade, emTransacao, normalizarNome, proximoId, reaisDoBanco } from "../compartilhado";

export class RepositorioBairrosPrisma implements RepositorioBairros {
    constructor(private readonly prisma: PrismaClient) {}

    async buscarPorId(id: number): Promise<Bairro | null> {
        const registro = await this.prisma.bairro.findUnique({ where: { id } });
        return registro ? paraDominio(registro) : null;
    }

    async existeComNome(nome: string, ignorarId?: number): Promise<boolean> {
        return (await this.prisma.bairro.findFirst({
            where: { nomeNormalizado: normalizarNome(nome), ...(ignorarId === undefined ? {} : { id: { not: ignorarId } }) },
            select: { id: true },
        })) !== null;
    }

    async salvar(bairro: Bairro, camposAlterados?: Array<"nome" | "taxaEntrega" | "ativo">): Promise<number> {
        try {
            if (bairro.id !== null) {
                const data: { nome?: string; nomeNormalizado?: string; taxaEntregaCentavos?: bigint; ativo?: boolean } = {};
                if (camposAlterados?.includes("nome")) {
                    data.nome = bairro.nome.trim();
                    data.nomeNormalizado = normalizarNome(bairro.nome);
                }
                if (camposAlterados?.includes("taxaEntrega")) data.taxaEntregaCentavos = centavosParaBanco(bairro.taxaEntrega.emReais);
                if (camposAlterados?.includes("ativo")) data.ativo = bairro.ativo;
                const resultado = await this.prisma.bairro.updateMany({ where: { id: bairro.id }, data });
                if (resultado.count === 0) throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
                return bairro.id;
            }

            return await emTransacao(this.prisma, async (tx) => {
                const id = await proximoId(tx, "bairros");
                await tx.bairro.create({ data: {
                    id,
                    nome: bairro.nome.trim(),
                    nomeNormalizado: normalizarNome(bairro.nome),
                    taxaEntregaCentavos: centavosParaBanco(bairro.taxaEntrega.emReais),
                    ativo: bairro.ativo,
                } });
                return id;
            });
        } catch (erro) {
            if (ehUnicidade(erro)) throw new ConflitoDeDados(MENSAGENS_BAIRROS.nomeRepetido);
            throw erro;
        }
    }

    async excluir(id: number): Promise<void> {
        const resultado = await this.prisma.bairro.deleteMany({ where: { id } });
        if (resultado.count === 0) throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
    }
}

export class ConsultaBairrosPrisma implements ConsultaBairros {
    constructor(private readonly prisma: PrismaClient) {}

    async listar(ativo?: boolean): Promise<BairroApi[]> {
        const registros = await this.prisma.bairro.findMany({
            where: ativo === undefined ? undefined : { ativo },
            orderBy: [{ nome: "asc" }, { id: "asc" }],
        });
        return registros.map(paraApi);
    }

    async buscarPorId(id: number): Promise<BairroApi | null> {
        const registro = await this.prisma.bairro.findUnique({ where: { id } });
        return registro ? paraApi(registro) : null;
    }
}

function paraDominio(registro: { id: number; nome: string; taxaEntregaCentavos: bigint; ativo: boolean }): Bairro {
    return Bairro.restaurar({ id: registro.id, nome: registro.nome, taxaEntrega: Dinheiro.deCentavos(Number(registro.taxaEntregaCentavos)), ativo: registro.ativo });
}

function paraApi(registro: { id: number; nome: string; taxaEntregaCentavos: bigint; ativo: boolean }): BairroApi {
    return { id: registro.id, nome: registro.nome, taxaEntrega: reaisDoBanco(registro.taxaEntregaCentavos), ativo: registro.ativo };
}
