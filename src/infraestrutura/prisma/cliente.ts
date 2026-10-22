import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Um único cliente/pool por instância Node, inclusive em invocações da Vercel.
// A URL é lida só no backend; não há conexão nem alteração de schema no import.
export const prisma = new PrismaClient({ log: [] });
