import { Response } from "express";

// Erro de regra de negócio com o código HTTP que a API deve devolver.
// O service lança, o controller transforma em { "erro": "mensagem" }.
export class ErroApi extends Error {
    constructor(public status: number, mensagem: string) {
        super(mensagem);
    }
}

export function responderErro(res: Response, erro: unknown) {
    if (erro instanceof ErroApi) {
        res.status(erro.status).json({ erro: erro.message });
        return;
    }
    console.error(erro);
    res.status(500).json({ erro: "Erro inesperado no servidor" });
}
