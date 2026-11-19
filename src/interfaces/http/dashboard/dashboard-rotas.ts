import { Router } from "express";
import { DashboardController } from "./dashboard-controller";

export function dashboardRotas(controller: DashboardController): Router {
    const router = Router();
    router.get("/metricas", controller.metricas);
    return router;
}

export function caixaRotas(controller: DashboardController): Router {
    const router = Router();
    router.get("/fechamento", controller.fechamento);
    return router;
}
