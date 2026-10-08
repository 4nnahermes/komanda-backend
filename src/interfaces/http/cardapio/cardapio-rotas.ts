import { Router } from "express";
import { CardapioController } from "./cardapio-controller";

export function cardapioRotas(controller: CardapioController): Router {
    const router = Router();
    router.get("/", controller.consultar);
    return router;
}
