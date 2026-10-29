# Stack do backend próprio

- Node.js 24 e TypeScript.
- Express 5, com default export para Vercel.
- Prisma Client e CLI 6.19.3, fixados em conjunto por compatibilidade estável com MongoDB.
- MongoDB Atlas, ou replica set MongoDB 8 local para testes.
- Zod para validação HTTP e Vitest/Supertest para testes.

O pedido de 22/10/2026 substitui nesta cópia o TypeORM/PostgreSQL do projeto original. Contratos REST, IDs numéricos e valores em reais continuam compatíveis com o frontend. Não há driver PostgreSQL, entidades/decorators TypeORM ou migrations SQL ativos. Documentos anteriores estão em `docs/historico/` para rastreabilidade, sem orientar a configuração atual.

O conector MongoDB do Prisma 6 não suporta Decimal nem autoincremento: dinheiro usa BigInt em centavos e IDs usam contadores transacionais. Também não usa Prisma Migrate; coleções e índices são preparados explicitamente com `prisma db push`. Consulte `docs/PUBLICACAO.md` e o schema para executar a versão atual.
