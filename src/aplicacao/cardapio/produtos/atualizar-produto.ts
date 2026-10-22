import { CategoriasDoCardapio } from "../../../dominio/cardapio/categorias-do-cardapio";
import { AlteracoesProduto, Produto } from "../../../dominio/cardapio/produto";
import { RepositorioProdutos } from "../../../dominio/cardapio/repositorio-produtos";
import { ConflitoDeDados, ErroDeValidacao, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { BuscarProduto } from "./buscar-produto";
import { ConsultaProdutos, ProdutoDetalhado } from "./consulta-produtos";
import { MENSAGENS } from "./mensagens";

export class AtualizarProduto {
    private readonly buscarProduto: BuscarProduto;

    constructor(
        private readonly repositorio: RepositorioProdutos,
        private readonly categorias: CategoriasDoCardapio,
        consulta: ConsultaProdutos,
    ) {
        this.buscarProduto = new BuscarProduto(consulta);
    }

    async executar(id: number, alteracoes: AlteracoesProduto): Promise<ProdutoDetalhado> {
        if (Object.values(alteracoes).every((valor) => valor === undefined)) {
            throw new ErroDeValidacao(MENSAGENS.nadaParaAlterar);
        }

        const produto = await this.repositorio.buscarPorId(id);
        if (!produto) {
            throw new RecursoNaoEncontrado(MENSAGENS.produtoNaoEncontrado);
        }

        this.aplicar(produto, alteracoes);
        await this.garantirCategoriaExistente(produto, alteracoes);
        await this.garantirNomeLivre(id, produto, alteracoes);

        if (!(await this.repositorio.atualizarCampos(id, this.normalizarCampos(produto, alteracoes)))) {
            throw new RecursoNaoEncontrado(MENSAGENS.produtoNaoEncontrado);
        }
        return this.buscarProduto.executar(id);
    }

    private normalizarCampos(produto: Produto, alteracoes: AlteracoesProduto): AlteracoesProduto {
        const campos: AlteracoesProduto = {};
        if (alteracoes.nome !== undefined) campos.nome = produto.nome;
        if (alteracoes.descricao !== undefined) campos.descricao = produto.descricao;
        if (alteracoes.preco !== undefined) campos.preco = produto.preco.emReais;
        if (alteracoes.categoriaId !== undefined) campos.categoriaId = produto.categoriaId;
        if (alteracoes.ativo !== undefined) campos.ativo = produto.ativo;
        if (alteracoes.ingredientes !== undefined) campos.ingredientes = produto.ingredientes;
        if (alteracoes.adicionais !== undefined) campos.adicionais = produto.adicionais;
        return campos;
    }

    private aplicar(produto: Produto, alteracoes: AlteracoesProduto): void {
        if (alteracoes.nome !== undefined) produto.renomear(alteracoes.nome);
        if (alteracoes.descricao !== undefined) produto.alterarDescricao(alteracoes.descricao);
        if (alteracoes.preco !== undefined) produto.alterarPreco(alteracoes.preco);
        if (alteracoes.categoriaId !== undefined) produto.moverParaCategoria(alteracoes.categoriaId);
        if (alteracoes.ativo !== undefined) produto.definirAtivo(alteracoes.ativo);
        if (alteracoes.ingredientes !== undefined) produto.alterarIngredientes(alteracoes.ingredientes);
        if (alteracoes.adicionais !== undefined) produto.alterarAdicionais(alteracoes.adicionais);
    }

    private async garantirCategoriaExistente(produto: Produto, alteracoes: AlteracoesProduto): Promise<void> {
        if (alteracoes.categoriaId === undefined) return;
        if (!(await this.categorias.buscarPorId(produto.categoriaId))) {
            throw new ErroDeValidacao(MENSAGENS.categoriaNaoEncontrada);
        }
    }

    // O nome só pode repetir em outra categoria. Mudar o nome ou a categoria exige conferir de novo.
    private async garantirNomeLivre(id: number, produto: Produto, alteracoes: AlteracoesProduto): Promise<void> {
        if (alteracoes.nome === undefined && alteracoes.categoriaId === undefined) return;
        if (await this.repositorio.existeNaCategoria(produto.nome, produto.categoriaId, id)) {
            throw new ConflitoDeDados(MENSAGENS.nomeRepetido);
        }
    }
}
