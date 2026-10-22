# Validação da migração Prisma/MongoDB

Em 22/10/2026, na cópia `GabrielLTM/komanda-backend` derivada da versão original `4f9020a`.

## Verificado

- Node.js 24.22.1: typecheck, 133 testes unitários/HTTP/adaptadores, schema Prisma e build aprovados.
- Prisma Client/CLI 6.19.3 e MongoDB 8.0 em replica set local descartável: `npm run test:integration` aprovado. A execução prepara os índices no banco local, limpa seus próprios dados e recusa URI remota ou nome fora de `komanda_test_*`.
- HTTP real sobre o app exportado, sem listener: health e inicialização concorrente, CRUDs de categorias/produtos/bairros/motoboys, filtros e cardápio ativo.
- IDs numéricos, unicidade sem diferenciar caixa, ausência de campos internos nos DTOs e persistência lida de outro processo.
- Valores zero e limite R$ 99.999.999,99 persistidos como 9.999.999.999 centavos de 64 bits; adicional com preço zero; produto acima do limite rejeitado em criação e PATCH.
- PATCH parcial conserva os campos omitidos, aceita null/false/listas vazias e não recria registro removido. Duas alterações simultâneas em campos distintos do produto preservam ambas.
- Concorrência: IDs distintos em bairros/categorias criados em paralelo, disputa de nome 201/409, ordem contínua após inclusões simultâneas, e corrida entre criação de produto/exclusão de categoria sem produto órfão.
- Revisão independente identificou a necessidade de explicitar o teto monetário anteriormente imposto pela coluna SQL; correção incluída no domínio e na validação HTTP.
- `npm audit`: zero vulnerabilidades reportadas na verificação final. CLI e Client Prisma permanecem fixados em versão compatível com MongoDB; dependência transitiva deepmerge-ts usa override 8.0.2, validado com generate/validate/db push. Ferramentas de desenvolvimento atualizadas e verificadas em Node 24.

## Pendências externas

A URI do Atlas será inserida pelo usuário na Vercel. Nenhuma conexão com o Atlas/Supabase real, migração de dados PostgreSQL, criação de dados demonstrativos em produção ou deploy do backend foi realizada nesta validação. O schema/índices no Atlas precisam ser preparados explicitamente e a API publicada deve ser conferida com `/health` e os cadastros após a configuração.

O frontend publicado anteriormente continua sem essa conexão. Depois de publicar a API, configurar sua URL em `VITE_API_URL` e publicar a versão do frontend com integração.
