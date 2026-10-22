# Validação — cadastro de motoboys

O módulo expõe CRUD em `/api/motoboys`, com busca ordenada por nome/id, filtro `ativo`, PATCH parcial, telefone textual anulável e valor individual por noite em reais na API e centavos no domínio. A migration `1792620001000-CriaMotoboy.ts` cria `motoboy`, `numeric(10,2)` e índice único em `lower(nome)`.

Cobertura automatizada inclui regras da entidade, mensagens e status HTTP, CRUD e defaults, filtro e ordenação, PATCH que preserva omissões e limpa telefone com `null`, ids inválidos/maiores que `integer`, além da tradução de erros PostgreSQL `23505` e `23503` no repositório.

Validação executada após `npm ci`:

- `npm test` — 86 testes passaram.
- `npm run typecheck` — passou.
- `npm run build` — passou.
- Migration aplicada e revertida, depois reaplicada no schema descartável `motoboys_agent` do container `komanda-sprint3-review`, sem usar `.env` ou o schema `public`.
- Teste HTTP contra PostgreSQL real confirmou POST/GET/PATCH/DELETE, preservação do valor monetário no limite `99999999.98` e conflito de caixa via índice `lower(nome)`.
- Testes unitários do adaptador TypeORM verificam tradução dos códigos `23505` e `23503`; o endpoint de FK em uso não pode ser provocado por tabelas de pedidos, que ainda não existem nesta sprint.

O roteiro manual está em `docs/testes/motoboys.http`. O teste HTTP automatizado de contrato também usa repositórios em memória; a chamada real descrita acima cobre persistência do cadastro e a restrição de unicidade. Nenhum schema compartilhado fora do descartável foi alterado.
