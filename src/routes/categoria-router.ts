import { Router } from "express";
import { CategoriaController } from "../controller/categoria-controller";

export function categoriaRotas(controller: CategoriaController): Router {
    const router = Router();

    router.get("/", controller.listar);
    router.post("/", controller.inserir);

    // "/ordem" vem antes de "/:id" para não ser confundida com um id.
    router.patch("/ordem", controller.reordenar);

    router.get("/:id", controller.buscarPorId);
    router.patch("/:id", controller.atualizar);
    router.delete("/:id", controller.excluir);

    return router;
}
