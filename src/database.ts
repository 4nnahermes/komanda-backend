import { AppDataSource } from "./data-source";
import { InicializadorDeBanco } from "./database-initializer";

const inicializador = new InicializadorDeBanco(AppDataSource);

export function inicializarBanco() {
    return inicializador.inicializar();
}
