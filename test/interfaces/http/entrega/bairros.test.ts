import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Bairro } from "../../../../src/dominio/entrega/bairro";
import { BairroApi, ConsultaBairros, RepositorioBairros } from "../../../../src/dominio/entrega/repositorio-bairros";
import { ConflitoDeDados } from "../../../../src/dominio/compartilhado/erros";
import { Dinheiro } from "../../../../src/dominio/compartilhado/dinheiro";
import { montarRotasBairros } from "../../../../src/main/bairros";
import { tratarErros } from "../../../../src/interfaces/http/tratar-erros";
import { dependenciasBairrosPrisma } from "../../../../src/main/bairros";

class BairrosEmMemoria implements RepositorioBairros {
    private dados: BairroApi[] = [];
    private proximoId = 1;

    async buscarPorId(id: number): Promise<Bairro | null> {
        const bairro = this.dados.find((item) => item.id === id);
        if (!bairro) return null;
        return Bairro.restaurar({ ...bairro, taxaEntrega: Dinheiro.deReais(bairro.taxaEntrega) });
    }
    async existeComNome(nome: string, ignorarId?: number): Promise<boolean> {
        return this.dados.some((item) => item.id !== ignorarId && item.nome.toLocaleLowerCase() === nome.toLocaleLowerCase());
    }
    async salvar(bairro: Bairro): Promise<number> {
        if (await this.existeComNome(bairro.nome, bairro.id ?? undefined)) throw new ConflitoDeDados("Já existe um bairro com esse nome");
        const id = bairro.id ?? this.proximoId++;
        const api = { id, nome: bairro.nome, taxaEntrega: bairro.taxaEntrega.emReais, ativo: bairro.ativo };
        this.dados = [...this.dados.filter((item) => item.id !== id), api];
        return id;
    }
    async excluir(id: number): Promise<void> {
        this.dados = this.dados.filter((item) => item.id !== id);
    }
    async listar(ativo?: boolean): Promise<BairroApi[]> {
        return this.dados.filter((item) => ativo === undefined || item.ativo === ativo).sort((a, b) => a.nome.localeCompare(b.nome) || a.id - b.id);
    }
    consulta: ConsultaBairros = {
        listar: (ativo) => this.listar(ativo),
        buscarPorId: async (id) => this.dados.find((item) => item.id === id) ?? null,
    };
}

function criarApp(store: BairrosEmMemoria) {
    const app = express();
    app.use(express.json());
    app.use("/api/bairros", montarRotasBairros({ repositorio: store, consulta: store.consulta }));
    app.use(tratarErros);
    return app;
}

describe("API de bairros", () => {
    let store: BairrosEmMemoria;
    let api: ReturnType<typeof request>;
    beforeEach(() => { store = new BairrosEmMemoria(); api = request(criarApp(store)); });

    it("faz CRUD, normaliza nome, aceita taxa zero e preserva campos omitidos", async () => {
        const criado = await api.post("/api/bairros").send({ nome: " Centro ", taxaEntrega: 0 });
        expect(criado.status).toBe(201);
        expect(criado.body).toEqual({ id: 1, nome: "Centro", taxaEntrega: 0, ativo: true });
        const alterado = await api.patch("/api/bairros/1").send({ taxaEntrega: 4.55, ativo: false });
        expect(alterado.status).toBe(200);
        expect(alterado.body).toMatchObject({ nome: "Centro", taxaEntrega: 4.55, ativo: false });
        expect((await api.get("/api/bairros?ativo=false")).body).toHaveLength(1);
        expect((await api.get("/api/bairros?ativo=true")).body).toEqual([]);
        expect((await api.delete("/api/bairros/1")).status).toBe(204);
        expect((await api.get("/api/bairros/1")).status).toBe(404);
    });

    it.each([
        [{ taxaEntrega: 2 }, "O nome do bairro é obrigatório"],
        [{ nome: "Centro" }, "A taxa de entrega é obrigatória"],
        [{ nome: "Centro", taxaEntrega: "2" }, "A taxa de entrega deve ser um número"],
        [{ nome: "Centro", taxaEntrega: -1 }, "A taxa de entrega não pode ser negativa"],
        [{ nome: "Centro", taxaEntrega: 1.234 }, "A taxa de entrega deve ter no máximo 2 casas decimais"],
        [{ nome: "Centro", taxaEntrega: 100_000_000 }, "A taxa de entrega deve ser no máximo 99999999.99"],
        [{ nome: "Centro", taxaEntrega: 1, ativo: "sim" }, "O campo ativo deve ser true ou false"],
    ])("responde erro de contrato para %j", async (corpo, erro) => {
        const resposta = await api.post("/api/bairros").send(corpo);
        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({ erro });
    });

    it("valida nomes duplicados, filtro, PATCH vazio e ids fora do intervalo", async () => {
        await api.post("/api/bairros").send({ nome: "Centro", taxaEntrega: 1 });
        expect((await api.post("/api/bairros").send({ nome: " centro ", taxaEntrega: 2 })).status).toBe(409);
        expect((await api.get("/api/bairros?ativo=sim")).body).toEqual({ erro: "O filtro ativo deve ser true ou false" });
        expect((await api.patch("/api/bairros/1").send({ desconhecido: 1 })).body).toEqual({ erro: "Informe ao menos um campo para alterar" });
        expect((await api.get("/api/bairros/2147483648")).status).toBe(404);
    });

    it("rejeita corpos que não são objetos JSON", async () => {
        const resposta = await api.post("/api/bairros").set("Content-Type", "application/json").send("[]");
        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({ erro: "O corpo da requisição deve ser um objeto JSON" });
    });

    it("traduz conflito Prisma P2002 ao atualizar nome para 409", async () => {
        const prisma = {
            bairro: {
                findUnique: vi.fn().mockResolvedValue({ id: 1, nome: "Centro", nomeNormalizado: "centro", taxaEntregaCentavos: 100n, ativo: true }),
                findFirst: vi.fn().mockResolvedValue(null),
                updateMany: vi.fn().mockRejectedValue(Object.assign(new Error("unique constraint"), { code: "P2002" })),
                findMany: vi.fn(),
            },
        };
        const app = express();
        app.use(express.json());
        app.use("/api/bairros", montarRotasBairros(dependenciasBairrosPrisma(prisma as any)));
        app.use(tratarErros);
        const response = await request(app).patch("/api/bairros/1").send({ nome: "Centro Histórico" });
        expect(response.status).toBe(409);
        expect(response.body).toEqual({ erro: "Já existe um bairro com esse nome" });
    });
});
