import express from "express";
import cors from "cors";
import { healthRotas } from "./routes/health-router";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRotas());

// As rotas do Komanda entram aqui a partir da Sprint 2, por exemplo:
// app.use("/api/categorias", categoriaRotas(categoriaController));
