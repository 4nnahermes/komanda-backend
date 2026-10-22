import { Router } from "express";
import { CategoriasController } from "./categorias-controller";

export function categoriasRotas(controller: CategoriasController): Router {
    const router = Router();
    router.get("/", controller.listar);
    router.post("/", controller.criar);
    // Precisa vir antes de /:id.
    router.patch("/ordem", controller.reordenar);
    router.get("/:id", controller.buscar);
    router.patch("/:id", controller.atualizar);
    router.delete("/:id", controller.excluir);
    return router;
}
