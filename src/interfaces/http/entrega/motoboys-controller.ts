import { Request, Response } from "express";
import { AtualizarMotoboy } from "../../../aplicacao/entrega/motoboys/atualizar-motoboy";
import { BuscarMotoboy } from "../../../aplicacao/entrega/motoboys/buscar-motoboy";
import { CriarMotoboy } from "../../../aplicacao/entrega/motoboys/criar-motoboy";
import { ExcluirMotoboy } from "../../../aplicacao/entrega/motoboys/excluir-motoboy";
import { ListarMotoboys } from "../../../aplicacao/entrega/motoboys/listar-motoboys";
import { MENSAGENS } from "../../../aplicacao/entrega/motoboys/mensagens";
import { RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { lerFiltroBooleano, lerId, validarCorpo } from "../validacao";
import { esquemaAlteracoesMotoboy, esquemaNovoMotoboy } from "./motoboys-esquemas";

export class MotoboysController {
    constructor(private readonly casos: { listar: ListarMotoboys; buscar: BuscarMotoboy; criar: CriarMotoboy; atualizar: AtualizarMotoboy; excluir: ExcluirMotoboy }) {}
    listar = async (req: Request, res: Response) => res.json(await this.casos.listar.executar({ ativo: lerFiltroBooleano(req.query.ativo, "ativo") }));
    buscar = async (req: Request, res: Response) => res.json(await this.casos.buscar.executar(this.id(req)));
    criar = async (req: Request, res: Response) => res.status(201).json(await this.casos.criar.executar(validarCorpo(esquemaNovoMotoboy, req.body)));
    atualizar = async (req: Request, res: Response) => res.json(await this.casos.atualizar.executar(this.id(req), validarCorpo(esquemaAlteracoesMotoboy, req.body)));
    excluir = async (req: Request, res: Response) => { await this.casos.excluir.executar(this.id(req)); res.status(204).send(); };
    private id(req: Request): number {
        const valor = req.params.id;
        if (typeof valor !== "string" || !/^\d+$/.test(valor)) throw new RecursoNaoEncontrado(MENSAGENS.motoboyNaoEncontrado);
        const id = Number(valor);
        if (!Number.isInteger(id) || id <= 0 || id > 2_147_483_647) throw new RecursoNaoEncontrado(MENSAGENS.motoboyNaoEncontrado);
        return lerId(valor, MENSAGENS.motoboyNaoEncontrado);
    }
}
