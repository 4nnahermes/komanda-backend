# Plano de migração para Prisma e MongoDB Atlas

## Objetivo e origem

Criar `GabrielLTM/komanda-backend`, público como o frontend, a partir da `main` de `4nnahermes/komanda-backend` em `4f9020a`, preservando autoria e histórico. A migração acontece somente na cópia. O repositório original, seu PostgreSQL/Supabase e os PRs anteriores não serão alterados. A conexão do Atlas será configurada depois, fora do Git.

## Contrato preservado

- Express e rotas `/health`, `/api/categorias`, `/api/produtos`, `/api/cardapio`, `/api/bairros` e `/api/motoboys`.
- IDs públicos inteiros positivos, nomes e mensagens em português, códigos HTTP e filtros atuais.
- Dinheiro exposto em reais com duas casas; ingredientes como textos e adicionais como `{ nome, preco }`.
- PATCH altera apenas os campos enviados; omissões preservam dados e `false`, zero, `null` e listas vazias continuam significativos.
- Ordenação de categorias, exclusão restrita quando houver produtos e unicidade de nomes sem diferenciar maiúsculas.
- Nenhum endpoint novo para pedidos, caixa ou estoque: permanecem fora desta entrega.

## Modelo e persistência

Usar Prisma e `@prisma/client` 6.19.3, versão estável com conector MongoDB documentado. Modelos: Categoria, Produto, Bairro, Motoboy e Contador. `_id` inteiro nos cadastros, atribuído por contador atômico, preserva o contrato do frontend; não usar `autoincrement()`. O contador usa chave textual. Valores em centavos usam BSON long/Prisma BigInt, inclusive adicionais embutidos, para comportar integralmente o limite monetário existente sem arredondamento e sem vazar BigInt no JSON da API.

Nomes normalizados em campos próprios com índices únicos; produtos têm chave única por categoria e nome normalizado. Relações categoria/produto usam o ID inteiro. MongoDB não tem as foreign keys anteriores: as escritas relacionadas usam transações com bloqueio por documento compartilhado do catálogo e tentativas limitadas para conflitos transitórios. Criar/mover produto e excluir/reordenar categoria precisam preservar referências e ordenação também sob concorrência. Exclusões/atualizações de registro já removido não podem recriar dados.

## Etapas de implementação

1. Versionar este plano antes da implementação. Adicionar schema Prisma e validar sua compatibilidade; instalar versões fixas.
2. Substituir adaptadores TypeORM por Prisma nos módulos de produtos/cardápio e entrega, mantendo domínio/casos de uso.
3. Adaptar o serviço de categorias à persistência Prisma mantendo seu contrato HTTP. Introduzir utilitários de transação, contador, moeda e erros.
4. Trocar a composição do app e conexão por um Prisma Client reutilizável, inicialização concorrente com retry e health MongoDB. Manter default export para Vercel e execução local.
5. Remover dependências TypeORM/pg, entidades/decorators/migrations SQL e referências operacionais antigas; atualizar scripts, `.env.example`, Node, documentação e testes. A história Git preserva a implementação anterior.
6. Verificar esquema/generate, typecheck, build, testes existentes e novos testes de persistência contra replica set MongoDB local descartável. Conferir HTTP real, índices, moeda máxima, PATCH, filtros, ordenação e concorrência.
7. Publicar a cópia própria e o PR da migração, com as verificações e limitações documentadas. Não publicar backend na Vercel nem conectar ao Atlas sem a configuração posterior.

## Operação e dados

MongoDB com Prisma exige replica set para transações; Atlas fornece isso. Desenvolvimento/teste local terá um replica set descartável, sem usar dados da equipe. `prisma generate` é parte da instalação/build. `prisma db push` aplica índices de forma explícita; não usar Prisma Migrate nem executar `db push` automaticamente ao subir a API. Não usar `--accept-data-loss` ou reset em banco real.

Essa entrega migra a aplicação, não os dados existentes do PostgreSQL. Uma eventual transferência de dados requer exportação revisável e autorização separada. Documentar claramente a pendência de receber a conexão do Atlas e validar o ambiente real. Nunca gravar credenciais, `.env`, saída de banco real ou string de conexão em commits/logs.

## Referências

- https://www.prisma.io/docs/orm/v6/overview/databases/mongodb
- https://www.prisma.io/docs/v7/prisma-orm/add-to-existing-project/mongodb
