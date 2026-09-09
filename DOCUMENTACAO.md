# Heróis do Cofrinho — Documentação do Projeto

## 1. Visão Geral

**Heróis do Cofrinho** é uma aplicação web gamificada de educação financeira infantil. Crianças completam tarefas (organizadas em sprints semanais estilo Kanban), acumulam pontos convertíveis em dinheiro real e trocam por recompensas cadastradas pelos responsáveis. O sistema inclui jornada educativa (história e quiz), conquistas, metas, avatares personalizáveis e o mascote guia "Capitão Cofrinho".

### Perfis de usuário

| Perfil | Descrição |
|---|---|
| **Administrador** | Acesso total; criado via código de convite `HEROIS-ADMIN-2026`. |
| **Responsável** | Cadastra crianças, tarefas, metas e recompensas; aprova conclusões de tarefas. |
| **Criança** | Conta própria criada pelo Responsável/Admin; executa tarefas, joga e resgata recompensas. |

---

## 2. Tecnologias Utilizadas

### Frontend / Framework
- **React 19** com **TypeScript 5.8**
- **TanStack Start v1** — framework full-stack com SSR (renderização no servidor)
- **TanStack Router v1** — roteamento file-based com type-safety
- **TanStack Query v5** — cache e sincronização de dados
- **Tailwind CSS v4** — estilização via `src/styles.css` com tokens semânticos
- **shadcn/ui + Radix UI** — biblioteca de componentes acessíveis
- **Lucide React** — ícones
- **Zod + React Hook Form** — validação de formulários
- **Vite 7** — build tool e dev server

### Backend (Lovable Cloud)
- **Supabase** (PostgreSQL gerenciado) — banco de dados, autenticação e Row Level Security (RLS)
- **`createServerFn` (TanStack Start)** — RPC tipado para lógica de servidor (ex.: criação de logins de crianças)
- **Cliente admin Supabase** (`client.server.ts`) — operações privilegiadas server-side

### Infraestrutura
- Deploy em **Cloudflare Workers** (via Nitro), com SSR no edge
- Fontes: **Fredoka** (títulos) e **Nunito** (texto)

---

## 3. Estrutura de Diretórios

