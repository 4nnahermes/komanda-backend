import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { healthRotas } from "./routes/health-router";
import { CategoriaService } from "./service/categoria-service";
import { CategoriaController } from "./controller/categoria-controller";
import { categoriaRotas } from "./routes/categoria-router";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRotas());

// US01 — Cadastro de categorias
const categoriaController = new CategoriaController(new CategoriaService(AppDataSource));
app.use("/api/categorias", categoriaRotas(categoriaController));

// JSON inválido no corpo da requisição
app.use((erro: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (erro?.type === "entity.parse.failed") {
        res.status(400).json({ erro: "O corpo da requisição não é um JSON válido" });
        return;
    }
    next(erro);
});
