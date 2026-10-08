import { NextFunction, Request, Response } from "express";
import { ConflitoDeDados, ErroDeValidacao, RecursoNaoEncontrado } from "../../dominio/compartilhado/erros";

// Middleware único de erros, registrado por último no app.
// Traduz os erros do domínio para o código HTTP e para o formato
// { "erro": "mensagem" } do contrato da API. O Express 5 encaminha para cá
// os erros lançados nas rotas assíncronas, sem precisar de try/catch nas rotas.
export function tratarErros(erro: unknown, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        next(erro);
        return;
    }

    if (ehJsonInvalido(erro)) {
        res.status(400).json({ erro: "O corpo da requisição não é um JSON válido" });
        return;
    }

    const status = statusDoErroDeDominio(erro);
    if (status !== undefined) {
        res.status(status).json({ erro: (erro as Error).message });
        return;
    }

    console.error(erro);
    res.status(500).json({ erro: "Erro inesperado no servidor" });
}

function statusDoErroDeDominio(erro: unknown): number | undefined {
    if (erro instanceof ErroDeValidacao) return 400;
    if (erro instanceof RecursoNaoEncontrado) return 404;
    if (erro instanceof ConflitoDeDados) return 409;
    return undefined;
}

// Erro do express.json() quando o corpo não é um JSON válido.
function ehJsonInvalido(erro: unknown): boolean {
    return typeof erro === "object" && erro !== null && (erro as { type?: string }).type === "entity.parse.failed";
}