```text
├── src/
│   ├── assets/                    # Imagens (mascote, capítulos educativos)
│   │   ├── mascot.png
│   │   ├── chapter-barter.jpg
│   │   ├── chapter-coins.jpg
│   │   └── chapter-digital.jpg
│   │
│   ├── components/                # Componentes de UI reutilizáveis
│   │   ├── ui/                    # Componentes shadcn/ui (button, card, dialog…)
│   │   ├── AppSidebar.tsx         # Navegação lateral por perfil
│   │   ├── ChildSelector.tsx      # Seletor da criança ativa (header)
│   │   ├── EmptyChildState.tsx    # Estado vazio quando não há criança selecionada
│   │   └── PiggyBank.tsx          # Cofrinho visual (1 ponto = R$ 0,50)
│   │
│   ├── hooks/
│   │   └── use-mobile.tsx         # Detecção de viewport mobile
│   │
│   ├── integrations/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Cliente browser (RLS) — auto-gerado
│   │   │   ├── client.server.ts   # Cliente admin (service role) — auto-gerado
│   │   │   ├── auth-middleware.ts # Middleware requireSupabaseAuth — auto-gerado
│   │   │   ├── auth-attacher.ts   # Anexa bearer token às server functions
│   │   │   └── types.ts           # Tipos do banco — auto-gerado
│   │   └── lovable/
│   │
│   ├── lib/                       # Lógica de negócio e utilitários
│   │   ├── auth.ts                # useCurrentUser, roles, erros amigáveis
│   │   ├── profile.ts             # useCurrentProfile, saudações por gênero
│   │   ├── children.ts            # useSelectedChild (persiste no localStorage)
│   │   ├── sprints.ts             # Ciclos semanais, carryover, tarefas diárias
│   │   ├── child-login.functions.ts # Server functions de login infantil
│   │   ├── utils.ts               # cn() e helpers
│   │   ├── error-capture.ts / error-page.ts # Tratamento de erros SSR
│   │   └── mock-data.ts           # Dados estáticos da jornada educativa
│   │
│   ├── routes/                    # Rotas file-based (TanStack Router)
│   │   ├── __root.tsx             # Layout raiz (fontes, meta, Toaster)
│   │   ├── auth.tsx               # Login/cadastro com roteamento por perfil
│   │   ├── forgot-password.tsx    # Recuperação de senha (envio de e-mail)
│   │   ├── reset-password.tsx     # Definição de nova senha
│   │   └── _authenticated/        # Rotas protegidas (gate de sessão)
│   │       ├── route.tsx          # Guarda: redireciona para /auth se não logado
│   │       ├── _app.tsx           # Layout com sidebar, header e ChildSelector
│   │       ├── _app.index.tsx     # "Meu Mundo" — dashboard da criança
│   │       ├── _app.tarefas.tsx   # Kanban (A fazer / Fazendo / Concluída)
│   │       ├── _app.sprints.tsx   # Histórico de sprints semanais
│   │       ├── _app.recompensas.tsx # Loja de recompensas
│   │       ├── _app.metas.tsx     # Metas de economia
│   │       ├── _app.conquistas.tsx # Medalhas e conquistas
│   │       ├── _app.historia.tsx  # Jornada educativa — capítulos
│   │       ├── _app.quiz.tsx      # Quiz por capítulo
│   │       ├── _app.avatar.tsx    # Editor de avatar
│   │       ├── _app.criancas.tsx  # Gestão de crianças (Responsável/Admin)
│   │       ├── _app.pais.tsx      # Painel do Responsável
│   │       └── _app.admin.tsx     # Painel do Administrador
│   │
│   ├── router.tsx                 # Criação do router
│   ├── routeTree.gen.ts           # Árvore de rotas (auto-gerado)
│   ├── server.ts                  # Entry SSR com wrapper de erros
│   ├── start.ts                   # Config do TanStack Start + middlewares
│   └── styles.css                 # Design tokens (Tailwind v4, cores, fontes)
│
├── supabase/
│   ├── config.toml                # Configuração do projeto (auto-gerado)
│   └── migrations/                # 6 migrations com schema, RLS e triggers
│
├── vite.config.ts                 # Config Vite/TanStack Start
├── tsconfig.json                  # TypeScript strict + alias "@/"
└── components.json                # Config shadcn/ui
```

---

## 4. Arquitetura da Solução

### 4.1 Camadas

```text
┌─────────────────────────────────────────────────────┐
│                    Navegador                        │
│  React 19 + TanStack Router/Query + Tailwind        │
│  Cliente Supabase (anon key, RLS aplicada)          │
└──────────────┬──────────────────────┬───────────────┘
               │ SSR / RPC            │ PostgREST + Auth
┌──────────────▼──────────────┐       │
│  TanStack Start (Worker)    │       │
│  - SSR das rotas            │       │
│  - createServerFn (RPC)     │       │
│  - requireSupabaseAuth      │       │
│  - supabaseAdmin (privil.)  │       │
└──────────────┬──────────────┘       │
               │                      │
        ┌──────▼──────────────────────▼──────┐
        │   Supabase (PostgreSQL + Auth)     │
        │   - 10 tabelas com RLS             │
        │   - Triggers (handle_new_user)     │
        │   - Funções (has_role,             │
        │     can_access_child)              │
        └────────────────────────────────────┘
```

### 4.2 Fluxo de autenticação e autorização

1. **Cadastro público** (`/auth`): apenas perfis **Responsável** (e Admin via código de convite). O formulário de Responsável já permite cadastrar crianças vinculadas. O trigger `handle_new_user` cria `profiles` e `user_roles` automaticamente.
2. **Login infantil**: criado exclusivamente pelo Responsável/Admin logado, via server function `createChildLogin` (`child-login.functions.ts`), que usa o cliente admin para criar o usuário Auth e vincular `children.user_id`. A revogação (`removeChildLogin`) exclui o usuário e desvincula.
3. **Roteamento por perfil**: após login, `fetchPrimaryRole` (em `lib/auth.ts`) consulta `user_roles` e redireciona: Admin → `/admin`, Responsável → `/pais`, Criança → `/`.
4. **Guarda de rotas**: `src/routes/_authenticated/route.tsx` verifica a sessão em `beforeLoad` e redireciona para `/auth`.
5. **RLS**: toda tabela possui políticas baseadas em `has_role()` e `can_access_child()`, garantindo que cada usuário veja apenas seus dados (ou os dos filhos vinculados).

