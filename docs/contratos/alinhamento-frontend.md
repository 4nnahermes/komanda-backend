# Alinhamento entre a API e o frontend Mau Mau

Fonte de referência: `projeto_mau_mau_lanches_teste`, revisão de origem `bca95c7` com os ajustes locais mantidos em `komanda-frontend`. O mapeamento abaixo descreve o contrato da fonte importada; não significa que a integração foi validada pelo cliente.

| Modelo da tela | Contrato da API | Regra de integração |
|---|---|---|
| Categoria `{id,name,active,ordem}` | `{id,nome,ativo,ordem}` | CRUD e reordenação existentes |
| Produto `{id,catId,name,price,desc,active,ings,extras}` | `categoria.id`, `nome`, `preco`, `descricao`, `ativo`, `ingredientes:string[]`, `adicionais:[{nome,preco}]` | converter nomes e usar valores em reais com até dois centavos |
| Bairro `{id,name,fee,active}` | `{id,nome,taxaEntrega,ativo}` | carregar da API e converter nomes |
| Motoboy `{id,name,phone,active}` | `{id,nome,telefone,valorFixoNoite,ativo}` | diária é individual no backend; uma diária de referência só se aplica a novos cadastros quando a interface deixar isso claro |

`ings` são textos que a tela pode remover ao personalizar um pedido. Não representam ficha técnica nem baixa de insumos. `extras` são nomes com preços e não movimentam estoque. As listas aceitam até 50 itens; ingredientes são textos únicos de até 120 caracteres e adicionais têm nome único sem diferenciar maiúsculas/minúsculas até 100 caracteres.

Em `PATCH`, a API preserva campos omitidos; listas vazias apagam somente a lista correspondente. Preços de adicionais são validados e normalizados em centavos. Produto e categoria continuam aceitando payloads antigos.

## Publicação do backend

A configuração segue os guias oficiais de [Express na Vercel](https://vercel.com/docs/frameworks/backend/express) e [conexão serverless do Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres/serverless-drivers).

1. Conectar o repositório backend à Vercel usando o preset automático do Express. `src/app.ts` exporta a aplicação como default; a execução serverless não chama `listen`.
2. Definir `DATABASE_URL` somente como variável secreta do projeto backend. No Supabase, obter a URI de conexão apropriada à execução serverless no painel Connect; para clientes PostgreSQL em serverless, a documentação orienta usar o pool compartilhado em modo transaction. Configurar SSL no banco.
3. `DB_POOL_MAX` controla o máximo por instância Vercel; o padrão é `2` para limitar conexões em escala horizontal. A instância de Node reaproveita o `DataSource` e o pool durante chamadas quentes, e compartilha uma única inicialização simultânea. Uma falha de conexão libera a próxima chamada para tentar novamente.
   As consultas do TypeORM usam parâmetros sem nome explícito para prepared statements, evitando manter statements nomeados presos a conexões de pool compartilhado em modo transaction.
4. Para aplicar migrations, executar `npm run migration:run:compiled` a partir de um ambiente confiável com `DATABASE_URL` apontando para o banco de destino. Esse comando compila e então usa o TypeORM CLI sobre `dist/data-source.js`; não roda automaticamente em cada build nem no início de uma requisição. Para desfazer a última migration, existe `npm run migration:revert:compiled`.
5. Fazer deploy e conferir `/health` e os cadastros depois que a migration estiver aplicada. Não configurar `DATABASE_URL` no frontend.

O `DATABASE_URL` de produção ainda não foi conectado nem testado neste repositório. A validação operacional deve usar o banco descartável e, depois, a responsável pode aplicar o procedimento ao ambiente autorizado.
