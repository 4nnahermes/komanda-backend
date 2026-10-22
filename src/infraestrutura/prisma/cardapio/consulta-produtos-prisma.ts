import { PrismaClient } from "@prisma/client";
import { ConsultaProdutos, FiltroProdutos, ProdutoDetalhado } from "../../../aplicacao/cardapio/produtos/consulta-produtos";
import { reaisDoBanco } from "../compartilhado";

export class ConsultaProdutosPrisma implements ConsultaProdutos {
    constructor(private readonly prisma: PrismaClient) {}

    async listar(filtro: FiltroProdutos): Promise<ProdutoDetalhado[]> {
        const registros = await this.prisma.produto.findMany({
            where: {
                ...(filtro.categoriaId === undefined ? {} : { categoriaId: filtro.categoriaId }),
                ...(filtro.ativo === undefined ? {} : { ativo: filtro.ativo }),
            },
            include: { categoria: true },
        });
        return registros.sort((a, b) => a.categoria.ordem - b.categoria.ordem || a.nome.localeCompare(b.nome, "pt-BR") || a.id - b.id).map(paraDetalhado);
    }

    async buscarPorId(id: number): Promise<ProdutoDetalhado | null> {
        const registro = await this.prisma.produto.findUnique({ where: { id }, include: { categoria: true } });
        return registro ? paraDetalhado(registro) : null;
    }
}

export function paraDetalhado(registro: {
    id: number; nome: string; descricao: string | null; precoCentavos: bigint; ativo: boolean;
    ingredientes: string[]; adicionais: { nome: string; precoCentavos: bigint }[];
    categoria: { id: number; nome: string; ordem: number };
}): ProdutoDetalhado {
    return {
        id: registro.id,
        nome: registro.nome,
        descricao: registro.descricao,
        preco: reaisDoBanco(registro.precoCentavos),
        ativo: registro.ativo,
        categoria: { id: registro.categoria.id, nome: registro.categoria.nome },
        ingredientes: registro.ingredientes,
        adicionais: registro.adicionais.map((adicional) => ({ nome: adicional.nome, preco: reaisDoBanco(adicional.precoCentavos) })),
    };
}