### 4.3 Multi-criança

- Hook `useSelectedChild` (`lib/children.ts`) mantém a criança ativa e persiste a escolha no `localStorage`.
- `ChildSelector` no header permite alternar entre crianças (visão do Responsável).
- Todos os dados (tarefas, metas, conquistas, progresso educativo) são escopados por `child_id`.

### 4.4 Sistema de tarefas, sprints e economia

- **Kanban** (`_app.tarefas.tsx`): três colunas (A fazer / Fazendo / Concluída) com drag-and-drop para mouse e **botões de seta para dispositivos touch**.
- **Sprints semanais** (`lib/sprints.ts`): começam segunda e terminam domingo. `ensureSprintForChild` (chamado no layout `_app.tsx` a cada acesso) cria o novo sprint quando necessário, fazendo **carryover** das tarefas únicas não concluídas e recriando tarefas recorrentes (diárias ganham `task_date` do dia; semanais, o primeiro dia da semana). Se a tarefa diária do dia não existir/não estiver concluída, uma nova é criada em "A fazer".
- **Aprovação parental**: a criança move para "Concluída", mas a tarefa fica `approval = 'pending'`. O Responsável aprova (pontos creditados) ou rejeita (tarefa volta para "Fazendo"). Estorno automático se a tarefa for movida de volta antes da aprovação.
- **Economia**: 1 ponto = R$ 0,50, exibido no `PiggyBank`. Pontos acumulam para resgate de recompensas cadastradas pelos pais.
- **Histórico**: `_app.sprints.tsx` lista semanas anteriores com desempenho.

### 4.5 Jornada educativa e gamificação

- Capítulos de história (escambo, moedas, dinheiro digital) com progresso persistido em `chapter_progress` por criança.
- Quizzes com tentativas registradas em `quiz_attempts`.
- Conquistas (`achievements`), metas de economia (`goals`), avatar personalizável e saudações dinâmicas ("Bem-vindo" para masculino/outros, "Bem-vinda" para feminino) via `useCurrentProfile` e campo `gender`.

### 4.6 Banco de dados (10 tabelas)

| Tabela | Finalidade |
|---|---|
| `profiles` | Dados do usuário (nome, gênero) |
| `user_roles` | Papéis (admin/parent/child) — separada por segurança |
| `children` | Crianças vinculadas a responsáveis (`parent_id`, `user_id`) |
| `sprints` | Ciclos semanais por criança |
| `tasks` | Tarefas (status, `sprint_id`, `task_date`, `approval`, pontos) |
| `rewards` | Recompensas resgatáveis por pontos |
| `goals` | Metas de economia |
| `achievements` | Conquistas desbloqueadas |
| `chapter_progress` | Progresso na jornada educativa |
| `quiz_attempts` | Tentativas e notas dos quizzes |

Todas com RLS habilitado, GRANTs explícitos e migrations versionadas em `supabase/migrations/`.

---

## 5. Integrações

- **Supabase Auth**: e-mail/senha, recuperação de senha (`/forgot-password` → e-mail → `/reset-password`), mensagens de erro amigáveis em português (`friendlyAuthError`).
- **Supabase PostgREST**: leituras/escritas do cliente com RLS; server functions com `requireSupabaseAuth` para operações autenticadas e `supabaseAdmin` (carregado dinamicamente no handler) apenas para criação/revogação de logins infantis.
- **TanStack Query**: `ensureQueryData` em loaders + `useSuspenseQuery`/`useQuery` nos componentes, com invalidação após mutações (ex.: após `ensureSprintForChild`).

## 6. Convenções e Segurança

- Rotas em português, uma por seção, cada uma com `head()` próprio (SEO).
- Tokens semânticos de cor em `styles.css` (sem cores hardcoded nos componentes).
- Papéis nunca armazenados no perfil nem verificados no client para autorização — sempre via `user_roles` + funções `security definer` no banco.
- Validação de entrada com Zod tanto no client (formulários) quanto nas server functions.
