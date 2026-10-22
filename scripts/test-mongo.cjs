// Integração destrutiva somente em replica set LOCAL de teste explicitamente indicado.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const uri = process.env.MONGODB_TEST_URL;
if (!uri) throw new Error('Defina MONGODB_TEST_URL para um banco local descartável.');
const parsed = new URL(uri);
if (parsed.protocol !== 'mongodb:' || !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) ||
    !/^\/komanda_test_[a-z0-9_]+$/i.test(parsed.pathname)) {
    throw new Error('Integração recusada: exige MongoDB local e nome de banco komanda_test_*.');
}
process.env.DATABASE_URL = uri;
const cli = path.join(path.dirname(require.resolve('prisma/package.json')), 'build/index.js');
const setup = spawnSync(process.execPath, [cli, 'db', 'push', '--skip-generate'], { env: process.env, encoding: 'utf8' });
if (setup.status !== 0) throw new Error('Não foi possível preparar os índices no banco local de teste.');

const request = require('supertest');
const app = require('../dist/app').default;
const { prisma } = require('../dist/infraestrutura/prisma/cliente');
const { RepositorioProdutosPrisma } = require('../dist/infraestrutura/prisma/cardapio/repositorio-produtos-prisma');
const api = request(app);

async function call(method, rota, corpo, status = 200) {
    let req = api[method](rota);
    if (corpo !== undefined) req = req.send(corpo);
    const res = await req;
    assert.equal(res.status, status, `${method.toUpperCase()} ${rota}: ${JSON.stringify(res.body)}`);
    return res.body;
}
async function limpar() {
    await prisma.produto.deleteMany();
    await prisma.categoria.deleteMany();
    await prisma.bairro.deleteMany();
    await prisma.motoboy.deleteMany();
    await prisma.contador.deleteMany();
}

