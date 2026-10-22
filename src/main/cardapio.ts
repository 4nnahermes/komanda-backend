import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ConsultaCardapio } from "../aplicacao/cardapio/cardapio/consulta-cardapio";
import { ConsultarCardapio } from "../aplicacao/cardapio/cardapio/consultar-cardapio";
import { ConsultaCardapioPrisma } from "../infraestrutura/prisma/cardapio/consulta-cardapio-prisma";
import { CardapioController } from "../interfaces/http/cardapio/cardapio-controller";
import { cardapioRotas } from "../interfaces/http/cardapio/cardapio-rotas";

// Monta o módulo do cardápio (US03). Recebe a consulta pronta para que
// os testes possam usar uma implementação em memória no lugar do banco.
export function montarRotasCardapio(consulta: ConsultaCardapio): Router {
    return cardapioRotas(new CardapioController(new ConsultarCardapio(consulta)));
}

export function consultaCardapioPrisma(prisma: PrismaClient): ConsultaCardapio {
    return new ConsultaCardapioPrisma(prisma);
}
