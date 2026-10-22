import { PrismaClient } from "@prisma/client";
import { ConsultaCardapio, ItemAtivoDoCardapio } from "../../../aplicacao/cardapio/cardapio/consulta-cardapio";
import { reaisDoBanco } from "../compartilhado";

export class ConsultaCardapioPrisma implements ConsultaCardapio {
    constructor(private readonly prisma: PrismaClient) {}

    async listarItensAtivos(): Promise<ItemAtivoDoCardapio[]> {
        const produtos = await this.prisma.produto.findMany({
            where: { ativo: true, categoria: { is: { ativo: true } } },
            include: { categoria: true },
        });
        return produtos
            .sort((a, b) => a.categoria.ordem - b.categoria.ordem || a.nome.localeCompare(b.nome, "pt-BR") || a.id - b.id)
            .map((produto) => ({
                categoria: { id: produto.categoria.id, nome: produto.categoria.nome, ordem: produto.categoria.ordem },
                produto: {
                    id: produto.id,
                    nome: produto.nome,
                    descricao: produto.descricao,
                    preco: reaisDoBanco(produto.precoCentavos),
                    ingredientes: produto.ingredientes,
                    adicionais: produto.adicionais.map((adicional) => ({ nome: adicional.nome, preco: reaisDoBanco(adicional.precoCentavos) })),
                },
            }));
    }
}
