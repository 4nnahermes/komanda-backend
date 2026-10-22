import { Router } from "express";
import { DataSource } from "typeorm";
import { AtualizarCategoria } from "../aplicacao/categorias/atualizar-categoria";
import { BuscarCategoria } from "../aplicacao/categorias/buscar-categoria";
import { CriarCategoria } from "../aplicacao/categorias/criar-categoria";
import { ExcluirCategoria } from "../aplicacao/categorias/excluir-categoria";
import { ListarCategorias } from "../aplicacao/categorias/listar-categorias";
import { ReordenarCategorias } from "../aplicacao/categorias/reordenar-categorias";
import { RepositorioCategorias } from "../dominio/categorias/repositorio-categorias";
import { RepositorioCategoriasTypeorm } from "../infraestrutura/typeorm/categorias/repositorio-categorias-typeorm";
import { CategoriasController } from "../interfaces/http/categorias/categorias-controller";
import { categoriasRotas } from "../interfaces/http/categorias/categorias-rotas";

export function montarRotasCategorias(repositorio: RepositorioCategorias): Router {
    const controller = new CategoriasController({
        listar: new ListarCategorias(repositorio),
        buscar: new BuscarCategoria(repositorio),
        criar: new CriarCategoria(repositorio),
        atualizar: new AtualizarCategoria(repositorio),
        excluir: new ExcluirCategoria(repositorio),
        reordenar: new ReordenarCategorias(repositorio),
    });
    return categoriasRotas(controller);
}

export function dependenciasCategoriasTypeorm(dataSource: DataSource): RepositorioCategorias {
    return new RepositorioCategoriasTypeorm(dataSource);
}
