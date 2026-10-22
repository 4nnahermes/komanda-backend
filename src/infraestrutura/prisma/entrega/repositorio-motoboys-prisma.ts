import { PrismaClient } from "@prisma/client";
import { MENSAGENS } from "../../../aplicacao/entrega/motoboys/mensagens";
import { Motoboy } from "../../../dominio/entrega/motoboy";
import { ConsultaMotoboys, FiltroMotoboys, RepositorioMotoboys } from "../../../dominio/entrega/repositorio-motoboys";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { ConflitoDeDados, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { centavosParaBanco, ehUnicidade, emTransacao, normalizarNome, proximoId } from "../compartilhado";

export class RepositorioMotoboysPrisma implements RepositorioMotoboys {
    constructor(private readonly prisma: PrismaClient) {}

    async buscarPorId(id: number): Promise<Motoboy | null> {
        const registro = await this.prisma.motoboy.findUnique({ where: { id } });
        return registro ? paraDominio(registro) : null;
    }

    async existePorNome(nome: string, ignorarId?: number): Promise<boolean> {
        return (await this.prisma.motoboy.findFirst({
            where: { nomeNormalizado: normalizarNome(nome), ...(ignorarId === undefined ? {} : { id: { not: ignorarId } }) },
            select: { id: true },
        })) !== null;
    }

    async salvar(motoboy: Motoboy): Promise<number> {
        try {
            return await emTransacao(this.prisma, async (tx) => {
                const id = await proximoId(tx, "motoboys");
                await tx.motoboy.create({ data: {
                    id,
                    nome: motoboy.nome.trim(),
                    nomeNormalizado: normalizarNome(motoboy.nome),
                    telefone: motoboy.telefone,
                    valorFixoNoiteCentavos: centavosParaBanco(motoboy.valorFixoNoite.emReais),
                    ativo: motoboy.ativo,
                } });
                return id;
            });
        } catch (erro) {
            if (ehUnicidade(erro)) throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
            throw erro;
        }
    }

    async atualizar(id: number, campos: Partial<{ nome: string; telefone: string | null; valorFixoNoite: number; ativo: boolean }>): Promise<boolean> {
        const data: { nome?: string; nomeNormalizado?: string; telefone?: string | null; valorFixoNoiteCentavos?: bigint; ativo?: boolean } = {};
        if (campos.nome !== undefined) {
            data.nome = campos.nome.trim();
            data.nomeNormalizado = normalizarNome(campos.nome);
        }
        if (campos.telefone !== undefined) data.telefone = campos.telefone;
        if (campos.valorFixoNoite !== undefined) data.valorFixoNoiteCentavos = centavosParaBanco(campos.valorFixoNoite);
        if (campos.ativo !== undefined) data.ativo = campos.ativo;
        try {
            const resultado = await this.prisma.motoboy.updateMany({ where: { id }, data });
            return resultado.count > 0;
        } catch (erro) {
            if (ehUnicidade(erro)) throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
            throw erro;
        }
    }

    async excluir(id: number): Promise<boolean> {
        const resultado = await this.prisma.motoboy.deleteMany({ where: { id } });
        return resultado.count > 0;
    }
}

export class ConsultaMotoboysPrisma implements ConsultaMotoboys {
    constructor(private readonly prisma: PrismaClient) {}

    async listar(filtro: FiltroMotoboys): Promise<Motoboy[]> {
        const registros = await this.prisma.motoboy.findMany({
            where: filtro.ativo === undefined ? undefined : { ativo: filtro.ativo },
            orderBy: [{ nome: "asc" }, { id: "asc" }],
        });
        return registros.map(paraDominio);
    }

    async buscarPorId(id: number): Promise<Motoboy | null> {
        const registro = await this.prisma.motoboy.findUnique({ where: { id } });
        return registro ? paraDominio(registro) : null;
    }
}

function paraDominio(registro: { id: number; nome: string; telefone: string | null; valorFixoNoiteCentavos: bigint; ativo: boolean }): Motoboy {
    return Motoboy.restaurar({
        id: registro.id,
        nome: registro.nome,
        telefone: registro.telefone,
        valorFixoNoite: Dinheiro.deCentavos(Number(registro.valorFixoNoiteCentavos)),
        ativo: registro.ativo,
    });
}

