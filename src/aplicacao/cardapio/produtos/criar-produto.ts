import { CategoriasDoCardapio } from "../../../dominio/cardapio/categorias-do-cardapio";
import { NovoProduto, Produto } from "../../../dominio/cardapio/produto";
import { RepositorioProdutos } from "../../../dominio/cardapio/repositorio-produtos";
import { ConflitoDeDados, ErroDeValidacao } from "../../../dominio/compartilhado/erros";
import { BuscarProduto } from "./buscar-produto";
import { ConsultaProdutos, ProdutoDetalhado } from "./consulta-produtos";
import { MENSAGENS } from "./mensagens";

// US02: cadastra um produto numa categoria existente, sem repetir o nome dentro dela.
export class CriarProduto {
    private readonly buscarProduto: BuscarProduto;

    constructor(
        private readonly repositorio: RepositorioProdutos,
        private readonly categorias: CategoriasDoCardapio,
        consulta: ConsultaProdutos,
    ) {
        this.buscarProduto = new BuscarProduto(consulta);
    }

    async executar(dados: NovoProduto): Promise<ProdutoDetalhado> {
        const produto = Produto.criar(dados);

        if (!(await this.categorias.buscarPorId(produto.categoriaId))) {
            throw new ErroDeValidacao(MENSAGENS.categoriaNaoEncontrada);
        }
        if (await this.repositorio.existeNaCategoria(produto.nome, produto.categoriaId)) {
            throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
        }

        const id = await this.repositorio.salvar(produto);
        return this.buscarProduto.executar(id);
    }
}
