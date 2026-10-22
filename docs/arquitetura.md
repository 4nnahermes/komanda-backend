# Arquitetura

Domínio e aplicação permanecem independentes de Express, Prisma e MongoDB. `src/dominio/` contém regras de produto, bairro, motoboy e dinheiro; `src/aplicacao/` contém casos de uso e contratos de consulta/repositório; `src/interfaces/http/` mantém validações, controllers e rotas.

`src/infraestrutura/prisma/` implementa a persistência e conversão de DTOs. O schema MongoDB fica em `prisma/schema.prisma`. `compartilhado.ts` concentra normalização de nomes, contador atômico de IDs, conversões de dinheiro e tentativas limitadas de transações. Escritas do catálogo compartilham um documento de bloqueio para preservar a relação entre categorias e produtos sob concorrência.

As factories em `src/main/` compõem os casos de uso com adaptadores Prisma. Categorias mantêm seu serviço existente em `src/service/categoria-service.ts`, agora sobre Prisma, sem introduzir uma refatoração extra de arquitetura. `src/app.ts` exporta Express para Vercel; `src/server.ts` permite execução local. `src/database.ts` compartilha a inicialização e permite tentar novamente após falha. `cliente.ts` mantém um único Prisma Client por instância.

Erros de negócio continuam em português com os mesmos status HTTP; índices únicos também protegem disputas concorrentes. PATCH não usa upsert: registros removidos não reaparecem e campos omitidos não são escritos. A API não executa db push, seed ou migração de dados ao iniciar. Para criar novos módulos, definir contratos de domínio/aplicação, adaptadores Prisma, composição e testes de comportamento — não adicionar acesso ao banco nos controllers.
