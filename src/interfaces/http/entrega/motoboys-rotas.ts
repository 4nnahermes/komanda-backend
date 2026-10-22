import { Router } from "express";
import { MotoboysController } from "./motoboys-controller";
export function motoboysRotas(controller: MotoboysController): Router {
    const router = Router();
    router.get("/", controller.listar); router.post("/", controller.criar); router.get("/:id", controller.buscar); router.patch("/:id", controller.atualizar); router.delete("/:id", controller.excluir);
    return router;
}
