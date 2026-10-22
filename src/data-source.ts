import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { Bairro } from "./entity/bairro";
import { Categoria } from "./entity/categoria";
import { Motoboy } from "./entity/motoboy";
import { Produto } from "./entity/produto";
import { CriaCategoriaEProduto1791330933298 } from "./migrations/1791330933298-CriaCategoriaEProduto";
import { CriaBairro1792620000000 } from "./migrations/1792620000000-CriaBairro";
import { CriaMotoboy1792620001000 } from "./migrations/1792620001000-CriaMotoboy";
import { CamposCatalogoFrontend1792620003000 } from "./migrations/1792620003000-CamposCatalogoFrontend";

// Duas formas de conectar, escolhidas pelo .env:
// - Banco online (Neon, Supabase...): preencha DATABASE_URL. A conexão usa SSL.
// - Banco local: deixe DATABASE_URL vazio e preencha DB_HOST, DB_USER etc.
const databaseUrl = process.env.DATABASE_URL;

const conexao = databaseUrl
    ? {
          url: databaseUrl,
          ssl: { rejectUnauthorized: false },
      }
    : {
          host: process.env.DB_HOST ?? "localhost",
          port: Number(process.env.DB_PORT ?? 5432),
          username: process.env.DB_USER ?? "postgres",
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME ?? "komanda",
      };

const poolMaxConfigurado = Number(process.env.DB_POOL_MAX ?? 2);
const poolMax = Number.isInteger(poolMaxConfigurado) && poolMaxConfigurado >= 1 && poolMaxConfigurado <= 10 ? poolMaxConfigurado : 2;

export const AppDataSource = new DataSource({
    type: "postgres",
    ...conexao,
    // As tabelas são criadas pelas migrations (npm run migration:run),
    // assim o modelo fica versionado no repositório.
    synchronize: false,
    logging: false,
    entities: [Bairro, Categoria, Motoboy, Produto],
    migrations: [
        CriaCategoriaEProduto1791330933298,
        CriaBairro1792620000000,
        CriaMotoboy1792620001000,
        CamposCatalogoFrontend1792620003000,
    ],
    extra: {
        max: poolMax,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
        allowExitOnIdle: true,
    },
});
