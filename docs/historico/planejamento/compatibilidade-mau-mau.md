> Documento histórico da versão TypeORM/PostgreSQL. Para a versão atual use [o README](../../../README.md) e `docs/PUBLICACAO.md`.

# Compatibilidade — fonte Mau Mau Lanches e publicação na Vercel

22/10/2026. A fonte foi corrigida pelo usuário para o frontend de `projeto_mau_mau_lanches_teste`, origem `diego-rosa/projeto_mau_mau_lanches_teste`, revisão `bca95c7` mais os ajustes locais existentes. O novo repositório é `GabrielLTM/komanda-frontend`. Importar somente src/public/configurações do frontend, preservando autoria e a base de telas; não importar backend embutido, node_modules, .env ou builds. As tentativas de adaptação da versão antiga do frontend foram mantidas somente em branches locais, sem publicação.

## Escopo autorizado

Concluir a compatibilidade dos cadastros e do cardápio com o backend Komanda. O backend será publicado na Vercel pela responsável do repositório, usando Supabase como PostgreSQL. Frontend será publicado depois pelo novo repositório. Não executar deploy, merge ou migration no banco da equipe. Informar o usuário quando os PRs estiverem revisados/testados e prontos para merge.

## Contrato real da nova fonte

- Categorias: frontend `{id,name,active,ordem}`; API `{id,nome,ativo,ordem}`. CRUD/reordenação já existem.
- Produtos: frontend `{id,catId,name,price,desc,active,ings:string[],extras:[nome,preco][]}`. API mantém os campos existentes e acrescenta somente `ingredientes:string[]` e `adicionais:[{nome,preco}]`.
- `ings` representa a lista textual que pode ser removida no pedido do protótipo; não é ficha técnica nem baixa de insumos. `extras` são opções textuais com preço, não movimentações de estoque.
- Bairros: frontend `{id,name,fee,active}` ↔ API `{id,nome,taxaEntrega,ativo}`.
- Motoboys: frontend nome/telefone ↔ API nome/telefone/valorFixoNoite/ativo. O valor fixo do backend é individual. A edição de uma diária de referência pode ser usada explicitamente para novos cadastros; não anunciar pagamentos/acerto sem módulo de pedidos real.

## Backend

Branch de compatibilidade parte de `codex/motoboys`, sem depender da refatoração adicional de categorias. Extensão mínima de produto: domínio, schemas, DTOs, leitura de cardápio, repositórios e migration aditiva reversível `1792620003000-CamposCatalogoFrontend.ts`, somente duas colunas JSONB com defaults []. Ingredientes: no máximo 50 textos únicos não vazios de até120 caracteres aparados. Adicionais: no máximo50, nome único sem diferenciar caixa até100, preço 0..99999999.99 até2casas validado emcentavos. POST/PATCH aceitam ambos, arraysvazios limpam, omissão preserva. PATCH persiste só campos enviados, com valores normalizados do domínio, sem regravar preço ausente nem recriar registro excluído. Payloads antigos seguem válidos. Sem campo novo de imagem/combos/estoque porproduto ou metadados de categoria que a nova fonte não usa.

Vercel: expor entrada Express reconhecida com default export, inicialização idempotente do TypeORM antes de atender rotas, sem depender de app.listen no caminho serverless; reusar pool por instância e promessadeinitialização concorrente, recuperar falha posterior. Incluir entidades de forma rastreável pelo bundler (imports explícitos em vez de depender só de glob) e scripts de migrations compiladas para o procedimento da responsável. Manter desenvolvimento local funcionando. Ambiente: DATABASE_URL do Supabase apenas no backend; SSL e tamanho do pool conforme configuração. Testes de inicialização concorrente/falha e smokeHTTPcomPGlocal. Documentar procedimento Vercel+Supabase com referências oficiais. Não conectar aoSupabasereal nem mudar credenciais.

## Frontend

Base main deve permanecer uma importação fiel da fonte. Alterações ficam em `codex/integracao-cadastros`. Não substituir a interface pela versão antiga. Completar o serviço HTTP existente com bairros/motoboys e mapear os campos reais, sem o fallback silencioso que mistura dadosdemonstrativos comdadosreais. Preservar estados vazios e mensagens de erro/retry. GEThealth usa URL dobackend derivadadeVITE_API_URL emprodução; Viteproxy parametrizável API_PROXY_TARGET emdesenvolvimento. Não enviar conexãoSupabase aocliente.

Ligar categorias/produtos/bairros/motoboys às telas jáexistentes com operações persistentes, busy/dedupe e confirmação de exclusão da aplicação. Alterações de ingredientes/adicionais no CardapioAdmin também devem irparaAPI e sobreviver recarga. Formulários sófecham após sucesso e mantêm entradas emfalhas. A descrição vazia vira null e preçoausente numPATCH não vira NaN.

Pedidos/quadro/estoque/caixa/acerto ainda não têm módulo entregue nobackend. Preservar as telas dafonte e identificar claramente a demonstração/indisponibilidade sem anunciar persistência; não gravar parcialmente umpedido com PATCHs independentes nem exibir dadosdemonstrativos como Supabase. Nenhum resetdestrutivo remoto ou seedautomático. Preservar assets/fontes/layout, corrigindo apenas problemas deinteração/acessibilidade afetados. Ler/aplicar frontend-design e frontend-design-premium sobre a novaidentidade visual, com DESIGN/UX baseados na fonte nova.

## Verificação

Backend: suíte unitária/HTTP, typecheck/build, migrationup/down/up compreservaçãodelegados, campos stringlist/extraspreço4.1/zero, PATCH parcialnormalizado, errosPortuguês, inicializaçãodatabase concorrente. Frontend: testes do serviço, build, varredura de arquivos para ausência backend/.env/node_modules emtodo históricopublicado, comparación byteabyte da importação main comfonte. Browser contraAPI/PostgreSQLdescartável: criar/editar/toggle/reordenar/excluir categorias/produtos/bairros/motoboys; ingredientes/adicionaisapós recarga; erro de validação/rede mantendo formulário; retry; listasvazias; viewportestreita. Todos PRs precisam ter resultados reais e limitações descritos. Deploy final naVercel somente após revisão/merge pelaequipe.
