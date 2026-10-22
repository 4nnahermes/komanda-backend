import { prisma } from "./infraestrutura/prisma/cliente";
import { InicializadorDeBanco } from "./database-initializer";

let conectado = false;
const inicializador = new InicializadorDeBanco({
    get isInitialized() { return conectado; },
    async initialize() {
        await prisma.$connect();
        conectado = true;
    },
});

export function inicializarBanco() {
    return inicializador.inicializar();
}
