# Validação integrada do backend — Sprint 3

Data: 22/10/2026. Implementação por três agentes gpt-6-luna em worktrees isolados, após commit do planejamento `3e9ca5e`. Revisão independente por outro agente Luna e integração pelo agente principal.

## Resultado

- Suíte completa com PostgreSQL habilitado: 117 testes passaram, sem skip.
- `npm run typecheck` e `npm run build`: passaram.
- `npm run test:postgres`: 15 verificações integradas passaram em PostgreSQL 16 real descartável.
- `git diff --check`: passou.

## Cobertura com banco real

1. As quatro migrations aplicam em schema vazio.
2. CRUD de bairros, taxa zero, limite numeric(10,2), filtro ativo e PATCH parcial.
3. Dados inválidos de bairros devolvem mensagens e status definidos.
4. Inserções concorrentes de bairro com nomes que diferem em caixa resultam em 201/409.
5. Motoboys: defaults, telefone aparado/anulável, valor fixo, ativação e PATCH parcial.
6. Inserções concorrentes de motoboy com nomes que diferem em caixa resultam em 201/409.
7. Uma tabela de referência criada só para teste comprova a tradução de FK para 409 nos dois novos cadastros.
8. Criações concorrentes de categoria preservam posições contínuas.
9. Reordenação incompleta não altera parcialmente o conjunto; PATCH concorrente não restaura ordem antiga.
10. Conflito de nome de categoria reverte os deslocamentos de ordem da transação.
11. Produtos/cardápio continuam funcionando; categoria com produtos não pode ser excluída; desativar esconde o cardápio sem desativar o produto.
12. Fechar e reabrir a conexão preserva dados e valores monetários.
13. Reverter o índice de categorias mantém dados; reaplicar com duplicados legados falha com diagnóstico e sem removê-los; após resolver o conflito de teste, reaplica.
14. DELETE responde 204; consulta posterior responde 404; excluir categoria fecha a lacuna.
15. Todas as migrations revertem e reaplicam.

O log da verificação 13 contém uma falha de migration esperada: é o cenário negativo que comprova a proteção dos dados legados, não uma falha da suíte.

## Como reproduzir

Requer Docker e dependências instaladas com `npm ci`. Use um banco local exclusivo de teste, nunca a conexão da equipe.

```sh
docker run --name komanda-sprint3-test --rm -d -e POSTGRES_PASSWORD=komanda_test_only -e POSTGRES_DB=komanda_test_sprint3 -p 127.0.0.1:55439:5432 postgres:16-alpine
# Espere pg_isready confirmar que o servidor aceita conexões.
docker exec komanda-sprint3-test pg_isready -U postgres
CATEGORIAS_TEST_DATABASE_URL=postgresql://postgres:komanda_test_only@127.0.0.1:55439/komanda_test_sprint3 npm test
npm run typecheck
TEST_DATABASE_URL=postgresql://postgres:komanda_test_only@127.0.0.1:55439/komanda_test_sprint3 npm run test:postgres
docker stop komanda-sprint3-test
```

O script recusa host fora de loopback e banco sem prefixo `komanda_test`. Cria um schema exclusivo por processo e o remove em `finally`; não usa o `.env` da equipe nem o schema público para os dados de teste. A suíte de categorias também usa schema exclusivo e libera os QueryRunners.

## Correções da revisão

- PATCH dos novos cadastros atualiza somente colunas enviadas; exclusão concorrente não recria registros.
- PATCH de categoria usa o mesmo advisory lock transacional das operações de ordem e não persiste uma posição antiga.
- Os casos de uso de bairros foram separados por ação, conforme a arquitetura existente.
- QueryRunners dos testes de migration são liberados em finally; fixtures representam a unicidade legada.
- Imports e registro das três rotas foram preservados ao integrar as branches.

## Limitações

Frontend (#24), sessão de feedback com cliente (#19), decisão final com as duplas (#25), acerto financeiro, pedidos, estoque, imagens e combos não foram implementados nem declarados concluídos. Nenhuma migration foi executada no banco da equipe; nenhum deploy ou merge foi realizado. As vulnerabilidades de dependências reportadas na instalação já pertenciam à base e não foram alteradas nesta entrega.
