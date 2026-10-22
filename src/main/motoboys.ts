import { Router } from "express";
import { DataSource } from "typeorm";
import { AtualizarMotoboy } from "../aplicacao/entrega/motoboys/atualizar-motoboy";
import { BuscarMotoboy } from "../aplicacao/entrega/motoboys/buscar-motoboy";
import { CriarMotoboy } from "../aplicacao/entrega/motoboys/criar-motoboy";
import { ExcluirMotoboy } from "../aplicacao/entrega/motoboys/excluir-motoboy";
import { ListarMotoboys } from "../aplicacao/entrega/motoboys/listar-motoboys";
import { ConsultaMotoboys, RepositorioMotoboys } from "../dominio/entrega/repositorio-motoboys";
import { ConsultaMotoboysTypeorm, RepositorioMotoboysTypeorm } from "../infraestrutura/typeorm/entrega/repositorio-motoboys-typeorm";
import { MotoboysController } from "../interfaces/http/entrega/motoboys-controller";
import { motoboysRotas } from "../interfaces/http/entrega/motoboys-rotas";

export function montarRotasMotoboys(deps: { repositorio: RepositorioMotoboys; consulta: ConsultaMotoboys }): Router {
    const controller = new MotoboysController({ listar: new ListarMotoboys(deps.consulta), buscar: new BuscarMotoboy(deps.consulta), criar: new CriarMotoboy(deps.repositorio), atualizar: new AtualizarMotoboy(deps.repositorio, deps.consulta), excluir: new ExcluirMotoboy(deps.repositorio) });
    return motoboysRotas(controller);
}
export function dependenciasMotoboysTypeorm(dataSource: DataSource) {
    return { repositorio: new RepositorioMotoboysTypeorm(dataSource), consulta: new ConsultaMotoboysTypeorm(dataSource) };
}
