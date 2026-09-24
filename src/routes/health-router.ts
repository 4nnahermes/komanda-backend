import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";

// Rota de verificação: confirma que a API está no ar e que o banco responde.
export function healthRotas(): Router {
    const router = Router();

    router.get("/", async (req: Request, res: Response) => {
        try {
            await AppDataSource.query("SELECT 1");
            res.json({ status: "ok", banco: "conectado", horario: new Date().toISOString() });
        } catch {
            res.status(503).json({ status: "erro", banco: "sem conexão" });
        }
    });

    return router;
}
