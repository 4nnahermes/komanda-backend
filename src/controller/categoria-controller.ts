import { Request, Response } from "express";
import { CategoriaService } from "../service/categoria-service";
import { ErroApi, responderErro } from "../utils/erro-api";

export class CategoriaController {
    constructor(private service: CategoriaService) {}

    listar = async (req: Request, res: Response) => {
        try {
            const ativo = this.lerFiltroAtivo(req.query.ativo);
            res.json(await this.service.listar(ativo));
        } catch (erro) {
            responderErro(res, erro);
        }
    };

    buscarPorId = async (req: Request, res: Response) => {
        try {
            res.json(await this.service.buscarPorId(this.lerId(req)));
        } catch (erro) {
            responderErro(res, erro);
        }
    };

    inserir = async (req: Request, res: Response) => {
        try {
            const corpo = req.body ?? {};
            const categoria = await this.service.inserir({ nome: corpo.nome, ordem: corpo.ordem });
            res.status(201).json(categoria);
        } catch (erro) {
            responderErro(res, erro);
        }
    };

    atualizar = async (req: Request, res: Response) => {
        try {
            const corpo = req.body ?? {};
            const categoria = await this.service.atualizar(this.lerId(req), {
                nome: corpo.nome,
                ativo: corpo.ativo,
            });
            res.json(categoria);
        } catch (erro) {
            responderErro(res, erro);
        }
    };

    excluir = async (req: Request, res: Response) => {
        try {
            await this.service.excluir(this.lerId(req));
            res.status(204).send();
        } catch (erro) {
            responderErro(res, erro);
        }
    };

    reordenar = async (req: Request, res: Response) => {
        try {
            const corpo = req.body ?? {};
            res.json(await this.service.reordenar(corpo.ids));
        } catch (erro) {
            responderErro(res, erro);
        }
    };

    // Um id que não é número inteiro positivo não existe no banco.
    private lerId(req: Request): number {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new ErroApi(404, "Categoria não encontrada");
        }
        return id;
    }

    private lerFiltroAtivo(valor: unknown): boolean | undefined {
        if (valor === undefined) return undefined;
        if (valor === "true") return true;
        if (valor === "false") return false;
        throw new ErroApi(400, "O filtro ativo deve ser true ou false");
    }
}
