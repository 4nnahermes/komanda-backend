# Publicação — Vercel e MongoDB Atlas

## Configurar o Atlas

A URI deve começar com `mongodb+srv://` (Atlas) ou `mongodb://` (replica set local) e conter explicitamente o nome do banco, por exemplo `/komanda`. Use um usuário de banco com acesso ao banco da aplicação; a permissão do painel Atlas é diferente da credencial de conexão do banco. Copie a URI pelo painel e configure-a diretamente em `DATABASE_URL`, somente no backend. Se a senha contiver caracteres especiais, use o formato codificado fornecido pelo Atlas.

Configure o acesso de rede no Atlas para os ambientes que executarão a API e a preparação dos índices. Não desative TLS e não publique a URI no Git, em mensagens de erro ou no frontend. Parâmetros de pool e timeouts podem ser incluídos na URI, conforme as opções suportadas pelo conector Prisma: por exemplo `maxPoolSize=5&serverSelectionTimeoutMS=10000&connectTimeoutMS=10000`. Não crie um Prisma Client por requisição.

## Preparar coleções e índices

Com `DATABASE_URL` definida no ambiente correto:

```sh
npm ci
npm run db:validate
npm run db:push
```

O schema está em `prisma/schema.prisma`. Prisma MongoDB não usa Prisma Migrate; `db push` configura os índices de unicidade e consulta. A inicialização da API e o build não executam esse comando. Não usar opções de reset ou aceitação automática de perda de dados. Para mudanças posteriores que alterem documentos existentes, preparar um procedimento explícito com backup; as migrations PostgreSQL continuam somente no histórico Git. Esta versão parte de um banco MongoDB novo, sem importar dados do Supabase.

## Publicar o backend

Importar `GabrielLTM/komanda-backend` na Vercel, na raiz do repositório. Runtime Node.js 24, aplicação Express, instalação `npm ci` e build `npm run build`. A entrada `src/app.ts` exporta o app; `src/server.ts` mantém a inicialização local. O build gera o Prisma Client, incluindo binário compatível com o runtime Linux da Vercel.

Adicionar `DATABASE_URL` como variável secreta do backend em Production e nos demais ambientes desejados. A string será inserida pelo responsável; nunca fica no repositório. Os índices devem estar preparados no banco de destino antes de testar gravações. Validar `/health`, categorias, produtos/cardápio, bairros e motoboys na URL publicada.

## Conectar o frontend

No projeto Vercel `komanda-frontend`, definir `VITE_API_URL=https://URL-DO-BACKEND/api` e publicar novamente. Incorporar antes a versão do frontend com integração de cadastros. O navegador chama a API, e só a API acessa o Atlas. A implementação atual mantém CORS como no backend original; não cria autenticação ou controle de usuários nesta migração.

## Teste local reproduzível

Somente para banco descartável, com Docker disponível:

```sh
docker run -d --name komanda-mongo-test -p 127.0.0.1:55440:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker exec komanda-mongo-test mongosh --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
```

Aguardar o membro ficar PRIMARY. A conexão local é `mongodb://127.0.0.1:55440/komanda_test_mongo?replicaSet=rs0&directConnection=true`. Defina-a em `MONGODB_TEST_URL` e execute `npm run test:integration`. Esse roteiro limpa apenas o banco local de teste e prepara seus índices; ele recusa nomes fora do prefixo `komanda_test_` e hosts remotos. Nunca aponte o teste para o Atlas da equipe. Os dados do teste são apagados ao final; o container pode ser parado com `docker stop komanda-mongo-test`.

## Referências

- [Prisma MongoDB 6](https://www.prisma.io/docs/orm/v6/overview/databases/mongodb)
- [Express na Vercel](https://vercel.com/docs/frameworks/backend/express)
- [Conexão com MongoDB Atlas](https://www.mongodb.com/docs/atlas/connect-to-your-cluster/)

## Ambiente publicado

Em 22/10/2026, backend em https://komanda-backend.vercel.app e frontend em https://komanda-frontend.vercel.app, usando Atlas. A preparação inicial dos índices foi executada explicitamente no primeiro deploy e removida do comando de build logo depois. O build configurado permanece `npm run build`; a string de conexão existe somente como variável secreta do projeto backend. Verificação de produção registrada em [prisma-mongodb.md](validacao/prisma-mongodb.md).
