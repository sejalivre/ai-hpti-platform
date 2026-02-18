# AGENTS.md

Este documento descreve os agentes disponíveis no projeto AI HPTI Platform.

## Visão Geral

Os agentes são personas especializadas que utilizam Modelos de Linguagem (LLMs) para realizar tarefas específicas. Cada agente possui um "System Prompt" (instrução de sistema) que define seu comportamento, tom de voz e expertise.

## Lista de Agentes

### 1. Assistente Padrão (Default)
- **Descrição:** Assistente geral útil e amigável.
- **System Prompt:** (Vazio ou instrução básica de ajuda).
- **Uso:** Perguntas gerais, conversas casuais.

### 2. Agentes Personalizados (Criados pelo Usuário)

O sistema permite criar agentes dinamicamente através da interface `/agents`. Exemplos comuns incluem:

- **Programador Python:** Especialista em código Python otimizado.
- **Tradutor Técnico:** Traduz textos mantendo terminologia técnica precisa.
- **Revisor de Texto:** Corrige gramática e estilo.
- **Professor de Inglês:** Ensina o idioma e corrige erros do aluno.

## Como Criar um Agente

1. Acesse a página `/agents`.
2. Clique em "Novo Agente".
3. Preencha Nome, Descrição e System Prompt.
4. Escolha um ícone.
5. Salve. O agente estará disponível no Chat.

## Integração Técnica

Os agentes são salvos no **Upstash Redis** sob a chave `agents:{userId}`.
O `System Prompt` do agente selecionado é injetado no contexto da conversa antes das mensagens do usuário, orientando o modelo de IA sobre como se comportar.

## API de Agentes

### Endpoints

- `GET /api/agents` - Lista todos os agentes do usuário
- `POST /api/agents` - Cria um novo agente
- `PUT /api/agents` - Atualiza um agente existente
- `DELETE /api/agents?id={id}` - Remove um agente

### Estrutura de Dados

```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
}
```
