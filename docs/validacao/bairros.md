# Validação — bairros e taxas

## Cobertura automatizada

- Domínio: normalização do nome, limite de tamanho, taxa zero, centavos, valores negativos, excesso de precisão e limite superior.
- HTTP: CRUD, PATCH parcial, filtro e erros do contrato, nome duplicado sem diferenciar caixa, limite de id e conflito de exclusão.
- Infraestrutura: tradução de `23505` para conflito de nome e `23503` para conflito de referência.

## Persistência PostgreSQL

A migration `1792620000000-CriaBairro.ts` cria `bairro`, `numeric(10,2)` e índice único em `LOWER(nome)`. O roteiro `docs/testes/bairros.http` permite conferir o contrato via API. A validação com PostgreSQL descartável e migration up/down será registrada após execução local.

## Comandos

- `npm ci`: concluído; npm reportou 6 vulnerabilidades já presentes na árvore de dependências (1 moderada, 3 altas, 2 críticas).
- `npm test`: passou, 11 arquivos / 82 testes.
- `npm run typecheck`: passou.
- `npm run build`: passou.
- PostgreSQL descartável: pendente da validação integrada do principal, que disponibilizou instância compartilhada para uso sequencial após a integração. Nenhum `.env` foi usado.
