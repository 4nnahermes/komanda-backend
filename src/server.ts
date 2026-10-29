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
    .catch(() => {
        console.error("Não foi possível conectar ao MongoDB. Confira DATABASE_URL e o acesso ao replica set.");
        process.exit(1);
    });
