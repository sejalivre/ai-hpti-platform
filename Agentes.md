# Agents.md - AI HPTI Ultimate Master Plan

## 1. Identidade e Visão
- **Projeto:** AI HPTI (`ai.hpinfo.com.br`)
- **Objetivo:** Plataforma de IA Multimodal, Híbrida e Autônoma.
- **Dono:** @sejalivre
- **Storage Legado:** `files.hpinfo.com.br` (Cloudflare R2 + Workers).

## 2. Stack Tecnológica (Expandida)
- **Frontend:** Next.js 16 (App Router) na Vercel.
- **Backend:** Vercel Serverless Functions.
- **Auth:** Clerk (Login Social/GitHub) - *Essencial para preferências/histórico.*
- **Database/Cache:** Upstash Redis (Rate limiting e memória curta - Free Tier).
- **Vetores (RAG):** Upstash Vector ou JSON Search no R2.
- **Logs/Monitoramento:** Vercel Analytics + Integração Customizada (HPTI Files).

## 3. Matriz de Inteligência (Router Híbrido)
| Modelo | Provedor | Função |
| :--- | :--- | :--- |
| **Llama 3.3 70B** | **Groq** | Chat rápido, Agentes Simples, Router. |
| **DeepSeek V3/R1** | **DeepSeek** | Lógica complexa, Coding, Raciocínio (ReAct). |
| **Gemini 1.5 Pro** | **Google** | Visão (Prints/Vídeo), Contexto Gigante (Docs). |
| **Whisper V3** | **Groq** | Transcrição de Áudio (STT). |
| **ElevenLabs** | **ElevenLabs** | Voz Neural (TTS). |
| **Stable Diffusion** | **HuggingFace** | Geração de Imagens (Via Inference API). |

## 4. Plano de Execução (Roadmap Rigoroso)
A IA deve respeitar a ordem para garantir estabilidade.

### FASE 1: Fundação & Auth (O Core) ✅ COMPLETA
- [x] Setup Next.js + Vercel.
- [x] Implementar **Clerk Auth** (Login cria o contexto do usuário).
- [x] Chat Básico (Texto -> Groq -> Texto) com streaming.
- [ ] Configurar Logs básicos salvando no `files.hpinfo.com.br`.

### FASE 2: Cérebro & Memória (A "Super IDE") 🟡 EM PROGRESSO
- [ ] Integrar DeepSeek para perguntas de código complexas.
- [x] Sistema de Histórico (Salvar chats no Redis por User ID do Clerk).
- [x] API `/api/history` para carregar histórico ao iniciar.
- [ ] RAG Simples: Upload de PDF -> Extrair Texto -> Buscar respostas (Contexto Pessoal).

### FASE 3: Multimodalidade (Olhos e Ouvidos)
- [ ] Visão: Colar Prints (Clipboard) -> Gemini.
- [ ] Voz Input: Gravar Áudio -> Groq Whisper.
- [ ] Voz Output: Texto -> ElevenLabs (com Cache no R2).

### FASE 4: Criatividade (O Artista)
- [ ] Geração de Imagem: Prompt -> Stable Diffusion API -> Exibir.
- [ ] Análise de Vídeo: Upload curto -> Extrair Frames (FFmpeg.wasm client-side) -> Gemini analisa.

### FASE 5: Autonomia (Agentes)
- [ ] Tool Calling: Permitir que a IA chame APIs externas (Clima, Notícias).
- [ ] Agentes Autônomos: Loops de "Pensar -> Agir -> Observar".
- [ ] Análise de Sentimento: Detectar humor no chat e adaptar respostas.

## 5. DevOps & Qualidade (Transversal)
*Aplicar em todas as fases:*
- **CI/CD:** GitHub Actions rodando testes básicos antes do deploy.
- **Segurança:** Chaves sempre no `.env`. Rate Limiting com Redis.
- **Custos:** Dashboard simples para monitorar uso de tokens Groq/DeepSeek.

---

## 📝 Notas Técnicas (2026-02-01)

### Decisões de Implementação
- **AI SDK 6.x não é compatível com Groq** - Usa endpoint `/responses` que Groq não suporta.
- **Solução**: Chamada direta à API Groq via `fetch` em `/api/chat/route.ts`.
- **Modelo atualizado**: `llama-3.1-70b-versatile` foi descontinuado → usando `llama-3.3-70b-versatile`.
- **Persistência**: Histórico salvo no Redis com expiração de 24h.

### Arquivos Principais
- `src/app/(dashboard)/chat/page.tsx` - Interface do chat
- `src/app/api/chat/route.ts` - API de chat (Groq direto)
- `src/app/api/history/route.ts` - API de histórico (Redis)
- `src/middleware.ts` - Proteção de rotas (Clerk)