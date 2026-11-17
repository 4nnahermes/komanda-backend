import { Request, Response } from "express";
import { AlterarStatusPedido } from "../../../aplicacao/pedidos/alterar-status-pedido";
import { BuscarPedido } from "../../../aplicacao/pedidos/buscar-pedido";
import { CriarPedido } from "../../../aplicacao/pedidos/criar-pedido";
import { ExcluirPedido } from "../../../aplicacao/pedidos/excluir-pedido";
import { ListarPedidos } from "../../../aplicacao/pedidos/listar-pedidos";
import { MENSAGENS } from "../../../aplicacao/pedidos/mensagens";
import { VincularMotoboy } from "../../../aplicacao/pedidos/vincular-motoboy";
import { ErroDeValidacao, RecursoNaoEncontrado } from "../../../dominio/compartilhado/erros";
import { ehNoiteValida } from "../../../dominio/pedidos/noite";
import { STATUS_PEDIDO, StatusPedido } from "../../../dominio/pedidos/pedido";
import { lerId, validarCorpo } from "../validacao";
import { esquemaMotoboyPedido, esquemaNovoPedido, esquemaStatusPedido } from "./pedidos-esquemas";

export interface CasosDeUsoPedidos {
    criar: CriarPedido;
    listar: ListarPedidos;
    buscar: BuscarPedido;
    alterarStatus: AlterarStatusPedido;
    vincularMotoboy: VincularMotoboy;
    excluir: ExcluirPedido;
}

export class PedidosController {
    constructor(private readonly casos: CasosDeUsoPedidos) {}

    criar = async (req: Request, res: Response) => {
        res.status(201).json(await this.casos.criar.executar(validarCorpo(esquemaNovoPedido, req.body)));
    };

    listar = async (req: Request, res: Response) => {
        res.json(await this.casos.listar.executar({ noite: lerNoite(req.query.noite), status: lerStatus(req.query.status) }));
    };

    buscar = async (req: Request, res: Response) => {
        res.json(await this.casos.buscar.executar(lerIdPedido(req)));
    };

    alterarStatus = async (req: Request, res: Response) => {
        const id = lerIdPedido(req);
        const { status } = validarCorpo(esquemaStatusPedido, req.body);
        res.json(await this.casos.alterarStatus.executar(id, status));
    };

    vincularMotoboy = async (req: Request, res: Response) => {
        const id = lerIdPedido(req);
        const { motoboyId } = validarCorpo(esquemaMotoboyPedido, req.body);
        res.json(await this.casos.vincularMotoboy.executar(id, motoboyId));
    };

    excluir = async (req: Request, res: Response) => {
        await this.casos.excluir.executar(lerIdPedido(req));
        res.status(204).send();
    };
}

function lerIdPedido(req: Request): number {
    const valor = req.params.id;
    if (typeof valor !== "string" || !/^\d+$/.test(valor)) throw new RecursoNaoEncontrado(MENSAGENS.pedidoNaoEncontrado);
    return lerId(valor, MENSAGENS.pedidoNaoEncontrado);
}

function lerNoite(valor: unknown): string | undefined {
    if (valor === undefined) return undefined;
    if (typeof valor !== "string" || !ehNoiteValida(valor)) {
        throw new ErroDeValidacao("O filtro noite deve estar no formato AAAA-MM-DD");
    }
    return valor;
}

function lerStatus(valor: unknown): StatusPedido | undefined {
    if (valor === undefined) return undefined;
    if (typeof valor !== "string" || !(STATUS_PEDIDO as readonly string[]).includes(valor)) {
        throw new ErroDeValidacao("O filtro status deve ser EM_PREPARO, PRONTO, ENTREGUE ou CANCELADO");
    }
    return valor as StatusPedido;
}
