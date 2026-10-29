import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AtualizarProduto } from "../aplicacao/cardapio/produtos/atualizar-produto";
import { BuscarProduto } from "../aplicacao/cardapio/produtos/buscar-produto";
import { ConsultaProdutos } from "../aplicacao/cardapio/produtos/consulta-produtos";
import { CriarProduto } from "../aplicacao/cardapio/produtos/criar-produto";
import { ExcluirProduto } from "../aplicacao/cardapio/produtos/excluir-produto";
import { ListarProdutos } from "../aplicacao/cardapio/produtos/listar-produtos";
import { CategoriasDoCardapio } from "../dominio/cardapio/categorias-do-cardapio";
import { RepositorioProdutos } from "../dominio/cardapio/repositorio-produtos";
import { CategoriasDoCardapioPrisma } from "../infraestrutura/prisma/cardapio/categorias-do-cardapio-prisma";
import { ConsultaProdutosPrisma } from "../infraestrutura/prisma/cardapio/consulta-produtos-prisma";
import { RepositorioProdutosPrisma } from "../infraestrutura/prisma/cardapio/repositorio-produtos-prisma";
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

export function dependenciasProdutosPrisma(prisma: PrismaClient): DependenciasProdutos {
    return {
        repositorio: new RepositorioProdutosPrisma(prisma),
        consulta: new ConsultaProdutosPrisma(prisma),
        categorias: new CategoriasDoCardapioPrisma(prisma),
    };
}
