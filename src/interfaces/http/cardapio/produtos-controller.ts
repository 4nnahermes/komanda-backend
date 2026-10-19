import { Request, Response } from "express";
import { AtualizarProduto } from "../../../aplicacao/cardapio/produtos/atualizar-produto";
import { BuscarProduto } from "../../../aplicacao/cardapio/produtos/buscar-produto";
import { CriarProduto } from "../../../aplicacao/cardapio/produtos/criar-produto";
import { ExcluirProduto } from "../../../aplicacao/cardapio/produtos/excluir-produto";
import { ListarProdutos } from "../../../aplicacao/cardapio/produtos/listar-produtos";
import { MENSAGENS } from "../../../aplicacao/cardapio/produtos/mensagens";
import { lerFiltroBooleano, lerFiltroId, lerId, validarCorpo } from "../validacao";
import { esquemaAlteracoesProduto, esquemaNovoProduto } from "./produtos-esquemas";

export interface CasosDeUsoProdutos {
    listar: ListarProdutos;
    buscar: BuscarProduto;
    criar: CriarProduto;
    atualizar: AtualizarProduto;
    excluir: ExcluirProduto;
}

// Traduz HTTP para os casos de uso. Os erros seguem para o middleware tratarErros.
export class ProdutosController {
    constructor(private readonly casosDeUso: CasosDeUsoProdutos) {}

    listar = async (req: Request, res: Response) => {
        const filtro = {
            categoriaId: lerFiltroId(req.query.categoriaId, "categoriaId"),
            ativo: lerFiltroBooleano(req.query.ativo, "ativo"),
        };
        res.json(await this.casosDeUso.listar.executar(filtro));
    };

    buscar = async (req: Request, res: Response) => {
        res.json(await this.casosDeUso.buscar.executar(this.lerIdDoProduto(req)));
    };

    criar = async (req: Request, res: Response) => {
        const dados = validarCorpo(esquemaNovoProduto, req.body);
        res.status(201).json(await this.casosDeUso.criar.executar(dados));
    };

    atualizar = async (req: Request, res: Response) => {
        const id = this.lerIdDoProduto(req);
        const alteracoes = validarCorpo(esquemaAlteracoesProduto, req.body);
        res.json(await this.casosDeUso.atualizar.executar(id, alteracoes));
    };

    excluir = async (req: Request, res: Response) => {
        await this.casosDeUso.excluir.executar(this.lerIdDoProduto(req));
        res.status(204).send();
    };

    private lerIdDoProduto(req: Request): number {
        return lerId(req.params.id, MENSAGENS.produtoNaoEncontrado);
    }
}
