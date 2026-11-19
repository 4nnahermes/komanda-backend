import { Request, Response } from "express";
import { ConsultarMetricas } from "../../../aplicacao/dashboard/consultar-metricas";
import { FecharCaixa } from "../../../aplicacao/dashboard/fechar-caixa";
import { ErroDeValidacao } from "../../../dominio/compartilhado/erros";
import { ehNoiteValida } from "../../../dominio/pedidos/noite";

export class DashboardController {
    constructor(private readonly casos: { metricas: ConsultarMetricas; fecharCaixa: FecharCaixa }) {}

    metricas = async (req: Request, res: Response) => {
        res.json(await this.casos.metricas.executar({
            inicio: lerNoite(req.query.inicio, "inicio"),
            fim: lerNoite(req.query.fim, "fim"),
        }));
    };

    fechamento = async (req: Request, res: Response) => {
        res.json(await this.casos.fecharCaixa.executar(lerNoite(req.query.noite, "noite")));
    };
}

function lerNoite(valor: unknown, nome: string): string | undefined {
    if (valor === undefined) return undefined;
    if (typeof valor !== "string" || !ehNoiteValida(valor)) {
        throw new ErroDeValidacao(`O filtro ${nome} deve estar no formato AAAA-MM-DD`);
    }
    return valor;
}
