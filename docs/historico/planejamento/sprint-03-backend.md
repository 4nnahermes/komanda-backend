> Documento histórico da versão TypeORM/PostgreSQL. Para a versão atual use [o README](../../../README.md) e `docs/PUBLICACAO.md`.

# Planejamento da Sprint 3 — backend

Data: 22/10/2026. Base auditada: `main` em `531a13f`.

## Objetivo e fontes

Entregar cadastros de bairros/taxas e motoboys com persistência e contrato explícito, apoiar a integração do cardápio já disponível e concluir a transição arquitetural de categorias. Fontes: status report Sprint 2 do projeto acadêmico, requisitos R1/R19/R26, RN4, código remoto e issues #19/#24/#25/#26. O report fornece escopo; o backlog de 08/10 está desatualizado. Não há datas novas de sprint confirmadas.

## Situação de partida

Categorias, produtos e cardápio estão na main (PRs #20/#21/#22/#23). Produtos/cardápio já usam domínio, aplicação, infraestrutura, interfaces HTTP e composição. Categorias ainda depende de service/controller/routes legados. Bairros e motoboys não existem. As issues #24–#26 não têm descrição, responsável ou milestone; #19 permanece na Sprint 2.

## Divisão em PRs

1. **Planejamento e alinhamento de contrato**: este plano, contratos detalhados dos dois cadastros e matriz de integração. Referencia #25; não encerra a negociação com cliente/frontend por conta própria.
2. **Bairros e taxas**: CRUD, ativação, filtro, migration reversível, unicidade no banco, testes unitários/HTTP/PostgreSQL e roteiro manual. Parte de #26.
3. **Motoboys**: CRUD, nome, telefone opcional, situação e valor fixo por noite, migration reversível, testes e roteiro manual. Parte de #26. Acerto financeiro fica fora.
4. **Categorias em arquitetura limpa**: migrar a US01 preservando as seis rotas e mensagens; ordem transacional e unicidade sem diferenciar maiúsculas. Acrescentar testes de contrato e persistência. Pendência técnica do report.

Os implementadores trabalham em worktrees separados e usam gpt-6-luna. Todos recebem este plano antes de codificar. A revisão final e a integração são do agente principal. Para permitir revisão de diffs pequenos, os PRs serão encadeados nesta ordem: planejamento → bairros → motoboys → categorias. O corpo de cada PR declara a dependência. Nenhum PR será mergeado automaticamente.

## Contrato dos cadastros

Especificação completa em `docs/contratos/cadastros-entrega.md`. Ambos usam `/api`, JSON, erros `{ "erro": "mensagem" }`, arrays diretos, identificadores inteiros positivos compatíveis com PostgreSQL integer e PATCH parcial. Valores monetários são números em reais na API, inteiros em centavos no domínio, `numeric(10,2)` no banco; intervalo de zero a 99999999.99. Taxa zero significa entrega gratuita. Os novos cadastros aceitam `ativo` no POST, padrão true. Nomes são aparados; unicidade por `lower(nome)` vale também para registros inativos. Não há remoção automática de acentos.

Bairro: `{id,nome,taxaEntrega,ativo}`, nome obrigatório até 100 caracteres, taxa obrigatória. Motoboy: `{id,nome,telefone,valorFixoNoite,ativo}`, nome obrigatório até 100 caracteres, telefone opcional até 30 caracteres (texto, aparado; vazio vira null). Valor fixo omitido usa zero, sem presumir a diária de R$40 do protótipo. R26 é interpretado conforme o modelo original como valor por motoboy; a proposta global da tela ainda requer validação e não altera pagamentos nesta sprint. Nomes duplicados retornam 409, inclusive em concorrência.

GET de coleção aceita `ativo=true|false`, ordena por nome e id e inclui inativos quando o filtro falta. POST retorna 201; GET/PATCH 200; DELETE 204; dado inválido 400; id inválido/inexistente 404; unicidade/referência em uso 409. PATCH vazio ou só com campos desconhecidos retorna 400. Nenhum endpoint calcula acerto, cria pedido ou baixa estoque.

## Critérios de aceite

### Bairros

- B1: criar, listar, buscar, editar só campos enviados e excluir; alterações persistem após nova consulta/conexão.
- B2: ativar/desativar e filtrar, sem apagar dados.
- B3: aceitar taxa zero e duas casas decimais; rejeitar negativa, tipo inválido, excesso de precisão e valores fora do numeric.
- B4: nome vazio/longo, filtro inválido e id inválido têm respostas do contrato; nome repetido sem diferenciar caixa retorna 409, inclusive em concorrência.
- B5: migration up/down em banco descartável e ausência de regressão nas rotas existentes.

### Motoboys

- M1: CRUD e filtro ativo com persistência; nome é obrigatório.
- M2: telefone textual opcional/null; PATCH com null limpa, omissão preserva; números não substituem texto.
- M3: valor fixo não negativo em centavos, padrão zero; mesmas bordas monetárias dos bairros.
- M4: validações, 404, nome repetido/concorrência 409 e migration reversível.
- M5: não calcular saldo, marcar pagamento nem alterar pedidos nesta entrega.

### Categorias

- C1: preservar GET coleção/detalhe, POST, PATCH, DELETE e PATCH /ordem, com mensagens/status/payload existentes.
- C2: inserir na posição solicitada, deslocar seguintes, fechar lacuna ao excluir e reordenar lista completa sem duplicidade.
- C3: bloquear exclusão com produtos (409); desativação mantém produtos e esconde categoria do cardápio.
- C4: domínio/aplicação sem TypeORM/Express; controllers sem acesso ao banco; remover legado não usado.
- C5: transação serializa alterações de ordem e protege o conjunto validado; erro não deixa ordem parcial. Índice lower(nome) impede duplicados concorrentes. Migration falha claramente em dados antigos conflitantes, sem apagar ou renomear registros.

## Estratégia de implementação

Seguir os padrões de produtos: entidade de domínio, interfaces de repositório, um caso de uso por ação, modelos TypeORM em src/entity, repositórios em infraestrutura, schemas zod/controllers/rotas em interfaces/http e factories em main. Registrar rotas antes do middleware final. `data-source.ts` já descobre entidades e migrations por glob. Cada agente possui os arquivos do módulo, sua migration, seus testes e roteiro HTTP. Arquivos compartilhados são integrados sequencialmente pelo agente principal.

## Verificação e evidências

Executar `npm test`, `npm run typecheck` e `npm run build` por módulo e no conjunto. Validar persistência, índices únicos concorrentes, transações de ordem e up/down com PostgreSQL descartável local via Docker; nunca usar DATABASE_URL da equipe. Revisão independente verifica diff, contrato, erros, concorrência e migrations. Registrar comandos/resultados e limitações em `docs/validacao/sprint-03-backend.md` antes de publicar os PRs. O backend não exige teste de tela; a integração visual permanece não verificada neste escopo.

## Integração e decisões pendentes

A matriz em `docs/contratos/alinhamento-frontend.md` orienta a issue #24 e registra limites para #25. Contrato documentado não equivale a acordo com cliente. Combos/imagens/ingredientes removíveis/estoque por produto permanecem fora do catálogo básico até as decisões listadas. A equipe frontend deve converter `name/fee/active/phone` para os campos do contrato, remover a persistência local dos cadastros e validar recarregamento/erros/estados vazios. Feedback do cliente (#19) exige sessão real e registro humano, não pode ser fabricado nem fechado por esta implementação.

## Riscos e sequência de merge

- Dados antigos de categorias podem conflitar no novo índice: investigar e corrigir com a equipe, sem limpeza automática.
- PRs dependentes: mergear planejamento, bairros, motoboys e categorias, atualizando bases conforme os anteriores entrarem.
- Não configurar CORS, SSL, autenticação ou módulos futuros por conveniência; esses assuntos não fazem parte destas entregas.
- Nenhum deploy, merge ou migration em ambiente da equipe está autorizado por este plano.
