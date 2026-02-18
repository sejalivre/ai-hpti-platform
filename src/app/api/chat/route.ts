import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { getAvailableModels, getModelById } from '@/lib/models';
import { getModel, streamText } from '@/lib/ai-service';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "http://dummy",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

export const dynamic = "force-dynamic";

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await req.json();
        const { messages: inputMessages, modelId, systemPrompt } = body;

        const models = await getAvailableModels();
        const selectedModel = await getModelById(modelId) || models[0];
        
        // Basic validation
        if (!process.env.GROQ_API_KEY && selectedModel.provider === 'groq') return new Response('Groq API Key missing', { status: 500 });
        if (!process.env.DEEPSEEK_API_KEY && selectedModel.provider === 'deepseek') return new Response('DeepSeek API Key missing', { status: 500 });
        if (!process.env.MODAL_API_KEY && selectedModel.provider === 'modal') return new Response('Modal API Key missing', { status: 500 });

        const formattedMessages: ChatMessage[] = inputMessages
            .filter((msg: { content: unknown }) => {
                const content = msg.content;
                return typeof content === 'string' && content.trim() !== '';
            })
            .map((msg: { role: string; content: string }) => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content.trim(),
            }));

        if (formattedMessages.length === 0) {
            return new Response(JSON.stringify({ error: 'No valid messages' }), { status: 400 });
        }

        const defaultSystemMessage = 'Você é um assistente útil e amigável. Sempre responda em português brasileiro.';
        const systemMessage: ChatMessage = { 
            role: 'system', 
            content: systemPrompt || defaultSystemMessage
        };

        const result = streamText({
            model: getModel(selectedModel.provider, selectedModel.id),
            messages: [systemMessage, ...formattedMessages],
            onFinish: async ({ text }) => {
                const chatId = `chat:${userId}`;
                const history = [...formattedMessages, { role: 'assistant', content: text }];
                await redis.set(chatId, JSON.stringify(history));
                await redis.expire(chatId, 86400);
            },
        });

        return result.toTextStreamResponse();

    } catch (error) {
        console.error('Erro na API:', error);
        const message = error instanceof Error ? error.message : 'Erro interno';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
