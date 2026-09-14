# Campus Events API

> API para gerenciamento de eventos do campus e inscrições de participantes, construída com Node.js, Express, TypeScript e PostgreSQL.

[![CI](https://github.com/vitoravalmeida/campus-events-api-trabalho-ciencia-computacao/actions/workflows/ci.yml/badge.svg)](https://github.com/vitoravalmeida/campus-events-api-trabalho-ciencia-computacao/actions/workflows/ci.yml)

## Sobre o projeto

O **Campus Events API** é o backend responsável por gerenciar **eventos do campus** (palestras, workshops, feiras, etc.) e as **inscrições** de participantes nesses eventos. O projeto foi construído a partir de um template genérico de Node.js + Express, e este README documenta o setup, a estrutura de pastas e as convenções aplicadas ao domínio real do projeto.

> ⚠️ **Nota para quem está migrando o código do template:** as rotas de exemplo `/people` (herdadas do template original) ainda estão presentes no código apenas como referência de implementação (controller, rotas, queries, migration). Elas devem ser substituídas/complementadas pelas entidades reais do domínio, como `events` (eventos) e `registrations` (inscrições), seguindo o mesmo padrão de arquitetura descrito abaixo.

## Índice

- [Requisitos](#requisitos)
- [Como começar (passo a passo)](#como-começar-passo-a-passo)
- [Scripts disponíveis](#scripts-disponíveis)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Rotas principais](#rotas-principais)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Tratamento de erros](#tratamento-de-erros)
- [Testes](#testes)
- [Integração contínua (CI)](#integração-contínua-ci)
- [Convenções de branch e commits](#convenções-de-branch-e-commits)
- [Como contribuir](#como-contribuir)

## Requisitos

- [Node.js](https://nodejs.org/) v22 ou superior (versão utilizada em CI/Docker, conforme `.nvmrc`)
- [Docker](https://www.docker.com/) e Docker Compose (para subir o banco de dados PostgreSQL local)

## Como começar (passo a passo)

Siga os passos abaixo do zero para rodar o projeto localmente. Este fluxo foi testado e não deve gerar erros:

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/vitoravalmeida/campus-events-api-trabalho-ciencia-computacao.git
   cd campus-events-api-trabalho-ciencia-computacao
   ```

2. **Copie o arquivo de variáveis de ambiente:**

   ```bash
   cp .env.example .env
   ```

   Os valores padrão do `.env.example` já são compatíveis com as credenciais definidas no `docker-compose.yml`. Se você alterar as credenciais em um dos arquivos, lembre-se de atualizar o outro também, senão a aplicação não conseguirá se conectar ao banco.

3. **Instale as dependências:**

   ```bash
   npm install
   ```

4. **Suba o banco de dados PostgreSQL com Docker Compose:**

   ```bash
   npm run db:up
   ```

   Esse comando sobe dois bancos: um para desenvolvimento (`api_dev`, porta `4329`) e outro para testes (`api_test`, porta `4328`).

5. **Inicie o servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

   As migrations do banco são aplicadas automaticamente ao iniciar a aplicação (`src/database/migrate.ts`). Se tudo der certo, o log deve mostrar `Server is up on port 3001` (ou a porta definida em `PORT` no `.env`).

6. **(Opcional) Pare os containers do banco quando não precisar mais deles:**

   ```bash
   npm run db:down
   ```

## Scripts disponíveis

| Script             | Descrição                                                    |
| ------------------ | ------------------------------------------------------------ |
| `npm start`        | Inicia o servidor em modo produção (a partir de `dist/`)     |
| `npm run dev`      | Inicia o servidor em modo desenvolvimento com hot reload     |
| `npm run build`    | Compila o projeto TypeScript para JavaScript (`tsc`)         |
| `npm run lint`     | Roda o ESLint para encontrar problemas de estilo/qualidade   |
| `npm run lint:fix` | Corrige automaticamente os problemas encontrados pelo ESLint |
| `npm test`         | Roda a suíte de testes com Vitest                            |
| `npm run db:up`    | Sobe os containers de banco de dados (dev e test) via Docker |
| `npm run db:down`  | Para e remove os containers de banco de dados                |

## Variáveis de ambiente

Definidas em `.env` (veja `.env.example`) e validadas em `src/config.ts` com Zod:

```
# desenvolvimento
PORT="3001"
DATABASE_URL="postgres://api:password@localhost:4329/api_dev"

# testes
TEST_PORT="3002"
TEST_DATABASE_URL="postgres://api:password@localhost:4328/api_test"
```

- `PORT` / `DATABASE_URL`: usados pela aplicação em modo normal (`npm run dev` / `npm start`).
- `TEST_PORT` / `TEST_DATABASE_URL`: usados pela suíte de testes, apontando para o banco de testes isolado.

## Rotas principais

```
GET  /health         # health check básico (status da API)
GET  /health/deep    # health check completo (status da API + conexão com o banco)

GET  /people         # [exemplo do template] lista registros de "people"
POST /people         # [exemplo do template] cria um registro de "people"
```

As rotas de `/people` servem hoje como **referência de implementação** (controller + rotas + queries + migration) para o padrão a ser seguido pelas novas rotas do domínio de eventos, por exemplo:

```
GET  /events              # lista os eventos do campus
POST /events               # cria um novo evento
GET  /events/:id           # detalha um evento específico
POST /events/:id/registrations   # inscreve um participante em um evento
GET  /events/:id/registrations   # lista as inscrições de um evento
```

> As rotas de eventos/inscrições acima ainda estão em desenvolvimento. Ao implementá-las, siga a mesma organização usada em `people`: uma migration em `migrations/`, tipos e queries em `src/database`, um controller em `src/controllers` e as rotas em `src/routes`, registradas em `src/app.ts`.

## Estrutura do projeto

```
.
├── .github            # workflows de CI (testes, lint) e configuração do Dependabot
├── migrations         # scripts de migration do banco de dados (ex.: criação da tabela de eventos)
└── src
    ├── controllers    # lógica de cada rota (ex.: controllers/events.ts, controllers/registrations.ts)
    ├── database       # conexão com o banco, queries SQL e tipos (ex.: Event, Registration)
    ├── errors         # classe de erro customizada (HttpError) para respostas consistentes
    ├── middleware     # middlewares (logger, tratamento de erros, rota não encontrada)
    └── routes         # definição das rotas e seus testes de integração
```

Aplicando ao domínio de eventos, o fluxo de uma requisição `POST /events` seria:

1. `src/routes/events.ts` recebe a requisição e delega para o controller.
2. `src/controllers/events.ts` valida o corpo da requisição (ex.: com um schema Zod `Event`) e chama as queries.
3. `src/database/queries.ts` executa o `INSERT` na tabela `events` e retorna o registro criado.
4. Em caso de erro (dado inválido, evento não encontrado etc.), lança-se um `HttpError`, tratado pelo middleware de erro (`src/middleware`).

## Tratamento de erros

Para manter respostas de erro consistentes, use a classe `HttpError` (`src/errors/index.ts`) ao lançar erros esperados, por exemplo:

```ts
throw new HttpError(404, 'Evento não encontrado');
```

O middleware de erro (`src/middleware/index.ts`) já trata:

- Erros `HttpError` lançados explicitamente (status e mensagem definidos por quem lançou o erro).
- Erros de validação `ZodError` (respondidos automaticamente com status `400`).
- Qualquer outro erro não tratado (respondido com status `500`).

Formato padrão de resposta de erro:

```json
{
  "status": 404,
  "message": "Evento não encontrado",
  "name": "HttpError"
}
```

## Testes

Os testes usam [Vitest](https://vitest.dev/) e [Supertest](https://github.com/ladjs/supertest), cobrindo rotas (`src/routes/*.test.ts`) e queries (`src/database/*.test.ts`).

Para rodar os testes localmente (com o banco de testes já disponível via `npm run db:up`):

```bash
npm test
```

Ao adicionar novas entidades do domínio (eventos, inscrições), crie os testes correspondentes seguindo o padrão já existente em `people.test.ts` e `health.test.ts`.

## Integração contínua (CI)

O projeto conta com workflows do GitHub Actions em `.github/workflows`:

- `ci.yml`: roda os testes e o build do projeto a cada push/PR na branch principal.
- `lint.yml`: roda o ESLint para garantir a qualidade e o padrão do código.

Além disso, `.github/dependabot.yml` mantém as dependências npm atualizadas automaticamente.

## Convenções de branch e commits

### Branches

Use o padrão `<tipo>/<descrição-curta>`, em minúsculas e separado por hífens. Exemplos:

```
feat/events-crud
feat/registrations-endpoint
fix/health-check-timeout
docs/readme-guide
```

Tipos mais comuns: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

### Commits (Conventional Commits)

Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo opcional>): <descrição curta no imperativo>
```

Exemplos:

```
feat(events): adiciona endpoint de criação de evento
fix(registrations): corrige validação de inscrição duplicada
docs(readme): atualiza guia de setup para o domínio de eventos
test(events): adiciona testes de integração para GET /events
chore(deps): atualiza dependências via Dependabot
```

Tipos principais:

| Tipo       | Quando usar                                                         |
| ---------- | ------------------------------------------------------------------- |
| `feat`     | Nova funcionalidade                                                 |
| `fix`      | Correção de bug                                                     |
| `docs`     | Alterações apenas em documentação                                   |
| `refactor` | Alteração de código que não corrige bug nem adiciona funcionalidade |
| `test`     | Adição ou ajuste de testes                                          |
| `chore`    | Tarefas de manutenção (dependências, configs, etc.)                 |

## Como contribuir

1. Crie uma branch a partir da `main` seguindo a convenção acima.
2. Faça commits pequenos e descritivos, seguindo o Conventional Commits.
3. Rode `npm run lint` e `npm test` antes de abrir o Pull Request.
4. Abra o Pull Request descrevendo o que foi feito e referenciando a issue relacionada.
5. **Peça revisão do outro integrante da dupla antes do merge.**

### Dependency security audit

The CI pipeline automatically checks for high and critical dependency vulnerabilities using:

`npm audit --audit-level=high`

The same command can be run locally before opening a pull request.
