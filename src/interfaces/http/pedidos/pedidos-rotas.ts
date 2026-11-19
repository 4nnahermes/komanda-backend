import { Router } from "express";
import { PedidosController } from "./pedidos-controller";

export function pedidosRotas(controller: PedidosController): Router {
    const router = Router();
    router.get("/", controller.listar);
    router.post("/", controller.criar);
    router.get("/:id", controller.buscar);
    router.patch("/:id/status", controller.alterarStatus);
    router.patch("/:id/motoboy", controller.vincularMotoboy);
    router.delete("/:id", controller.excluir);
    return router;
}
