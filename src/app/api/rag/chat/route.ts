import { auth } from '@clerk/nextjs/server';
import { streamText } from 'ai';
import { getAvailableModels, getModelById } from '@/lib/models';
import { getModel } from '@/lib/ai-service';
import { queryVectorStore } from '@/lib/rag-service';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new Response('Unauthorized', { status: 401 });

        const body = await req.json();
        const { messages, modelId } = body;

        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content;

        // Retrieve relevant context from vector store
        const context = await queryVectorStore(userQuery);

        const systemPrompt = `Você é um assistente inteligente que responde perguntas com base no contexto fornecido.
        
Contexto Relevante:
${context}

Instruções:
1. Use o contexto acima para responder à pergunta do usuário.
2. Se a resposta não estiver no contexto, diga que não encontrou a informação nos documentos, mas tente responder com seu conhecimento geral avisando sobre isso.
3. Responda sempre em Português Brasileiro.`;

        const models = await getAvailableModels();
        const selectedModel = await getModelById(modelId) || models[0];

        const result = streamText({
            model: getModel(selectedModel.provider, selectedModel.id),
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
        });

        return result.toTextStreamResponse();

    } catch (error) {
        console.error('RAG Chat Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process chat' }), { status: 500 });
    }
}
