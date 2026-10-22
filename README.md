# Komanda Backend — Prisma e MongoDB Atlas

API Node.js/TypeScript/Express para o Komanda, com persistência Prisma/MongoDB. Derivada de [4nnahermes/komanda-backend](https://github.com/4nnahermes/komanda-backend), preservando autores e histórico; esta cópia é mantida em [GabrielLTM/komanda-backend](https://github.com/GabrielLTM/komanda-backend). A versão PostgreSQL original não é alterada.

## Rodar

Use Node.js 24. Copie `.env.example` para `.env` e configure `DATABASE_URL` com a URI MongoDB que inclui o nome do banco. A conexão do Atlas fica somente no backend, nunca no frontend ou em commits.

```sh
npm ci
npm run db:validate
npm run db:push
npm run dev
```

`npm ci` gera o Prisma Client. `db:push` configura coleções/índices no banco indicado: execute conscientemente no ambiente correto. Não há Prisma Migrate para este conector, nem migrations SQL. Não use reset ou `--accept-data-loss` em produção. Subir a API e fazer build não alteram schema/índices e não inserem dados demonstrativos.

MongoDB precisa de replica set para transações. Atlas já oferece replica set; para desenvolvimento local consulte [PUBLICACAO.md](docs/PUBLICACAO.md). `/health` responde 200 quando API e MongoDB estão acessíveis e 503 se o banco não está disponível.

## Contratos preservados

| Recurso | Rota |
|---|---|
| Categorias e ordenação | `/api/categorias` |
| Produtos, ingredientes e adicionais | `/api/produtos` |
| Cardápio ativo por categoria | `/api/cardapio` |
| Bairros e taxas | `/api/bairros` |
| Motoboys e valor fixo por noite | `/api/motoboys` |

A API mantém IDs inteiros positivos e valores monetários em reais. No MongoDB, contadores atômicos atribuem IDs e dinheiro é guardado como inteiros de 64 bits em centavos. O frontend não precisa conhecer o modelo interno. Consulte [api-contrato.md](docs/api-contrato.md), [modelo-dados.md](docs/modelo-dados.md) e o [plano da migração](docs/planejamento/prisma-mongodb.md).

Pedidos, estoque, caixa e acertos ainda não têm persistência implementada nesta API. Esta migração troca a persistência dos módulos existentes e não importa dados do PostgreSQL/Supabase.

## Verificar

```sh
npm test
npm run typecheck
npm run build
```

O teste de integração usa somente MongoDB local descartável com banco cujo nome começa com `komanda_test_`. Consulte `docs/PUBLICACAO.md` para o roteiro reproduzível. Testes unitários não exigem Atlas ou credenciais.

## Publicação

[Guia Vercel + Atlas](docs/PUBLICACAO.md). O app Express tem default export em `src/app.ts`, Prisma Client reutilizável e inicialização compartilhada por instância. Configure a conexão no painel da Vercel e os índices antes de habilitar o uso dos cadastros. A URL pública do backend com `/api` no fim será o `VITE_API_URL` do frontend.

## Origem e autoria

O histórico original e os créditos de Anna Hermes, Diego Silva, Gabriel Lessa e Lucas Sol são preservados. A migração Prisma/MongoDB é desenvolvida nesta cópia. A licença ISC declarada no projeto original foi mantida. Documentos anteriores de planejamento e validação foram movidos para `docs/historico/` e não são instruções de operação desta versão.
