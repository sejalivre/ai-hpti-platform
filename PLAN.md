# Plano de Evolução da Plataforma AI (HPTI)

Este plano visa analisar o estado atual do projeto e propor melhorias estruturais e novas funcionalidades criativas para explorar o potencial das APIs de IA disponíveis (Llama, DeepSeek, Kimi, GLM).

## 1. Análise do Estado Atual

O projeto é uma aplicação **Next.js 16** robusta com autenticação (**Clerk**), banco de dados/cache (**Upstash Redis**) e estilização (**Tailwind**).

**Funcionalidades Existentes:**
- **Chat Geral:** Interface para conversar com múltiplos modelos via Groq, DeepSeek e Modal.
- **Batalha de IAs:** Modo criativo onde dois modelos conversam entre si.
- **Visão:** Análise de imagens usando modelos multimodais.
- **Arquivos:** Processamento básico de arquivos de texto.

**Pontos de Atenção:**
- **Abstração de Modelos:** A lógica de chamada de API está dispersa em funções específicas (`streamGroq`, `streamDeepSeek`, etc.) em `route.ts`, dificultando a adição de novos modelos.
- **Gerenciamento de Contexto:** O chat com arquivos parece injetar o conteúdo diretamente no prompt, o que limita o tamanho dos arquivos (limite de tokens).
- **Interface de Chat:** Pode ser enriquecida com mais controles (System Prompt, Temperatura).

---

## 2. Proposta de Melhorias e Novas Funcionalidades

### Fase 1: Refatoração e Fundação (Code Quality)
O objetivo é preparar o terreno para escalar o projeto com facilidade.
- [ ] **Unificar Provedores de IA:** Criar uma camada de serviço (`lib/ai-service.ts`) que padronize a interface para todos os provedores (Groq, DeepSeek, Modal). Isso permitirá trocar de "backend" para um modelo sem mudar o código do frontend.
- [ ] **Padronização de Erros:** Melhorar o tratamento de erros nas rotas de API para feedback visual claro ao usuário (ex: "Modelo sobrecarregado", "Erro de autenticação").

### Fase 2: "Agent Builder" e Personas (Criatividade)
Transformar o chat simples em uma ferramenta de criação de assistentes especializados.
- [ ] **Criador de Personas:** Adicionar uma interface para o usuário criar e salvar "Agentes" com instruções específicas (System Prompts).
    - Ex: *Code Reviewer*, *Tradutor Técnico*, *Professor de Inglês*.
- [ ] **Biblioteca de Prompts:** Um menu lateral para salvar e reutilizar prompts frequentes.

### Fase 3: RAG (Retrieval-Augmented Generation) Real
Evoluir a funcionalidade de "Arquivos" para lidar com documentos grandes e múltiplos arquivos.
- [ ] **Implementar Vetorização:** Usar **Upstash Vector** (já que usamos Upstash) ou uma solução local simples para indexar documentos.
- [ ] **Chat com Documentos:** Permitir fazer perguntas sobre um PDF de 100 páginas, recuperando apenas os trechos relevantes para o contexto do modelo.

### Fase 4: Funcionalidades "Uau" (Inovação)
Explorar capacidades avançadas dos modelos atuais.
- [ ] **"Juiz de Batalha":** No modo Batalha, adicionar um terceiro modelo (ex: Llama 3.3 70b) que analisa a conversa e decide quem ganhou o debate com base em lógica e argumentação.
- [ ] **Modo de Voz (Talk-to-AI):** Implementar *Speech-to-Text* (via navegador ou API Whisper) para permitir conversar por voz com os modelos.
- [ ] **Laboratório de JSON (Structured Output):** Uma ferramenta para desenvolvedores testarem a extração de dados estruturados. O usuário cola um texto bagunçado e define um esquema JSON, e a IA extrai os dados perfeitamente.

---

## 3. Próximos Passos (Execução Imediata)

Para começar, focaremos na **Fase 1 (Refatoração)** e **Fase 2 (Agentes)**, que trarão o maior impacto visual e funcional imediato.

1.  Refatorar `src/app/api/chat/route.ts` para usar um padrão de *Strategy* ou *Factory* para os modelos.
2.  Criar a interface de configuração de "System Prompt" no Chat.
3.  Implementar a persistência de configurações de modelo (temperatura, top_p) no LocalStorage ou Banco.

---
**Observação:** Este plano é flexível. Podemos priorizar funcionalidades específicas conforme seu interesse (ex: focar totalmente no RAG primeiro).
