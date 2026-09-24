# Definição da stack de backend

Sprint 1 · Item 2 · Responsáveis: Anna Hermes e Gabriel Lessa

## Decisão

**Node.js + TypeScript + Express 5 + TypeORM + PostgreSQL**

## O que os requisitos exigem do backend

Levantado a partir do documento de requisitos do Komanda:

| Necessidade | Requisitos relacionados |
|---|---|
| Muitos cadastros com relacionamentos (categoria → produto → ficha técnica → ingrediente; grupos de complementos N:N com produtos) | R1 a R8, R19, R20, R26 |
| Operações que precisam acontecer juntas: salvar o pedido e dar baixa no estoque | R9 a R13, R24, RN3 |
| Valores em dinheiro e conversão de unidades (g → kg) | RN1, RN3, R16 |
| Consultas agregadas por período (total vendido, mais/menos vendido, fechamento por forma de pagamento) | R28 a R31 |
| Login único e uma credencial extra para o dashboard | R34 |
| Prazo curto: 5 sprints de desenvolvimento até a apresentação final (03/12) | Cronograma |

## Critérios de comparação

1. Atende aos requisitos acima (relacionamentos, transações, agregações)
2. Experiência prévia da equipe
3. Facilidade de rodar em todas as máquinas (Windows, Mac, Linux)
4. Integração com o frontend
5. Curva de aprendizado dentro do prazo

## Alternativas avaliadas

| Critério | Node + Express + TypeORM | ASP.NET Core Web API + EF Core |
|---|---|---|
| Requisitos | Atende: relacionamentos, transações (`AppDataSource.transaction`) e QueryBuilder para agregações | Atende muito bem: tipo `decimal` nativo e LINQ para agregações |
| Experiência da equipe | Alta: usada na disciplina de Fullstack (2026-1) com o mesmo padrão em camadas, JWT e PostgreSQL (ex.: API da clínica veterinária) | Média: usada em Frameworks (2025-1), mas em MVC com views, não como API |
| Rodar em todas as máquinas | Node e PostgreSQL rodam em qualquer sistema | Os projetos anteriores usam SQL Server LocalDB, que só roda no Windows |
| Integração com o frontend | Mesma linguagem (TypeScript) do frontend em React/Angular | Linguagens diferentes entre front e back |
| Curva de aprendizado | Baixa: padrão já dominado | Maior: montar Web API e trocar o banco para PostgreSQL |

## Justificativa

A stack Node + Express + TypeORM atende a todos os requisitos levantados e é a que a equipe usou mais recentemente, com a mesma arquitetura em camadas (entity, service, controller, router) que o Komanda vai precisar. Com o prazo curto, reaproveitar um padrão conhecido reduz o risco de gastar sprints aprendendo tecnologia nova.

O PostgreSQL foi escolhido por ser relacional (o modelo tem muitos relacionamentos e precisa de transações para o pedido e a baixa de estoque), gratuito, multiplataforma e já conhecido pela equipe.

## Cuidados combinados

- **Migrations em vez de `synchronize`**: o modelo do banco fica versionado no repositório.
- **Credenciais no `.env`**: nenhuma senha vai para o GitHub; o repositório tem só o `.env.example`.
- **Transação no pedido**: registrar o pedido e dar baixa no estoque na mesma transação (tudo ou nada).
- **Dinheiro em `numeric(10,2)`**: o TypeORM devolve `numeric` como texto; converter com `Number()` no service ou usar um transformer na coluna.

## Apresentação

- [ ] Apresentada aos quatro integrantes em __/__/2026
