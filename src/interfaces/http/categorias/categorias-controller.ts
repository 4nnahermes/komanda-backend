import { Request, Response } from "express";
import { AtualizarCategoria } from "../../../aplicacao/categorias/atualizar-categoria";
import { BuscarCategoria } from "../../../aplicacao/categorias/buscar-categoria";
import { CriarCategoria } from "../../../aplicacao/categorias/criar-categoria";
import { ExcluirCategoria } from "../../../aplicacao/categorias/excluir-categoria";
import { ListarCategorias } from "../../../aplicacao/categorias/listar-categorias";
import { ReordenarCategorias } from "../../../aplicacao/categorias/reordenar-categorias";
import { MENSAGENS_CATEGORIAS } from "../../../aplicacao/categorias/mensagens";
import { lerFiltroBooleano, lerId, validarCorpo } from "../validacao";
import { esquemaAlteracoesCategoria, esquemaNovaCategoria, esquemaOrdemCategorias } from "./categorias-esquemas";

export interface CasosDeUsoCategorias {
    listar: ListarCategorias;
    buscar: BuscarCategoria;
    criar: CriarCategoria;
    atualizar: AtualizarCategoria;
    excluir: ExcluirCategoria;
    reordenar: ReordenarCategorias;
}

export class CategoriasController {
    constructor(private readonly casosDeUso: CasosDeUsoCategorias) {}

    listar = async (req: Request, res: Response) => {
        res.json(await this.casosDeUso.listar.executar(lerFiltroBooleano(req.query.ativo, "ativo")));
    };

    buscar = async (req: Request, res: Response) => {
        res.json(await this.casosDeUso.buscar.executar(lerId(req.params.id, MENSAGENS_CATEGORIAS.categoriaNaoEncontrada)));
    };

    criar = async (req: Request, res: Response) => {
        const dados = validarCorpo(esquemaNovaCategoria, req.body);
        res.status(201).json(await this.casosDeUso.criar.executar(dados));
    };

    atualizar = async (req: Request, res: Response) => {
        const id = lerId(req.params.id, MENSAGENS_CATEGORIAS.categoriaNaoEncontrada);
        const dados = validarCorpo(esquemaAlteracoesCategoria, req.body);
        res.json(await this.casosDeUso.atualizar.executar(id, dados));
    };

    excluir = async (req: Request, res: Response) => {
        await this.casosDeUso.excluir.executar(lerId(req.params.id, MENSAGENS_CATEGORIAS.categoriaNaoEncontrada));
        res.status(204).send();
    };

    reordenar = async (req: Request, res: Response) => {
        const dados = validarCorpo(esquemaOrdemCategorias, req.body);
        res.json(await this.casosDeUso.reordenar.executar(dados.ids));
    };
}
