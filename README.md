# Smart Notes - AI-Powered Note-Taking App

A modern note-taking application with an AI-powered chat interface for intelligent note querying using RAG (Retrieval Augmented Generation) and MCP (Model Context Protocol) integration.

## Features

- **Notes CRUD** - Create, read, update, and delete notes with a clean UI
- **AI Chat Assistant** - Chat with your notes using OpenAI GPT-4o-mini with streaming responses
- **Semantic Search** - Find notes by meaning using vector embeddings (pgvector + OpenAI text-embedding-3-small)
- **MCP Integration** - Expose notes as tools for Claude Desktop and other MCP clients via xmcp
- **API Key Management** - Generate scoped API keys with granular permissions (read, create, update, delete)
- **Auth** - Email/password authentication with Supabase Auth
- **Dark Mode** - Theme switching with next-themes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) |
| Database | Supabase PostgreSQL + pgvector |
| ORM | Drizzle ORM |
| Auth | Supabase Auth |
| AI | Vercel AI SDK v5 + OpenAI |
| MCP | xmcp |
| State | TanStack React Query |
| Forms | React Hook Form + Zod |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with the pgvector extension enabled
- An [OpenAI](https://platform.openai.com) API key

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Database (Supabase Postgres connection string)
DATABASE_URL=your_database_url
```

### Setup

```bash
# Install dependencies
npm install

# Run database migrations
npx drizzle-kit push

# Start the dev server (runs xmcp dev + next dev)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Project Structure

```
app/
├── (auth)/              # Sign in / sign up routes
├── (main)/notes/        # Notes management page
├── api/chats/           # Chat API endpoint
├── mcp/                 # MCP protocol handler
├── settings/            # API key management
└── actions/             # Server actions (notes, auth, api-keys)
components/
├── ai-elements/         # Chat UI & chat panel
├── notes/               # Note card, list, dialog
├── settings/            # API key settings
└── ui/                  # shadcn/ui components
lib/
├── db/                  # Drizzle schema & client
├── ai/                  # AI model config & system prompts
├── services/            # Business logic (notes, auth)
├── supabase/            # Supabase client configs
└── embeddings.ts        # OpenAI embedding generation
tools/                   # MCP tools (search, create, update, delete)
drizzle/                 # Database migrations
```

## MCP Integration

The app exposes four tools via xmcp for use with Claude Desktop or any MCP client:

| Tool | Scope | Description |
|------|-------|-------------|
| `search_notes` | `notes:read` | Semantic search across notes |
| `create_note` | `notes:create` | Create a new note |
| `update_note` | `notes:update` | Update an existing note |
| `delete_note` | `notes:delete` | Delete a note |

Generate API keys with appropriate scopes in the Settings page to authenticate MCP clients.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (xmcp + Next.js) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
