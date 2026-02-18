# AI HPTI Platform

Uma plataforma de IA multimodal com suporte a múltiplos provedores, agentes personalizados e batalha de modelos.

## 📄 Documentação

- [**AGENTS.md**](./AGENTS.md) - Agentes personalizados e system prompts.
- [**SKILLS.md**](./SKILLS.md) - Capacidades e features da plataforma.

## 🚀 Funcionalidades Principais

### Chat Inteligente
- Múltiplos modelos: Groq (Llama), DeepSeek (R1/V3), Modal (GLM-5)
- Streaming em tempo real
- Histórico persistente
- Agentes personalizados

### Batalha de IAs
- Dois modelos conversam entre si
- Auto-save automático
- Troca de tópico durante conversa
- Áudio playback
- Nomes brasileiros realistas

### Visão Computacional
- Análise de imagens
- OpenAI GPT-4o e Google Gemini
- Upload, Ctrl+V ou URL

### RAG (Arquivos)
- Chat com documentos
- Suporte a .txt, .md, .pdf
- Resumo e extração de pontos-chave

### Configurações
- Chaves de API por usuário
- Múltiplos provedores suportados
- Interface em `/settings/api`

## 🛠️ Tecnologias

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Auth:** Clerk
- **Database:** Upstash Redis
- **AI:** Groq, DeepSeek, Modal, OpenAI, Google AI

## 🏁 Getting Started

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar em desenvolvimento
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (dashboard)/     # Páginas protegidas
│   │   ├── agents/      # Gerenciar agentes
│   │   ├── battle/      # Batalha de IAs
│   │   ├── chat/        # Chat principal
│   │   ├── files/       # Análise de arquivos
│   │   ├── images/      # Análise de imagens
│   │   ├── rag/         # RAG
│   │   └── settings/    # Configurações
│   └── api/             # API routes
├── components/          # Componentes React
└── lib/                 # Utilitários e configs
```

## 🔑 Variáveis de Ambiente

```env
# Clerk (Autenticação)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI Providers
GROQ_API_KEY=
DEEPSEEK_API_KEY=
MODAL_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
```

## 📚 Aprenda Mais

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Auth](https://clerk.com/docs)
- [Upstash Redis](https://upstash.com/docs/redis)

## 🚢 Deploy

A forma mais fácil é usar [Vercel Platform](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Veja [Next.js deployment docs](https://nextjs.org/docs/deployment) para mais detalhes.
