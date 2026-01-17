# 🚀 Projeto Fullstack - Vercel + Supabase

Este é um projeto fullstack preparado para deploy no Vercel, com:
- **Frontend**: React + Vite + TypeScript
- **Backend**: Python (FastAPI) como Serverless Functions
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth

## 📁 Estrutura do Projeto

```
meu-projeto-vercel/
├── api/                    # Backend (Python - Serverless Functions)
│   ├── index.py           # Rota principal da API
│   ├── auth.py            # Rotas de autenticação
│   ├── users.py           # CRUD de usuários
│   ├── items.py           # CRUD de items (exemplo)
│   └── _utils/            # Utilitários do backend
│       ├── __init__.py
│       ├── supabase_client.py
│       └── auth_middleware.py
├── src/                    # Frontend (React)
│   ├── components/        # Componentes React
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # Serviços (API, Supabase)
│   ├── hooks/             # Custom hooks
│   ├── contexts/          # Context API
│   ├── App.tsx
│   └── main.tsx
├── public/                 # Arquivos estáticos
├── vercel.json            # Configuração do Vercel
├── requirements.txt       # Dependências Python
├── package.json           # Dependências Node.js
├── vite.config.ts         # Configuração do Vite
├── tsconfig.json          # Configuração TypeScript
└── .env.example           # Exemplo de variáveis de ambiente
```

## 🛠️ Configuração Inicial

### 1. Clone e instale as dependências

```bash
# Instalar dependências do frontend
npm install

# Instalar dependências do backend (para desenvolvimento local)
pip install -r requirements.txt
```

### 2. Configure o Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings > API** e copie:
   - `Project URL` → será o `VITE_SUPABASE_URL` e `SUPABASE_URL`
   - `anon public` key → será o `VITE_SUPABASE_ANON_KEY` e `SUPABASE_ANON_KEY`
   - `service_role` key → será o `SUPABASE_SERVICE_ROLE_KEY` (apenas backend)

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha com suas credenciais do Supabase.

### 4. Execute o SQL no Supabase

Vá em **SQL Editor** no Supabase e execute o conteúdo do arquivo `supabase/schema.sql`.

## 🚀 Desenvolvimento Local

### Rodar o frontend

```bash
npm run dev
```

### Rodar o backend localmente (com Vercel CLI)

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Rodar em modo desenvolvimento
vercel dev
```

## 📦 Deploy no Vercel

### 1. Instale o Vercel CLI

```bash
npm install -g vercel
```

### 2. Faça login

```bash
vercel login
```

### 3. Deploy

```bash
vercel
```

### 4. Configure as variáveis de ambiente no Vercel

No dashboard do Vercel, vá em **Settings > Environment Variables** e adicione:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🔐 Autenticação

O projeto usa o Supabase Auth. Endpoints disponíveis:

- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário logado

## 📝 CRUD de Items (Exemplo)

- `GET /api/items` - Listar todos os items
- `GET /api/items/{id}` - Buscar item por ID
- `POST /api/items` - Criar novo item
- `PUT /api/items/{id}` - Atualizar item
- `DELETE /api/items/{id}` - Deletar item

## 🔗 Links Úteis

- [Documentação Vercel Python](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação FastAPI](https://fastapi.tiangolo.com/)
- [Documentação React](https://react.dev/)

## 📄 Licença

MIT
