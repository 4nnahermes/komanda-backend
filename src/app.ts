import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { healthRotas } from "./routes/health-router";
import { CategoriaService } from "./service/categoria-service";
import { CategoriaController } from "./controller/categoria-controller";
import { categoriaRotas } from "./routes/categoria-router";
import { tratarErros } from "./interfaces/http/tratar-erros";
import { dependenciasProdutosTypeorm, montarRotasProdutos } from "./main/produtos";
import { consultaCardapioTypeorm, montarRotasCardapio } from "./main/cardapio";
import { dependenciasBairrosTypeorm, montarRotasBairros } from "./main/bairros";
import { dependenciasMotoboysTypeorm, montarRotasMotoboys } from "./main/motoboys";
import { inicializarBanco } from "./database";

export const app = express();

app.use(cors());
app.use(express.json());

// Em Vercel cada pedido pode iniciar uma execução fria. A promessa fica no
// módulo para compartilhar a conexão e a inicialização concorrente por instância.
app.use((_req, _res, next) => {
    void inicializarBanco().then(() => next()).catch(next);
});

app.use("/health", healthRotas());

// US01 — Cadastro de categorias
const categoriaController = new CategoriaController(new CategoriaService(AppDataSource));
app.use("/api/categorias", categoriaRotas(categoriaController));

// US02 — Cadastro de produtos
app.use("/api/produtos", montarRotasProdutos(dependenciasProdutosTypeorm(AppDataSource)));

// US03 — Consulta do cardápio
app.use("/api/cardapio", montarRotasCardapio(consultaCardapioTypeorm(AppDataSource)));

// US06 — Cadastro de bairros e taxas de entrega
app.use("/api/bairros", montarRotasBairros(dependenciasBairrosTypeorm(AppDataSource)));
// Cadastro de motoboys
app.use("/api/motoboys", montarRotasMotoboys(dependenciasMotoboysTypeorm(AppDataSource)));

// Tratamento de erros: sempre o último middleware registrado.
app.use(tratarErros);

export default app;
