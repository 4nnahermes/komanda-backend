# Komanda — Backend

API do Komanda, sistema de gestão para lancheria com delivery: cardápio, pedidos com cálculo automático, estoque de insumos, acerto dos motoboys, fechamento de caixa e dashboard do gestor.

Projeto de Desenvolvimento 1 · UniSenac · 2026-2
Equipe: Anna Hermes, Diego Silva, Gabriel Lessa e Lucas Sol

## Stack

- Node.js + TypeScript
- Express 5
- TypeORM
- PostgreSQL

A justificativa da escolha está em [docs/stack-backend.md](docs/stack-backend.md).

## Pré-requisitos

| Ferramenta | Versão | Como conferir |
|---|---|---|
| Node.js | 20 LTS ou mais recente | `node -v` |
| PostgreSQL | 14 ou mais recente (só para banco local) | pgAdmin aberto ou `psql --version` |
| Git | qualquer recente | `git --version` |

Editor recomendado: VS Code.

## Como rodar

**1. Clonar o repositório**

```bash
git clone https://github.com/4nnahermes/komanda-backend.git
cd komanda-backend
```

**2. Instalar as dependências**

```bash
npm install
```

**3. Configurar o `.env`**

Copie o arquivo de exemplo:

```bash
# Windows (PowerShell)
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

O `.env` fica só na sua máquina e não vai para o GitHub. Escolha uma das opções de banco:

**Opção A — banco online da equipe:** cole em `DATABASE_URL` a connection string que a equipe compartilhou por mensagem privada. Não precisa instalar o PostgreSQL.

**Opção B — banco local:** deixe `DATABASE_URL` vazio, crie um banco vazio chamado `komanda` no pgAdmin (ou no `psql`) e preencha a senha do **seu** PostgreSQL em `DB_PASSWORD`:

```sql
CREATE DATABASE komanda;
```

**4. Criar as tabelas**

```bash
npm run migration:run
```

**5. Subir a API**

```bash
npm run dev
```

O terminal deve mostrar:

```
Komanda API rodando em http://localhost:3000
Verificação: http://localhost:3000/health
```

**6. Testar**

Abra http://localhost:3000/health no navegador (ou no Postman/Insomnia). A resposta esperada é:

```json
{ "status": "ok", "banco": "conectado", "horario": "..." }
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API em modo desenvolvimento (reinicia ao salvar) |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Roda a versão compilada |
| `npm test` | Roda os testes automatizados |
| `npm run typecheck` | Confere os tipos do código e dos testes |
| `npm run migration:generate -- src/migrations/NomeDaMigration` | Gera uma migration a partir das mudanças nas entidades |
| `npm run migration:run` | Aplica as migrations pendentes no banco |
| `npm run migration:revert` | Desfaz a última migration |

## Estrutura

O backend segue a arquitetura limpa. A explicação das camadas, o caminho de uma requisição e o passo a passo para criar um módulo estão em [docs/arquitetura.md](docs/arquitetura.md).

```
src/
  server.ts         ponto de entrada: conecta no banco e sobe a API
  app.ts            configuração do Express e registro das rotas
  data-source.ts    conexão com o PostgreSQL (lê o .env)
  dominio/          regras de negócio puras
  aplicacao/        casos de uso
  infraestrutura/   repositórios e consultas com TypeORM
  interfaces/http/  rotas, controllers, validação e tratamento de erros
  main/             montagem dos módulos
  entity/           modelos de tabela do TypeORM
  migrations/       migrations versionadas do banco
test/               testes automatizados, espelhando src/
docs/               documentação do projeto
```

## Problemas comuns

- **"Não foi possível conectar ao banco"**: confira se o PostgreSQL está rodando, se o banco `komanda` existe e se a senha no `.env` está certa.
- **Banco online não conecta**: confira se a `DATABASE_URL` foi colada inteira, sem espaços nem aspas.
- **Porta 3000 ocupada**: troque `PORT` no `.env`.
- **`password authentication failed`**: a senha em `DB_PASSWORD` não é a do seu usuário `postgres`.

## Validação do README

- [ ] Validado por: ____________ (integrante de fora da dupla de backend) em __/__/2026
