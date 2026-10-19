# Arquitetura do backend

O Komanda segue a **arquitetura limpa**: as regras de negócio ficam no centro e não dependem de Express, de TypeORM nem de banco de dados. Isso permite testar as regras sem subir a API e trocar o banco ou o framework sem reescrever o domínio.

O backend é genérico para qualquer restaurante. Termos e regras específicos de um cliente ficam nos dados e nas configurações, nunca no código.

## Camadas

```
src/
  dominio/            regras de negócio puras: entidades, value objects, erros e interfaces de repositório
  aplicacao/          casos de uso (um por ação) e portas de consulta
  infraestrutura/     implementações com TypeORM: repositórios e consultas
  interfaces/http/    Express: rotas, controllers, validação das requisições e tratamento de erros
  main/               composição: monta cada módulo ligando os casos de uso às implementações
  entity/             modelos de tabela do TypeORM
  migrations/         migrations versionadas do banco
```

**Regra de dependência.** Cada camada só conhece as camadas mais internas:

```
interfaces/http  ─┐
                  ├──>  aplicacao  ──>  dominio
infraestrutura   ─┘
main  (conhece todas, porque monta as peças)
```

O domínio não importa nada de fora dele. O caso de uso recebe as dependências como interfaces, e quem entrega a implementação com TypeORM é o `main`.

## Caminho de uma requisição

Exemplo com `POST /api/produtos`:

1. **Rota e controller** (`interfaces/http`): conferem o formato do corpo com um esquema do zod e chamam o caso de uso.
2. **Caso de uso** (`aplicacao`): confere se a categoria existe e se o nome está livre, cria a entidade `Produto` e pede ao repositório para gravar.
3. **Entidade** (`dominio`): valida as regras do próprio produto, como nome obrigatório e preço maior que zero.
4. **Repositório** (`infraestrutura`): converte a entidade para o modelo do TypeORM e grava no banco.
5. **Erros**: o domínio e os casos de uso lançam `ErroDeValidacao`, `RecursoNaoEncontrado` ou `ConflitoDeDados`. O middleware `tratarErros` transforma cada um em 400, 404 ou 409, no formato `{ "erro": "mensagem" }` do contrato.

## Convenções

- **Controller só traduz HTTP.** Lê a requisição, chama o caso de uso e devolve a resposta. Sem regra de negócio e sem acesso ao banco.
- **Sem try/catch nas rotas.** O Express 5 encaminha os erros das rotas assíncronas para o `tratarErros`.
- **Um caso de uso por arquivo**, com nome de ação: `CriarProduto`, `AtualizarProduto`.
- **Dinheiro em centavos** no domínio, com o value object `Dinheiro`. A conversão para reais acontece só na entrada e na saída da API.
- **Erros de domínio sem código HTTP.** Quem escolhe o status é a camada HTTP.
- **Leitura e escrita separadas.** Os casos de uso que alteram dados usam um repositório com a entidade do domínio. Listagens usam uma porta de consulta que já devolve o formato de resposta, com os joins necessários.

## Testes

```bash
npm test
```

- **Domínio e casos de uso**: testes unitários com repositórios em memória (`test/fakes`), sem banco.
- **Rotas**: testes com supertest sobre o módulo montado com os repositórios em memória. Conferem códigos HTTP e mensagens do contrato.

## Como criar um módulo novo

1. Entidade e interface do repositório em `src/dominio/<modulo>/`.
2. Casos de uso e portas de consulta em `src/aplicacao/<modulo>/`.
3. Implementações com TypeORM em `src/infraestrutura/typeorm/`, e o modelo de tabela com a migration.
4. Esquemas do zod, controller e rotas em `src/interfaces/http/<modulo>/`.
5. Montagem do módulo em `src/main/` e registro da rota no `app.ts`.
6. Testes em `test/`, espelhando a estrutura de `src/`.

## Transição

A US01 (categorias) foi feita antes desta estrutura e ainda usa `service`, `controller` e `routes` na raiz de `src/`. Ela será migrada para as camadas acima. Até lá, os modelos de tabela de `src/entity/` servem às duas formas.
