import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

// Inicializa o cliente Redis
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
        // 1. Identifica o usuário
        const { userId } = await auth();
        if (!userId) {
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const messages = body.messages || [];

        // Formatar mensagens
        const formattedMessages: ChatMessage[] = messages
            .filter((msg: { content: unknown }) => {
                const content = msg.content;
                return typeof content === 'string' && content.trim() !== '';
            })
            .map((msg: { role: string; content: string }) => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content.trim(),
            }));

        if (formattedMessages.length === 0) {
            return new Response('No valid messages', { status: 400 });
        }

        // Adiciona system message no início
        const allMessages = [
            { role: 'system' as const, content: 'Você é um assistente útil e amigável. Sempre responda em português brasileiro.' },
            ...formattedMessages
        ];

        const chatId = `chat:${userId}`;

        // Chamar API Groq diretamente (sem o AI SDK que está causando problemas)
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: allMessages,
                stream: true,
            }),
        });

        if (!groqResponse.ok) {
            const error = await groqResponse.text();
            console.error('Erro Groq:', error);
            return new Response('Groq API error', { status: 500 });
        }

        // Criar um TransformStream para processar o SSE e salvar no Redis
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullResponse = '';

        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                const text = decoder.decode(chunk);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            // Salvar no Redis quando terminar
                            const history = [...formattedMessages, { role: 'assistant' as const, content: fullResponse }];
                            await redis.set(chatId, JSON.stringify(history));
                            await redis.expire(chatId, 86400);
                            continue;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                controller.enqueue(encoder.encode(content));
                            }
                        } catch {
                            // Ignorar linhas que não são JSON válido
                        }
                    }
                }
            },
        });

        return new Response(groqResponse.body?.pipeThrough(transformStream), {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error) {
        console.error('Erro na API:', error);
        return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
    }
}