(async () => {
    await prisma.$connect();
    await limpar();
    // O app exportado atende sem app.listen; inicialização concorrente é reutilizada.
    await Promise.all(Array.from({ length: 5 }, () => call('get', '/health')));
    const cat = await call('post', '/api/categorias', { nome: ' Xis ' }, 201);
    const bebidas = await call('post', '/api/categorias', { nome: 'Bebidas', ordem: 1 }, 201);
    assert.equal(typeof cat.id, 'number');
    assert.equal(cat.nome, 'Xis');
    assert.equal('nomeNormalizado' in cat, false);
    await call('post', '/api/categorias', { nome: 'xis' }, 409);
    await call('get', '/api/categorias/2147483648', undefined, 404);
    let cats = await call('patch', '/api/categorias/ordem', { ids: [cat.id, bebidas.id] });
    assert.deepEqual(cats.map(c => c.ordem), [1, 2]);
    await call('patch', '/api/categorias/ordem', { ids: [cat.id, cat.id] }, 400);
    const produto = await call('post', '/api/produtos', {
        nome: 'Xis integração', categoriaId: cat.id, preco: 99999999.99, descricao: ' teste ',
        ingredientes: ['Pão', 'Queijo'], adicionais: [{ nome: 'Bacon', preco: 99999999.99 }, { nome: 'Molho', preco: 0 }],
    }, 201);
    assert.equal(produto.preco, 99999999.99);
    assert.equal(produto.adicionais[0].preco, 99999999.99);
    assert.equal(produto.adicionais[1].preco, 0);
    const registro = await prisma.produto.findUnique({ where: { id: produto.id } });
    assert.equal(registro.precoCentavos, 9999999999n);
    assert.equal(registro.adicionais[0].precoCentavos, 9999999999n);
    await call('post', '/api/produtos', { nome: ' Acima ', categoriaId: cat.id, preco: 100000000 }, 400);
    await call('patch', `/api/produtos/${produto.id}`, { preco: 100000000 }, 400);
    await call('post', '/api/produtos', { nome: 'XIS INTEGRAÇÃO', categoriaId: cat.id, preco: 10 }, 409);
    await call('delete', `/api/categorias/${cat.id}`, undefined, 409);
    let alterado = await call('patch', `/api/produtos/${produto.id}`, { ativo: false, descricao: null, ingredientes: [], adicionais: [] });
    assert.equal(alterado.ativo, false);
    assert.equal(alterado.preco, 99999999.99);
    assert.equal(alterado.descricao, null);
    assert.deepEqual(alterado.ingredientes, []);
    assert.deepEqual(alterado.adicionais, []);
    assert.deepEqual(await call('get', '/api/cardapio'), []);
    await call('patch', `/api/produtos/${produto.id}`, { ativo: true, ingredientes: ['Pão'], adicionais: [{ nome: 'Queijo', preco: 4.1 }] });
    await Promise.all([
        call('patch', `/api/produtos/${produto.id}`, { nome: '  Novo nome  ' }),
        call('patch', `/api/produtos/${produto.id}`, { preco: 42.1 }),
    ]);
    alterado = await call('get', `/api/produtos/${produto.id}`);
    assert.equal(alterado.nome, 'Novo nome');
    assert.equal(alterado.preco, 42.1);
    assert.deepEqual(alterado.adicionais, [{ nome: 'Queijo', preco: 4.1 }]);
    assert.deepEqual(alterado.ingredientes, ['Pão']);
    assert.equal((await call('get', '/api/cardapio'))[0].produtos[0].id, produto.id);
    await call('patch', `/api/categorias/${cat.id}`, { ativo: false });
    assert.deepEqual(await call('get', '/api/cardapio'), []);
    await call('patch', `/api/categorias/${cat.id}`, { ativo: true });
    await call('patch', `/api/produtos/${produto.id}`, { categoriaId: bebidas.id });
    await call('delete', `/api/categorias/${cat.id}`, undefined, 204);
    cats = await call('get', '/api/categorias');
    assert.equal(cats[0].ordem, 1);

    const bairro = await call('post', '/api/bairros', { nome: 'Centro', taxaEntrega: 0 }, 201);
    await call('patch', `/api/bairros/${bairro.id}`, { taxaEntrega: 99999999.99 });
    assert.equal((await call('patch', `/api/bairros/${bairro.id}`, { ativo: false })).taxaEntrega, 99999999.99);
    assert.deepEqual(await call('get', '/api/bairros?ativo=true'), []);
    const areas = await Promise.all(Array.from({ length: 6 }, (_, i) => call('post', '/api/bairros', { nome: `Bairro ${i}`, taxaEntrega: i }, 201)));
    assert.equal(new Set(areas.map(a => a.id)).size, areas.length);
    const repetidos = await Promise.all([
        api.post('/api/bairros').send({ nome: 'Moinhos', taxaEntrega: 0 }),
        api.post('/api/bairros').send({ nome: 'moinhos', taxaEntrega: 0 }),
    ]);
    assert.deepEqual(repetidos.map(r => r.status).sort(), [201, 409]);
    const motoboy = await call('post', '/api/motoboys', { nome: 'Entregador', telefone: '51999990000', valorFixoNoite: 0 }, 201);
    assert.equal(motoboy.valorFixoNoite, 0);
    await call('patch', `/api/motoboys/${motoboy.id}`, { valorFixoNoite: 99999999.99 });
    const mot = await call('patch', `/api/motoboys/${motoboy.id}`, { telefone: null, ativo: false });
    assert.equal(mot.valorFixoNoite, 99999999.99);
    assert.equal(mot.telefone, null);
    assert.equal(mot.ativo, false);
    await call('post', '/api/motoboys', { nome: 'ENTREGADOR', valorFixoNoite: 0 }, 409);
    await call('delete', `/api/motoboys/${motoboy.id}`, undefined, 204);
    await call('patch', `/api/motoboys/${motoboy.id}`, { ativo: true }, 404);

    // Corrida categoria/produto: nunca ficam produtos órfãos.
    for (let i = 0; i < 5; i++) {
        const corrida = await call('post', '/api/categorias', { nome: `Corrida ${i}` }, 201);
        const [p, c] = await Promise.all([
            api.post('/api/produtos').send({ nome: 'Concorrente', categoriaId: corrida.id, preco: 1 }),
            api.delete(`/api/categorias/${corrida.id}`),
        ]);
        assert.ok((p.status === 201 && c.status === 409) || (p.status === 400 && c.status === 204),
            `Corrida inconsistente: produto ${p.status}, categoria ${c.status}`);
    }
    const concorrentes = await Promise.all(Array.from({ length: 6 }, (_, i) =>
        call('post', '/api/categorias', { nome: `Categoria paralela ${i}`, ordem: 1 }, 201)));
    assert.equal(new Set(concorrentes.map(c => c.id)).size, concorrentes.length);
    cats = await call('get', '/api/categorias');
    assert.deepEqual(cats.map(c => c.ordem), cats.map((_, i) => i + 1));
    const todos = await prisma.produto.findMany();
    const ids = new Set(cats.map(c => c.id));
    assert.ok(todos.every(p => ids.has(p.categoriaId)));

    // Uma nova instância/processo lê os mesmos dados persistidos.
    const leitura = spawnSync(process.execPath, ['-e',
        "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.produto.findUnique({where:{id:" + produto.id + "}}).then(x=>{if(x.nome!=='Novo nome') process.exitCode=1}).finally(()=>p.$disconnect());"],
        { env: process.env, encoding: 'utf8' });
    assert.equal(leitura.status, 0, 'Persistência não confirmada em processo independente');
    await call('delete', `/api/produtos/${produto.id}`, undefined, 204);
    assert.equal(await new RepositorioProdutosPrisma(prisma).atualizarCampos(produto.id, { ativo: true }), false);
    await call('get', `/api/produtos/${produto.id}`, undefined, 404);
    console.log('Integração MongoDB: HTTP, índices, centavos/limites, persistência, PATCH e concorrência aprovados.');
})().finally(async () => {
    await limpar();
    await prisma.$disconnect();
}).catch((erro) => {
    // Não imprimir erros Prisma/URI ou dados sensíveis de configuração.
    console.error('Integração MongoDB falhou. Confira as assertions e o replica set local.');
    if (erro instanceof assert.AssertionError) console.error(erro.message);
    process.exitCode = 1;
});
