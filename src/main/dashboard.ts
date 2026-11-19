import { PrismaClient } from "@prisma/client";
import { ConsultaDashboard } from "../aplicacao/dashboard/consulta-dashboard";
import { ConsultarMetricas } from "../aplicacao/dashboard/consultar-metricas";
import { FecharCaixa } from "../aplicacao/dashboard/fechar-caixa";
import { ConsultaDashboardPrisma } from "../infraestrutura/prisma/dashboard/consulta-dashboard-prisma";
import { DashboardController } from "../interfaces/http/dashboard/dashboard-controller";
import { caixaRotas, dashboardRotas } from "../interfaces/http/dashboard/dashboard-rotas";

export interface DependenciasDashboard {
    consulta: ConsultaDashboard;
    // Permite fixar a hora nos testes.
    agora?: () => Date;
}

export function montarRotasDashboard({ consulta, agora }: DependenciasDashboard) {
    const controller = new DashboardController({
        metricas: new ConsultarMetricas(consulta, agora),
        fecharCaixa: new FecharCaixa(consulta, agora),
    });
    return { dashboard: dashboardRotas(controller), caixa: caixaRotas(controller) };
}

export function dependenciasDashboardPrisma(prisma: PrismaClient): DependenciasDashboard {
    return { consulta: new ConsultaDashboardPrisma(prisma) };
}
