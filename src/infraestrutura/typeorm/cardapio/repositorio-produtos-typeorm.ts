import { DataSource } from "typeorm";
import { Produto } from "../../../dominio/cardapio/produto";
import { RepositorioProdutos } from "../../../dominio/cardapio/repositorio-produtos";
import { Dinheiro } from "../../../dominio/compartilhado/dinheiro";
import { ConflitoDeDados } from "../../../dominio/compartilhado/erros";
import { MENSAGENS } from "../../../aplicacao/cardapio/produtos/mensagens";
import { Produto as ProdutoModelo } from "../../../entity/produto";
import { ehViolacaoDeChaveEstrangeira, ehViolacaoDeUnicidade } from "../erros-postgres";

export class RepositorioProdutosTypeorm implements RepositorioProdutos {
    constructor(private readonly dataSource: DataSource) {}

    private get modelos() {
        return this.dataSource.getRepository(ProdutoModelo);
    }

    async buscarPorId(id: number): Promise<Produto | null> {
        const modelo = await this.modelos.findOne({ where: { id }, relations: { categoria: true } });
        return modelo ? paraDominio(modelo) : null;
    }

    async existeNaCategoria(nome: string, categoriaId: number, ignorarId?: number): Promise<boolean> {
        const consulta = this.modelos
            .createQueryBuilder("produto")
            .where("produto.categoria_id = :categoriaId", { categoriaId })
            .andWhere("LOWER(produto.nome) = LOWER(:nome)", { nome });

        if (ignorarId !== undefined) {
            consulta.andWhere("produto.id != :ignorarId", { ignorarId });
        }
        return consulta.getExists();
    }

    async salvar(produto: Produto): Promise<number> {
        try {
            const salvo = await this.modelos.save(paraModelo(this.modelos.create(), produto));
            return salvo.id;
        } catch (erro) {
            // Dois cadastros simultâneos podem passar pela checagem de nome repetido;
            // o índice único do banco segura o segundo.
            if (ehViolacaoDeUnicidade(erro)) throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
            throw erro;
        }
    }

    async excluir(id: number): Promise<void> {
        try {
            await this.modelos.delete({ id });
        } catch (erro) {
            // Algum registro ainda aponta para o produto, como um item de pedido.
            if (ehViolacaoDeChaveEstrangeira(erro)) {
                throw new ConflitoDeDados(MENSAGENS.produtoJaVendido);
            }
            throw erro;
        }
    }
}

function paraDominio(modelo: ProdutoModelo): Produto {
    return Produto.restaurar({
        id: modelo.id,
        nome: modelo.nome,
        descricao: modelo.descricao,
        // O preço vem do banco em numeric(10,2); arredondar evita resíduo de ponto flutuante.
        preco: Dinheiro.deCentavos(Math.round(modelo.preco * 100)),
        categoriaId: modelo.categoria.id,
        ativo: modelo.ativo,
    });
}

function paraModelo(modelo: ProdutoModelo, produto: Produto): ProdutoModelo {
    if (produto.id !== null) modelo.id = produto.id;
    modelo.nome = produto.nome;
    modelo.descricao = produto.descricao;
    modelo.preco = produto.preco.emReais;
    modelo.ativo = produto.ativo;
    modelo.categoria = { id: produto.categoriaId } as ProdutoModelo["categoria"];
    return modelo;
}
