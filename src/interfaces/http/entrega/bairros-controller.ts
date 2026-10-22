import { Request, Response } from "express";
import { z } from "zod";
import { AtualizarBairro } from "../../../aplicacao/entrega/bairros/atualizar-bairro";
import { BuscarBairro } from "../../../aplicacao/entrega/bairros/buscar-bairro";
import { CriarBairro } from "../../../aplicacao/entrega/bairros/criar-bairro";
import { ExcluirBairro } from "../../../aplicacao/entrega/bairros/excluir-bairro";
import { ListarBairros } from "../../../aplicacao/entrega/bairros/listar-bairros";
import { MENSAGENS_BAIRROS } from "../../../aplicacao/entrega/bairros/mensagens";
import { ErroDeValidacao, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { lerFiltroBooleano, validarCorpo } from "../validacao";
import { esquemaAlteracoesBairro, esquemaNovoBairro } from "./bairros-esquemas";

export interface CasosDeUsoBairros {
    listar: ListarBairros;
    buscar: BuscarBairro;
    criar: CriarBairro;
    atualizar: AtualizarBairro;
    excluir: ExcluirBairro;
}

export class BairrosController {
    constructor(private readonly casos: CasosDeUsoBairros) {}
    listar = async (req: Request, res: Response) => {
        const ativo = lerFiltroBooleano(req.query.ativo, "ativo");
        res.json(await this.casos.listar.executar(ativo));
    };

    buscar = async (req: Request, res: Response) => {
        res.json(await this.casos.buscar.executar(this.lerId(req)));
    };

    criar = async (req: Request, res: Response) => {
        const dados = this.validarBairroCorpo(esquemaNovoBairro, req.body);
        res.status(201).json(await this.casos.criar.executar(dados));
    };

    atualizar = async (req: Request, res: Response) => {
        const id = this.lerId(req);
        const alteracoes = this.validarBairroCorpo(esquemaAlteracoesBairro, req.body);
        res.json(await this.casos.atualizar.executar(id, alteracoes));
    };

    excluir = async (req: Request, res: Response) => {
        await this.casos.excluir.executar(this.lerId(req));
        res.status(204).send();
    };

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
