import express from "express";
import cors from "cors";
import { prisma } from "./infraestrutura/prisma/cliente";
import { healthRotas } from "./routes/health-router";
import { CategoriaService } from "./service/categoria-service";
import { CategoriaController } from "./controller/categoria-controller";
import { categoriaRotas } from "./routes/categoria-router";
import { tratarErros } from "./interfaces/http/tratar-erros";
import { dependenciasProdutosPrisma, montarRotasProdutos } from "./main/produtos";
import { consultaCardapioPrisma, montarRotasCardapio } from "./main/cardapio";
import { dependenciasBairrosPrisma, montarRotasBairros } from "./main/bairros";
import { dependenciasMotoboysPrisma, montarRotasMotoboys } from "./main/motoboys";
import { inicializarBanco } from "./database";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRotas());

// Em Vercel cada pedido pode iniciar uma execução fria. A promessa fica no
// módulo para compartilhar a conexão e a inicialização concorrente por instância.
app.use((_req, _res, next) => {
    void inicializarBanco().then(() => next()).catch(() => {
        _res.status(503).json({ erro: "Banco de dados indisponível" });
    });
});

// US01 — Cadastro de categorias
const categoriaController = new CategoriaController(new CategoriaService(prisma));
app.use("/api/categorias", categoriaRotas(categoriaController));

// US02 — Cadastro de produtos
app.use("/api/produtos", montarRotasProdutos(dependenciasProdutosPrisma(prisma)));

// US03 — Consulta do cardápio
app.use("/api/cardapio", montarRotasCardapio(consultaCardapioPrisma(prisma)));

// US06 — Cadastro de bairros e taxas de entrega
app.use("/api/bairros", montarRotasBairros(dependenciasBairrosPrisma(prisma)));
// Cadastro de motoboys
app.use("/api/motoboys", montarRotasMotoboys(dependenciasMotoboysPrisma(prisma)));

// Tratamento de erros: sempre o último middleware registrado.
app.use(tratarErros);

export default app;
