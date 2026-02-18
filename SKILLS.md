# SKILLS.md

Este documento descreve as habilidades e capacidades da plataforma AI HPTI.

## 1. Chat Inteligente (LLM)
- **Descrição:** Interface de conversação com múltiplos modelos de IA.
- **Modelos Suportados:**
    - **Groq:** Llama 3.3 70b Versatile, Llama 3.1 8b Instant
    - **DeepSeek:** R1 (Reasoning), V3 (Chat)
    - **Modal:** GLM-5 (Zhipu AI)
- **Features:**
    - Streaming de respostas em tempo real.
    - Histórico de conversa persistente (Upstash Redis).
    - Agentes Personalizados (System Prompts).
    - Seleção dinâmica de provedores.
    - Áudio playback das mensagens (Web Speech API).

## 2. Visão Computacional (Multimodal)
- **Descrição:** Análise de imagens para descrição, extração de texto ou resposta a perguntas visuais.
- **Modelos:** OpenAI GPT-4o, Google Gemini 2.0 Flash.
- **Entrada:** Upload de arquivo, Ctrl+V, URL.
- **Features:**
    - Descrição detalhada de imagens.
    - Extração de texto (OCR).
    - Análise de gráficos e diagramas.
    - Resposta a perguntas sobre conteúdo visual.

## 3. Batalha de IAs (Arena)
- **Descrição:** Dois modelos de IA conversam entre si sobre um tema definido pelo usuário.
- **Features:**
    - **Auto-save:** Conversas salvas automaticamente após cada resposta.
    - **Título automático:** Baseado na primeira mensagem/assunto.
    - **Troca de tópico:** Mude o tema no meio da conversa.
    - **Controle de turnos:** Pausa após cada resposta para leitura.
    - **Áudio:** Ouça as mensagens com text-to-speech.
    - **Nomes brasileiros:** IA com nomes falsos realistas.
    - **Histórico:** Acesse conversas anteriores.
    - **Nova sessão:** Trocar IAs cria nova conversa automaticamente.
- **Armazenamento:** Upstash Redis (retenção de 30 dias).

## 4. Análise de Arquivos (RAG)
- **Descrição:** Chat com documentos e arquivos de texto.
- **Suporte:** `.txt`, `.md`, `.pdf` (via extração de texto).
- **Features:**
    - Resumo automático.
    - Extração de pontos-chave.
    - Perguntas e Respostas baseadas no conteúdo.
    - Upload múltiplo de arquivos.

## 5. Agentes Personalizáveis
- **Descrição:** Criação de personas com instruções específicas.
- **Features:**
    - Editor visual de agentes.
    - Biblioteca de prompts salvos.
    - Integração direta no chat.
    - Ícones customizáveis.
- **API:** CRUD completo para gerenciamento.

## 6. Configurações de API
- **Descrição:** Gerenciamento de chaves de API por usuário.
- **Features:**
    - Suporte múltiplos provedores (Groq, DeepSeek, Modal, OpenAI, Google, Anthropic).
    - Chaves isoladas por usuário.
    - Ativação/desativação de configurações.
    - URL base customizável para provedores customizados.
- **Rota:** `/settings/api`

## 7. (Em Desenvolvimento) Features Futuras
- **RAG Vetorial:** Indexação semântica de PDFs grandes para busca precisa.
- **Voz Input:** Interação por voz (microfone) no chat.
- **Juiz IA:** Avaliação automática na Batalha de IAs.

## Provedores de IA

| Provedor | Modelos | Uso Principal |
|----------|---------|---------------|
| Groq | Llama 3.3 70b, Llama 3.1 8b | Chat rápido e eficiente |
| DeepSeek | R1, V3 | Raciocínio complexo |
| Modal | GLM-5 | Alternativa open-source |
| OpenAI | GPT-4o, GPT-4o-mini | Visão e chat premium |
| Google | Gemini 1.5 Pro/Flash | Multimodal avançado |

## Armazenamento

- **Redis (Upstash):**
  - Histórico de chat (`history:{userId}`)
  - Agentes (`agents:{userId}`)
  - Batalhas (`battle:{sessionId}`, `battles:{userId}`)
  - Configurações de API (`api-configs:{userId}`)
- **Retenção:** 30 dias para sessões de batalha.
