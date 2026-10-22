import { Request, Response } from "express";
import { z } from "zod";
import { AtualizarBairro, BuscarBairro, CriarBairro, ExcluirBairro, ListarBairros } from "../../../aplicacao/entrega/bairros/casos-de-uso";
import { MENSAGENS_BAIRROS } from "../../../aplicacao/entrega/bairros/mensagens";
import { RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { ErroDeValidacao } from "../../../dominio/compartilhado/erros";
import { lerFiltroBooleano, validarCorpo } from "../validacao";
import { esquemaAlteracoesBairro, esquemaNovoBairro } from "./bairros-esquemas";

export interface CasosDeUsoBairros { listar: ListarBairros; buscar: BuscarBairro; criar: CriarBairro; atualizar: AtualizarBairro; excluir: ExcluirBairro; }

export class BairrosController {
    constructor(private readonly casos: CasosDeUsoBairros) {}
    listar = async (req: Request, res: Response) => res.json(await this.casos.listar.executar(lerFiltroBooleano(req.query.ativo, "ativo")));
    buscar = async (req: Request, res: Response) => res.json(await this.casos.buscar.executar(this.lerId(req)));
    criar = async (req: Request, res: Response) => res.status(201).json(await this.casos.criar.executar(this.validarBairroCorpo(esquemaNovoBairro, req.body)));
    atualizar = async (req: Request, res: Response) => res.json(await this.casos.atualizar.executar(this.lerId(req), this.validarBairroCorpo(esquemaAlteracoesBairro, req.body)));
    excluir = async (req: Request, res: Response) => { await this.casos.excluir.executar(this.lerId(req)); res.status(204).send(); };
    private lerId(req: Request): number {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1 || id > 2_147_483_647) {
            throw new RecursoNaoEncontrado(MENSAGENS_BAIRROS.naoEncontrado);
        }
        return id;
    }

    private validarBairroCorpo<T extends z.ZodType>(esquema: T, corpo: unknown): z.infer<T> {
        if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) {
            throw new ErroDeValidacao("O corpo da requisição deve ser um objeto JSON");
        }
        return validarCorpo(esquema, corpo);
    }
}
