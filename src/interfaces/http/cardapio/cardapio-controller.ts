import { Request, Response } from "express";
import { ConsultarCardapio } from "../../../aplicacao/cardapio/cardapio/consultar-cardapio";

export class CardapioController {
    constructor(private readonly consultarCardapio: ConsultarCardapio) {}

    consultar = async (req: Request, res: Response) => {
        res.json(await this.consultarCardapio.executar());
    };
}
