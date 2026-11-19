import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AlterarStatusPedido } from "../aplicacao/pedidos/alterar-status-pedido";
import { BuscarPedido } from "../aplicacao/pedidos/buscar-pedido";
import { CriarPedido } from "../aplicacao/pedidos/criar-pedido";
import { ExcluirPedido } from "../aplicacao/pedidos/excluir-pedido";
import { ListarPedidos } from "../aplicacao/pedidos/listar-pedidos";
import { VincularMotoboy } from "../aplicacao/pedidos/vincular-motoboy";
import { CatalogoDoPedido } from "../dominio/pedidos/catalogo-do-pedido";
import { RepositorioPedidos } from "../dominio/pedidos/repositorio-pedidos";
import { CatalogoDoPedidoPrisma } from "../infraestrutura/prisma/pedidos/catalogo-do-pedido-prisma";
import { RepositorioPedidosPrisma } from "../infraestrutura/prisma/pedidos/repositorio-pedidos-prisma";
import { PedidosController } from "../interfaces/http/pedidos/pedidos-controller";
import { pedidosRotas } from "../interfaces/http/pedidos/pedidos-rotas";

export interface DependenciasPedidos {
    repositorio: RepositorioPedidos;
    catalogo: CatalogoDoPedido;
    // Permite fixar a hora nos testes.
    agora?: () => Date;
}

export function montarRotasPedidos({ repositorio, catalogo, agora }: DependenciasPedidos): Router {
    const controller = new PedidosController({
        criar: new CriarPedido(repositorio, catalogo, agora),
        listar: new ListarPedidos(repositorio, agora),
        buscar: new BuscarPedido(repositorio),
        alterarStatus: new AlterarStatusPedido(repositorio),
        vincularMotoboy: new VincularMotoboy(repositorio, catalogo),
        excluir: new ExcluirPedido(repositorio),
    });
    return pedidosRotas(controller);
}

export function dependenciasPedidosPrisma(prisma: PrismaClient): DependenciasPedidos {
    return {
        repositorio: new RepositorioPedidosPrisma(prisma),
        catalogo: new CatalogoDoPedidoPrisma(prisma),
    };
}
