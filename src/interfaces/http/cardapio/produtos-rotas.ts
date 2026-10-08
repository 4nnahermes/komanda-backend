import { Router } from "express";
import { ProdutosController } from "./produtos-controller";

export function produtosRotas(controller: ProdutosController): Router {
    const router = Router();

    router.get("/", controller.listar);
    router.post("/", controller.criar);
    router.get("/:id", controller.buscar);
    router.patch("/:id", controller.atualizar);
    router.delete("/:id", controller.excluir);

    return router;
}
