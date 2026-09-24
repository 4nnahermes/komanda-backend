import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? "komanda",
    // As tabelas são criadas pelas migrations (npm run migration:run),
    // assim o modelo fica versionado no repositório.
    synchronize: false,
    logging: false,
    entities: [__dirname + "/entity/*.{ts,js}"],
    migrations: [__dirname + "/migrations/*.{ts,js}"],
});
