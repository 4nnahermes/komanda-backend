# Validação da US01 — categorias

Migração para domínio, aplicação, infraestrutura, HTTP e composição concluída preservando as seis rotas, os payloads e as mensagens descritas em `docs/api-contrato.md`.

## Verificações executadas

- `npm ci`
- `CATEGORIAS_TEST_DATABASE_URL=<URL do PostgreSQL descartável> npm test`: 69 testes passaram, incluindo testes unitários, HTTP e integração PostgreSQL.
- `npm run typecheck`
- `npm run build`
- Os três testes de infraestrutura também podem rodar isolados com `CATEGORIAS_TEST_DATABASE_URL=<URL do PostgreSQL descartável> npm test -- test/infraestrutura/categorias-typeorm.test.ts`.

Os testes de infraestrutura verificam serialização de criação/reordenação/PATCH, ordem contínua, unicidade concorrente sem diferenciar caixa, recusa explícita da migration quando há nomes antigos conflitantes e bloqueio de exclusão quando existe produto. O schema de teste é removido ao final. Nenhum `.env` foi lido ou alterado.

## Limites

Não houve execução contra o banco de equipe nem limpeza automática de dados antigos. Se a migration encontrar duplicatas por `lower(nome)`, ela informa os nomes conflitantes e deve ser repetida depois da correção manual dos dados. A integração visual do frontend não faz parte desta validação.
