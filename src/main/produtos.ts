import { Router } from "express";
import { DataSource } from "typeorm";
import { AtualizarProduto } from "../aplicacao/cardapio/produtos/atualizar-produto";
import { BuscarProduto } from "../aplicacao/cardapio/produtos/buscar-produto";
import { ConsultaProdutos } from "../aplicacao/cardapio/produtos/consulta-produtos";
import { CriarProduto } from "../aplicacao/cardapio/produtos/criar-produto";
import { ExcluirProduto } from "../aplicacao/cardapio/produtos/excluir-produto";
import { ListarProdutos } from "../aplicacao/cardapio/produtos/listar-produtos";
import { CategoriasDoCardapio } from "../dominio/cardapio/categorias-do-cardapio";
import { RepositorioProdutos } from "../dominio/cardapio/repositorio-produtos";
import { CategoriasDoCardapioTypeorm } from "../infraestrutura/typeorm/cardapio/categorias-do-cardapio-typeorm";
import { ConsultaProdutosTypeorm } from "../infraestrutura/typeorm/cardapio/consulta-produtos-typeorm";
import { RepositorioProdutosTypeorm } from "../infraestrutura/typeorm/cardapio/repositorio-produtos-typeorm";
import { ProdutosController } from "../interfaces/http/cardapio/produtos-controller";
import { produtosRotas } from "../interfaces/http/cardapio/produtos-rotas";

export interface DependenciasProdutos {
    repositorio: RepositorioProdutos;
    consulta: ConsultaProdutos;
    categorias: CategoriasDoCardapio;
}

// Monta o módulo de produtos (US02). Recebe as dependências prontas para que
// os testes possam usar implementações em memória no lugar do banco.
export function montarRotasProdutos({ repositorio, consulta, categorias }: DependenciasProdutos): Router {
    const controller = new ProdutosController({
        listar: new ListarProdutos(consulta),
        buscar: new BuscarProduto(consulta),
        criar: new CriarProduto(repositorio, categorias, consulta),
        atualizar: new AtualizarProduto(repositorio, categorias, consulta),
        excluir: new ExcluirProduto(repositorio),
    });
    return produtosRotas(controller);
}

export function dependenciasProdutosTypeorm(dataSource: DataSource): DependenciasProdutos {
    return {
        repositorio: new RepositorioProdutosTypeorm(dataSource),
        consulta: new ConsultaProdutosTypeorm(dataSource),
        categorias: new CategoriasDoCardapioTypeorm(dataSource),
    };
}
