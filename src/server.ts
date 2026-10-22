import "reflect-metadata";
import "dotenv/config";
import { inicializarBanco } from "./database";
import { app } from "./app";

const port = Number(process.env.PORT ?? 3000);

inicializarBanco()
    .then(() => {
        app.listen(port, () => {
            console.log(`Komanda API rodando em http://localhost:${port}`);
            console.log(`Verificação: http://localhost:${port}/health`);
        });
    })
    .catch((erro: Error) => {
        console.error("Não foi possível conectar ao banco. Confira o arquivo .env e se o PostgreSQL está rodando.");
        console.error(erro.message);
        process.exit(1);
    });
