# Agents.md - AI HPTI Ultimate Master Plan

## 1. Identidade e Visão
- **Projeto:** AI HPTI (`ai.hpinfo.com.br`)
- **Objetivo:** Plataforma de IA Multimodal, Híbrida e Autônoma.
- **Dono:** @sejalivre
- **Storage Legado:** `files.hpinfo.com.br` (Cloudflare R2 + Workers).

## 2. Stack Tecnológica (Expandida)
- **Frontend:** Next.js (App Router) na Vercel.
- **Backend:** Vercel Serverless Functions.
- **Auth:** Clerk (Login Social/GitHub) - *Essencial para preferências/histórico.*
- **Database/Cache:** Upstash Redis (Rate limiting e memória curta - Free Tier).
- **Vetores (RAG):** Upstash Vector ou JSON Search no R2.
- **Logs/Monitoramento:** Vercel Analytics + Integração Customizada (HPTI Files).

## 3. Matriz de Inteligência (Router Híbrido)
| Modelo | Provedor | Função |
| :--- | :--- | :--- |
| **Llama 3 / Mixtral** | **Groq** | Chat rápido, Agentes Simples, Router. |
| **DeepSeek V3/R1** | **DeepSeek** | Lógica complexa, Coding, Raciocínio (ReAct). |
| **Gemini 1.5 Pro** | **Google** | Visão (Prints/Vídeo), Contexto Gigante (Docs). |
| **Whisper V3** | **Groq** | Transcrição de Áudio (STT). |
| **ElevenLabs** | **ElevenLabs** | Voz Neural (TTS). |
| **Stable Diffusion** | **HuggingFace** | Geração de Imagens (Via Inference API). |

## 4. Plano de Execução (Roadmap Rigoroso)
A IA deve respeitar a ordem para garantir estabilidade.

### FASE 1: Fundação & Auth (O Core)
- [ ] Setup Next.js + Vercel.
- [ ] Implementar **Clerk Auth** (Login cria o contexto do usuário).
- [ ] Chat Básico (Texto -> Groq -> Texto).
- [ ] Configurar Logs básicos salvando no `files.hpinfo.com.br`.

### FASE 2: Cérebro & Memória (A "Super IDE")
- [ ] Integrar DeepSeek para perguntas de código complexas.
- [ ] Sistema de Histórico (Salvar chats no R2 por User ID do Clerk).
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

### 5. DevOps & Qualidade (Transversal)
*Aplicar em todas as fases:*
- **CI/CD:** GitHub Actions rodando testes básicos antes do deploy.
- **Segurança:** Chaves sempre no `.env`. Rate Limiting com Redis.
- **Custos:** Dashboard simples para monitorar uso de tokens Groq/DeepSeek.