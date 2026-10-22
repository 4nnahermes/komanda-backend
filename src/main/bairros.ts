import { Router } from "express";
import { DataSource } from "typeorm";
import { AtualizarBairro } from "../aplicacao/entrega/bairros/atualizar-bairro";
import { BuscarBairro } from "../aplicacao/entrega/bairros/buscar-bairro";
import { CriarBairro } from "../aplicacao/entrega/bairros/criar-bairro";
import { ExcluirBairro } from "../aplicacao/entrega/bairros/excluir-bairro";
import { ListarBairros } from "../aplicacao/entrega/bairros/listar-bairros";
import { ConsultaBairros, RepositorioBairros } from "../dominio/entrega/repositorio-bairros";
import { ConsultasBairrosTypeorm } from "../infraestrutura/typeorm/entrega/consultas-bairros-typeorm";
import { RepositorioBairrosTypeorm } from "../infraestrutura/typeorm/entrega/repositorio-bairros-typeorm";
import { BairrosController } from "../interfaces/http/entrega/bairros-controller";
import { bairrosRotas } from "../interfaces/http/entrega/bairros-rotas";

export interface DependenciasBairros {
    repositorio: RepositorioBairros;
    consulta: ConsultaBairros;
}

export function montarRotasBairros({ repositorio, consulta }: DependenciasBairros): Router {
    const controller = new BairrosController({
        listar: new ListarBairros(consulta),
        buscar: new BuscarBairro(consulta),
        criar: new CriarBairro(repositorio, consulta),
        atualizar: new AtualizarBairro(repositorio, consulta),
        excluir: new ExcluirBairro(repositorio),
    });
    return bairrosRotas(controller);
}

export function dependenciasBairrosTypeorm(dataSource: DataSource): DependenciasBairros {
    return {
        repositorio: new RepositorioBairrosTypeorm(dataSource),
        consulta: new ConsultasBairrosTypeorm(dataSource),
    };
}
