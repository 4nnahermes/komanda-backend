import { Router } from "express";
import { BairrosController } from "./bairros-controller";

export function bairrosRotas(controller: BairrosController): Router {
    const router = Router();
    router.get("/", controller.listar);
    router.post("/", controller.criar);
    router.get("/:id", controller.buscar);
    router.patch("/:id", controller.atualizar);
    router.delete("/:id", controller.excluir);
    return router;
}
