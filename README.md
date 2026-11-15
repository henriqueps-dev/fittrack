# FITTRACK

App de academia para montar treinos, registrar a carga de cada série e acompanhar a evolução.
Funciona no navegador e **instala no celular como app** (PWA), inclusive registrando treinos sem internet.

**Stack:** Angular 21 (standalone, signals, zoneless, PWA) · Spring Boot 4 (Java 21, Spring Security + JWT) · PostgreSQL 17 · three.js · Chart.js

## Funcionalidades

- **Conta própria**: cadastro, login com JWT, recuperação de senha. Cada usuário vê só os próprios dados.
- **Biblioteca de exercícios**: 81 exercícios com filtro por mapa muscular interativo, equipamento, nome e favoritos;
  demonstração 3D animada (modelo humano com esqueleto) com o músculo trabalhado destacado em vermelho.
- **Treinos**: montagem com séries, repetições, descanso e observações; reordenação por arrastar;
  divisões prontas ABC / ABCD / ABCDE.
- **Treino em andamento**: carga da última vez já preenchida, check por série, cronômetro de descanso automático
  (vibração, som e notificação), salvamento automático e modo offline com sincronização posterior.
- **Resumo ao finalizar**: volume, duração, comparação com o treino anterior e novos recordes pessoais.
- **Histórico**: mapa de frequência de 26 semanas e detalhe de cada sessão.
- **Evolução**: indicadores por período, volume semanal, séries por músculo, gráfico de carga / 1RM por exercício,
  recordes e conquistas.
- **Perfil**: foto, dados corporais (IMC), objetivo, meta semanal, descanso padrão e troca de senha.

## Rodando localmente

Pré-requisitos: Docker, Java 21+, Node 22+.

```bash
cp .env.example .env              # ajuste as senhas
docker compose up -d              # PostgreSQL em localhost:5433

cd backend
./mvnw spring-boot:run            # API em http://localhost:8080 (migrações Flyway rodam sozinhas)

cd ../frontend
npm install
npm start                         # app em http://localhost:4200
```

## Imagem de produção

O `Dockerfile` na raiz gera **uma única imagem**: compila o Angular e o embute no Spring Boot,
que serve o app e a API (`/api`) no mesmo domínio. Isso dispensa CORS e garante HTTPS para o PWA.

```bash
docker build -t fittrack .
docker run -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://HOST:5432/fittrack -e DB_USERNAME=... -e DB_PASSWORD=... \
  -e JWT_SECRET=$(openssl rand -base64 48) \
  fittrack
```

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DB_URL` | JDBC completo. Alternativa: `DB_HOST`, `DB_PORT`, `DB_NAME` |
| `DB_USERNAME` / `DB_PASSWORD` | Credenciais do PostgreSQL |
| `JWT_SECRET` | Chave de assinatura dos tokens (mínimo 32 caracteres) |
| `JWT_EXPIRATION_HOURS` | Validade do login (padrão 72) |
| `FRONTEND_URL` | URL pública do app (links de recuperação de senha) |
| `EXPOSE_RESET_TOKEN` | `true` só em desenvolvimento (não há SMTP configurado) |
| `PORT` | Porta HTTP (padrão 8080; provedores costumam definir) |

### Deploy no Render

O arquivo `render.yaml` descreve o serviço web (Docker) e o banco PostgreSQL.
No painel do Render: **New → Blueprint**, selecione o repositório e confirme.
O `JWT_SECRET` é gerado automaticamente.

## Instalar no celular

Abra o endereço publicado (HTTPS) no celular:

- **Android (Chrome):** toque em **Instalar** no aviso do app, ou menu ⋮ → *Instalar app*.
- **iPhone (Safari):** botão **Compartilhar** → *Adicionar à Tela de Início*.

O app abre em tela cheia, com ícone próprio, e continua funcionando sem sinal na academia:
os treinos feitos offline são enviados quando a conexão volta.

## Estrutura

```
backend/   Spring Boot: controllers, services, JPA, migrações Flyway (db/migration), segurança JWT
frontend/  Angular: core (serviços, guards, modelos), features (telas), shared (componentes, 3D, gráficos)
Dockerfile Imagem única de produção
render.yaml Blueprint de deploy
```

## Créditos

Modelo 3D "Male Base Mesh" por BoQsc, domínio público (CC0) — ver `frontend/public/models/LICENSE-male-base.txt`.
