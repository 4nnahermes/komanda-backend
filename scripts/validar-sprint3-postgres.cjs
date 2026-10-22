/* Validação HTTP + PostgreSQL em schema descartável. Execute após npm run build. */
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = process.env.KOMANDA_REVIEW_ROOT || path.resolve(__dirname, '..');
const req = createRequire(path.join(root, 'package.json'));
const { Client } = req('pg');
const request = req('supertest');
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error('Informe TEST_DATABASE_URL de um PostgreSQL local descartável.');
const uri = new URL(connectionString);
if (!['localhost', '127.0.0.1', '[::1]'].includes(uri.hostname) || !uri.pathname.startsWith('/komanda_test')) {
  throw new Error('Validação permitida apenas em loopback e banco com prefixo komanda_test.');
}
const schema = `sprint3_review_${process.pid}`;
// Sobrescreve configuração ANTES de carregar a aplicação; nunca usa banco da equipe.
process.env.DATABASE_URL = '';
process.env.DB_HOST = uri.hostname;
process.env.DB_PORT = uri.port || '5432';
process.env.DB_USER = decodeURIComponent(uri.username);
process.env.DB_PASSWORD = decodeURIComponent(uri.password);
process.env.DB_NAME = uri.pathname.slice(1);
const { AppDataSource: db } = req(path.join(root, 'dist/data-source.js'));
const { app } = req(path.join(root, 'dist/app.js'));
db.setOptions({ schema, extra: { options: `-c search_path=${schema},public` }, logging: false });
const admin = new Client({ connectionString });
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log(`PASSOU ${name}`); }
async function error(method, route, body, code, message) {
  let r = request(app)[method](route);
  if (body !== undefined) r = r.send(body);
  const result = await r;
  assert.equal(result.status, code, JSON.stringify(result.body));
  if (message) assert.equal(result.body.erro, message);
  return result;
}
(async () => {
  await admin.connect();
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await db.initialize();
  await check('migrations up em schema vazio', async () => { assert.equal((await db.runMigrations()).length, 4); });
  let bairroId, motoboyId, categoriaId, produtoId;
  await check('bairros: CRUD, taxa zero, limite numeric, filtro e PATCH parcial', async () => {
    const c = await request(app).post('/api/bairros').send({ nome: ' Centro ', taxaEntrega: 0 });
    assert.equal(c.status, 201, JSON.stringify(c.body)); bairroId = c.body.id;
    assert.deepEqual(c.body, { id: bairroId, nome: 'Centro', taxaEntrega: 0, ativo: true });
    const p = await request(app).patch(`/api/bairros/${bairroId}`).send({ taxaEntrega: 99999999.99, ativo: false });
    assert.equal(p.status, 200, JSON.stringify(p.body)); assert.equal(p.body.nome, 'Centro'); assert.equal(p.body.taxaEntrega, 99999999.99);
    assert.deepEqual((await request(app).get('/api/bairros?ativo=true')).body, []);
    assert.equal((await request(app).get('/api/bairros?ativo=false')).body.length, 1);
    await error('patch', `/api/bairros/${bairroId}`, { extra: 1 }, 400, 'Informe ao menos um campo para alterar');
  });
  await check('bairros: bordas monetárias, nome, ativo e ids', async () => {
    for (const [taxaEntrega, message] of [[-1,'A taxa de entrega não pode ser negativa'],[0.001,'A taxa de entrega deve ter no máximo 2 casas decimais'],[100000000,'A taxa de entrega deve ser no máximo 99999999.99'],['5','A taxa de entrega deve ser um número']]) {
      await error('post','/api/bairros',{nome:'Inválido',taxaEntrega},400,message);
    }
    await error('post','/api/bairros',{nome:' ',taxaEntrega:5},400,'O nome do bairro é obrigatório');
    await error('get','/api/bairros?ativo=sim',undefined,400,'O filtro ativo deve ser true ou false');
    await error('get','/api/bairros/2147483648',undefined,404,'Bairro não encontrado');
  });
  await check('bairros: índice lower(nome) impede duplicidade concorrente', async () => {
    const rs = await Promise.all(['Concorrente','concorrente'].map(nome => request(app).post('/api/bairros').send({nome,taxaEntrega:1.23})));
    assert.deepEqual(rs.map(r=>r.status).sort(), [201,409]);
  });
  await check('motoboys: defaults, telefone, dinheiro, ativação e PATCH parcial', async () => {
    const c = await request(app).post('/api/motoboys').send({nome:' João '});
    assert.equal(c.status,201,JSON.stringify(c.body)); motoboyId=c.body.id;
    assert.deepEqual(c.body,{id:motoboyId,nome:'João',telefone:null,valorFixoNoite:0,ativo:true});
    const p=await request(app).patch(`/api/motoboys/${motoboyId}`).send({telefone:'  (51) 99999-0000  ',valorFixoNoite:99999999.99,ativo:false});
    assert.equal(p.status,200,JSON.stringify(p.body)); assert.equal(p.body.telefone,'(51) 99999-0000'); assert.equal(p.body.valorFixoNoite,99999999.99);
    assert.equal((await request(app).patch(`/api/motoboys/${motoboyId}`).send({nome:'João Silva'})).body.telefone,'(51) 99999-0000');
    assert.equal((await request(app).patch(`/api/motoboys/${motoboyId}`).send({telefone:null})).body.telefone,null);
    assert.equal((await request(app).get('/api/motoboys?ativo=false')).body.length,1);
    await error('post','/api/motoboys',{nome:'Teste',telefone:123},400,'O telefone deve ser um texto');
    await error('patch',`/api/motoboys/${motoboyId}`,{valorFixoNoite:0.001},400,'O valor fixo por noite deve ter no máximo 2 casas decimais');
    await error('get','/api/motoboys/2147483648',undefined,404,'Motoboy não encontrado');
  });
  await check('motoboys: índice lower(nome) impede duplicidade concorrente', async () => {
    const rs=await Promise.all(['Entregador','entregador'].map(nome=>request(app).post('/api/motoboys').send({nome})));
    assert.deepEqual(rs.map(r=>r.status).sort(),[201,409]);
  });
  await check('novos cadastros: FK em uso devolve 409 sem remover registro', async () => {
    await db.query('CREATE TABLE referencia_teste (bairro_id integer REFERENCES bairro(id), motoboy_id integer REFERENCES motoboy(id))');
    await db.query('INSERT INTO referencia_teste VALUES ($1,$2)',[bairroId,motoboyId]);
    await error('delete',`/api/bairros/${bairroId}`,undefined,409,'Não é possível excluir um bairro em uso. Desative o bairro');
    await error('delete',`/api/motoboys/${motoboyId}`,undefined,409,'Não é possível excluir um motoboy em uso. Desative o motoboy');
    await db.query('DROP TABLE referencia_teste');
  });
  await check('categorias: inserções concorrentes mantêm ordem contínua', async () => {
    const rs=await Promise.all(Array.from({length:8},(_,i)=>request(app).post('/api/categorias').send({nome:`Categoria ${i}`,ordem:1})));
    rs.forEach(r=>assert.equal(r.status,201,JSON.stringify(r.body)));
    const lista=(await request(app).get('/api/categorias')).body;
    assert.deepEqual(lista.map(x=>x.ordem),[1,2,3,4,5,6,7,8]); categoriaId=lista[0].id;
  });
  await check('categorias: reordenação completa, erro sem alteração parcial e PATCH concorrente', async () => {
    let lista=(await request(app).get('/api/categorias')).body;
    const ids=lista.map(x=>x.id).reverse();
    await request(app).patch('/api/categorias/ordem').send({ids}).expect(200);
    await error('patch','/api/categorias/ordem',{ids:[ids[0],ids[0]]},400,'A lista deve conter todas as categorias, sem repetir');
    assert.deepEqual((await request(app).get('/api/categorias')).body.map(x=>x.id),ids);
    await Promise.all([
      request(app).patch(`/api/categorias/${categoriaId}`).send({nome:'Categoria renomeada'}).expect(200),
      request(app).patch('/api/categorias/ordem').send({ids:ids.slice().reverse()}).expect(200)
    ]);
    lista=(await request(app).get('/api/categorias')).body;
    assert.deepEqual(lista.map(x=>x.ordem),[1,2,3,4,5,6,7,8]);
    assert.deepEqual(lista.map(x=>x.id),ids.slice().reverse());
    assert.equal(lista.find(x=>x.id===categoriaId).nome,'Categoria renomeada');
  });
  await check('categorias: nomes concorrentes e rollback da ordem em conflito',async()=>{
    const before=(await request(app).get('/api/categorias')).body.length;
    const rs=await Promise.all(['Bebidas','bebidas'].map(nome=>request(app).post('/api/categorias').send({nome,ordem:1})));
    assert.deepEqual(rs.map(r=>r.status).sort(),[201,409]);
    const lista=(await request(app).get('/api/categorias')).body;
    assert.equal(lista.length,before+1); assert.deepEqual(lista.map(x=>x.ordem),Array.from({length:before+1},(_,i)=>i+1));
  });
  await check('regressão produtos/cardápio: vínculo, desativação e exclusão protegida',async()=>{
    const p=await request(app).post('/api/produtos').send({nome:'Xis',preco:32.9,categoriaId});
    assert.equal(p.status,201,JSON.stringify(p.body));produtoId=p.body.id;
    assert.equal((await request(app).get('/api/cardapio')).body.length,1);
    await error('delete',`/api/categorias/${categoriaId}`,undefined,409,'Não é possível excluir uma categoria com produtos. Exclua ou mova os produtos, ou desative a categoria');
    await request(app).patch(`/api/categorias/${categoriaId}`).send({ativo:false}).expect(200);
    assert.deepEqual((await request(app).get('/api/cardapio')).body,[]);
    assert.equal((await request(app).get(`/api/produtos/${produtoId}`)).body.ativo,true);
    await request(app).patch(`/api/categorias/${categoriaId}`).send({ativo:true}).expect(200);
    assert.equal((await request(app).get('/api/cardapio')).body.length,1);
  });
  await check('persistência após fechar e reabrir conexão',async()=>{
    await db.destroy();await db.initialize();
    assert.equal((await request(app).get(`/api/bairros/${bairroId}`)).body.nome,'Centro');
    assert.equal((await request(app).get(`/api/motoboys/${motoboyId}`)).body.nome,'João Silva');
    assert.equal((await request(app).get(`/api/produtos/${produtoId}`)).body.preco,32.9);
  });
  await check('categorias: migration down preserva dados e up recusa duplicidade legada',async()=>{
    const before=await db.query('SELECT count(*)::int AS n FROM categoria');
    await db.undoLastMigration();
    await db.query('INSERT INTO categoria(nome,ordem,ativo) VALUES ($1,100,true)',['CATEGORIA RENOMEADA']);
    await assert.rejects(db.runMigrations(),/duplicad/i);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM categoria'))[0].n,before[0].n+1);
    await db.query('DELETE FROM categoria WHERE nome=$1',['CATEGORIA RENOMEADA']);
    assert.equal((await db.runMigrations()).length,1);
  });
  await check('exclusão 204, 404 posterior e fechamento de lacuna',async()=>{
    await request(app).delete(`/api/bairros/${bairroId}`).expect(204);
    await error('get',`/api/bairros/${bairroId}`,undefined,404,'Bairro não encontrado');
    await request(app).delete(`/api/motoboys/${motoboyId}`).expect(204);
    await error('get',`/api/motoboys/${motoboyId}`,undefined,404,'Motoboy não encontrado');
    await request(app).delete(`/api/produtos/${produtoId}`).expect(204);
    await request(app).delete(`/api/categorias/${categoriaId}`).expect(204);
    const lista=(await request(app).get('/api/categorias')).body;
    assert.deepEqual(lista.map(x=>x.ordem),Array.from({length:lista.length},(_,i)=>i+1));
  });
  await check('migrations down completas e reaplicação',async()=>{
    for(let i=0;i<4;i++)await db.undoLastMigration();
    assert.equal((await db.runMigrations()).length,4);
  });
  console.log(`RESULTADO: ${checks} verificações passaram com PostgreSQL real.`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(db.isInitialized)await db.destroy();
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await admin.end();
});
