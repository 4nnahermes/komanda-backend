import { Router } from "express";
import { DataSource } from "typeorm";
import { ConsultaCardapio } from "../aplicacao/cardapio/cardapio/consulta-cardapio";
import { ConsultarCardapio } from "../aplicacao/cardapio/cardapio/consultar-cardapio";
import { ConsultaCardapioTypeorm } from "../infraestrutura/typeorm/cardapio/consulta-cardapio-typeorm";
import { CardapioController } from "../interfaces/http/cardapio/cardapio-controller";
import { cardapioRotas } from "../interfaces/http/cardapio/cardapio-rotas";

// Monta o módulo do cardápio (US03). Recebe a consulta pronta para que
// os testes possam usar uma implementação em memória no lugar do banco.
export function montarRotasCardapio(consulta: ConsultaCardapio): Router {
    return cardapioRotas(new CardapioController(new ConsultarCardapio(consulta)));
}

export function consultaCardapioTypeorm(dataSource: DataSource): ConsultaCardapio {
    return new ConsultaCardapioTypeorm(dataSource);
}
