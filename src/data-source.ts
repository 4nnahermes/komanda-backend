import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";

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

export const AppDataSource = new DataSource({
    type: "postgres",
    ...conexao,
    // As tabelas são criadas pelas migrations (npm run migration:run),
    // assim o modelo fica versionado no repositório.
    synchronize: false,
    logging: false,
    entities: [__dirname + "/entity/*.{ts,js}"],
    migrations: [__dirname + "/migrations/*.{ts,js}"],
});
