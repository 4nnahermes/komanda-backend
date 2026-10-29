> Documento histórico da versão TypeORM/PostgreSQL. Para a versão atual use [o README](../../../README.md) e `docs/PUBLICACAO.md`.

# Validação — bairros e taxas

## Cobertura automatizada

- Domínio: normalização do nome, limite de tamanho, taxa zero, centavos, valores negativos, excesso de precisão e limite superior.
- HTTP: CRUD, PATCH parcial, filtro e erros do contrato, nome duplicado sem diferenciar caixa, limite de id e conflito de exclusão.
- Infraestrutura: tradução de `23505` para conflito de nome e `23503` para conflito de referência.

## Persistência PostgreSQL

A migration `1792620000000-CriaBairro.ts` cria `bairro`, `numeric(10,2)` e índice único em `LOWER(nome)`. O roteiro `docs/testes/bairros.http` permite conferir o contrato via API. Em 22/10/2026, a revisão independente executou migrations reais up/down/up e chamadas HTTP com PostgreSQL 16 descartável no container local `komanda-sprint3-review`, banco `komanda_test_sprint3`, schema isolado `bairros_review_<pid>` removido ao final. Passaram: taxa zero, limite 99999999.99, PATCH parcial, filtro ativo, reconexão com persistência, disputa concorrente entre Moinhos/moinhos (201/409) e exclusão protegida por FK de teste (409).

## Comandos

- `npm ci`: concluído; npm reportou 6 vulnerabilidades já presentes na árvore de dependências (1 moderada, 3 altas, 2 críticas).
- `npm test`: passou, 11 arquivos / 82 testes.
- `npm run typecheck`: passou.
- `npm run build`: passou.
- PostgreSQL descartável: passou na revisão descrita acima. Nenhum `.env` foi usado; nenhum banco da equipe foi acessado.
